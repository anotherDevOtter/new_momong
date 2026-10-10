/**
 * 로컬 백엔드 얼굴 측정 저장 API 점검 (업로드 → 저장 → 조회 · 잘못된 입력 거부).
 * 측정은 브라우저와 같은 lib/face-measure 로 하고, 랜드마크는 web-landmarks/<사진>.json 을 쓴다.
 *
 * 실행 (frontend/user 에서):
 *   API_TOKEN=<로그인 토큰> CUSTOMER_ID=<고객 id> npx jiti ../../tools/face-baseline/api-smoke.ts --image <사진 경로>
 * 로컬 전용 — API 주소는 localhost:3200 으로 고정.
 */

import fs from 'node:fs';
import path from 'node:path';
import { analyzeFace, ENGINE } from '../../frontend/user/src/lib/face-measure';
import { loadImage } from './compare';

const API = 'http://localhost:3200/api';
const token = process.env.API_TOKEN ?? '';
const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

async function call(method: string, url: string, body?: unknown) {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

const ok = (cond: boolean, label: string, extra = '') => console.log(`${cond ? '✅' : '❌'} ${label}${extra ? `  ${extra}` : ''}`);

async function main() {
  const imagePath = path.resolve(process.cwd(), arg('image')!);
  const stem = path.basename(imagePath).replace(/\.\w+$/, '');
  const lm = JSON.parse(fs.readFileSync(path.join(__dirname, 'web-landmarks', `${stem}.json`), 'utf8')).landmarks as number[][];
  const image = await loadImage(imagePath);
  const measured = analyzeFace({ landmarks: lm.map(([x, y, z]) => ({ x, y, z })), image });
  const bytes = fs.readFileSync(imagePath);
  const contentType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // 1) 업로드 URL 발급 + S3 PUT
  const up = await call('POST', '/face-analysis/upload-url', { contentType, contentLength: bytes.length });
  ok(up.status === 201 || up.status === 200, '업로드 URL 발급', `${up.status} ${up.json?.data?.publicUrl?.replace(/\?.*/, '') ?? JSON.stringify(up.json).slice(0, 120)}`);
  const { uploadUrl, publicUrl } = up.json.data;
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: bytes });
  ok(put.ok, 'S3 업로드 (PUT)', String(put.status));

  // 2) 측정 결과 저장
  const body = { faceImageUrl: publicUrl, customerId: process.env.CUSTOMER_ID, wnc: measured.wnc, snh: measured.snh, engine: ENGINE };
  const saved = await call('POST', '/face-analysis/analyze', body);
  const d = saved.json?.data;
  ok(saved.status === 201 || saved.status === 200, '측정 결과 저장', `${saved.status} wnc=${d?.wnc?.final} snh=${d?.snh?.final} 항목 ${d?.metadata?.total_modules}`);
  ok(!!d?.wncId && !!d?.snhId, '저장 id 반환', `${d?.wncId?.slice(0, 8)} / ${d?.snhId?.slice(0, 8)}`);
  ok(d?.wnc?.final === measured.wnc.final && d?.snh?.final === measured.snh.final, '서버 재계산 final = 브라우저 final');
  ok(Object.keys(d?.wnc?.results ?? {}).every((k: string) => /^[a-z]+$/.test(k)), '결과 키 = 화면 항목 id', Object.keys(d?.wnc?.results ?? {}).join(','));
  ok(d?.wnc?.engine?.name === ENGINE.name, 'engine 표시 저장');

  // 3) 촬영본 GET presigned URL 이 실제로 열리는지
  const get = await fetch(d.faceImageDownloadUrl);
  ok(get.ok && Number(get.headers.get('content-length')) === bytes.length, '저장된 사진 다시 읽기 (GET)', `${get.status} ${get.headers.get('content-length')}B`);

  // 4) 잘못된 입력은 400
  const bad = async (label: string, patch: Record<string, unknown>) => {
    const r = await call('POST', '/face-analysis/analyze', { ...body, ...patch });
    ok(r.status === 400, `거부: ${label}`, `${r.status} ${String(r.json?.message ?? '').slice(0, 70)}`);
  };
  await bad('모르는 항목 키', { wnc: { results: { ...measured.wnc.results, hack: measured.wnc.results.faceline } } });
  await bad('잘못된 등급', { snh: { results: { facelen: { ...measured.snh.results.facelen, grade: 'X' } } } });
  await bad('우리 버킷이 아닌 사진 URL', { faceImageUrl: 'https://example.com/a.jpg' });
  await bad('도형 개수 초과', { wnc: { results: { faceline: { ...measured.wnc.results.faceline, measurement: { image_size: { width: 10, height: 10 }, shapes: Array(41).fill({ type: 'point', point: { x: 1, y: 1 } }) } } } } });
  await bad('숫자 아닌 값', { wnc: { results: { faceline: { ...measured.wnc.results.faceline, value: 'abc' } } } });

  // 5) 토큰 없으면 401
  const anon = await fetch(`${API}/face-analysis/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  ok(anon.status === 401, '토큰 없이 저장 거부', String(anon.status));

  console.log(`\nSAVED ${d?.wncId} ${d?.snhId}`);
}

if (process.argv[1]?.endsWith('api-smoke.ts')) main();
