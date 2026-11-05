// 피부 보정 픽셀 계산. 캔버스 없이 배열만 다룬다.
// 먼저 어둡고 가는 선(주름)을 메우고, 윤곽을 살리는 guided filter 를 두 강도로 쓴다.
//   skin — 피부 전체: 좁고 약하게 (잔주름·잡티)
//   fold — 팔자·눈밑: 넓고 강하게 (폭이 넓은 주름 그림자)

export interface RetouchParams {
  /** 얼굴 폭(px). 필터 반경의 기준이다 */
  faceSize: number;
  /** 0~1 */
  strength: number;
  /** 밝기 보정. 0 이면 끈다 */
  brighten: number;
}

/** 지운 뒤 남길 미세 피부결 비율. 0 이면 플라스틱처럼 보인다 */
const DETAIL_KEEP = 0.5;
/** 되살리는 피부결의 최대 폭. 이보다 진한 차이는 주름이라 돌려놓지 않는다 */
const DETAIL_LIMIT = 0.012;

export function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const size = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[row + Math.min(w - 1, Math.max(0, i))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / size;
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += tmp[Math.min(h - 1, Math.max(0, i)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / size;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

function dilate(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let v = src[row + x];
      const end = Math.min(w - 1, x + r);
      for (let k = Math.max(0, x - r); k <= end; k++) if (src[row + k] > v) v = src[row + k];
      tmp[row + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    const end = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      let v = tmp[y * w + x];
      for (let k = Math.max(0, y - r); k <= end; k++) if (tmp[k * w + x] > v) v = tmp[k * w + x];
      out[y * w + x] = v;
    }
  }
  return out;
}

function negate(src: Float32Array): Float32Array {
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) out[i] = -src[i];
  return out;
}

/** 폭이 2r+1 보다 좁은 어두운 선만 메운다 (morphological closing) */
function fillDarkLines(I: Float32Array, w: number, h: number, r: number): Float32Array {
  return negate(dilate(negate(dilate(I, w, h, r)), w, h, r));
}

function guidedFilter(I: Float32Array, w: number, h: number, r: number, eps: number): Float32Array {
  const n = I.length;
  const sq = new Float32Array(n);
  for (let i = 0; i < n; i++) sq[i] = I[i] * I[i];
  const mean = boxBlur(I, w, h, r);
  const corr = boxBlur(sq, w, h, r);
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const variance = Math.max(0, corr[i] - mean[i] * mean[i]);
    a[i] = variance / (variance + eps);
    b[i] = mean[i] - a[i] * mean[i];
  }
  const meanA = boxBlur(a, w, h, r);
  const meanB = boxBlur(b, w, h, r);
  const q = new Float32Array(n);
  for (let i = 0; i < n; i++) q[i] = meanA[i] * I[i] + meanB[i];
  return q;
}

/** RGBA 픽셀을 보정한 새 배열을 돌려준다. 마스크가 0 인 픽셀은 그대로다 */
export function retouchPixels(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  skinMask: Float32Array,
  foldMask: Float32Array,
  { faceSize, strength, brighten }: RetouchParams,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba);
  const n = w * h;
  const rSkin = Math.max(2, Math.round(faceSize * 0.012));
  const rFold = Math.max(4, Math.round(faceSize * 0.035));
  const rLine = Math.max(1, Math.round(faceSize * 0.006));

  for (let c = 0; c < 3; c++) {
    const I = new Float32Array(n);
    for (let i = 0; i < n; i++) I[i] = rgba[i * 4 + c] / 255;
    const filled = fillDarkLines(I, w, h, rLine);
    const qSkin = guidedFilter(filled, w, h, rSkin, 0.01);
    const qFold = guidedFilter(filled, w, h, rFold, 0.03);
    const local = boxBlur(I, w, h, 1);

    for (let i = 0; i < n; i++) {
      const s = skinMask[i] * strength;
      const f = foldMask[i] * strength;
      const m = Math.max(s, f);
      if (m <= 0) continue;
      let v = I[i] + s * (qSkin[i] - I[i]);
      v += f * (qFold[i] - v);
      const detail = Math.max(-DETAIL_LIMIT, Math.min(DETAIL_LIMIT, I[i] - local[i]));
      v += m * DETAIL_KEEP * detail;
      v += m * brighten * (1 - v) * v;
      out[i * 4 + c] = Math.round(v * 255);
    }
  }
  return out;
}

export interface JawPoint {
  /** 얼굴 중심선을 따라 이마 위에서 내려온 거리 */
  along: number;
  /** 중심선에서 턱선까지의 거리 */
  across: number;
  /** 안쪽으로 당길 거리. 위아래 끝점은 0 이어야 한다. */
  move: number;
}

export interface FaceAxis {
  x: number;
  y: number;
  /** 이마 위 → 턱끝 단위 벡터 */
  dx: number;
  dy: number;
}

function smoothstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** 턱선 점을 얼굴 높이별 표로 편다. 당기는 양은 꺾이지 않게 위아래로 흐린다. */
function jawProfile(points: JawPoint[], smooth: number) {
  const sorted = [...points].sort((a, b) => a.along - b.along);
  const size = Math.ceil(sorted[sorted.length - 1].along) + 1;
  const across = new Float32Array(size);
  let move: Float32Array = new Float32Array(size);
  let seg = 0;
  for (let i = 0; i < size; i++) {
    while (seg < sorted.length - 2 && i > sorted[seg + 1].along) seg += 1;
    const a = sorted[seg], b = sorted[seg + 1];
    const t = Math.min(1, Math.max(0, (i - a.along) / ((b.along - a.along) || 1)));
    across[i] = Math.max(1, a.across + (b.across - a.across) * t);
    move[i] = i < a.along || i > b.along ? 0 : a.move + (b.move - a.move) * t;
  }
  for (let pass = 0; pass < 2; pass++) move = boxBlur(move, size, 1, smooth);
  return { across, move };
}

/**
 * 턱선을 얼굴 중심선 쪽으로 당겨 폭을 줄인다. 결과 픽셀마다 원본 위치를 거꾸로 찾아 빈틈이 없다.
 * 턱선에서 가장 많이 움직이고, 중심선 쪽과 턱선 바깥 band 까지 부드럽게 0 이 된다.
 * 턱 아래는 목선까지 같이 옮겨야 턱과 목이 만나는 곳에 혹이 생기지 않는다 — sides 가 목까지 이어진다.
 */
export function narrowFacePixels(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  axis: FaceAxis,
  sides: [JawPoint[], JawPoint[]],
  band: number,
  smooth: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba);
  const [negative, positive] = sides.map((points) => jawProfile(points, smooth));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x - axis.x, py = y - axis.y;
      const row = Math.round(px * axis.dx + py * axis.dy);
      if (row < 0) continue;
      const lateral = px * -axis.dy + py * axis.dx;
      const side = lateral < 0 ? negative : positive;
      if (row >= side.move.length) continue;
      const move = side.move[row];
      if (move <= 0) continue;
      const distance = Math.abs(lateral), jaw = side.across[row];
      const falloff = distance < jaw
        ? smoothstep((distance / jaw - 0.35) / 0.65)
        : 1 - smoothstep((distance - jaw) / band);
      if (falloff <= 0) continue;
      const shift = (lateral < 0 ? -1 : 1) * move * falloff;
      const sx = Math.min(w - 1, Math.max(0, x - axis.dy * shift));
      const sy = Math.min(h - 1, Math.max(0, y + axis.dx * shift));
      const x1 = Math.floor(sx), y1 = Math.floor(sy);
      const x2 = Math.min(w - 1, x1 + 1), y2 = Math.min(h - 1, y1 + 1);
      const fx = sx - x1, fy = sy - y1;
      const o = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const top = rgba[(y1 * w + x1) * 4 + ch] * (1 - fx) + rgba[(y1 * w + x2) * 4 + ch] * fx;
        const bottom = rgba[(y2 * w + x1) * 4 + ch] * (1 - fx) + rgba[(y2 * w + x2) * 4 + ch] * fx;
        out[o + ch] = top * (1 - fy) + bottom * fy;
      }
    }
  }
  return out;
}
