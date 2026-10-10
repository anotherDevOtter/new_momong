// 비율 (Soft / Neutral / Hard) 10개 항목 + 1way 표 전용 코 폭.
// 각 함수 위에 원본 Python 모듈 이름을 적었다. 계산 · 기준값 · 설명 문구는 원본 그대로다.
// 예외: 얼굴 길이 · 턱 길이는 원본이 Haar 얼굴 검출 상자를 쓴다 → 랜드마크로 상자를 추정한다 (아래 HAAR_*).

import { canny, clahe, closeRow, absSobelYWrapped, bitwise, grayRoi, threshold } from './imageops';
import { dist, floorDiv, fmt, line, P, pt, round, text, toPt, xy } from './geometry';
import type { MeasureInput, MeasureResult, MeasurementShape, PropGrade } from './types';

const size = (i: MeasureInput) => ({ w: i.image.width, h: i.image.height });
const imageSize = (w: number, h: number) => ({ width: w, height: h });

/** 귀–귀(127–356) 거리 */
function faceWidth(input: MeasureInput): number {
  const { w, h } = size(input);
  return dist(pt(input.landmarks, 127, w, h), pt(input.landmarks, 356, w, h));
}

/** 이마(10)–턱끝(152) 세로 거리 */
function faceHeight(input: MeasureInput): number {
  const { w, h } = size(input);
  return Math.abs(pt(input.landmarks, 10, w, h)[1] - pt(input.landmarks, 152, w, h)[1]);
}

// ── Haar 얼굴 상자 추정 ──────────────────────────────────────────────────
// 원본(SNH_02 · SNH_14)은 OpenCV Haar 얼굴 검출 상자의 높이를 '얼굴 길이'로 쓴다.
// 브라우저에는 Haar 검출기가 없어서 랜드마크로 상자를 추정한다.
// 기준 사진 7장에서 잰 값 (2026-10-10, tools/face-baseline):
//   상자 높이 ≈ 1.095 × (152번 y − 10번 y)    (1.04 ~ 1.14)
//   상자 위   ≈ 10번 y − 0.106 × 위 길이
// 사진이 늘어나면 다시 잰다.
const HAAR_HEIGHT_RATIO = 1.095;
const HAAR_TOP_OFFSET = -0.106;

function estimatedHaarBox(input: MeasureInput): { top: number; height: number } {
  const { w, h } = size(input);
  const y10 = pt(input.landmarks, 10, w, h)[1];
  const lmh = pt(input.landmarks, 152, w, h)[1] - y10;
  return { top: Math.round(y10 + HAAR_TOP_OFFSET * lmh), height: Math.round(HAAR_HEIGHT_RATIO * lmh) };
}

/** 얼굴 길이 ← SNH_TYPE_02_face_length */
export function facelen(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const box = estimatedHaarBox(input);
  const side = [127, 356, 123, 352, 234, 454, 10, 338, 9, 337, 8, 336].map((i) => pt(input.landmarks, i, w, h)[0]);
  const leftX = Math.min(...side);
  const rightX = Math.max(...side);
  const top = box.top;
  const bottom = box.top + box.height;

  const ratio = box.height / (rightX - leftX);
  const grade: PropGrade = ratio <= 1.3 ? 'S' : ratio <= 1.5 ? 'N' : 'H';

  return {
    name: '얼굴 길이',
    grade,
    value: round(ratio, 3),
    description: `세로:가로 비율 ${fmt(ratio, 2)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        { type: 'rectangle', points: [xy(leftX, top), xy(rightX, bottom)], stroke: '#FFFFFF', stroke_width: 2, dashed: true, label: '얼굴 영역' },
        text(xy(Math.max(leftX - 80, 0), floorDiv(top + bottom, 2)), fmt(ratio, 2), 18),
      ],
    },
  };
}

/** 상중하안부 비율 ← SNH_TYPE_11_midface_ratio (근사 연결) */
export function thirds(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const p145 = pt(lm, 145, w, h);
  const p48 = pt(lm, 48, w, h);
  const p177 = pt(lm, 177, w, h);
  const p150 = pt(lm, 150, w, h);
  const p374 = pt(lm, 374, w, h);
  const p379 = pt(lm, 379, w, h);
  const p278 = pt(lm, 278, w, h);
  const p401 = pt(lm, 401, w, h);

  const vertical = (Math.abs(p145[1] - p150[1]) + Math.abs(p374[1] - p379[1])) / 2;
  const leftHorizontal = Math.abs(p177[0] - p48[0]);
  // 원본은 오른쪽도 계산하지만 판정에는 왼쪽만 쓴다
  const ratio = vertical / leftHorizontal;
  const grade: PropGrade = ratio > 2.3 ? 'S' : ratio >= 1.3 ? 'N' : 'H';

  return {
    name: '상중하안부 비율',
    grade,
    value: round(ratio, 3),
    description: `중안부 비율 ${fmt(ratio, 2)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(p145), xy(p145[0], p150[1]), '왼쪽 세로', true),
        line(xy(p177[0], p48[1]), toPt(p48), '왼쪽 가로', true),
        line(toPt(p374), xy(p374[0], p379[1]), '오른쪽 세로', true),
        line(toPt(p278), xy(p401[0], p278[1]), '오른쪽 가로', true),
        text(xy(50, 50), fmt(ratio, 2), 18),
      ],
    },
  };
}

// ── 눈썹~눈 거리 ← SNH_TYPE_04_eyebrow_eye_distance ───────────────────────

/** 눈썹 하단을 Canny 엣지로 찾는다 (center_x 주변 ±5 열에서 가장 아래 엣지) */
function browBottomEdge(input: MeasureInput, brow: P[], cx: number): number | null {
  const { w, h } = size(input);
  const ys = brow.map((p) => p[1]);
  const y0 = Math.max(0, Math.min(...ys) - 10);
  const y1 = Math.min(h, Math.max(...ys) + 30);
  const x0 = Math.max(0, cx - 30);
  const x1 = Math.min(w, cx + 30);
  const roi = grayRoi(input.image, x0, y0, x1, y1);
  if (roi.width === 0 || roi.height === 0) return null;
  const edges = canny(roi, 50, 150);
  const rcx = cx - x0;
  if (rcx < 0 || rcx >= edges.width) return null;
  let bottom = -1;
  for (let dx = -5; dx <= 5; dx++) {
    const x = rcx + dx;
    if (x < 0 || x >= edges.width) continue;
    for (let y = 0; y < edges.height; y++) if (edges.data[y * edges.width + x] > 0 && y > bottom) bottom = y;
  }
  return bottom < 0 ? null : y0 + bottom;
}

/**
 * 원본은 눈 점들을 두께 2 선(cv2.polylines)으로 마스크에 그린 뒤, center_x 열의 가장 위 픽셀을 쓴다.
 * 마스크 대신 선분이 center_x 를 지나는 y 를 구하고 두께(위로 1px)를 뺀다.
 */
function eyeTopAt(eye: P[], cx: number): number | null {
  let top: number | null = null;
  for (let i = 0; i < eye.length - 1; i++) {
    const [ax, ay] = eye[i];
    const [bx, by] = eye[i + 1];
    if (cx < Math.min(ax, bx) || cx > Math.max(ax, bx)) continue;
    const y = ax === bx ? Math.min(ay, by) : ay + ((by - ay) * (cx - ax)) / (bx - ax);
    const yy = Math.round(y) - 1;
    if (top === null || yy < top) top = yy;
  }
  return top;
}

function broweyeSide(input: MeasureInput, browIdx: number[], eyeIdx: number[], faceH: number, side: string) {
  const { w, h } = size(input);
  const brow = browIdx.map((i) => pt(input.landmarks, i, w, h));
  const eye = eyeIdx.map((i) => pt(input.landmarks, i, w, h));
  const overlapMin = Math.max(Math.min(...brow.map((p) => p[0])), Math.min(...eye.map((p) => p[0])));
  const overlapMax = Math.min(Math.max(...brow.map((p) => p[0])), Math.max(...eye.map((p) => p[0])));
  const cx = floorDiv(overlapMin + overlapMax, 2);
  const browY = browBottomEdge(input, brow, cx);
  const eyeY = eyeTopAt(eye, cx);
  if (browY === null || eyeY === null) return null;

  const d = Math.abs(browY - eyeY);
  const r = d / faceH;
  const grade: PropGrade = r > 0.25 ? 'S' : r > 0.167 ? 'N' : 'H';
  const shapes: MeasurementShape[] = [
    line(xy(cx, eyeY), xy(cx, browY), `${side} 거리 ${fmt(d, 0)}px`, false, '#00FF00'),
    { type: 'circle', point: xy(cx, browY), radius: 5, fill: '#FF0000', stroke: '#FF0000', label: '눈썹 하단' },
    { type: 'circle', point: xy(cx, eyeY), radius: 5, fill: '#0000FF', stroke: '#0000FF', label: '눈 상단' },
    text(xy(cx + 8, floorDiv(browY + eyeY, 2)), `${fmt(d, 0)}px`, 14, '#00FF00'),
  ];
  return { d, grade, shapes };
}

export function broweye(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const faceH = faceHeight(input);
  const left = broweyeSide(input, [70, 63, 105, 66, 107], [33, 160, 159, 158, 133, 153, 144], faceH, '왼쪽');
  const right = broweyeSide(input, [300, 293, 334, 296, 336], [263, 387, 386, 385, 362, 398, 384], faceH, '오른쪽');
  const sides = [left, right].filter((s): s is NonNullable<typeof s> => s !== null);

  // 원본: 좌우 등급의 최빈값. 좌우가 다르면 Python set 순서에 따라 아무거나 나온다(실행마다 다를 수 있음).
  // 여기서는 좌우가 다르면 N 으로 정한다 (최종 판정의 '동점이면 중립' 규칙과 같게).
  let grade: PropGrade = 'N';
  if (sides.length === 1) grade = sides[0].grade;
  else if (sides.length === 2 && sides[0].grade === sides[1].grade) grade = sides[0].grade;

  const avg = sides.length ? sides.reduce((s, x) => s + x.d, 0) / sides.length : 0;
  return {
    name: '눈썹~눈 거리',
    grade,
    value: round(avg, 2),
    description: `눈썹-눈 평균 거리 ${fmt(avg, 1)}px (${grade})`,
    measurement: { image_size: imageSize(w, h), shapes: sides.flatMap((s) => s.shapes) },
  };
}

// ── 쌍꺼풀 ← SNH_TYPE_07_eyelid ──────────────────────────────────────────

/** 눈 위쪽 띠에서 가로 방향 주름 엣지가 가장 강한 줄과 그 세기를 찾는다 */
function eyelidCrease(input: MeasureInput, eye: P[]): { score: number; creaseY: number | null } {
  const { w, h } = size(input);
  const top = Math.min(...eye.map((p) => p[1]));
  const y0 = Math.max(0, top - 5);
  const y1 = Math.min(h, top + 25);
  const x0 = Math.max(0, Math.min(...eye.map((p) => p[0])) - 5);
  const x1 = Math.min(w, Math.max(...eye.map((p) => p[0])) + 5);
  const roi = grayRoi(input.image, x0, y0, x1, y1);
  if (roi.width === 0 || roi.height === 0) return { score: 0, creaseY: null };

  const enhanced = clahe(roi, 2.0, 4, 4);
  const edges = canny(enhanced, 30, 100);
  const horizontal = threshold(absSobelYWrapped(enhanced, 5), 40);
  const morphed = closeRow(bitwise(edges, horizontal, 'and'), 5);

  const rows: number[] = [];
  for (let y = 0; y < morphed.height; y++) {
    let s = 0;
    for (let x = 0; x < morphed.width; x++) s += morphed.data[y * morphed.width + x];
    rows.push(s);
  }
  const max = Math.max(...rows);
  const cut = max * 0.3;
  const candidates = rows.map((v, i) => [i, v]).filter(([, v]) => v > cut);
  if (!candidates.length) return { score: 0, creaseY: null };

  // 눈 위쪽 5~20px 줄 중 가장 강한 줄. 없으면 전체에서 가장 강한 줄
  const valid = candidates.filter(([row]) => row >= 5 && row <= 20);
  let bestRow: number;
  let bestVal: number;
  if (valid.length) {
    [bestRow, bestVal] = valid.reduce((a, b) => (b[1] > a[1] ? b : a));
  } else {
    bestRow = rows.indexOf(max);
    bestVal = max;
  }
  return { score: (bestVal / (roi.width * 255)) * 100, creaseY: y0 + bestRow };
}

export function eyelid(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const eyeL = [33, 160, 159, 158, 133, 153, 144].map((i) => pt(input.landmarks, i, w, h));
  const eyeR = [263, 387, 386, 385, 362, 398, 384].map((i) => pt(input.landmarks, i, w, h));
  const l = eyelidCrease(input, eyeL);
  const r = eyelidCrease(input, eyeR);
  const avg = (l.score + r.score) / 2;
  const grade: PropGrade = avg <= 10 ? 'S' : avg <= 25 ? 'N' : 'H';
  const label = grade === 'S' ? '무쌍' : grade === 'N' ? '속쌍' : '겉쌍';

  const shapes: MeasurementShape[] = [];
  const crease = (eye: P[], y: number | null, name: string) => {
    if (y === null) return;
    const xs = eye.map((p) => p[0]);
    shapes.push({ type: 'line', points: [xy(Math.min(...xs), y), xy(Math.max(...xs), y)], stroke: '#FFFFFF', stroke_width: 2, label: name });
  };
  crease(eyeL, l.creaseY, '왼쪽 쌍꺼풀 주름선');
  crease(eyeR, r.creaseY, '오른쪽 쌍꺼풀 주름선');
  shapes.push(text(xy(50, 50), `EYELID: ${grade}`, 18), text(xy(50, 80), `SCORE: ${fmt(avg, 1)}`, 18));

  return {
    name: '쌍꺼풀',
    grade,
    value: round(avg, 2),
    description: `쌍꺼풀 주름 강도 ${fmt(avg, 1)} (${label})`,
    measurement: { image_size: imageSize(w, h), shapes },
  };
}

/** 눈 사이 거리 ← SNH_TYPE_05_eye_distance */
export function intereye(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const a = pt(input.landmarks, 133, w, h);
  const b = pt(input.landmarks, 362, w, h);
  const d = dist(b, a);
  const ratio = d / faceWidth(input);
  const grade: PropGrade = ratio > 0.222 ? 'S' : ratio > 0.167 ? 'N' : 'H';

  return {
    name: '눈 사이 거리',
    grade,
    value: round(ratio, 3),
    description: `눈 사이 거리 비율 ${fmt(ratio, 3)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(a), toPt(b), `눈 사이 거리 ${fmt(d, 0)}px`, true),
        text(xy(floorDiv(a[0] + b[0], 2), floorDiv(a[1] + b[1], 2) - 8), `${fmt(d, 0)}px`, 14),
      ],
    },
  };
}

/** 눈 바깥 여백 ← SNH_TYPE_06_eye_margin */
export function eyeouter(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const fw = faceWidth(input);
  const fh = faceHeight(input);
  const le = pt(lm, 226, w, h);
  const lf = pt(lm, 127, w, h);
  const re = pt(lm, 446, w, h);
  const rf = pt(lm, 356, w, h);

  const lm_ = Math.abs(lf[0] - le[0]);
  const rm = Math.abs(rf[0] - re[0]);
  const avg = (lm_ / fw + rm / fw) / 2;
  // 원본은 좌우 각각 다른 기준(0.167 / 0.2)으로도 판정하지만 결과에는 평균 기준만 쓴다
  const grade: PropGrade = avg > 0.143 ? 'S' : avg > 0.111 ? 'N' : 'H';

  const vl = Math.trunc(fh * 0.4);
  return {
    name: '눈 바깥 여백',
    grade,
    value: round(avg, 3),
    description: `눈 바깥여백 평균 비율 ${fmt(avg, 3)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(le), xy(lf[0], le[1]), `왼쪽 여백 ${fmt(lm_, 0)}px`, true),
        line(xy(lf[0], lf[1] - vl), xy(lf[0], lf[1] + vl), '왼쪽 얼굴 끝', true),
        line(toPt(re), xy(rf[0], re[1]), `오른쪽 여백 ${fmt(rm, 0)}px`, true),
        line(xy(rf[0], rf[1] - vl), xy(rf[0], rf[1] + vl), '오른쪽 얼굴 끝', true),
        text(xy(floorDiv(le[0] + lf[0], 2), le[1] - 8), `${fmt(lm_, 0)}px`, 14),
        text(xy(floorDiv(re[0] + rf[0], 2), re[1] - 8), `${fmt(rm, 0)}px`, 14),
      ],
    },
  };
}

/** 코 길이 ← SNH_TYPE_09_nose_length */
export function noselen(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const tip = pt(input.landmarks, 2, w, h);
  const root = pt(input.landmarks, 8, w, h);
  const len = Math.abs(tip[1] - root[1]);
  const ratio = len / faceHeight(input);
  const grade: PropGrade = ratio <= 0.27 ? 'S' : ratio < 0.303 ? 'N' : 'H';

  const hl = Math.trunc(faceWidth(input) * 0.4);
  return {
    name: '코 길이',
    grade,
    value: round(ratio, 3),
    description: `코 길이 비율 ${fmt(ratio, 3)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(root), toPt(tip), '코 길이', true),
        line(xy(root[0] - hl, root[1]), xy(root[0] + hl, root[1]), '코 뿌리 기준선', true),
        line(xy(tip[0] - hl, tip[1]), xy(tip[0] + hl, tip[1]), '코 끝 기준선', true),
        text(xy(50, 50), `NOSE: ${grade}`, 18),
        text(xy(50, 80), `RATIO: ${fmt(ratio, 3)}`, 18),
      ],
    },
  };
}

/** 인중 길이 ← SNH_TYPE_12_philtrum_length */
export function philtrum(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const tip = pt(input.landmarks, 2, w, h);
  const lip = pt(input.landmarks, 0, w, h);
  // ⚠ 원본이 35px = 1cm 로 고정한다 — 사진 해상도에 따라 결과가 달라진다
  const cm = dist(lip, tip) / 35;
  const grade: PropGrade = cm <= 1.4 ? 'S' : cm <= 1.8 ? 'N' : 'H';

  return {
    name: '인중 길이',
    grade,
    value: round(cm, 2),
    description: `인중 길이 ${fmt(cm, 2)}cm (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(tip), toPt(lip), '인중', true),
        text(xy(50, 50), `PHILTRUM: ${fmt(cm, 2)}cm (${grade})`, 18),
      ],
    },
  };
}

/** 입 폭 ← SNH_TYPE_13_mouth_width */
export function mouthwidth(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const l = pt(input.landmarks, 61, w, h);
  const r = pt(input.landmarks, 291, w, h);
  const fw = faceWidth(input);
  const ratio = fw > 0 ? dist(r, l) / fw : 0;
  const grade: PropGrade = ratio < 0.35 ? 'S' : ratio <= 0.45 ? 'N' : 'H';

  return {
    name: '입 폭',
    grade,
    value: round(ratio, 3),
    description: `입 너비 비율 ${fmt(ratio, 2)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(l), toPt(r), '입 너비', true, '#0000FF'),
        { type: 'circle', point: toPt(l), radius: 5, fill: '#FF0000', stroke: '#FF0000', stroke_width: 1, label: '왼쪽 입꼬리' },
        { type: 'circle', point: toPt(r), radius: 5, fill: '#FF0000', stroke: '#FF0000', stroke_width: 1, label: '오른쪽 입꼬리' },
        text(xy(50, 50), `MOUTH: ${grade}`, 18),
        text(xy(50, 80), `RATIO: ${fmt(ratio, 2)}`, 18),
      ],
    },
  };
}

/** 턱 길이 ← SNH_TYPE_14_chin_length */
export function chinlen(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const below = pt(input.landmarks, 17, w, h);
  const chin = pt(input.landmarks, 152, w, h);
  const ratio = dist(chin, below) / estimatedHaarBox(input).height;
  const grade: PropGrade = ratio <= 1 / 4.5 ? 'S' : ratio >= 1 / 4 ? 'H' : 'N';

  return {
    name: '턱 길이',
    grade,
    value: round(ratio, 3),
    description: `턱길이 비율 ${fmt(ratio, 3)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(below), toPt(chin), '턱 길이', true),
        text(xy(50, 50), `CHIN LENGTH: ${fmt(ratio, 3)} (${grade})`, 18),
      ],
    },
  };
}

/**
 * 코 폭 ← SNH_TYPE_10_nose_width (키는 예전 번호 '10' 그대로 — 1way 표 · module_configs 가 이 키를 쓴다)
 * new 코스 화면에는 없는 항목이다 (화면의 '코 너비'는 WNC 08 코 형태). 2026-10-11 1way 전환 점검 중 추가.
 */
export function nosebreadth(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const l = pt(input.landmarks, 48, w, h);
  const r = pt(input.landmarks, 278, w, h);
  const ratio = Math.abs(r[0] - l[0]) / faceWidth(input);
  const grade: PropGrade = ratio <= 0.182 ? 'S' : ratio < 0.222 ? 'N' : 'H';
  const vl = Math.trunc(faceHeight(input) * 0.3);
  return {
    name: '코 폭',
    grade,
    value: round(ratio, 3),
    description: `코폭 비율 ${fmt(ratio, 3)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(l), xy(r[0], l[1]), '코폭', true),
        line(xy(l[0], l[1] - vl), xy(l[0], l[1] + vl), '왼쪽 콧망울 기준선', true),
        line(xy(r[0], r[1] - vl), xy(r[0], r[1] + vl), '오른쪽 콧망울 기준선', true),
        text(xy(50, 50), `NOSE_WIDTH: ${grade}`, 18),
        text(xy(50, 80), `RATIO: ${fmt(ratio, 3)}`, 18),
      ],
    },
  };
}
