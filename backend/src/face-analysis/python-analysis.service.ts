import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PythonAnalysisRequest {
  url: string;
  image_id: string;
  save_images: boolean;
}

// Python 응답의 한 모듈 결과 (실제: name, grade, value, description, image, measurement)
export interface AnalysisModule {
  name: string;
  grade?: string; // 'W'|'N'|'C' or 'S'|'N'|'H'
  type?: string; // (legacy) — momong_backend 호환
  value?: number | null;
  description?: string | null;
  image?: string | null;
  measurement?: Measurement | null;
}

/** 원본 이미지 위에 오버레이로 그릴 측정 도형들 (절대 픽셀 좌표) */
export interface Measurement {
  image_size: { width: number; height: number };
  shapes: MeasurementShape[];
}

export type MeasurementShape =
  | { type: 'point'; point: Point; color?: string; label?: string }
  | { type: 'line' | 'polyline' | 'polygon' | 'rectangle'; points: Point[]; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'circle'; point: Point; radius: number; stroke?: string; stroke_width?: number; fill?: string; dashed?: boolean; label?: string }
  | { type: 'text'; point: Point; text: string; color?: string; font_size?: number };

export interface Point {
  x: number;
  y: number;
  label?: string;
}

export interface WNCResult {
  final: string; // 'W'|'N'|'C' (단일 문자) — momong_backend 도 같이 사용
  counts: { W: number; N: number; C: number };
  results: Record<string, AnalysisModule>;
}

export interface SNHResult {
  final: string; // 'S'|'N'|'H'
  counts: { S: number; N: number; H: number };
  results: Record<string, AnalysisModule>;
}

export interface PythonAnalysisResponse {
  success: boolean;
  data: { wnc: WNCResult; snh: SNHResult };
  metadata: { image_id: string; total_modules: number };
  error?: string;
}

@Injectable()
export class PythonAnalysisService {
  private readonly logger = new Logger(PythonAnalysisService.name);
  private readonly pythonServerUrl: string;
  private readonly bucketName: string | undefined;
  private readonly s3Client: S3Client | undefined;
  private readonly presignedUrlExpiresIn: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.pythonServerUrl = this.configService.get<string>('PYTHON_SERVER_URL', '');
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
      });
    } else {
      this.logger.warn('AWS_REGION 미설정 — S3 presigned URL 생성 비활성화');
    }

    if (!this.pythonServerUrl) {
      this.logger.warn('PYTHON_SERVER_URL 미설정 — 얼굴 분석 호출 시 실패합니다');
    }
  }

  /**
   * Python 서버로 분석 요청. S3 URL 이면 자동으로 presigned URL 로 서명.
   */
  async analyzeImage(faceImageUrl: string, imageId: string): Promise<PythonAnalysisResponse> {
    if (!this.pythonServerUrl) {
      throw new InternalServerErrorException('PYTHON_SERVER_URL 미설정');
    }

    const signedUrl = await this.maybeSignS3Url(faceImageUrl);
    const payload: PythonAnalysisRequest = {
      url: signedUrl,
      image_id: imageId,
      save_images: false,
    };

    try {
      this.logger.log(`POST ${this.pythonServerUrl}/analyze-url image_id=${imageId}`);
      const response = await firstValueFrom(
        this.httpService.post<PythonAnalysisResponse>(
          `${this.pythonServerUrl}/analyze-url`,
          payload,
          { timeout: 60000, headers: { 'Content-Type': 'application/json' } },
        ),
      );
      const data = response.data;
      if (!data.success) {
        this.handlePythonError(data.error || '분석 실패', data);
      }
      this.logger.log(`분석 완료 wnc=${data.data.wnc.final} snh=${data.data.snh.final}`);
      return data;
    } catch (error) {
      this.logger.error('Python 서버 호출 실패', error as Error);
      const err = error as { response?: { data?: unknown }; code?: string };
      if (err.response) {
        this.handlePythonError(undefined, err.response.data);
      }
      if (err.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException('Python 서버에 연결할 수 없습니다');
      }
      throw new InternalServerErrorException('이미지 분석 중 오류가 발생했습니다');
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

  // ────────────────────────── private ──────────────────────────

  private handlePythonError(message?: string, rawError?: unknown): never {
    const extracted = this.extractMessage(rawError) || message || '이미지 분석에 실패했습니다';
    const status = this.extractStatus(rawError) || HttpStatus.BAD_REQUEST;
    throw new HttpException(
      {
        message: extracted,
        error: 'PythonError',
        rawError: process.env.NODE_ENV !== 'production' ? rawError : undefined,
      },
      status,
    );
  }

  private extractMessage(err: unknown): string | undefined {
    if (!err) return undefined;
    if (typeof err === 'string') return err;
    const e = err as {
      detail?: { error?: string; analysis_error?: { error?: string } };
      error?: string;
      message?: string;
    };
    return (
      e.detail?.analysis_error?.error ||
      e.detail?.error ||
      e.error ||
      e.message
    );
  }

  private extractStatus(err: unknown): number | undefined {
    if (!err) return undefined;
    const e = err as { status?: number; statusCode?: number; detail?: { statusCode?: number } };
    return e.status || e.statusCode || e.detail?.statusCode;
  }

  private async maybeSignS3Url(originalUrl: string): Promise<string> {
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
