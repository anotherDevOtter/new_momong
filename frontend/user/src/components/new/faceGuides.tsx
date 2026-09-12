'use client';

/**
 * 이목구비 20항목의 가이드선을 얼굴 랜드마크 좌표로 그린다.
 *
 * 예전에는 AIFaceFeature 의 OVERLAYS 가 예시 사진 기준 고정 SVG 라 고객 얼굴과
 * 어긋났다. 파이썬 실측 도형은 모듈이 있는 항목에만 오고, 촬영 전에는 아예 없다.
 * 여기서는 브라우저에서 뽑은 랜드마크(useFaceLandmarks)로 전 항목을 같은 방식으로
 * 그린다 — 얼굴 크기·위치가 달라도 따라간다. (2026-09-11)
 *
 * 좌표는 0~1 정규화 값이라 이미지 픽셀로 바꿔서 쓴다.
 */

import type { LandmarkPoint } from './useFaceLandmarks';

const INK = '#FFFFFF';
const DOT = '#FFFFFF';

/** MediaPipe FaceMesh 표준 인덱스 — 부위별로 필요한 점만 추렸다 */
const IDX = {
  faceOval: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],
  cheekL: 234, cheekR: 454,
  browL: [46, 53, 52, 65, 55],     // 왼쪽 눈썹 아래선 (바깥 → 안쪽)
  browR: [285, 295, 282, 283, 276], // 오른쪽 눈썹 (안쪽 → 바깥)
  browTopL: [70, 63, 105, 66, 107],
  browTopR: [336, 296, 334, 293, 300],
  eyeL: [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
  eyeR: [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
  eyeOuterL: 33, eyeInnerL: 133,
  eyeOuterR: 263, eyeInnerR: 362,
  eyeTopL: 159, eyeBotL: 145,
  eyeTopR: 386, eyeBotR: 374,
  noseBridge: 168, noseTip: 1, noseBottom: 2,
  alaL: 129, alaR: 358,
  lipTop: 0, lipBottom: 17, lipLeft: 61, lipRight: 291,
  lipUpperInner: 13, lipLowerInner: 14,
  chin: 152,
  foreheadTop: 10,
} as const;

type P = { x: number; y: number };

/** 정규화 좌표 → 이미지 픽셀 */
function toPx(pts: LandmarkPoint[], i: number, w: number, h: number): P {
  const p = pts[i];
  return { x: p.x * w, y: p.y * h };
}

// viewBox 가 원본 픽셀(1414×2000)이라 그냥 그리면 252px 표시에서 선이 0.7px 로
// 얇아져 사라진다. non-scaling-stroke 로 굵기를 화면 기준으로 고정한다. (2026-09-11)
const STROKE = { vectorEffect: 'non-scaling-stroke' as const };

/** 원장님 예시의 선 — 흰 얇은 점선. non-scaling-stroke 라 이 값이 화면 px 다 (2026-09-12) */
const DASH = '4 5';

/**
 * 점은 길이 0 짜리 선의 둥근 끝으로 그린다 — circle 의 r 은 viewBox 배율을 타서
 * 축소된 화면에서 점이 사라진다.
 */
function Dot({ p }: { p: P }) {
  return (
    <line
      x1={p.x} y1={p.y} x2={p.x} y2={p.y}
      stroke={DOT} strokeWidth={5} strokeLinecap="round" {...STROKE}
    />
  );
}

// 보조선도 실선으로 그린다 — 점선은 축소된 화면에서 지저분해 보인다 (2026-09-12)
function Line({ a, b }: { a: P; b: P }) {
  return (
    <line
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke={INK} strokeWidth={1} strokeLinecap="butt" strokeDasharray={DASH}
      {...STROKE}
    />
  );
}

/**
 * 랜드마크를 직선으로 이으면 턱·관자놀이에 마디가 보인다 — 예시 사진의 선은 매끈하다.
 * 점들을 Catmull-Rom 으로 지나는 3차 베지에로 바꿔 곡선으로 그린다. (2026-09-12)
 */
function smoothPath(pts: P[], close?: boolean): string {
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
  const at = (i: number): P =>
    close ? pts[(i + pts.length) % pts.length] : pts[Math.min(Math.max(i, 0), pts.length - 1)];
  const last = close ? pts.length : pts.length - 1;
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + (close ? ' Z' : '');
}

function Poly({ pts, close }: { pts: P[]; close?: boolean }) {
  return <path d={smoothPath(pts, close)} stroke={INK} strokeWidth={1} fill="none" strokeLinecap="butt" strokeLinejoin="round" strokeDasharray={DASH} {...STROKE} />;
}

/**
 * 항목 id 에 맞는 가이드선. 그릴 수 없는 항목이면 null.
 * 축 이름은 faceAnalysisData 의 id 를 그대로 쓴다.
 */
export function guideFor(
  id: string,
  pts: LandmarkPoint[],
  w: number,
  h: number,
): React.ReactNode | null {
  const P = (i: number) => toPx(pts, i, w, h);
  const mid = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  switch (id) {
    // ── 형태 분석 ──────────────────────────────────────────
    case 'faceline':
      return (
        <g>
          <Poly pts={IDX.faceOval.map(P)} close />
          <Dot p={P(IDX.chin)} />
          <Dot p={P(IDX.foreheadTop)} />
        </g>
      );

    case 'cheek': {
      const l = P(IDX.cheekL), r = P(IDX.cheekR);
      return (
        <g>
          <Line a={l} b={r} />
          <Dot p={l} /><Dot p={r} />
        </g>
      );
    }

    case 'browshape':
      return (
        <g>
          <Poly pts={IDX.browTopL.map(P)} />
          <Poly pts={IDX.browL.map(P)} />
          <Poly pts={IDX.browTopR.map(P)} />
          <Poly pts={IDX.browR.map(P)} />
        </g>
      );

    case 'browdir': {
      const lIn = P(55), lOut = P(46), rIn = P(285), rOut = P(276);
      return (
        <g>
          <Line a={lIn} b={lOut} />
          <Line a={rIn} b={rOut} />
          <Dot p={lIn} /><Dot p={lOut} /><Dot p={rIn} /><Dot p={rOut} />
        </g>
      );
    }

    case 'eyeshape':
      return (
        <g>
          <Poly pts={IDX.eyeL.map(P)} close />
          <Poly pts={IDX.eyeR.map(P)} close />
        </g>
      );

    case 'eyetail': {
      // 눈머리 → 눈꼬리 기울기. 수평선을 같이 그려 각도를 읽게 한다
      const lIn = P(IDX.eyeInnerL), lOut = P(IDX.eyeOuterL);
      const rIn = P(IDX.eyeInnerR), rOut = P(IDX.eyeOuterR);
      return (
        <g>
          <Line a={lIn} b={lOut} />
          <Line a={{ x: lOut.x, y: lIn.y }} b={lIn} />
          <Line a={rIn} b={rOut} />
          <Line a={{ x: rOut.x, y: rIn.y }} b={rIn} />
          <Dot p={lOut} /><Dot p={rOut} />
        </g>
      );
    }

    case 'eyefront': {
      const lIn = P(IDX.eyeInnerL), rIn = P(IDX.eyeInnerR);
      return (
        <g>
          <Line a={lIn} b={rIn} />
          <Dot p={lIn} /><Dot p={rIn} />
        </g>
      );
    }

    case 'nosewidth': {
      const a = P(IDX.alaL), b = P(IDX.alaR);
      return (
        <g>
          <Line a={a} b={b} />
          <Dot p={a} /><Dot p={b} />
        </g>
      );
    }

    case 'nosehigh': {
      const top = P(IDX.noseBridge), tip = P(IDX.noseTip);
      return (
        <g>
          <Line a={top} b={tip} />
          <Dot p={top} /><Dot p={tip} />
        </g>
      );
    }

    case 'lips': {
      // 윗입술 위 ~ 아랫입술 아래. 입 안쪽 경계(13/14)를 가로 점선으로 같이 그려
      // 윗입술·아랫입술 두께를 나눠 볼 수 있게 한다. 점선 폭은 입꼬리 기준. (2026-09-11)
      const t = P(IDX.lipTop), b = P(IDX.lipBottom);
      const inT = P(IDX.lipUpperInner), inB = P(IDX.lipLowerInner);
      const lx = P(IDX.lipLeft).x, rx = P(IDX.lipRight).x;
      const hline = (y: number) => <Line a={{ x: lx, y }} b={{ x: rx, y }} />;
      return (
        <g>
          <Line a={t} b={b} />
          {hline(t.y)}{hline(inT.y)}{hline(inB.y)}{hline(b.y)}
          <Dot p={t} /><Dot p={b} />
        </g>
      );
    }

    // ── 비율 분석 ──────────────────────────────────────────
    case 'facelen': {
      const top = P(IDX.foreheadTop), chin = P(IDX.chin);
      const l = P(IDX.cheekL), r = P(IDX.cheekR);
      return (
        <g>
          <Line a={top} b={chin} />
          <Line a={l} b={r} />
          <Dot p={top} /><Dot p={chin} />
        </g>
      );
    }

    case 'thirds': {
      const top = P(IDX.foreheadTop), brow = mid(P(55), P(285));
      const noseB = P(IDX.noseBottom), chin = P(IDX.chin);
      const span = (P(IDX.cheekR).x - P(IDX.cheekL).x) * 0.42;
      const hline = (p: P) => <Line a={{ x: p.x - span, y: p.y }} b={{ x: p.x + span, y: p.y }} />;
      return (
        <g>
          {hline(top)}{hline(brow)}{hline(noseB)}{hline(chin)}
          <Line a={top} b={chin} />
        </g>
      );
    }

    case 'broweye': {
      const bL = P(65), eL = P(IDX.eyeTopL);
      const bR = P(295), eR = P(IDX.eyeTopR);
      return (
        <g>
          <Line a={bL} b={eL} /><Line a={bR} b={eR} />
          <Dot p={bL} /><Dot p={eL} /><Dot p={bR} /><Dot p={eR} />
        </g>
      );
    }

    case 'eyelid': {
      const t = P(IDX.eyeTopL), b = P(IDX.eyeBotL);
      const t2 = P(IDX.eyeTopR), b2 = P(IDX.eyeBotR);
      return (
        <g>
          <Line a={t} b={b} /><Line a={t2} b={b2} />
          <Poly pts={IDX.eyeL.map(P)} close />
          <Poly pts={IDX.eyeR.map(P)} close />
        </g>
      );
    }

    case 'intereye': {
      const a = P(IDX.eyeInnerL), b = P(IDX.eyeInnerR);
      return (
        <g>
          <Line a={a} b={b} />
          <Dot p={a} /><Dot p={b} />
        </g>
      );
    }

    case 'eyeouter': {
      const oL = P(IDX.eyeOuterL), faceL = P(IDX.cheekL);
      const oR = P(IDX.eyeOuterR), faceR = P(IDX.cheekR);
      return (
        <g>
          <Line a={{ x: faceL.x, y: oL.y }} b={oL} />
          <Line a={oR} b={{ x: faceR.x, y: oR.y }} />
          <Dot p={oL} /><Dot p={oR} />
        </g>
      );
    }

    case 'noselen': {
      const top = P(IDX.noseBridge), bot = P(IDX.noseBottom);
      return (
        <g>
          <Line a={top} b={bot} />
          <Dot p={top} /><Dot p={bot} />
        </g>
      );
    }

    case 'philtrum': {
      const noseB = P(IDX.noseBottom), lipT = P(IDX.lipTop);
      return (
        <g>
          <Line a={noseB} b={lipT} />
          <Dot p={noseB} /><Dot p={lipT} />
        </g>
      );
    }

    case 'mouthwidth': {
      const l = P(IDX.lipLeft), r = P(IDX.lipRight);
      return (
        <g>
          <Line a={l} b={r} />
          <Dot p={l} /><Dot p={r} />
        </g>
      );
    }

    case 'chinlen': {
      const lipB = P(IDX.lipBottom), chin = P(IDX.chin);
      return (
        <g>
          <Line a={lipB} b={chin} />
          <Dot p={lipB} /><Dot p={chin} />
        </g>
      );
    }

    default:
      return null;
  }
}
