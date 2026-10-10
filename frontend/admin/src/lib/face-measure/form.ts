// ⚠ frontend/user/src/lib/face-measure/form.ts 의 복사본 — user · admin 은 독립 앱이라 코드를 공유할 수 없다 (ARCHITECTURE §3-1).
//   고칠 때는 두 곳을 같이 고친다.

// 형태 (Warm / Neutral / Cool) 7개 항목 + 1way 표 전용 피부톤.
// 각 함수 위에 원본 Python 모듈 이름을 적었다. 계산 · 기준값 · 설명 문구는 원본 그대로다.

import { absSobelYWrapped, bitwise, canny, clahe, closeRow, grayRoi, meanLabL, threshold } from './imageops';
import { angleAt, deg, dist, dot, floorDiv, fmt, line, P, polyline, pt, round, text, toPt, xy } from './geometry';
import type { FormGrade, MeasureInput, MeasureResult, MeasurementShape } from './types';


const size = (i: MeasureInput) => ({ w: i.image.width, h: i.image.height });
const imageSize = (w: number, h: number) => ({ width: w, height: h });

/** 페이스라인 ← WNC_TYPE_02_jaw_angle */
export function faceline(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const leftEar = pt(lm, 234, w, h);
  const leftJaw = pt(lm, 172, w, h);
  const chin = pt(lm, 152, w, h);
  const rightJaw = pt(lm, 397, w, h);
  const rightEar = pt(lm, 454, w, h);

  const la = angleAt(leftEar, leftJaw, chin);
  const ra = angleAt(chin, rightJaw, rightEar);
  const a = (la + ra) / 2;
  const grade: FormGrade = a >= 120 ? 'W' : a >= 100 ? 'N' : 'C';

  return {
    name: '페이스라인',
    grade,
    value: round(a, 2),
    description: `평균 턱 각도 ${fmt(a, 1)}° (L:${fmt(la, 1)}°, R:${fmt(ra, 1)}°)`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        polyline([toPt(leftEar), toPt(leftJaw), toPt(chin)], '왼쪽 턱 각도'),
        polyline([toPt(chin), toPt(rightJaw), toPt(rightEar)], '오른쪽 턱 각도'),
        dot(toPt(leftJaw), '왼쪽 턱 꼭짓점'),
        dot(toPt(rightJaw), '오른쪽 턱 꼭짓점'),
        dot(toPt(chin), '턱 끝'),
        text(xy(Math.max(leftJaw[0] - 60, 0), Math.max(leftJaw[1] - 25, 0)), `L:${fmt(la, 1)}°`, 16),
        text(xy(rightJaw[0] + 10, Math.max(rightJaw[1] - 25, 0)), `R:${fmt(ra, 1)}°`, 16),
      ],
    },
  };
}

/** 광대 발달 ← WNC_TYPE_03_cheekbone */
export function cheek(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const lc = pt(lm, 234, w, h);
  const rc = pt(lm, 454, w, h);
  const le = pt(lm, 127, w, h);
  const re = pt(lm, 356, w, h);

  const lp = Math.abs(lc[0] - le[0]);
  const rp = Math.abs(rc[0] - re[0]);
  const avg = (lp + rp) / 2;
  const pxPerCm = Math.abs(re[0] - le[0]) / 15.0; // 15cm = 평균 얼굴 폭
  const cm = avg / pxPerCm;
  const grade: FormGrade = cm <= 0.5 ? 'W' : cm <= 1.0 ? 'N' : 'C';

  return {
    name: '광대 발달',
    grade,
    value: round(cm, 3),
    description: `평균 광대 돌출 ${fmt(cm, 2)}cm (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(xy(le[0], le[1] - 50), xy(le[0], le[1] + 50), '왼쪽 측면 기준선'),
        line(xy(re[0], re[1] - 50), xy(re[0], re[1] + 50), '오른쪽 측면 기준선'),
        line(xy(le[0], lc[1]), xy(lc[0], lc[1]), '왼쪽 광대 돌출', true),
        line(xy(re[0], rc[1]), xy(rc[0], rc[1]), '오른쪽 광대 돌출', true),
        dot(toPt(lc), '왼쪽 광대'),
        dot(toPt(rc), '오른쪽 광대'),
        dot(toPt(le), '왼쪽 귀'),
        dot(toPt(re), '오른쪽 귀'),
        text(xy(floorDiv(le[0] + lc[0], 2), Math.max(lc[1] - 10, 0)), `${fmt(lp / pxPerCm, 2)}cm`, 14),
        text(xy(floorDiv(re[0] + rc[0], 2), Math.max(rc[1] - 10, 0)), `${fmt(rp / pxPerCm, 2)}cm`, 14),
      ],
    },
  };
}

// ── 눈썹 형태 ← WNC_TYPE_05_eyebrow_shape ──────────────────────────────────

const LEFT_BROW = [70, 63, 105, 66, 107];
const RIGHT_BROW = [300, 293, 334, 296, 336];

/** 눈썹 주변을 엣지 검출해 헤드(안쪽 끝) · 테일 점을 찾는다 */
function detectBrowContour(input: MeasureInput, isLeft: boolean): { head: P; tail: P } | null {
  const { w, h } = size(input);
  const brow = (isLeft ? LEFT_BROW : RIGHT_BROW).map((i) => pt(input.landmarks, i, w, h));
  const xs = brow.map((p) => p[0]);
  const ys = brow.map((p) => p[1]);
  const xMin = Math.min(...xs) - 10;
  const xMax = Math.max(...xs) + 10;
  const yMin = Math.min(...ys) - 15;
  const yMax = Math.max(...ys) + 15;
  // Python 은 image[y_min:y_max, x_min:x_max] — 사진 경계 안으로 자른다
  const x0 = Math.max(0, xMin);
  const y0 = Math.max(0, yMin);
  const roi = grayRoi(input.image, x0, y0, Math.min(w, xMax), Math.min(h, yMax));
  if (roi.width === 0 || roi.height === 0) return null;

  const enhanced = clahe(roi, 3.0, 8, 8);
  const edges = canny(enhanced, 30, 100);
  const sobel = threshold(absSobelYWrapped(enhanced, 3), 30);
  const morphed = closeRow(bitwise(edges, sobel, 'or'), 3);

  // 열마다 가장 아래쪽 엣지
  const bottomByX = new Map<number, number>();
  for (let y = 0; y < morphed.height; y++) {
    for (let x = 0; x < morphed.width; x++) {
      if (morphed.data[y * morphed.width + x] > 0) bottomByX.set(x, y);
    }
  }
  if (bottomByX.size < 2) return null;
  const contour: P[] = [...bottomByX].map(([x, y]) => [x + x0, y + y0]);
  const head = contour.reduce((a, b) => (isLeft ? (b[0] > a[0] ? b : a) : b[0] < a[0] ? b : a));
  return { head, tail: brow[4] };
}

function browAngle(head: P, tail: P): number {
  const dy = tail[1] - head[1];
  const dx = tail[0] - head[0];
  if (dx === 0) return 0;
  return deg(Math.atan2(-dy, Math.abs(dx)));
}

export function browshape(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const left = detectBrowContour(input, true);
  const right = detectBrowContour(input, false);
  if (!left || !right) return null;

  const la = browAngle(left.head, left.tail);
  const ra = browAngle(right.head, right.tail);
  const avg = (Math.abs(la) + Math.abs(ra)) / 2;
  const grade: FormGrade = avg <= 5 ? 'W' : avg <= 9 ? 'N' : 'C';

  const lmid = [floorDiv(left.head[0] + left.tail[0], 2), floorDiv(left.head[1] + left.tail[1], 2)];
  const rmid = [floorDiv(right.head[0] + right.tail[0], 2), floorDiv(right.head[1] + right.tail[1], 2)];
  return {
    name: '눈썹 형태',
    grade,
    value: round(avg, 2),
    description: `평균 눈썹 각도 ${fmt(avg, 1)}° (L:${fmt(la, 1)}°, R:${fmt(ra, 1)}°)`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(toPt(left.head), toPt(left.tail), '왼쪽 눈썹 각도'),
        line(toPt(right.head), toPt(right.tail), '오른쪽 눈썹 각도'),
        dot(toPt(left.head), '왼쪽 눈썹 헤드'),
        dot(toPt(left.tail), '왼쪽 눈썹 테일'),
        dot(toPt(right.head), '오른쪽 눈썹 헤드'),
        dot(toPt(right.tail), '오른쪽 눈썹 테일'),
        text(xy(Math.max(lmid[0] - 40, 0), Math.max(lmid[1] - 10, 0)), `${fmt(la, 1)}°`, 16),
        text(xy(Math.max(rmid[0] - 40, 0), Math.max(rmid[1] - 10, 0)), `${fmt(ra, 1)}°`, 16),
      ],
    },
  };
}

/** 눈 형태 ← WNC_TYPE_06_eye_shape */
export function eyeshape(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const p159 = pt(lm, 159, w, h);
  const p145 = pt(lm, 145, w, h);
  const p133 = pt(lm, 133, w, h);
  const p33 = pt(lm, 33, w, h);

  const eyeH = Math.abs(p159[1] - p145[1]);
  const eyeW = Math.abs(p133[0] - p33[0]);
  if (eyeW <= 0) return null;
  const ratio = eyeH / eyeW;
  const grade: FormGrade = ratio >= 1 / 3.5 ? 'W' : ratio >= 1 / 4.25 ? 'N' : 'C';

  const vx = floorDiv(p159[0] + p145[0], 2);
  const hy = floorDiv(p133[1] + p33[1], 2);
  return {
    name: '눈 형태',
    grade,
    value: round(ratio, 3),
    description: `눈 세로:가로 비율 1:${fmt(1 / ratio, 1)} (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(xy(vx, p159[1]), xy(vx, p145[1]), '눈 세로 길이'),
        line(xy(p33[0], hy), xy(p133[0], hy), '눈 가로 길이'),
        text(xy(Math.max(p33[0] - 80, 0), hy - 10), `1:${fmt(1 / ratio, 1)}`, 18),
      ],
    },
  };
}

/** 눈꼬리 ← WNC_TYPE_07_eye_tail_angle */
export function eyetail(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const p226 = pt(lm, 226, w, h);
  const p133 = pt(lm, 133, w, h);

  const hd = p133[0] - p226[0];
  const vd = p133[1] - p226[1];
  const slope = hd !== 0 ? deg(Math.atan(vd / hd)) : vd > 0 ? 90 : -90;
  const grade: FormGrade = slope <= -10 ? 'W' : slope < 10 ? 'N' : 'C';

  return {
    name: '눈꼬리',
    grade,
    value: round(slope, 2),
    description: `눈꼬리 기울기 ${fmt(slope, 1)}° (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        line(xy(Math.max(0, p133[0] - 140), p133[1]), toPt(p133), '수평 기준선', true),
        line(toPt(p226), toPt(p133), '눈헤드→눈꼬리'),
        dot(toPt(p226), '눈헤드'),
        dot(toPt(p133), '눈꼬리'),
        text(xy(p226[0], Math.min(p226[1], p133[1]) - 10), `${fmt(slope, 1)}°`, 18),
      ],
    },
  };
}

/** 코 너비 ← WNC_TYPE_08_nose_shape (근사 연결 — INFRA-MIGRATION Q6) */
export function nosewidth(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const top = pt(lm, 6, w, h);
  const mid = pt(lm, 168, w, h);
  const tip = pt(lm, 1, w, h);
  const ln = pt(lm, 48, w, h);
  const rn = pt(lm, 278, w, h);

  const noseW = dist(rn, ln);
  const noseL = dist(tip, top);
  // 콧대가 직선에서 벗어난 정도 (미간–코끝 직선과 168번 점의 거리)
  const ex = tip[0] - top[0];
  const ey = tip[1] - top[1];
  const cross = ex * (top[1] - mid[1]) - ey * (top[0] - mid[0]);
  const deviation = Math.abs(cross) / Math.hypot(ex, ey);

  // ⚠ 원본이 픽셀 절대값(100px, 60px)을 기준으로 쓴다 — 사진 해상도에 따라 결과가 달라진다
  const lengthScore = Math.min(noseL / 100, 1.0);
  const widthScore = Math.max(1.0 - noseW / 60, 0);
  const straightScore = Math.max(1.0 - deviation / 5, 0);
  const total = lengthScore * 0.4 + widthScore * 0.4 + straightScore * 0.2;
  const grade: FormGrade = total >= 0.65 ? 'C' : total >= 0.35 ? 'N' : 'W';

  return {
    name: '코 너비',
    grade,
    value: round(total, 3),
    description: `코 형태 점수 ${fmt(total, 2)} (폭 ${fmt(noseW, 0)}px, 길이 ${fmt(noseL, 0)}px) (${grade})`,
    measurement: {
      image_size: imageSize(w, h),
      shapes: [
        polyline([toPt(top), toPt(mid), toPt(tip)], '콧대 라인'),
        line(toPt(ln), toPt(rn), '코 폭', true),
        dot(toPt(top), '미간'),
        dot(toPt(tip), '코 끝'),
        dot(toPt(ln), '왼쪽 콧구멍'),
        dot(toPt(rn), '오른쪽 콧구멍'),
        text(xy(tip[0] + 10, tip[1]), fmt(total, 2), 18),
      ],
    },
  };
}

/** 입술 두께 ← WNC_TYPE_09_lip_thickness */
export function lips(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const ut = pt(lm, 0, w, h);
  const ub = pt(lm, 13, w, h);
  const lt = pt(lm, 14, w, h);
  const lb = pt(lm, 17, w, h);
  const lc = pt(lm, 61, w, h);
  const rc = pt(lm, 291, w, h);

  const upper = Math.abs(ut[1] - ub[1]);
  const lower = Math.abs(lb[1] - lt[1]);
  const mouthW = dist(rc, lc);
  const ratio = mouthW > 0 ? (upper + lower) / mouthW : 0;
  const grade: FormGrade = ratio >= 0.286 ? 'W' : ratio >= 0.23 ? 'N' : 'C';

  const shapes: MeasurementShape[] = [
    line(xy(ut[0], ut[1]), xy(ut[0], ub[1]), '윗입술 두께', true),
    line(xy(lb[0], lt[1]), xy(lb[0], lb[1]), '아랫입술 두께', true),
    line(toPt(lc), toPt(rc), '입 너비'),
    dot(toPt(ut), '윗입술 상단'),
    dot(toPt(ub), '윗입술 하단'),
    dot(toPt(lt), '아랫입술 상단'),
    dot(toPt(lb), '아랫입술 하단'),
    text(xy(rc[0] + 10, floorDiv(ut[1] + lb[1], 2)), fmt(ratio, 2), 18),
  ];
  return {
    name: '입술 두께',
    grade,
    value: round(ratio, 3),
    description: `입술 두께/너비 비율 ${fmt(ratio, 2)} (${grade})`,
    measurement: { image_size: imageSize(w, h), shapes },
  };
}

/**
 * 피부톤 ← WNC_TYPE_01_skin_tone (키는 예전 번호 '1' 그대로 — 1way 표 · module_configs 가 이 키를 쓴다)
 * new 코스 화면에는 없는 항목이다. 2026-10-11 1way 전환 점검 중 추가.
 */
export function skintone(input: MeasureInput): MeasureResult | null {
  const { w, h } = size(input);
  const lm = input.landmarks;
  const forehead = pt(lm, 10, w, h);
  const regions: { center: P; name: string }[] = [
    { center: [forehead[0], Math.max(0, forehead[1] - 50)], name: 'forehead' },
    { center: pt(lm, 205, w, h), name: 'left_cheek' },
    { center: pt(lm, 425, w, h), name: 'right_cheek' },
    { center: pt(lm, 4, w, h), name: 'nose' },
  ];
  const S = 20;
  const boxes: { x1: number; y1: number; x2: number; y2: number; l: number; name: string }[] = [];
  const lValues: number[] = [];
  for (const r of regions) {
    const [cx, cy] = r.center;
    const x1 = Math.max(0, cx - S);
    const y1 = Math.max(0, cy - S);
    const x2 = Math.min(w, cx + S);
    const y2 = Math.min(h, cy + S);
    if (x2 > x1 && y2 > y1) {
      const meanL = meanLabL(input.image, x1, y1, x2, y2);
      lValues.push(meanL);
      boxes.push({ x1, y1, x2, y2, l: meanL / 2.55, name: r.name });
    }
  }
  if (!lValues.length) return null;
  const avg = lValues.reduce((a, b) => a + b, 0) / lValues.length / 2.55;
  // ⚠ 원본 기준값(≤19 W, ≤22 N)이 실제 피부 L 값(60~70대)과 맞지 않아 거의 항상 C 가 나온다 — 원본 그대로
  const grade: FormGrade = avg <= 19 ? 'W' : avg <= 22 ? 'N' : 'C';
  const shapes: MeasurementShape[] = boxes.flatMap((b) => [
    { type: 'rectangle' as const, points: [xy(b.x1, b.y1), xy(b.x2, b.y2)], stroke: '#FFFFFF', stroke_width: 2, dashed: false, label: `${b.name} L:${fmt(b.l, 1)}` },
    text(xy(b.x1, Math.max(b.y1 - 5, 0)), `L:${fmt(b.l, 1)}`, 14),
  ]);
  return {
    name: '피부톤',
    grade,
    value: round(avg, 2),
    description: `평균 피부 밝기 L값 ${fmt(avg, 1)} (${grade})`,
    measurement: { image_size: imageSize(w, h), shapes },
  };
}
