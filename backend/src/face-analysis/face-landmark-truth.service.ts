import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import type { Readable } from 'stream';

/**
 * 랜드마크 정답 — 로컬 전용 시험 데이터.
 * 사진 폴더에 있는 사진마다 사람이 찍은 '진짜 위치'를 JSON 으로 남긴다. 여러 검출 방법을 이 정답으로 채점한다.
 *
 *   LANDMARK_BENCH_DIR (기본: 저장소 바깥 ../../landmark-bench — Git 에 안 들어간다)
 *     images/<이름>.jpg|png    사진 (tools/landmark-bench/seed.sh 로 채운다)
 *     truth/<이름>.json        정답 { imageWidth, imageHeight, points: { id: [x, y] | null }, updatedAt }
 *                              x, y 는 사진 크기 대비 0~1. null = 사진에서 안 보이는 점
 *
 * DB 를 쓰지 않는다 — 채점 스크립트(파이썬 등)가 폴더만 읽으면 되게.
 * NODE_ENV=production 에서는 모든 요청을 막는다.
 */
const NAME_RE = /^[\w.-]{1,120}$/;
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;
const POINT_ID_RE = /^[a-z][a-z0-9_]{0,40}$/;

export interface TruthFile {
  imageWidth: number;
  imageHeight: number;
  points: Record<string, [number, number] | null>;
  updatedAt: string;
}

@Injectable()
export class FaceLandmarkTruthService {
  private readonly dir: string;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    this.enabled = config.get<string>('NODE_ENV') !== 'production';
    this.dir = resolve(config.get<string>('LANDMARK_BENCH_DIR') || join(process.cwd(), '..', '..', 'landmark-bench'));
  }

  private guard() {
    if (!this.enabled) throw new ForbiddenException('랜드마크 정답 도구는 로컬 전용입니다');
  }

  private imagesDir() {
    return join(this.dir, 'images');
  }

  private truthPath(name: string) {
    return join(this.dir, 'truth', `${name}.json`);
  }

  private checkName(name: string | undefined): string {
    if (!name || !NAME_RE.test(name) || !IMAGE_RE.test(name)) throw new BadRequestException('사진 이름이 잘못되었습니다');
    if (!existsSync(join(this.imagesDir(), name))) throw new NotFoundException('폴더에 없는 사진입니다');
    return name;
  }

  private readTruth(name: string): TruthFile | null {
    const p = this.truthPath(name);
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, 'utf8')) as TruthFile;
  }

  list() {
    this.guard();
    const imgDir = this.imagesDir();
    const names = existsSync(imgDir) ? readdirSync(imgDir).filter((n) => NAME_RE.test(n) && IMAGE_RE.test(n)).sort() : [];
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

  get(name: string) {
    this.guard();
    return this.readTruth(this.checkName(name));
  }

  openPhoto(name: string): { body: Readable; contentType: string } {
    this.guard();
    const n = this.checkName(name);
    const ext = n.split('.').pop()!.toLowerCase();
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    return { body: createReadStream(join(this.imagesDir(), n)), contentType };
  }

  /** 예시 그림 (examples/ — 받은 기준시각화 PDF 에서 뽑은 페이지) */
  openExample(name: string): { body: Readable; contentType: string } {
    this.guard();
    if (!name || !NAME_RE.test(name) || !/\.jpe?g$/i.test(name)) throw new BadRequestException('그림 이름이 잘못되었습니다');
    const p = join(this.dir, 'examples', name);
    if (!existsSync(p)) throw new NotFoundException('예시 그림이 없습니다');
    return { body: createReadStream(p), contentType: 'image/jpeg' };
  }

  save(body: { name?: string; imageWidth?: unknown; imageHeight?: unknown; points?: unknown }) {
    this.guard();
    const name = this.checkName(body.name);
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
