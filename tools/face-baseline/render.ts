/**
 * Python 측정 결과와 웹(TS) 측정 결과를 사진 위에 나란히 그린 비교 이미지를 만든다.
 * 사진 한 장당 한 장. 항목마다 [Python | 웹] 두 칸, 측정 부위를 확대해서 보여준다.
 *
 * 웹 쪽은 web-landmarks/ (브라우저 FaceLandmarker 0.10.35 결과)를 쓴다 = 실제 웹에서 나올 결과.
 *
 * --server-images <폴더> 를 주면 Python 칸에 측정선 대신 Python 서버가 직접 그린 결과 이미지
 * (모듈이 output_images/ 에 남기는 <모듈>_baseline_<사진>.png)를 같은 영역으로 잘라 넣는다.
 *
 * 실행 (frontend/user 에서):
 *   npx jiti ../../tools/face-baseline/render.ts --images ../../../face_landmark/test_image --out <폴더>
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { analyzeFace } from '../../frontend/user/src/lib/face-measure';
import { FORM, PROP } from '../../frontend/user/src/components/new/faceAnalysisData';
import type { LandmarkPoint, MeasurementShape } from '../../frontend/user/src/lib/face-measure/types';
import { loadImage, PY_KEY } from './compare';

const sharp = createRequire(path.resolve(__dirname, '../../frontend/user/package.json'))('sharp');

const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};

const CELL = 300; // 한 칸(정사각) 크기
const GAP = 8;
const COLS = 3;
const PY_COLOR = '#FF8A00';
const WEB_COLOR = '#00C2FF';
const FONT = "Apple SD Gothic Neo, AppleSDGothicNeo, sans-serif";
const TITLE: Record<string, string> = Object.fromEntries([...FORM, ...PROP].map((m) => [m.id, m.title]));

type Box = { left: number; top: number; width: number; height: number };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 도형의 좌표들 (글자 제외) */
function shapePoints(s: MeasurementShape): { x: number; y: number }[] {
  if (s.type === 'text') return [];
  if (s.type === 'point') return [s.point];
  if (s.type === 'circle') return [s.point ?? s.center!];
  return s.points;
}

/** 측정 부위가 보이도록 정사각 영역을 잡는다 */
function cropFor(shapes: MeasurementShape[], imgW: number, imgH: number): Box {
  const pts = shapes.flatMap(shapePoints);
  if (!pts.length) return { left: 0, top: 0, width: Math.min(imgW, imgH), height: Math.min(imgW, imgH) };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  let side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.5;
  // 정수로 맞춰야 사진 경계를 1px 넘지 않는다
  side = Math.floor(Math.min(Math.max(side, Math.min(imgW, imgH) * 0.18), Math.min(imgW, imgH)));
  const left = Math.max(0, Math.min(Math.round(cx - side / 2), imgW - side));
  const top = Math.max(0, Math.min(Math.round(cy - side / 2), imgH - side));
  return { left, top, width: side, height: side };
}

/** 도형을 확대된 칸 좌표로 옮겨 SVG 로 그린다 */
function shapesSvg(shapes: MeasurementShape[], box: Box, color: string): string {
  const k = CELL / box.width;
  const X = (x: number) => ((x - box.left) * k).toFixed(1);
  const Y = (y: number) => ((y - box.top) * k).toFixed(1);
  const sw = 2.5;
  const out: string[] = [];
  for (const s of shapes) {
    if (s.type === 'text') continue;
    const dash = 'dashed' in s && s.dashed ? ' stroke-dasharray="7 5"' : '';
    if (s.type === 'point') {
      out.push(`<circle cx="${X(s.point.x)}" cy="${Y(s.point.y)}" r="4" fill="${color}" stroke="#000" stroke-width="1"/>`);
    } else if (s.type === 'circle') {
      const c = s.point ?? s.center!;
      out.push(`<circle cx="${X(c.x)}" cy="${Y(c.y)}" r="4" fill="${color}" stroke="#000" stroke-width="1"/>`);
    } else if (s.type === 'rectangle') {
      const [a, b] = s.points;
      out.push(`<rect x="${X(Math.min(a.x, b.x))}" y="${Y(Math.min(a.y, b.y))}" width="${(Math.abs(b.x - a.x) * k).toFixed(1)}" height="${(Math.abs(b.y - a.y) * k).toFixed(1)}" fill="none" stroke="${color}" stroke-width="${sw}"${dash}/>`);
    } else {
      const pts = s.points.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
      const tag = s.type === 'polygon' ? 'polygon' : 'polyline';
      out.push(`<${tag} points="${pts}" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="${sw + 2}"/>`);
      out.push(`<${tag} points="${pts}" fill="none" stroke="${color}" stroke-width="${sw}"${dash}/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL}" height="${CELL}">${out.join('')}</svg>`;
}

async function panel(file: string, box: Box, shapes: MeasurementShape[], color: string): Promise<Buffer> {
  return sharp(file)
    .rotate()
    .extract(box)
    .resize(CELL, CELL)
    .composite([{ input: Buffer.from(shapesSvg(shapes, box, color)) }])
    .png()
    .toBuffer();
}

const fmtVal = (v: number | null | undefined) => (v == null ? '-' : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(3));

/** Python 서버가 그린 결과 이미지 경로 — 모듈이 output_images/<모듈>_<image_id>.png 로 남긴다 */
function serverImagePath(dir: string, group: 'wnc' | 'snh', key: string, stem: string) {
  return path.join(dir, `${group.toUpperCase()}_TYPE_${key.padStart(2, '0')}_baseline_${stem}.png`);
}

async function serverPanel(file: string, box: Box): Promise<Buffer> {
  return sharp(file).extract(box).resize(CELL, CELL).png().toBuffer();
}

async function renderSheet(baseDir: string, imgDir: string, outDir: string, name: string, serverDir?: string) {
  const base = JSON.parse(fs.readFileSync(path.join(baseDir, 'baselines', name), 'utf8'));
  const webLmPath = path.join(baseDir, 'web-landmarks', name);
  if (!base.result?.success || !fs.existsSync(webLmPath)) return null;
  const webLm = JSON.parse(fs.readFileSync(webLmPath, 'utf8')).landmarks as number[][] | null;
  if (!webLm) return null;

  const file = path.join(imgDir, base.image);
  const image = await loadImage(file);
  const web = analyzeFace({ landmarks: webLm.map(([x, y, z]): LandmarkPoint => ({ x, y, z })), image });

  const items = (['wnc', 'snh'] as const).flatMap((g) => Object.entries(PY_KEY[g]).map(([id, key]) => ({ g, id, key })));
  const cellW = CELL * 2 + GAP;
  const headH = 34;
  const footH = 48;
  const blockH = headH + CELL + footH;
  const topH = 96;
  const width = COLS * cellW + (COLS + 1) * 24;
  const rows = Math.ceil(items.length / COLS);
  const height = topH + rows * (blockH + 24) + 40;

  const composites: { input: Buffer; left: number; top: number }[] = [];
  const texts: string[] = [];
  let same = 0;

  for (const [i, it] of items.entries()) {
    const py = base.result.data[it.g].results[it.key];
    const wr = web[it.g].results[it.id];
    const pyShapes: MeasurementShape[] = py?.measurement?.shapes ?? [];
    const webShapes: MeasurementShape[] = wr?.measurement?.shapes ?? [];
    const box = cropFor([...pyShapes, ...webShapes], image.width, image.height);
    const x0 = 24 + (i % COLS) * (cellW + 24);
    const y0 = topH + Math.floor(i / COLS) * (blockH + 24);
    const match = py?.grade === wr?.grade;
    if (match) same++;

    const serverFile = serverDir && serverImagePath(serverDir, it.g, it.key, base.image.replace(/\.\w+$/, ''));
    const pyPanel = serverFile && fs.existsSync(serverFile) ? await serverPanel(serverFile, box) : await panel(file, box, pyShapes, PY_COLOR);
    composites.push({ input: pyPanel, left: x0, top: y0 + headH });
    composites.push({ input: await panel(file, box, webShapes, WEB_COLOR), left: x0 + CELL + GAP, top: y0 + headH });

    const titleColor = match ? '#111' : '#D62828';
    texts.push(`<text x="${x0}" y="${y0 + 23}" font-size="19" font-weight="700" fill="${titleColor}">${esc(TITLE[it.id] ?? it.id)}<tspan font-size="13" font-weight="400" fill="#888"> ${it.id}${match ? '' : '  · 등급 다름'}</tspan></text>`);
    if (!match) texts.push(`<rect x="${x0 - 4}" y="${y0 + headH - 4}" width="${cellW + 8}" height="${CELL + 8}" fill="none" stroke="#D62828" stroke-width="3"/>`);
    const fy = y0 + headH + CELL + 22;
    texts.push(`<text x="${x0}" y="${fy}" font-size="16" fill="${PY_COLOR}" font-weight="700">${serverDir ? 'Python 서버' : 'Python'}  ${esc(py?.grade ?? '-')}  <tspan fill="#333" font-weight="400">${fmtVal(py?.value)}</tspan></text>`);
    texts.push(`<text x="${x0 + CELL + GAP}" y="${fy}" font-size="16" fill="${WEB_COLOR}" font-weight="700">웹  ${esc(wr?.grade ?? '-')}  <tspan fill="#333" font-weight="400">${fmtVal(wr?.value)}</tspan></text>`);
  }

  const header =
    `<text x="24" y="44" font-size="30" font-weight="800" fill="#111">얼굴 자동 측정 비교 — ${esc(base.image)}</text>` +
    `<text x="24" y="76" font-size="17" fill="#444">등급 일치 ${same}/${items.length}   ·   ` +
    `<tspan fill="${PY_COLOR}" font-weight="700">■ ${serverDir ? 'Python 서버가 그린 결과 이미지' : 'Python (현재 서버'}${serverDir ? '' : ', MediaPipe 0.10.14)'}</tspan>   ` +
    `<tspan fill="${WEB_COLOR}" font-weight="700">■ 웹 (브라우저, MediaPipe 0.10.35)</tspan>   ·   빨간 테두리 = 등급 다름</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><style>text{font-family:${FONT}}</style>${header}${texts.join('')}</svg>`;

  const outName = `${serverDir ? '비교_얼굴측정_서버이미지 vs 웹' : '비교_얼굴측정_Python vs 웹'}_${base.image.replace(/\.\w+$/, '')}.png`;
  await sharp({ create: { width, height, channels: 3, background: '#FFFFFF' } })
    .composite([...composites, { input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toFile(path.join(outDir, outName));
  return { outName, same, total: items.length };
}

async function main() {
  const baseDir = __dirname;
  const imgDir = path.resolve(process.cwd(), arg('images', '../../../face_landmark/test_image')!);
  const outDir = path.resolve(process.cwd(), arg('out', path.join(baseDir, 'compare-images'))!);
  fs.mkdirSync(outDir, { recursive: true });
  for (const name of fs.readdirSync(path.join(baseDir, 'baselines')).filter((n) => n.endsWith('.json')).sort()) {
    const r = await renderSheet(baseDir, imgDir, outDir, name, arg('server-images'));
    if (r) console.log(`${r.outName}  (등급 일치 ${r.same}/${r.total})`);
  }
}

if (process.argv[1]?.endsWith('render.ts')) main();
