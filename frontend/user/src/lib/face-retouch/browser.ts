'use client';

// 고객에게 보여 줄 사진의 피부를 보정한다. 사진이 브라우저 밖으로 나가지 않는다.
// 분석·측정에는 넘기지 말 것 — 분석은 항상 원본으로 돌린다.

import { detectLandmarks } from '@/components/new/useFaceLandmarks';
import type { LandmarkPoint } from '@/lib/face-measure/types';
import { boxBlur, narrowFacePixels, retouchPixels } from './core';
import type { JawPoint } from './core';

// MediaPipe FaceLandmarker 468점 번호
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const EYES = [
  [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
  [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
];
const BROWS_AND_LIPS = [
  [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],                                                // 눈썹
  [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185], // 입술
];
const NASOLABIAL = [[98, 206, 216, 212], [327, 426, 436, 432]];
const UNDER_EYE = [[111, 117, 118, 119, 120, 121], [340, 346, 347, 348, 349, 350]];
// 얼굴 양쪽 턱선 점과 당기는 비율. 눈높이는 그대로, 턱 모서리를 가장 많이 당긴다.
const JAWLINE_SIDES: [number, number][][] = [
  [[234, 0], [93, 0.5], [132, 0.8], [58, 1], [172, 1]],
  [[454, 0], [323, 0.5], [361, 0.8], [288, 1], [397, 1]],
];
const FACE_MIDLINE = [10, 152]; // 이마 위 → 턱끝
const SLIM_BAND = 0.12; // 턱선 바깥으로 영향이 미치는 폭(얼굴 폭 대비)
const SLIM_NECK = 0.5; // 턱끝 아래로 이만큼(얼굴 폭 대비) 내려가며 0 이 된다
const SLIM_SMOOTH = 0.04; // 높이 방향으로 흐리는 폭(얼굴 폭 대비)

/** 전후 사진 전용 얼굴 작게 강도. 턱 모서리가 얼굴 폭의 이 비율만큼 안쪽으로 온다. */
export const TREATMENT_PHOTO_SLIM = 0.04;

export interface RetouchOptions {
  strength?: number;
  brighten?: number;
  /** 얼굴 작게. 기본 0. 윤곽이 바뀌므로 전후 사진에만 쓴다. */
  slim?: number;
}

export interface RetouchResult {
  blob: Blob;
  /** 얼굴을 못 찾으면 false 이고 blob 은 받은 파일 그대로다 */
  applied: boolean;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다'));
    img.src = url;
  });
}

function tracePath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], close: boolean) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  if (close) ctx.closePath();
}

function featheredAlpha(ctx: CanvasRenderingContext2D, w: number, h: number, radius: number): Float32Array {
  const { data } = ctx.getImageData(0, 0, w, h);
  let mask: Float32Array = new Float32Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] / 255;
  for (let pass = 0; pass < 2; pass++) mask = boxBlur(mask, w, h, radius);
  return mask;
}

function maskCanvas(w: number, h: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas context');
  return ctx;
}

/** 턱선을 얼굴 중심선 쪽으로 당겨 폭만 줄인다. 고개가 기울어도 방향이 맞고, 길이는 그대로다. */
function slimFace(ctx: CanvasRenderingContext2D, landmarks: LandmarkPoint[], W: number, H: number, faceSize: number, slim: number) {
  const px = (i: number) => ({ x: landmarks[i].x * W, y: landmarks[i].y * H });
  const [top, bottom] = FACE_MIDLINE.map(px);
  const length = Math.hypot(bottom.x - top.x, bottom.y - top.y) || 1;
  const dx = (bottom.x - top.x) / length, dy = (bottom.y - top.y) / length;

  const lateral = (p: { x: number; y: number }) => (p.x - top.x) * -dy + (p.y - top.y) * dx;
  const neckEnd = length + faceSize * SLIM_NECK;
  const [first, second] = JAWLINE_SIDES.map((side) => {
    const points = side.map(([i, weight]): JawPoint => {
      const p = px(i);
      return {
        along: (p.x - top.x) * dx + (p.y - top.y) * dy,
        across: Math.abs(lateral(p)),
        move: faceSize * slim * weight,
      };
    });
    return [...points, { along: neckEnd, across: points[points.length - 1].across, move: 0 }];
  });
  // 셀카 반전과 무관하게 중심선 기준 음수 쪽을 앞에 둔다
  const sides: [JawPoint[], JawPoint[]] = lateral(px(JAWLINE_SIDES[0][0][0])) < 0 ? [first, second] : [second, first];

  const band = faceSize * SLIM_BAND;
  const corners = JAWLINE_SIDES.flat().map(([i]) => px(i));
  corners.push(...corners.map((p) => {
    const down = neckEnd - ((p.x - top.x) * dx + (p.y - top.y) * dy);
    return { x: p.x + dx * down, y: p.y + dy * down };
  }));
  const x0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.x)) - band));
  const y0 = Math.max(0, Math.floor(Math.min(...corners.map((p) => p.y)) - band));
  const w = Math.min(W, Math.ceil(Math.max(...corners.map((p) => p.x)) + band)) - x0;
  const h = Math.min(H, Math.ceil(Math.max(...corners.map((p) => p.y)) + band)) - y0;

  const region = ctx.getImageData(x0, y0, w, h);
  const axis = { x: top.x - x0, y: top.y - y0, dx, dy };
  const smooth = Math.max(2, Math.round(faceSize * SLIM_SMOOTH));
  region.data.set(narrowFacePixels(region.data, w, h, axis, sides, band, smooth));
  ctx.putImageData(region, x0, y0);
}

/** 볼 색에서 먼 픽셀(앞머리·안경)은 얼굴 윤곽 안이어도 보정하지 않는다 */
function applySkinToneGate(rgba: Uint8ClampedArray, skin: Float32Array, fold: Float32Array) {
  const chroma = (i: number) => {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
    return [-0.169 * r - 0.331 * g + 0.5 * b, 0.5 * r - 0.419 * g - 0.081 * b];
  };
  let sumCb = 0, sumCr = 0, count = 0;
  for (let i = 0; i < skin.length; i++) {
    if (skin[i] < 0.9) continue;
    const [cb, cr] = chroma(i);
    sumCb += cb;
    sumCr += cr;
    count += 1;
  }
  if (!count) return;
  const meanCb = sumCb / count, meanCr = sumCr / count;
  for (let i = 0; i < skin.length; i++) {
    if (skin[i] <= 0 && fold[i] <= 0) continue;
    const [cb, cr] = chroma(i);
    const d = Math.hypot(cb - meanCb, cr - meanCr);
    const t = Math.min(1, Math.max(0, (d - 14) / 20));
    const gate = 1 - t * t * (3 - 2 * t);
    skin[i] *= gate;
    fold[i] *= gate;
  }
}

export async function retouchFaceImage(file: Blob, options: RetouchOptions = {}): Promise<RetouchResult> {
  const { strength = 0.9, brighten = 0.02, slim = 0 } = options;
  const url = URL.createObjectURL(file);
  try {
    const landmarks = await detectLandmarks(url);
    if (!landmarks) return { blob: file, applied: false };
    const img = await loadImage(url);
    const W = img.naturalWidth, H = img.naturalHeight;

    // 얼굴 주변만 계산한다 — 사진 전체를 돌리면 태블릿에서 느리다
    const px = (p: LandmarkPoint) => ({ x: p.x * W, y: p.y * H });
    const oval = FACE_OVAL.map((i) => px(landmarks[i]));
    const xs = oval.map((p) => p.x), ys = oval.map((p) => p.y);
    const faceSize = Math.max(...xs) - Math.min(...xs);
    const pad = faceSize * 0.15;
    const x0 = Math.max(0, Math.floor(Math.min(...xs) - pad));
    const y0 = Math.max(0, Math.floor(Math.min(...ys) - pad));
    const w = Math.min(W, Math.ceil(Math.max(...xs) + pad)) - x0;
    const h = Math.min(H, Math.ceil(Math.max(...ys) + pad)) - y0;
    const local = (i: number) => {
      const p = px(landmarks[i]);
      return { x: p.x - x0, y: p.y - y0 };
    };

    const skinCtx = maskCanvas(w, h);
    tracePath(skinCtx, FACE_OVAL.map(local), true);
    skinCtx.fill();
    skinCtx.globalCompositeOperation = 'destination-out';
    skinCtx.lineJoin = 'round';
    const exclude = (regions: number[][], margin: number) => {
      skinCtx.lineWidth = faceSize * margin;
      for (const region of regions) {
        tracePath(skinCtx, region.map(local), true);
        skinCtx.fill();
        skinCtx.stroke();
      }
    };
    exclude(EYES, 0.06); // 속눈썹은 눈 윤곽 밖으로 뻗어 있다
    exclude(BROWS_AND_LIPS, 0.012);
    const feather = Math.max(2, Math.round(faceSize * 0.012));
    const skin = featheredAlpha(skinCtx, w, h, feather);

    const foldCtx = maskCanvas(w, h);
    foldCtx.lineCap = 'round';
    foldCtx.lineJoin = 'round';
    foldCtx.lineWidth = faceSize * 0.07;
    for (const line of [...NASOLABIAL, ...UNDER_EYE]) {
      tracePath(foldCtx, line.map(local), false);
      foldCtx.stroke();
    }
    const fold = featheredAlpha(foldCtx, w, h, Math.max(3, Math.round(faceSize * 0.02)));
    for (let i = 0; i < fold.length; i++) fold[i] *= skin[i];

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas context');
    ctx.drawImage(img, 0, 0);
    const region = ctx.getImageData(x0, y0, w, h);
    applySkinToneGate(region.data, skin, fold);
    region.data.set(retouchPixels(region.data, w, h, skin, fold, { faceSize, strength, brighten }));
    ctx.putImageData(region, x0, y0);
    if (slim > 0) slimFace(ctx, landmarks, W, H, faceSize, slim);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) throw new Error('toBlob 실패');
    return { blob, applied: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}
