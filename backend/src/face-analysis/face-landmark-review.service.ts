import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { S3Service } from '../storage/s3.service';
import { FaceLandmarkReview, LANDMARK_PARTS, LandmarkPart, LandmarkVerdict } from './face-landmark-review.entity';

export type ReviewFilter = 'all' | 'unchecked' | 'ok' | 'bad';
export type ReviewSource = 'consultation' | 'admin_test' | 'all';

export interface LandmarkReviewItem {
  faceImageUrl: string;
  source: string;
  detectedAt: Date;
  review: { verdict: LandmarkVerdict; badParts: LandmarkPart[]; note: string | null; reviewedAt: Date } | null;
}

export interface LandmarkReviewCounts {
  total: number;
  unchecked: number;
  ok: number;
  bad: number;
}

/**
 * 랜드마크 검수 — 얼굴 사진 목록 + 사진별 가/부.
 * 랜드마크는 저장하지 않는다. admin 화면이 사진을 받아 브라우저에서 다시 뽑는다 (고객 화면과 같은 모델).
 *
 * 사진은 이 서버가 S3 에서 받아 그대로 넘긴다 (GET …/photo). 화면이 S3 를 직접 부르면
 * 버킷 CORS 에 그 화면 주소가 있어야 하는데, 로컬에서 운영 사진을 볼 때는 그렇지 않다.
 *
 * ── 로컬에서 운영 사진 검수하기 (tools/landmark-review/README.md) ──
 *   LANDMARK_REVIEW_PHOTOS=import      → 사진 목록을 face_analysis_results 대신
 *                                         landmark_review_photos(운영에서 내려받은 목록) 에서 읽는다
 *   LANDMARK_REVIEW_S3_BUCKET 외 3개   → 그 버킷을 이 키로 읽는다 (읽기 전용 키)
 *   검수 결과는 이 서버가 붙은 DB(로컬)에만 저장된다. 운영 서버(NODE_ENV=production)에서는 import 모드를 켜지 않는다.
 */
@Injectable()
export class FaceLandmarkReviewService {
  private readonly logger = new Logger(FaceLandmarkReviewService.name);
  private readonly photoTable: 'face_analysis_results' | 'landmark_review_photos';
  private readonly photoBucket: string | undefined;
  private readonly photoClient: S3Client | undefined;

  constructor(
    @InjectRepository(FaceLandmarkReview)
    private readonly repo: Repository<FaceLandmarkReview>,
    private readonly dataSource: DataSource,
    private readonly s3: S3Service,
    config: ConfigService,
  ) {
    const imported = config.get<string>('LANDMARK_REVIEW_PHOTOS') === 'import';
    if (imported && config.get<string>('NODE_ENV') === 'production') {
      throw new Error('LANDMARK_REVIEW_PHOTOS=import 는 로컬 전용입니다 (NODE_ENV=production 에서는 켜지 않는다)');
    }
    this.photoTable = imported ? 'landmark_review_photos' : 'face_analysis_results';

    // 사진 읽기: 따로 지정한 버킷 · 키가 있으면 그것, 없으면 앱 기본 S3 설정
    const bucket = config.get<string>('LANDMARK_REVIEW_S3_BUCKET');
    const region = config.get<string>('LANDMARK_REVIEW_AWS_REGION') || config.get<string>('AWS_REGION');
    const accessKeyId = bucket ? config.get<string>('LANDMARK_REVIEW_AWS_ACCESS_KEY_ID') : config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = bucket
      ? config.get<string>('LANDMARK_REVIEW_AWS_SECRET_ACCESS_KEY')
      : config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.photoBucket = bucket || config.get<string>('AWS_S3_BUCKET');
    if (region) {
      this.photoClient = new S3Client({
        region,
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
    }
    if (imported) this.logger.warn(`랜드마크 검수: 가져온 사진 목록 사용 · 사진 버킷 ${this.photoBucket}`);
  }

  /** 분석 한 번 = WNC 한 행. 같은 사진을 두 번 분석했으면 최근 것 하나만 */
  private photosSql(source: ReviewSource): { sql: string; params: unknown[] } {
    const where = source === 'all' ? '' : `AND source = $1`;
    const typeFilter = this.photoTable === 'face_analysis_results' ? `detection_type = 'WNC'` : 'TRUE';
    return {
      sql: `SELECT DISTINCT ON (face_image_url) face_image_url, source, detected_at
              FROM ${this.photoTable}
             WHERE ${typeFilter} ${where}
             ORDER BY face_image_url, detected_at DESC`,
      params: source === 'all' ? [] : [source],
    };
  }

  async list(opts: { filter: ReviewFilter; source: ReviewSource; limit: number; offset: number }): Promise<{
    items: LandmarkReviewItem[];
    counts: LandmarkReviewCounts;
  }> {
    const { sql, params } = this.photosSql(opts.source);
    const filterSql = {
      all: '',
      unchecked: 'WHERE v.id IS NULL',
      ok: "WHERE v.verdict = 'ok'",
      bad: "WHERE v.verdict = 'bad'",
    }[opts.filter];
    const n = params.length;

    const rows: {
      face_image_url: string;
      source: string;
      detected_at: Date;
      verdict: LandmarkVerdict | null;
      bad_parts: LandmarkPart[] | null;
      note: string | null;
      reviewed_at: Date | null;
    }[] = await this.dataSource.query(
      `SELECT p.face_image_url, p.source, p.detected_at, v.verdict, v.bad_parts, v.note, v.reviewed_at
         FROM (${sql}) p
         LEFT JOIN face_landmark_reviews v ON v.face_image_url = p.face_image_url
         ${filterSql}
        ORDER BY p.detected_at DESC
        LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, opts.limit, opts.offset],
    );

    const [counts] = await this.dataSource.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE v.id IS NULL)::int AS unchecked,
              count(*) FILTER (WHERE v.verdict = 'ok')::int AS ok,
              count(*) FILTER (WHERE v.verdict = 'bad')::int AS bad
         FROM (${sql}) p
         LEFT JOIN face_landmark_reviews v ON v.face_image_url = p.face_image_url`,
      params,
    );

    const items = rows.map((r) => ({
      faceImageUrl: r.face_image_url,
      source: r.source,
      detectedAt: r.detected_at,
      review: r.verdict
        ? { verdict: r.verdict, badParts: r.bad_parts ?? [], note: r.note, reviewedAt: r.reviewed_at as Date }
        : null,
    }));
    return { items, counts };
  }

  private async assertKnownPhoto(url: string) {
    const [exists] = await this.dataSource.query(`SELECT 1 FROM ${this.photoTable} WHERE face_image_url = $1 LIMIT 1`, [url]);
    if (!exists) throw new NotFoundException('검수 대상 목록에 없는 사진입니다');
  }

  /** 목록에 있는 사진만, 지정한 버킷에서 받아 넘긴다 */
  async openPhoto(url: string): Promise<{ body: Readable; contentType: string }> {
    if (!url) throw new BadRequestException('url 이 필요합니다');
    await this.assertKnownPhoto(url);
    let loc: { bucket: string; key: string } | null = null;
    try {
      loc = this.s3.extractS3Location(new URL(url));
    } catch {
      loc = null;
    }
    if (!loc || !this.photoClient || loc.bucket !== this.photoBucket) {
      throw new BadRequestException(`이 서버가 읽도록 설정된 버킷(${this.photoBucket ?? '없음'})의 사진이 아닙니다`);
    }
    const res = await this.photoClient.send(new GetObjectCommand({ Bucket: loc.bucket, Key: loc.key }));
    return { body: res.Body as Readable, contentType: res.ContentType || 'image/jpeg' };
  }

  async save(body: { faceImageUrl?: string; verdict?: string; badParts?: unknown; note?: unknown }) {
    const url = body.faceImageUrl;
    if (!url) throw new BadRequestException('faceImageUrl 이 필요합니다');
    if (body.verdict !== 'ok' && body.verdict !== 'bad') throw new BadRequestException("verdict 는 'ok' 또는 'bad'");
    const parts = Array.isArray(body.badParts) ? body.badParts : [];
    if (!parts.every((p) => (LANDMARK_PARTS as readonly unknown[]).includes(p))) {
      throw new BadRequestException(`badParts 는 ${LANDMARK_PARTS.join(', ')} 중에서`);
    }
    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
    await this.assertKnownPhoto(url);

    const row = (await this.repo.findOne({ where: { face_image_url: url } })) ?? this.repo.create({ face_image_url: url });
    row.verdict = body.verdict;
    row.bad_parts = body.verdict === 'ok' ? [] : (parts as LandmarkPart[]);
    row.note = note;
    const saved = await this.repo.save(row);
    return {
      verdict: saved.verdict,
      badParts: saved.bad_parts,
      note: saved.note,
      reviewedAt: saved.reviewed_at,
    };
  }

  /** 검수 취소 (미검수로 되돌림) */
  async clear(faceImageUrl: string) {
    if (!faceImageUrl) throw new BadRequestException('faceImageUrl 이 필요합니다');
    const res = await this.repo.delete({ face_image_url: faceImageUrl });
    return { deleted: res.affected || 0 };
  }
}
