import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { Readable } from 'stream';
import { S3Service } from '../storage/s3.service';

/**
 * 랜드마크 정답 — 사진마다 사람이 찍은 '진짜 위치'를 JSON 으로 남긴다. 여러 검출 방법을 이 정답으로 채점한다.
 *
 * 사진이 어디서 오는지만 다르다:
 *   로컬 (NODE_ENV≠production)  LANDMARK_BENCH_DIR/images/ 폴더 (tools/landmark-bench/seed.sh 로 채운다)
 *   운영 (NODE_ENV=production)   고객 상담 사진 (face_analysis_results · source=consultation) 을 S3 에서 바로 읽는다.
 *                                이름은 prod_<촬영일 YYMMDD>_<주소 md5 앞 12자>.jpg — 복사본을 만들지 않는다
 *
 * 정답은 둘 다 LANDMARK_BENCH_DIR/truth/<이름>.json
 *   { imageWidth, imageHeight, points: { id: [x, y] | null }, updatedAt }  x, y 는 사진 크기 대비 0~1, null = 안 보이는 점
 *   로컬 기본: 저장소 바깥 ../../landmark-bench (Git 밖). 운영: docker-compose 가 서버 ~/momong/landmark-bench 를 붙인다
 * 예시 그림: assets/landmark-examples/ (받은 기준시각화 PDF 페이지 — 이미지에 같이 들어간다)
 *
 * 쓸 수 있는 사람: 로컬은 admin 누구나. 운영은 .env.prod 의 ADMIN_EMAIL 로 로그인한 계정(sub='admin')만.
 */
const NAME_RE = /^[\w.-]{1,120}$/;
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const PROD_NAME_RE = /^prod_\d{6}_([0-9a-f]{12})\.jpg$/;
const POINT_ID_RE = /^[a-z][a-z0-9_]{0,40}$/;

export interface TruthFile {
  imageWidth: number;
  imageHeight: number;
  points: Record<string, [number, number] | null>;
  updatedAt: string;
}

/** AdminGuard 가 req.user 에 넣는 JWT 내용 */
export interface AdminUser {
  sub?: string;
}

@Injectable()
export class FaceLandmarkTruthService {
  private readonly dir: string;
  private readonly prod: boolean;
  private readonly bucket: string | undefined;
  private readonly s3Client: S3Client | undefined;
  private readonly examplesDir = join(process.cwd(), 'assets', 'landmark-examples');

  constructor(
    config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly s3: S3Service,
  ) {
    this.prod = config.get<string>('NODE_ENV') === 'production';
    this.dir = resolve(config.get<string>('LANDMARK_BENCH_DIR') || join(process.cwd(), '..', '..', 'landmark-bench'));
    this.bucket = config.get<string>('AWS_S3_BUCKET');
    const region = config.get<string>('AWS_REGION');
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
    if (this.prod && region) {
      this.s3Client = new S3Client({
        region,
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
    }
  }

  /** 운영은 env 관리자 계정만 */
  allowed(user: AdminUser | undefined): boolean {
    return !this.prod || user?.sub === 'admin';
  }

  private guard(user: AdminUser | undefined) {
    if (!this.allowed(user)) throw new ForbiddenException('랜드마크 정답은 관리자 본인 계정에서만 쓸 수 있습니다');
  }

  private imagesDir() {
    return join(this.dir, 'images');
  }

  private truthPath(name: string) {
    return join(this.dir, 'truth', `${name}.json`);
  }

  private readTruth(name: string): TruthFile | null {
    const p = this.truthPath(name);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, 'utf8')) as TruthFile;
  }

  // ── 운영: 상담 사진 ──

  private static prodName(md5: string, detectedAt: Date) {
    // 한국 날짜
    const d = new Date(new Date(detectedAt).getTime() + 9 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, '');
    return `prod_${d}_${md5.slice(0, 12)}.jpg`;
  }

  private async prodPhotos(): Promise<{ name: string; url: string }[]> {
    const rows: { face_image_url: string; md5: string; detected_at: Date }[] = await this.dataSource.query(
      `SELECT face_image_url, md5(face_image_url) AS md5, detected_at FROM (
         SELECT DISTINCT ON (face_image_url) face_image_url, detected_at
           FROM face_analysis_results
          WHERE detection_type = 'WNC' AND source = 'consultation'
          ORDER BY face_image_url, detected_at DESC
       ) p ORDER BY detected_at DESC`,
    );
    return rows.map((r) => ({ name: FaceLandmarkTruthService.prodName(r.md5, r.detected_at), url: r.face_image_url }));
  }

  private async prodUrl(name: string): Promise<string> {
    const m = PROD_NAME_RE.exec(name);
    if (!m) throw new BadRequestException('사진 이름이 잘못되었습니다');
    const [row]: { face_image_url: string }[] = await this.dataSource.query(
      `SELECT face_image_url FROM face_analysis_results
        WHERE detection_type = 'WNC' AND source = 'consultation' AND left(md5(face_image_url), 12) = $1
        LIMIT 1`,
      [m[1]],
    );
    if (!row) throw new NotFoundException('상담 사진 목록에 없는 사진입니다');
    return row.face_image_url;
  }

  // ── 공통 ──

  /** 이름 확인 — 운영은 상담 사진 주소, 로컬은 폴더 파일 경로를 돌려준다 */
  private async locate(name: string | undefined): Promise<string> {
    if (!name || !NAME_RE.test(name) || !IMAGE_RE.test(name)) throw new BadRequestException('사진 이름이 잘못되었습니다');
    if (this.prod) return this.prodUrl(name);
    const p = join(this.imagesDir(), name);
    if (!existsSync(p)) throw new NotFoundException('폴더에 없는 사진입니다');
    return p;
  }

  async list(user: AdminUser | undefined) {
    this.guard(user);
    let names: string[];
    if (this.prod) {
      names = (await this.prodPhotos()).map((p) => p.name);
    } else {
      const imgDir = this.imagesDir();
      names = existsSync(imgDir) ? readdirSync(imgDir).filter((n) => NAME_RE.test(n) && IMAGE_RE.test(n)).sort() : [];
    }
    return {
      dir: this.dir,
      items: names.map((name) => {
        const t = this.readTruth(name);
        return {
          name,
          pointCount: t ? Object.keys(t.points).length : 0,
          updatedAt: t?.updatedAt ?? null,
        };
      }),
    };
  }

  async get(user: AdminUser | undefined, name: string) {
    this.guard(user);
    await this.locate(name);
    return this.readTruth(name);
  }

  async openPhoto(user: AdminUser | undefined, name: string): Promise<{ body: Readable; contentType: string }> {
    this.guard(user);
    const where = await this.locate(name);
    if (this.prod) {
      let loc: { bucket: string; key: string } | null = null;
      try {
        loc = this.s3.extractS3Location(new URL(where));
      } catch {
        loc = null;
      }
      if (!loc || !this.s3Client || loc.bucket !== this.bucket) throw new BadRequestException('이 서버 버킷의 사진이 아닙니다');
      const res = await this.s3Client.send(new GetObjectCommand({ Bucket: loc.bucket, Key: loc.key }));
      return { body: res.Body as Readable, contentType: res.ContentType || 'image/jpeg' };
    }
    const ext = name.split('.').pop()!.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { body: createReadStream(where), contentType };
  }

  /** 예시 그림 (받은 기준시각화 PDF 에서 뽑은 페이지) */
  openExample(user: AdminUser | undefined, name: string): { body: Readable; contentType: string } {
    this.guard(user);
    if (!name || !NAME_RE.test(name) || !/\.jpe?g$/i.test(name)) throw new BadRequestException('그림 이름이 잘못되었습니다');
    const p = join(this.examplesDir, name);
    if (!existsSync(p)) throw new NotFoundException('예시 그림이 없습니다');
    return { body: createReadStream(p), contentType: 'image/jpeg' };
  }

  async save(user: AdminUser | undefined, body: { name?: string; imageWidth?: unknown; imageHeight?: unknown; points?: unknown }) {
    this.guard(user);
    const name = body.name as string;
    await this.locate(name);
    const w = Number(body.imageWidth);
    const h = Number(body.imageHeight);
    if (!(w > 0 && h > 0)) throw new BadRequestException('imageWidth · imageHeight 가 필요합니다');
    if (!body.points || typeof body.points !== 'object' || Array.isArray(body.points)) {
      throw new BadRequestException('points 는 { id: [x, y] | null }');
    }
    const points: TruthFile['points'] = {};
    for (const [id, v] of Object.entries(body.points as Record<string, unknown>)) {
      if (!POINT_ID_RE.test(id)) throw new BadRequestException(`점 이름이 잘못되었습니다: ${id}`);
      if (v === null) {
        points[id] = null;
        continue;
      }
      if (!Array.isArray(v) || v.length !== 2 || !v.every((n) => typeof n === 'number' && n >= 0 && n <= 1)) {
        throw new BadRequestException(`${id} 는 [x, y] (0~1) 또는 null`);
      }
      points[id] = [v[0], v[1]];
    }
    const file: TruthFile = { imageWidth: w, imageHeight: h, points, updatedAt: new Date().toISOString() };
    mkdirSync(join(this.dir, 'truth'), { recursive: true });
    const p = this.truthPath(name);
    writeFileSync(`${p}.tmp`, JSON.stringify(file, null, 2));
    renameSync(`${p}.tmp`, p);
    return file;
  }
}
