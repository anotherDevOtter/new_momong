// OpenCV 의 필요한 부분만 TS 로 옮긴 것.
// 눈썹 형태 · 눈썹~눈 거리 · 쌍꺼풀 모듈이 쓴다. opencv.js(약 8MB)를 싣지 않으려고 직접 구현했다.
// 각 함수는 OpenCV 4.x 소스(imgproc: color, clahe, canny, deriv, morph)의 기본 동작을 따른다.

import type { RgbImage } from './types';

/** 8비트 1채널 이미지 */
export interface Gray {
  width: number;
  height: number;
  data: Uint8Array;
}

/**
 * 사진의 [x0,x1) × [y0,y1) 영역을 흑백으로 잘라낸다.
 * cv2.cvtColor(BGR2GRAY) 의 정수 계산: (R·4899 + G·9617 + B·1868 + 2^13) >> 14
 */
export function grayRoi(img: RgbImage, x0: number, y0: number, x1: number, y1: number): Gray {
  const w = Math.max(0, x1 - x0);
  const h = Math.max(0, y1 - y0);
  const out = new Uint8Array(w * h);
  const c = img.channels;
  for (let y = 0; y < h; y++) {
    let si = ((y0 + y) * img.width + x0) * c;
    for (let x = 0; x < w; x++, si += c) {
      const r = img.data[si];
      const g = img.data[si + 1];
      const b = img.data[si + 2];
      out[y * w + x] = (r * 4899 + g * 9617 + b * 1868 + 8192) >> 14;
    }
  }
  return { width: w, height: h, data: out };
}

/** cvRound: 가장 가까운 정수, .5 는 짝수로 */
function cvRound(v: number): number {
  const f = Math.floor(v);
  const d = v - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

const sat8 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/** BORDER_REFLECT_101 인덱스 */
function reflect101(i: number, n: number): number {
  if (n === 1) return 0;
  while (i < 0 || i >= n) {
    if (i < 0) i = -i;
    if (i >= n) i = 2 * n - 2 - i;
  }
  return i;
}

const replicate = (i: number, n: number) => (i < 0 ? 0 : i >= n ? n - 1 : i);

// ── CLAHE ────────────────────────────────────────────────────────────────

/** cv2.createCLAHE(clipLimit, (tilesX, tilesY)).apply(src) */
export function clahe(src: Gray, clipLimit: number, tilesX: number, tilesY: number): Gray {
  const { width: w, height: h } = src;
  const histSize = 256;

  // 타일로 나누어떨어지지 않으면 오른쪽 · 아래를 REFLECT_101 로 늘린다.
  // OpenCV 는 한쪽만 안 나누어떨어져도 양쪽 모두 (tiles - 나머지) 만큼 늘린다 — 그대로 따른다.
  let ext = src;
  if (!(w % tilesX === 0 && h % tilesY === 0)) {
    const ew = w + (tilesX - (w % tilesX));
    const eh = h + (tilesY - (h % tilesY));
    const d = new Uint8Array(ew * eh);
    for (let y = 0; y < eh; y++) {
      const sy = reflect101(y, h);
      for (let x = 0; x < ew; x++) d[y * ew + x] = src.data[sy * w + reflect101(x, w)];
    }
    ext = { width: ew, height: eh, data: d };
  }
  const tw = Math.floor(ext.width / tilesX);
  const th = Math.floor(ext.height / tilesY);
  const tileArea = tw * th;
  const lutScale = Math.fround((histSize - 1) / tileArea);
  const clip = clipLimit > 0 ? Math.max(Math.trunc((clipLimit * tileArea) / histSize), 1) : 0;

  const luts = new Uint8Array(tilesX * tilesY * histSize);
  const hist = new Int32Array(histSize);
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      hist.fill(0);
      for (let y = ty * th; y < (ty + 1) * th; y++) {
        for (let x = tx * tw; x < (tx + 1) * tw; x++) hist[ext.data[y * ext.width + x]]++;
      }
      if (clip > 0) {
        let clipped = 0;
        for (let i = 0; i < histSize; i++) {
          if (hist[i] > clip) {
            clipped += hist[i] - clip;
            hist[i] = clip;
          }
        }
        const batch = Math.floor(clipped / histSize);
        let residual = clipped - batch * histSize;
        for (let i = 0; i < histSize; i++) hist[i] += batch;
        if (residual !== 0) {
          const step = Math.max(Math.floor(histSize / residual), 1);
          for (let i = 0; i < histSize && residual > 0; i += step, residual--) hist[i]++;
        }
      }
      const base = (ty * tilesX + tx) * histSize;
      let sum = 0;
      for (let i = 0; i < histSize; i++) {
        sum += hist[i];
        luts[base + i] = sat8(cvRound(Math.fround(sum * lutScale)));
      }
    }
  }

  // 타일 중심 사이를 양선형 보간 (float32 계산)
  const f = Math.fround;
  const invTw = f(1 / tw);
  const invTh = f(1 / th);
  const out = new Uint8Array(w * h);
  const ind1 = new Int32Array(w);
  const ind2 = new Int32Array(w);
  const xa = new Float32Array(w);
  const xa1 = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const txf = f(f(x * invTw) - 0.5);
    let tx1 = Math.floor(txf);
    let tx2 = tx1 + 1;
    xa[x] = f(txf - tx1);
    xa1[x] = f(1 - xa[x]);
    tx1 = Math.max(tx1, 0);
    tx2 = Math.min(tx2, tilesX - 1);
    ind1[x] = tx1 * histSize;
    ind2[x] = tx2 * histSize;
  }
  for (let y = 0; y < h; y++) {
    const tyf = f(f(y * invTh) - 0.5);
    let ty1 = Math.floor(tyf);
    let ty2 = ty1 + 1;
    const ya = f(tyf - ty1);
    const ya1 = f(1 - ya);
    ty1 = Math.max(ty1, 0);
    ty2 = Math.min(ty2, tilesY - 1);
    const p1 = ty1 * tilesX * histSize;
    const p2 = ty2 * tilesX * histSize;
    for (let x = 0; x < w; x++) {
      const v = src.data[y * w + x];
      const top = f(f(luts[p1 + ind1[x] + v] * xa1[x]) + f(luts[p1 + ind2[x] + v] * xa[x]));
      const bot = f(f(luts[p2 + ind1[x] + v] * xa1[x]) + f(luts[p2 + ind2[x] + v] * xa[x]));
      out[y * w + x] = sat8(cvRound(f(f(top * ya1) + f(bot * ya))));
    }
  }
  return { width: w, height: h, data: out };
}

// ── Sobel ────────────────────────────────────────────────────────────────

const SMOOTH: Record<number, number[]> = { 3: [1, 2, 1], 5: [1, 4, 6, 4, 1] };
const DERIV: Record<number, number[]> = { 3: [-1, 0, 1], 5: [-1, -2, 0, 2, 1] };

/** cv2.Sobel(src, CV_64F, dx, dy, ksize) — 1차 미분 하나만 (dx=1 또는 dy=1) */
function sobel(src: Gray, dir: 'x' | 'y', ksize: 3 | 5, border: (i: number, n: number) => number): Float64Array {
  const { width: w, height: h, data } = src;
  const kx = dir === 'x' ? DERIV[ksize] : SMOOTH[ksize];
  const ky = dir === 'x' ? SMOOTH[ksize] : DERIV[ksize];
  const r = ksize >> 1;
  const tmp = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += kx[k + r] * data[y * w + border(x + k, w)];
      tmp[y * w + x] = s;
    }
  }
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += ky[k + r] * tmp[border(y + k, h) * w + x];
      out[y * w + x] = s;
    }
  }
  return out;
}

/**
 * np.abs(cv2.Sobel(src, CV_64F, 0, 1, ksize)).astype(np.uint8)
 * 255 를 넘는 값은 포화가 아니라 하위 8비트로 잘린다 (numpy 캐스팅). Python 결과와 같게 그대로 따른다.
 */
export function absSobelYWrapped(src: Gray, ksize: 3 | 5): Gray {
  const s = sobel(src, 'y', ksize, reflect101);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = Math.trunc(Math.abs(s[i])) & 255;
  return { width: src.width, height: src.height, data: out };
}

// ── Canny ────────────────────────────────────────────────────────────────

const TG22 = 13573; // tan(22.5°) · 2^15

/** cv2.Canny(src, low, high) — aperture 3, L1 그래디언트 */
export function canny(src: Gray, lowThresh: number, highThresh: number): Gray {
  const { width: w, height: h } = src;
  let low = Math.floor(lowThresh);
  let high = Math.floor(highThresh);
  if (low > high) [low, high] = [high, low];

  const dx = sobel(src, 'x', 3, replicate);
  const dy = sobel(src, 'y', 3, replicate);
  // 테두리 1칸을 0 으로 둔 크기
  const mw = w + 2;
  const mag = new Int32Array(mw * (h + 2));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) mag[(y + 1) * mw + x + 1] = Math.abs(dx[y * w + x]) + Math.abs(dy[y * w + x]);
  }

  // 0 = 약한 후보, 1 = 아님, 2 = 강한 엣지
  const map = new Uint8Array(w * h).fill(1);
  const stack: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mi = (y + 1) * mw + x + 1;
      const m = mag[mi];
      if (m <= low) continue;
      const xs = dx[y * w + x];
      const ys = dy[y * w + x];
      const ax = Math.abs(xs);
      const ay = Math.abs(ys) * 32768;
      const tg22x = ax * TG22;
      let isMax: boolean;
      if (ay < tg22x) {
        isMax = m > mag[mi - 1] && m >= mag[mi + 1];
      } else {
        const tg67x = tg22x + ax * 65536;
        if (ay > tg67x) {
          isMax = m > mag[mi - mw] && m >= mag[mi + mw];
        } else {
          const s = (xs < 0) !== (ys < 0) ? -1 : 1;
          isMax = m > mag[mi - mw - s] && m > mag[mi + mw + s];
        }
      }
      if (!isMax) continue;
      if (m > high) {
        map[y * w + x] = 2;
        stack.push(y * w + x);
      } else {
        map[y * w + x] = 0;
      }
    }
  }

  // 히스테리시스: 강한 엣지에 8방향으로 이어진 약한 후보를 엣지로
  while (stack.length) {
    const i = stack.pop()!;
    const y = Math.floor(i / w);
    const x = i - y * w;
    for (let oy = -1; oy <= 1; oy++) {
      const ny = y + oy;
      if (ny < 0 || ny >= h) continue;
      for (let ox = -1; ox <= 1; ox++) {
        const nx = x + ox;
        if (nx < 0 || nx >= w) continue;
        const ni = ny * w + nx;
        if (map[ni] === 0) {
          map[ni] = 2;
          stack.push(ni);
        }
      }
    }
  }

  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i++) out[i] = map[i] === 2 ? 255 : 0;
  return { width: w, height: h, data: out };
}

// ── 기타 ─────────────────────────────────────────────────────────────────

/** cv2.threshold(src, t, 255, THRESH_BINARY) */
export function threshold(src: Gray, t: number): Gray {
  const out = new Uint8Array(src.data.length);
  for (let i = 0; i < out.length; i++) out[i] = src.data[i] > t ? 255 : 0;
  return { ...src, data: out };
}

export function bitwise(a: Gray, b: Gray, op: 'and' | 'or'): Gray {
  const out = new Uint8Array(a.data.length);
  for (let i = 0; i < out.length; i++) out[i] = op === 'and' ? a.data[i] & b.data[i] : a.data[i] | b.data[i];
  return { ...a, data: out };
}

/** 가로 kw × 세로 1 사각 커널로 팽창(max) 또는 침식(min). 이미지 밖은 무시 */
function morphRow(src: Gray, kw: number, op: 'max' | 'min'): Gray {
  const { width: w, height: h, data } = src;
  const r = kw >> 1;
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = op === 'max' ? 0 : 255;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + kw - 1 - r); k++) {
        const s = data[y * w + k];
        v = op === 'max' ? Math.max(v, s) : Math.min(v, s);
      }
      out[y * w + x] = v;
    }
  }
  return { width: w, height: h, data: out };
}

/** cv2.morphologyEx(src, MORPH_CLOSE, getStructuringElement(MORPH_RECT, (kw, 1))) */
export function closeRow(src: Gray, kw: number): Gray {
  return morphRow(morphRow(src, kw, 'max'), kw, 'min');
}
