import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createReadStream, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import type { Readable } from 'stream';
import { S3Service } from '../storage/s3.service';

/**
 * 랜드마크 정답 — 사진마다 사람이 찍은 '진짜 위치'. 여러 검출 방법을 이 정답으로 채점한다.
 *
 * 사진이 어디서 오는지만 다르다:
 *   로컬 (NODE_ENV≠production)  LANDMARK_BENCH_DIR/images/ 폴더 (tools/landmark-bench/seed.sh 로 채운다)
 *                                기본: 저장소 바깥 ../../landmark-bench (Git 밖)
 *   운영 (NODE_ENV=production)   고객 상담 사진 (face_analysis_results · source=consultation) 을 S3 에서 바로 읽는다.
 *                                이름은 prod_<촬영일 YYMMDD>_<주소 md5 앞 12자>.jpg — 복사본을 만들지 않는다
 *
 * 정답은 DB face_landmark_truths (migrations/008). 사진 한 장 = 한 행, 덮어쓰기.
 *   photo = 운영은 사진 주소, 로컬 폴더 사진은 'local:<파일 이름>'
 *   points = { id: [x, y] | null }  x, y 는 사진 크기 대비 0~1, null = 안 보이는 점
 * 채점용으로 꺼낼 때: GET …/export (화면의 '정답 내려받기')
 * 예시 그림: assets/landmark-examples/ (받은 기준시각화 PDF 페이지 — 이미지에 같이 들어간다)
 *
 * 쓸 수 있는 사람: 로컬은 admin 누구나. 운영은 OWNER_EMAILS 계정 (또는 .env.prod ADMIN_EMAIL 계정 sub='admin') 만.
 */
const NAME_RE = /^[\w.-]{1,120}$/;
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const PROD_NAME_RE = /^prod_\d{6}_([0-9a-f]{12})\.jpg$/;
const POINT_ID_RE = /^[a-z][a-z0-9_]{0,40}$/;
const LOCAL_PREFIX = 'local:';

export interface TruthFile {
  imageWidth: number;
  imageHeight: number;
  points: Record<string, [number, number] | null>;
  updatedAt: string;
}

/** AdminGuard 가 req.user 에 넣는 JWT 내용 */
export interface AdminUser {
  sub?: string;
  email?: string;
}

/** 운영에서 정답 화면을 쓸 수 있는 관리자 계정 (운영 .env.prod 에 ADMIN_EMAIL 이 없어서 DB 계정으로 지정). 화면 쪽 localOnly.ts 와 같게 */
const OWNER_EMAILS = ['another.dev.otter@gmail.com'];

interface TruthRow {
  photo: string;
  image_width: number;
  image_height: number;
  points: TruthFile['points'];
  updated_by: string | null;
  updated_at: Date;
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

  /** 운영은 관리자 본인 계정만 (env 관리자 계정 또는 OWNER_EMAILS) */
  allowed(user: AdminUser | undefined): boolean {
    if (!this.prod) return true;
    return user?.sub === 'admin' || OWNER_EMAILS.includes((user?.email ?? '').toLowerCase());
  }

  private guard(user: AdminUser | undefined) {
    if (!this.allowed(user)) throw new ForbiddenException('랜드마크 정답은 관리자 본인 계정에서만 쓸 수 있습니다');
  }

  private imagesDir() {
    return join(this.dir, 'images');
  }

  // ── 사진 목록 ──

  private static prodName(md5: string, detectedAt: Date) {
    // 한국 날짜
    const d = new Date(new Date(detectedAt).getTime() + 9 * 3600 * 1000).toISOString().slice(2, 10).replace(/-/g, '');
    return `prod_${d}_${md5.slice(0, 12)}.jpg`;
  }

  /** 화면 이름 ↔ DB photo 키. 운영은 최근 상담 사진 순, 로컬은 이름 순 */
  private async photos(): Promise<{ name: string; photo: string }[]> {
    if (!this.prod) {
      const imgDir = this.imagesDir();
      const names = existsSync(imgDir) ? readdirSync(imgDir).filter((n) => NAME_RE.test(n) && IMAGE_RE.test(n)).sort() : [];
      return names.map((name) => ({ name, photo: LOCAL_PREFIX + name }));
    }
    const rows: { face_image_url: string; md5: string; detected_at: Date }[] = await this.dataSource.query(
      `SELECT face_image_url, md5(face_image_url) AS md5, detected_at FROM (
         SELECT DISTINCT ON (face_image_url) face_image_url, detected_at
           FROM face_analysis_results
          WHERE detection_type = 'WNC' AND source = 'consultation'
          ORDER BY face_image_url, detected_at DESC
       ) p ORDER BY detected_at DESC`,
    );
    return rows.map((r) => ({ name: FaceLandmarkTruthService.prodName(r.md5, r.detected_at), photo: r.face_image_url }));
  }

  /** 이름 확인 → DB photo 키 (운영: 사진 주소, 로컬: 'local:<이름>') */
  private async locate(name: string | undefined): Promise<string> {
    if (!name || !NAME_RE.test(name) || !IMAGE_RE.test(name)) throw new BadRequestException('사진 이름이 잘못되었습니다');
    if (!this.prod) {
      if (!existsSync(join(this.imagesDir(), name))) throw new NotFoundException('폴더에 없는 사진입니다');
      return LOCAL_PREFIX + name;
    }
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

  private static toFile(r: TruthRow): TruthFile {
    return {
      imageWidth: r.image_width,
      imageHeight: r.image_height,
      points: r.points,
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  // ── 요청 ──

  async list(user: AdminUser | undefined) {
    this.guard(user);
    const photos = await this.photos();
    const rows: { photo: string; n: number; updated_at: Date }[] = await this.dataSource.query(
      `SELECT photo, (SELECT count(*) FROM jsonb_object_keys(points))::int AS n, updated_at FROM face_landmark_truths`,
    );
    const byPhoto = new Map(rows.map((r) => [r.photo, r]));
    return {
      dir: this.prod ? '' : this.dir,
      items: photos.map(({ name, photo }) => {
        const r = byPhoto.get(photo);
        return { name, pointCount: r?.n ?? 0, updatedAt: r ? new Date(r.updated_at).toISOString() : null };
      }),
    };
  }

  async get(user: AdminUser | undefined, name: string): Promise<TruthFile | null> {
    this.guard(user);
    const photo = await this.locate(name);
    const [row]: TruthRow[] = await this.dataSource.query(`SELECT * FROM face_landmark_truths WHERE photo = $1`, [photo]);
    return row ? FaceLandmarkTruthService.toFile(row) : null;
  }

  /** 채점용 — 정답이 있는 사진 전부 */
  async export(user: AdminUser | undefined) {
    this.guard(user);
    const names = new Map((await this.photos()).map((p) => [p.photo, p.name]));
    const rows: TruthRow[] = await this.dataSource.query(`SELECT * FROM face_landmark_truths ORDER BY updated_at`);
    return rows
      .filter((r) => names.has(r.photo))
      .map((r) => ({
        name: names.get(r.photo)!,
        photo: r.photo.startsWith(LOCAL_PREFIX) ? null : r.photo,
        updatedBy: r.updated_by,
        ...FaceLandmarkTruthService.toFile(r),
      }));
  }

  async openPhoto(user: AdminUser | undefined, name: string): Promise<{ body: Readable; contentType: string }> {
    this.guard(user);
    const photo = await this.locate(name);
    if (this.prod) {
      let loc: { bucket: string; key: string } | null = null;
      try {
        loc = this.s3.extractS3Location(new URL(photo));
      } catch {
        loc = null;
      }
      if (!loc || !this.s3Client || loc.bucket !== this.bucket) throw new BadRequestException('이 서버 버킷의 사진이 아닙니다');
      const res = await this.s3Client.send(new GetObjectCommand({ Bucket: loc.bucket, Key: loc.key }));
      return { body: res.Body as Readable, contentType: res.ContentType || 'image/jpeg' };
    }
    const ext = name.split('.').pop()!.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { body: createReadStream(join(this.imagesDir(), name)), contentType };
  }

  /** 예시 그림 (받은 기준시각화 PDF 에서 뽑은 페이지) */
  openExample(user: AdminUser | undefined, name: string): { body: Readable; contentType: string } {
    this.guard(user);
    if (!name || !NAME_RE.test(name) || !/\.jpe?g$/i.test(name)) throw new BadRequestException('그림 이름이 잘못되었습니다');
    const p = join(this.examplesDir, name);
    if (!existsSync(p)) throw new NotFoundException('예시 그림이 없습니다');
    return { body: createReadStream(p), contentType: 'image/jpeg' };
  }

  async save(
    user: AdminUser | undefined,
    body: { name?: string; imageWidth?: unknown; imageHeight?: unknown; points?: unknown },
  ): Promise<TruthFile> {
    this.guard(user);
    const photo = await this.locate(body.name);
    const w = Number(body.imageWidth);
    const h = Number(body.imageHeight);
    if (!(Number.isInteger(w) && w > 0 && Number.isInteger(h) && h > 0)) {
      throw new BadRequestException('imageWidth · imageHeight 가 필요합니다');
    }
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
    const [row]: TruthRow[] = await this.dataSource.query(
      `INSERT INTO face_landmark_truths (photo, image_width, image_height, points, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (photo) DO UPDATE
         SET image_width = EXCLUDED.image_width, image_height = EXCLUDED.image_height,
             points = EXCLUDED.points, updated_by = EXCLUDED.updated_by, updated_at = now()
       RETURNING *`,
      [photo, w, h, JSON.stringify(points), user?.email ?? null],
    );
    return FaceLandmarkTruthService.toFile(row);
  }
}
