import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3 presigned URL 발급 (업로드 PUT · 조회 GET).
 *
 * 예전에는 PythonAnalysisService 안에 있었다. 얼굴 분석이 브라우저로 옮겨가면서
 * Python 호출을 걷어내기 위해 분리했다 (INFRA-MIGRATION B3, 2026-10-10).
 * 얼굴 분석 촬영본과 사전설문 사진이 같이 쓴다.
 */
@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string | undefined;
  private readonly s3Client: S3Client | undefined;
  private readonly presignedUrlExpiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const expiresIn = this.configService.get<string>('AWS_PRESIGNED_EXPIRES_IN');
    this.presignedUrlExpiresIn = expiresIn && Number(expiresIn) > 0 ? Number(expiresIn) : 300;

    if (region) {
      this.s3Client = new S3Client({
        region,
        credentials:
          accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    } else {
      this.logger.warn('AWS_REGION 미설정 — S3 presigned URL 생성 비활성화');
    }
  }

  /**
   * 클라이언트가 S3 에 이미지를 직접 PUT 할 수 있는 presigned URL 발급.
   */
  async createUploadPresignedUrl(opts: { key: string; contentType: string }) {
    if (!this.s3Client || !this.bucketName) {
      throw new InternalServerErrorException('S3 설정이 누락되었습니다 (AWS_REGION/AWS_S3_BUCKET)');
    }
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: opts.key,
      ContentType: opts.contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: this.presignedUrlExpiresIn,
    });
    const region = this.configService.get<string>('AWS_REGION');
    const publicUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${opts.key}`;
    return { uploadUrl, publicUrl, key: opts.key, expiresIn: this.presignedUrlExpiresIn };
  }

  /**
   * 저장된 S3 객체를 GET 으로 열어볼 수 있는 presigned URL 발급.
   * 우리 버킷의 객체일 때만 서명하고, 그 외는 원본 그대로 반환.
   */
  async createDownloadPresignedUrl(originalUrl: string): Promise<string> {
    if (!originalUrl) throw new InternalServerErrorException('이미지 URL 누락');

    let parsed: URL;
    try {
      parsed = new URL(originalUrl);
    } catch {
      return originalUrl;
    }
    if (parsed.searchParams.has('X-Amz-Signature')) return originalUrl;

    const loc = this.extractS3Location(parsed);
    if (!loc) return originalUrl;
    if (!this.s3Client || !this.bucketName) return originalUrl;
    if (loc.bucket !== this.bucketName) {
      this.logger.warn(`버킷 불일치 expected=${this.bucketName} got=${loc.bucket}`);
      return originalUrl;
    }
    const cmd = new GetObjectCommand({ Bucket: loc.bucket, Key: loc.key });
    return getSignedUrl(this.s3Client, cmd, { expiresIn: this.presignedUrlExpiresIn });
  }

  /**
   * 저장된 JSON(상담 기록 등) 안의 우리 버킷 사진 주소를 모두 새 GET 서명 주소로 바꿔 돌려준다.
   * 예전에 서명 주소를 그대로 저장한 기록(5분 뒤 만료)도 서명을 떼고 다시 서명하므로 다시 열린다.
   * DB 에는 서명 없는 원래 주소를 저장하고, 읽을 때만 이걸로 서명한다. (2026-10-11)
   */
  async refreshOwnUrls<T>(value: T): Promise<T> {
    if (typeof value === 'string') {
      if (!value.startsWith('https://') || !this.isOwnBucketUrl(value)) return value;
      return (await this.createDownloadPresignedUrl(value.split('?')[0])) as unknown as T;
    }
    if (Array.isArray(value)) {
      return (await Promise.all(value.map((v) => this.refreshOwnUrls(v)))) as unknown as T;
    }
    if (value && typeof value === 'object') {
      const entries = await Promise.all(
        Object.entries(value as Record<string, unknown>).map(async ([k, v]) => [k, await this.refreshOwnUrls(v)] as const),
      );
      return Object.fromEntries(entries) as T;
    }
    return value;
  }

  /** 이 URL 이 우리 버킷의 객체인지 (분석 결과 저장 시 촬영본 URL 검증용) */
  isOwnBucketUrl(url: string): boolean {
    try {
      const loc = this.extractS3Location(new URL(url));
      return !!loc && !!this.bucketName && loc.bucket === this.bucketName;
    } catch {
      return false;
    }
  }

  private extractS3Location(url: URL): { bucket: string; key: string } | null {
    const host = url.hostname.split('.');
    // virtual-hosted: <bucket>.s3.<region>.amazonaws.com
    if (host.length >= 3 && host[1] === 's3') {
      const bucket = host[0];
      const key = url.pathname.replace(/^\/+/, '');
      if (!bucket || !key) return null;
      return { bucket, key: decodeURIComponent(key) };
    }
    // path-style: s3.<region>.amazonaws.com/<bucket>/<key>
    if (host[0] === 's3') {
      const [bucket, ...rest] = url.pathname.replace(/^\/+/, '').split('/');
      if (!bucket || rest.length === 0) return null;
      return { bucket, key: decodeURIComponent(rest.join('/')) };
    }
    return null;
  }
}
