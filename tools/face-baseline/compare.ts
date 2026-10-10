/**
 * 인프라 이전 1-5: 웹(TS) 측정 결과를 Python 기준값과 비교한다.
 *
 * --landmarks python (기본) : 기준값에 저장된 Python 랜드마크를 그대로 TS 로직에 넣는다
 *                              → 로직 이식 오류만 본다
 * --landmarks web            : web-landmarks/<사진>.json (브라우저 FaceLandmarker 결과)를 쓴다
 *                              → 실제 웹 파이프라인 차이를 본다
 *
 * 실행 (frontend/user 에서):
 *   npx jiti ../../tools/face-baseline/compare.ts --images ../../../face_landmark/test_image [--landmarks web] [--json out.json]
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeFace, type FaceMeasureResult } from '../../frontend/user/src/lib/face-measure';
import type { LandmarkPoint, RgbImage } from '../../frontend/user/src/lib/face-measure/types';

const requireUser = createRequire(path.resolve(__dirname, '../../frontend/user/package.json'));
const sharp = requireUser('sharp');

/** 화면 항목 id → 기존 Python 모듈 번호 */
export const PY_KEY: Record<'wnc' | 'snh', Record<string, string>> = {
  wnc: { faceline: '2', cheek: '3', browshape: '5', eyeshape: '6', eyetail: '7', nosewidth: '8', lips: '9' },
  snh: { facelen: '2', thirds: '11', broweye: '4', eyelid: '7', intereye: '5', eyeouter: '6', noselen: '9', philtrum: '12', mouthwidth: '13', chinlen: '14' },
};

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

/** cv2.imread 와 같게: EXIF 회전 적용, alpha 버림, RGB 8비트 */
export async function loadImage(file: string): Promise<RgbImage> {
  const { data, info } = await sharp(file).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, channels: 3, data: new Uint8Array(data) };
}

/** 저장 형식 [x, y, z][] → LandmarkPoint[] */
const toPoints = (a: number[][] | null): LandmarkPoint[] | null => (a ? a.map(([x, y, z]) => ({ x, y, z })) : null);

export interface Row {
  image: string;
  group: 'wnc' | 'snh';
  id: string;
  py: { grade?: string; value?: number | null; description?: string } | null;
  web: { grade?: string; value?: number | null; description?: string } | null;
}

export async function compareAll(baseDir: string, imgDir: string, landmarkSrc: string) {
  const rows: Row[] = [];
  const webResults: Record<string, FaceMeasureResult> = {};
  for (const f of fs.readdirSync(path.join(baseDir, 'baselines')).filter((n) => n.endsWith('.json')).sort()) {
    const base = JSON.parse(fs.readFileSync(path.join(baseDir, 'baselines', f), 'utf8'));
    if (!base.result?.success) continue;

    let lm: LandmarkPoint[] | null = null;
    if (landmarkSrc === 'web') {
      const p = path.join(baseDir, 'web-landmarks', f);
      if (fs.existsSync(p)) lm = toPoints(JSON.parse(fs.readFileSync(p, 'utf8')).landmarks);
    } else {
      lm = toPoints(base.landmarks);
    }
    if (!lm) continue;

    const image = await loadImage(path.join(imgDir, base.image));
    const web = analyzeFace({ landmarks: lm, image });
    webResults[base.image] = web;
    for (const group of ['wnc', 'snh'] as const) {
      for (const [id, key] of Object.entries(PY_KEY[group])) {
        rows.push({ image: base.image, group, id, py: base.result.data[group].results[key] ?? null, web: web[group].results[id] ?? null });
      }
    }
  }
  return { rows, webResults };
}

async function main() {
  const baseDir = __dirname;
  const imgDir = path.resolve(process.cwd(), arg('images', '../../../face_landmark/test_image')!);
  const src = arg('landmarks', 'python')!;
  const { rows } = await compareAll(baseDir, imgDir, src);

  const byId = new Map<string, Row[]>();
  for (const r of rows) byId.set(`${r.group}.${r.id}`, [...(byId.get(`${r.group}.${r.id}`) ?? []), r]);

  let same = 0;
  console.log(`랜드마크: ${src}\n`);
  console.log('항목'.padEnd(18) + '등급일치  값 최대차이  설명 다른 사진');
  for (const [k, rs] of byId) {
    const g = rs.filter((r) => r.py?.grade === r.web?.grade).length;
    same += g;
    const diffs = rs.map((r) => Math.abs((r.py?.value ?? NaN) - (r.web?.value ?? NaN))).filter((d) => !Number.isNaN(d));
    const descDiff = rs.filter((r) => r.py?.description !== r.web?.description).map((r) => r.image.replace(/\.\w+$/, ''));
    console.log(k.padEnd(18) + `${g}/${rs.length}`.padEnd(10) + (diffs.length ? Math.max(...diffs).toPrecision(3) : '-').padEnd(12) + descDiff.join(','));
  }
  console.log(`\n전체 등급 일치: ${same}/${rows.length} (${((same / rows.length) * 100).toFixed(1)}%)`);

  const out = arg('json');
  if (out) fs.writeFileSync(out, JSON.stringify(rows, null, 2));
}

if (process.argv[1]?.endsWith("compare.ts")) main();
