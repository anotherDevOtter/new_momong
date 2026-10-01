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

import { createContext, useContext } from 'react';
import type { LandmarkPoint } from './useFaceLandmarks';

/**
 * 사진이 표시되는 폭에 비례하는 배율. 선 굵기·노드를 화면 px 로 고정하면 작은 사진에서
 * 노드가 덩어리로 뭉치고 선이 빽빽해 보인다 — 레퍼런스는 폭 대비 훨씬 섬세하다. (2026-10-01)
 * 640px 표시를 1 로 본다.
 */
export interface GuideMetrics {
  /** 표시 폭 배율 (640px = 1) */
  u: number;
  /** 화면 1px 가 viewBox 몇 단위인지 — 원 반지름·화살촉을 화면 px 로 잡을 때 쓴다 */
  k: number;
}
export const GuideScale = createContext<GuideMetrics>({ u: 1, k: 1 });
const useU = () => useContext(GuideScale).u;
const useK = () => useContext(GuideScale).k;

// 프리미엄 뷰티테크 톤 — 전체 구조는 옅은 샴페인 골드·펄 아이보리, 지금 분석 중인 부위는
// 같은 골드 계열의 더 진하고 선명한 톤. (붉은 계열은 쓰지 않는다 — 2026-10-01)

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


/**
 * 얼굴 좌표(10번)는 이마 중간쯤이라 윤곽·세로축이 헤어라인 훨씬 아래에서 끊겼다.
 * 미간(168) → 이마 위(10) 방향으로 더 올려 헤어라인 근처까지 닿게 한다. 윤곽은 위쪽 점일수록
 * 많이 올려 매끈한 호가 되게 한다. (2026-10-01)
 */
const FOREHEAD_EXTRA = 0.6;
const FOREHEAD_WEIGHT: Record<number, number> = {
  10: 1, 338: 0.9, 109: 0.9, 297: 0.68, 67: 0.68, 332: 0.4, 103: 0.4, 284: 0.2, 54: 0.2,
};

function liftedPoint(pts: LandmarkPoint[], i: number, w: number, h: number): P {
  const p = toPx(pts, i, w, h);
  const wt = FOREHEAD_WEIGHT[i];
  if (!wt) return p;
  const top = toPx(pts, IDX.foreheadTop, w, h), bridge = toPx(pts, IDX.noseBridge, w, h);
  return {
    x: p.x + (top.x - bridge.x) * FOREHEAD_EXTRA * wt,
    y: p.y + (top.y - bridge.y) * FOREHEAD_EXTRA * wt,
  };
}

// viewBox 가 원본 픽셀(1414×2000)이라 그냥 그리면 252px 표시에서 선이 0.7px 로
// 얇아져 사라진다. non-scaling-stroke 로 굵기를 화면 기준으로 고정한다. (2026-09-11)
const STROKE = { vectorEffect: 'non-scaling-stroke' as const };

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

// ── 기준(항목)별 가이드 ───────────────────────────────────────────────
// 기획 시안의 체크 항목 이미지를 따른다: 흰 점선 · 양쪽 화살표 · 체크 원 · 얼굴 5등분 세로선.
// 위치는 모두 얼굴 좌표(MediaPipe)에서 잡으므로 고객 얼굴에 그대로 맞는다. (2026-10-01)

const LINE_COLOR = '#FFFFFF';

/** 흰 점선(기본) 또는 실선 */
function DLine({ a, b, solid }: { a: P; b: P; solid?: boolean }) {
  const u = useU();
  return (
    <line
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke={LINE_COLOR} strokeWidth={0.9 + 0.5 * u} strokeLinecap="round"
      strokeDasharray={solid ? undefined : `${3 + 3 * u} ${2.5 + 2.5 * u}`}
      {...STROKE}
    />
  );
}

/** 점선 꺾은선 / 곡선 */
function DPath({ d, close }: { d: string; close?: boolean }) {
  const u = useU();
  return (
    <path
      d={d + (close ? ' Z' : '')} fill="none" stroke={LINE_COLOR} strokeWidth={0.9 + 0.5 * u}
      strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${3 + 3 * u} ${2.5 + 2.5 * u}`}
      {...STROKE}
    />
  );
}

/** 양쪽(또는 한쪽) 화살표. 선은 실선, dashed 면 점선 */
function Arrow2({ a, b, both = true, dashed }: { a: P; b: P; both?: boolean; dashed?: boolean }) {
  const u = useU(), k = useK();
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const L = (4 + 4 * u) * k;
  const head = (tip: P, dir: number) => {
    const p1 = { x: tip.x - L * Math.cos(ang + dir * 0.45), y: tip.y - L * Math.sin(ang + dir * 0.45) };
    const p2 = { x: tip.x - L * Math.cos(ang - dir * 0.45), y: tip.y - L * Math.sin(ang - dir * 0.45) };
    return `M${p1.x} ${p1.y} L${tip.x} ${tip.y} L${p2.x} ${p2.y}`;
  };
  const back = (tip: P) => {
    const p1 = { x: tip.x + L * Math.cos(ang + 0.45), y: tip.y + L * Math.sin(ang + 0.45) };
    const p2 = { x: tip.x + L * Math.cos(ang - 0.45), y: tip.y + L * Math.sin(ang - 0.45) };
    return `M${p1.x} ${p1.y} L${tip.x} ${tip.y} L${p2.x} ${p2.y}`;
  };
  const sw = 1 + 0.5 * u;
  return (
    <g>
      <DLine a={a} b={b} solid={!dashed} />
      <path d={head(b, 1)} fill="none" stroke={LINE_COLOR} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...STROKE} />
      {both && <path d={back(a)} fill="none" stroke={LINE_COLOR} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...STROKE} />}
    </g>
  );
}

/** 원 (check 면 안에 체크 표시). 반지름은 화면 px 기준이라 사진 크기와 무관하게 일정하다 */
function Ring({ c, check, scale = 1 }: { c: P; check?: boolean; scale?: number }) {
  const u = useU(), k = useK();
  const R = (5 + 11 * u) * scale * k;
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={R} fill="rgba(255,255,255,0.08)" stroke={LINE_COLOR} strokeWidth={1.1 + 0.6 * u} {...STROKE} />
      {check && (
        <path
          d={`M${c.x - 0.42 * R} ${c.y + 0.02 * R} L${c.x - 0.1 * R} ${c.y + 0.34 * R} L${c.x + 0.46 * R} ${c.y - 0.3 * R}`}
          fill="none" stroke={LINE_COLOR} strokeWidth={1.2 + 0.6 * u} strokeLinecap="round" strokeLinejoin="round" {...STROKE}
        />
      )}
    </g>
  );
}

const polyD = (pts: P[]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

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
  const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const W = Math.hypot(P(IDX.cheekL).x - P(IDX.cheekR).x, P(IDX.cheekL).y - P(IDX.cheekR).y);
  const at = (p: P, dx: number, dy: number): P => ({ x: p.x + dx * W, y: p.y + dy * W });
  const hairline = liftedPoint(pts, IDX.foreheadTop, w, h);
  const chin = P(IDX.chin);
  const faceL = P(IDX.cheekL).x, faceR = P(IDX.cheekR).x;

  // 가로 선 / 세로 선 도우미
  const H = (y: number, x1: number, x2: number) => <DLine a={{ x: x1, y }} b={{ x: x2, y }} />;
  const V = (x: number, y1: number, y2: number) => <DLine a={{ x, y: y1 }} b={{ x, y: y2 }} />;

  switch (id) {
    // ── 형태 분석 ──────────────────────────────────────────
    case 'faceline': {
      // 얼굴 오른쪽 윤곽 바로 바깥을 따라가는 큰 점선 호
      const arc = [284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152]
        .map(i => at(P(i), 0.035, 0));
      return <DPath d={smoothPath(arc)} />;
    }

    case 'cheek': {
      // 광대(관자놀이 아래 ~ 볼 윤곽)를 페이스라인처럼 윤곽 바깥을 따라가는 점선 호로
      const arc = [389, 356, 454, 323, 361, 288].map(i => at(P(i), 0.035, 0));
      return <DPath d={smoothPath(arc)} />;
    }

    case 'browshape':
      return <Ring c={at(P(70), 0.11, -0.075)} check />;

    case 'browdir': {
      // 오른쪽 눈썹 위에서 눈썹 안쪽 끝 → 바깥쪽 끝까지만, 수평 점선 화살표
      const inner = P(336), outer = P(300);
      const y = (inner.y + outer.y) / 2 - 0.055 * W;
      return <Arrow2 a={{ x: inner.x, y }} b={{ x: outer.x, y }} both={false} dashed />;
    }

    case 'eyeshape':
      return <Ring c={at(P(263), -0.02, -0.06)} check />;

    case 'eyetail': {
      // 눈머리→눈꼬리 기울기를 수평선과 함께 — 오른쪽 눈
      const o = P(362), e = P(263);
      const ext = lerp(o, e, 1.25);
      return (
        <g>
          {V(o.x, P(107).y, P(IDX.noseBottom).y + 0.04 * W)}
          <DLine a={o} b={ext} />
          <DLine a={o} b={{ x: ext.x, y: o.y }} />
        </g>
      );
    }

    case 'eyefront': {
      const l = P(IDX.eyeInnerL), r = P(IDX.eyeInnerR);
      const y0 = P(107).y, y1 = P(IDX.noseBottom).y + 0.04 * W;
      return (
        <g>
          {V(l.x, y0, y1)}{V(r.x, y0, y1)}
          <Ring c={at(l, 0.015, 0.03)} />
        </g>
      );
    }

    case 'nosewidth': {
      const l = P(IDX.alaL), r = P(IDX.alaR);
      const y0 = P(107).y, y1 = P(IDX.noseBottom).y + 0.04 * W;
      return (
        <g>
          {V(l.x, y0, y1)}{V(r.x, y0, y1)}
          <Arrow2 a={{ x: l.x, y: l.y }} b={{ x: r.x, y: r.y }} />
          <Ring c={P(IDX.noseTip)} scale={1.15} />
        </g>
      );
    }

    case 'nosehigh': {
      const top = P(IDX.noseBridge), tip = P(IDX.noseTip);
      return (
        <g>
          <DLine a={top} b={tip} />
          <Ring c={tip} scale={1.15} />
        </g>
      );
    }

    case 'lips': {
      // 윗입술 위 · 입 선 · 아랫입술 아래 — 세 줄의 가로 점선
      const x1 = P(IDX.lipLeft).x - 0.03 * W, x2 = P(IDX.lipRight).x + 0.03 * W;
      const yTop = P(IDX.lipTop).y - 0.018 * W;
      const yMid = (P(IDX.lipUpperInner).y + P(IDX.lipLowerInner).y) / 2;
      const yBot = P(IDX.lipBottom).y + 0.012 * W;
      return <g>{H(yTop, x1, x2)}{H(yMid, x1, x2)}{H(yBot, x1, x2)}</g>;
    }

    // ── 비율 분석 ──────────────────────────────────────────
    case 'facelen': {
      // 헤어라인에서 턱까지 얼굴 전체를 감싸는 직사각형
      const corners: P[] = [
        { x: faceL, y: hairline.y }, { x: faceR, y: hairline.y },
        { x: faceR, y: chin.y }, { x: faceL, y: chin.y },
      ];
      return <DPath d={polyD(corners)} close />;
    }

    case 'thirds': {
      // 헤어라인 · 눈썹 · 코끝 아래 · 턱 — 상/중/하안부를 나누는 가로선
      const x1 = faceL - 0.01 * W, x2 = faceR + 0.01 * W;
      const brow = (P(107).y + P(336).y) / 2;
      return (
        <g>
          {H(hairline.y, x1, x2)}{H(brow, x1, x2)}
          {H(P(IDX.noseBottom).y, x1, x2)}{H(chin.y, x1, x2)}
        </g>
      );
    }

    case 'broweye': {
      // 왼쪽 눈썹 아래 ↔ 눈 위, 짧은 점선 두 줄 사이를 세로 화살표로
      const cx = P(159).x;
      const yBrow = P(52).y, yEye = P(159).y;
      const hw = 0.07 * W;
      return (
        <g>
          {H(yBrow, cx - hw, cx + hw)}{H(yEye, cx - hw, cx + hw)}
          <Arrow2 a={{ x: cx, y: yBrow }} b={{ x: cx, y: yEye }} />
        </g>
      );
    }

    case 'eyelid':
      return <Ring c={at(lerp(P(386), P(263), 0.7), 0, -0.02)} scale={0.95} />;

    case 'intereye': {
      const l = P(IDX.eyeInnerL), r = P(IDX.eyeInnerR);
      const y0 = P(107).y, y1 = P(IDX.noseBottom).y;
      return (
        <g>
          {V(l.x, y0, y1)}{V(r.x, y0, y1)}
          <Arrow2 a={{ x: l.x, y: (l.y + r.y) / 2 }} b={{ x: r.x, y: (l.y + r.y) / 2 }} />
        </g>
      );
    }

    case 'eyeouter': {
      // 얼굴 폭을 눈 기준으로 가르는 세로 5줄(양끝 포함 6선)
      const xs = [faceL, P(IDX.eyeOuterL).x, P(IDX.eyeInnerL).x, P(IDX.eyeInnerR).x, P(IDX.eyeOuterR).x, faceR];
      return <g>{xs.map((x, i) => <g key={i}>{V(x, hairline.y, chin.y)}</g>)}</g>;
    }

    case 'noselen': {
      const x1 = P(IDX.eyeInnerL).x, x2 = P(IDX.eyeInnerR).x;
      const yTop = P(IDX.noseBridge).y, yBot = P(IDX.noseBottom).y;
      const cx = P(6).x;
      return (
        <g>
          {H(yTop, x1, x2)}{H(yBot, x1, x2)}
          <Arrow2 a={{ x: cx, y: yTop }} b={{ x: cx, y: yBot }} />
        </g>
      );
    }

    case 'philtrum': {
      const cx = P(IDX.lipTop).x, yA = P(IDX.noseBottom).y, yB = P(IDX.lipTop).y;
      const hw = 0.055 * W;
      return (
        <g>
          {H(yA, cx - hw, cx + hw)}{H(yB, cx - hw, cx + hw)}
          <Arrow2 a={{ x: cx, y: yA }} b={{ x: cx, y: yB }} />
        </g>
      );
    }

    case 'mouthwidth': {
      const l = P(IDX.lipLeft), r = P(IDX.lipRight);
      const y0 = P(IDX.noseBottom).y + 0.03 * W, y1 = P(IDX.lipBottom).y + 0.04 * W;
      return (
        <g>
          {V(l.x, y0, y1)}{V(r.x, y0, y1)}
          <Arrow2 a={{ x: l.x, y: l.y }} b={{ x: r.x, y: r.y }} />
        </g>
      );
    }

    case 'chinlen': {
      const cx = P(IDX.lipBottom).x;
      const yA = P(IDX.lipBottom).y + 0.012 * W, yB = chin.y;
      const hw = 0.07 * W;
      return (
        <g>
          {H(yA, cx - hw, cx + hw)}{H(yB, cx - hw, cx + hw)}
          <Arrow2 a={{ x: cx, y: yA }} b={{ x: cx, y: yB }} />
        </g>
      );
    }

    default:
      return null;
  }
}

// ── 전체 메시 가이드 (레퍼런스 동일) ──────────────────────────────────
// 기획 시안(얼굴에 가는 흰 삼각 메시가 빛나는 이미지)의 점과 선을 그대로 옮겼다.
// 점 좌표와 연결선은 시안 이미지(1080×1350)에서 읽은 값이고, 얼굴 좌표로 새로 삼각 분할하지 않는다.
// 고객 얼굴에는 눈 중심 · 턱 · 얼굴 폭에 맞춰 얹는다. 지금 분석 중인 기준의 선(guideFor)은 그 위에 흰 점선으로 얹힌다.
// (2026-10-01)

const MESH_REF = { cx: 550, eyeY: 467, chinY: 920, faceW: 593 };

/** 시안의 노드 (x, y) */
const MESH_PTS: [number, number][] = [
  [555, 88], [493, 96], [607, 96], [548, 136], [400, 174], [652, 167], [331, 237], [738, 216], [262, 304], [817, 287],
  [344, 363], [482, 387], [615, 388], [753, 367], [332, 395], [333, 407], [463, 410], [634, 409], [767, 394], [256, 412],
  [849, 414], [292, 460], [802, 459], [485, 485], [541, 482], [564, 481], [615, 483], [257, 503], [336, 539], [437, 579],
  [666, 576], [755, 546], [292, 604], [278, 621], [480, 643], [623, 642], [400, 655], [704, 657], [480, 677], [629, 677],
  [390, 684], [708, 683], [552, 681], [568, 679], [536, 705], [568, 705], [426, 763], [673, 764], [351, 757], [728, 757],
  [333, 782], [497, 833], [611, 839], [479, 909], [551, 920], [624, 910], [797, 598],
];

/** 시안의 연결선 (노드 번호 쌍) */
const MESH_EDGES: [number, number][] = [
  // 이마
  [0, 3], [1, 4], [2, 5], [3, 4], [3, 5], [4, 6], [5, 7], [6, 10], [6, 19], [8, 19], [7, 9], [7, 13], [9, 20],
  // 눈썹 둘레
  [10, 11], [10, 14], [14, 15], [11, 23], [11, 24], [12, 13], [12, 26], [12, 25],
  [13, 18], [13, 22], [18, 20], [18, 22], [20, 22], [10, 21],
  // 왼쪽 볼 · 윤곽
  [14, 21], [15, 21], [19, 21], [19, 27], [21, 27], [21, 28], [21, 29], [23, 29], [28, 29], [28, 32],
  [27, 33], [40, 48], [32, 40], [32, 33], [29, 40], [33, 48], [33, 50], [48, 50], [50, 53], [48, 51], [48, 53], [46, 48],
  // 코 · 중앙
  [23, 24], [24, 25], [25, 26], [23, 34], [24, 34], [24, 44], [25, 35], [34, 35], [34, 38], [29, 34], [28, 40],
  [38, 40], [38, 46], [35, 39],
  // 오른쪽 볼 · 윤곽
  [22, 30], [26, 30], [30, 31], [30, 37], [37, 41], [31, 37], [22, 31], [20, 56], [47, 49], [26, 35], [30, 35], [31, 56], [22, 56], [41, 56],
  [39, 41], [39, 47], [41, 49], [49, 56],
  // 턱
  [49, 52], [49, 55], [47, 52], [51, 52], [52, 55], [52, 54], [51, 54], [53, 54], [51, 53], [54, 55], [46, 51],
];

/** 연결선이 하나라도 있는 노드 — 선을 정리하면서 홀로 남은 점은 그리지 않는다 */
const MESH_USED = new Set(MESH_EDGES.flat());

/** 빛 번짐이 큰 노드(시안에서 크게 반짝이는 점)와 중간 노드 */
const MESH_STAR = new Set([21, 22, 29, 30, 40, 41, 48, 51, 52]);
const MESH_MID = new Set([28, 31, 36, 37, 46, 47, 49, 53, 55]);

/**
 * 시안 얼굴의 기준점(눈 끝 · 눈썹 끝 · 콧방울 · 입꼬리 · 턱 · 윤곽 …) ↔ 고객 얼굴 좌표.
 * 템플릿을 한 번에 키우기만 하면 눈·코·입 위치가 고객마다 어긋난다. 이 기준점들을 고객 얼굴에 정확히
 * 맞추고, 그 사이는 삼각형 단위로 부드럽게 변형해 노드가 각 이목구비 위에 놓이게 한다.
 * [시안 x, 시안 y, 얼굴 좌표 번호]
 */
const MESH_ANCHORS: [number, number, number][] = [
  [335, 462, 33], [470, 490, 133], [635, 482, 362], [775, 458, 263],   // 눈 끝
  [340, 395, 46], [463, 410, 55], [634, 409, 285], [770, 392, 276],    // 눈썹 끝
  [552, 668, 1], [480, 650, 129], [625, 650, 358], [550, 440, 168],    // 코
  [460, 772, 61], [650, 772, 291], [552, 735, 0], [552, 825, 17],      // 입
  [551, 920, 152], [548, 136, 10],                                      // 턱 · 이마
];

/**
 * 시안 얼굴 윤곽 위의 노드. 템플릿 비율만 따르면 턱이 다른 얼굴에서 메시가 윤곽 안쪽/바깥으로 어긋난다.
 * 그래서 같은 높이(눈~턱 사이 비율)의 실제 얼굴 윤곽선 위에 바로 얹는다. [시안 x, 시안 y, 왼/오른쪽]
 */
const MESH_CONTOUR_ANCHORS: [number, number, 'L' | 'R'][] = [
  [400, 174, 'L'], [331, 237, 'L'], [262, 304, 'L'], [256, 412, 'L'], [257, 503, 'L'], [278, 621, 'L'], [333, 782, 'L'], [479, 909, 'L'],
  [652, 167, 'R'], [738, 216, 'R'], [817, 287, 'R'], [849, 414, 'R'], [797, 598, 'R'], [728, 757, 'R'], [624, 910, 'R'],
];

/** 얼굴 윤곽 랜드마크 — 위(이마)에서 아래(턱)로, 왼쪽/오른쪽 */
const OVAL_CHAIN = {
  L: [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152],
  R: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152],
};

/** 기준점이 없는 가장자리에서는 변형 없이 전체 틀을 따르게 하는 받침점 */
const MESH_PADS: RefPt[] = [
  [555, 40], [330, 110], [780, 110], [150, 260], [950, 260], [120, 520], [980, 520],
  [150, 780], [960, 780], [250, 980], [850, 980], [550, 1010],
];

type RefPt = [number, number];

/** Bowyer–Watson 삼각 분할 (시안 좌표 고정이라 모듈 로드 때 한 번만 쓴다) */
function delaunayRef(pts: RefPt[]): [number, number, number][] {
  const n = pts.length, d = 1e5;
  const all: RefPt[] = [...pts, [550 - d, 600 - d], [550, 600 + d], [550 + d, 600 - d]];
  let tris: [number, number, number][] = [[n, n + 1, n + 2]];
  const inCircle = (t: [number, number, number], p: RefPt) => {
    const [a, b, c] = t.map(i => all[i]);
    const ax = a[0] - p[0], ay = a[1] - p[1], bx = b[0] - p[0], by = b[1] - p[1], cx = c[0] - p[0], cy = c[1] - p[1];
    const det = (ax * ax + ay * ay) * (bx * cy - cx * by) - (bx * bx + by * by) * (ax * cy - cx * ay)
      + (cx * cx + cy * cy) * (ax * by - bx * ay);
    const orient = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    return orient > 0 ? det > 0 : det < 0;
  };
  for (let i = 0; i < n; i++) {
    const bad = tris.filter(t => inCircle(t, all[i]));
    const edges = new Map<string, [number, number]>();
    const count = new Map<string, number>();
    for (const [a, b, c] of bad) {
      for (const [u, v] of [[a, b], [b, c], [c, a]] as [number, number][]) {
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;
        edges.set(key, [u, v]);
        count.set(key, (count.get(key) ?? 0) + 1);
      }
    }
    tris = tris.filter(t => !bad.includes(t));
    for (const [key, [u, v]] of edges) if (count.get(key) === 1) tris.push([u, v, i]);
  }
  return tris.filter(t => t.every(i => i < n));
}

/** 노드마다 '어느 삼각형 안에서 어떤 비율인지' 를 미리 구해 둔다 (시안 좌표는 변하지 않는다) */
const MESH_WARP: ({ tri: [number, number, number]; w: [number, number, number] } | null)[] = (() => {
  const refs: RefPt[] = [
    ...MESH_ANCHORS.map(([x, y]): RefPt => [x, y]),
    ...MESH_CONTOUR_ANCHORS.map(([x, y]): RefPt => [x, y]),
    ...MESH_PADS,
  ];
  const tris = delaunayRef(refs);
  return MESH_PTS.map(([x, y]) => {
    for (const t of tris) {
      const [a, b, c] = t.map(i => refs[i]);
      const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (!den) continue;
      const w0 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / den;
      const w1 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / den;
      const w2 = 1 - w0 - w1;
      if (w0 >= -1e-6 && w1 >= -1e-6 && w2 >= -1e-6) return { tri: t, w: [w0, w1, w2] };
    }
    return null;
  });
})();

/** 시안 좌표 → 이미지 픽셀 변환 틀. 눈 중심 · 턱 · 얼굴 폭에 맞춘다. */
function meshFrame(pts: LandmarkPoint[], w: number, h: number) {
  const P = (i: number) => toPx(pts, i, w, h);
  const avg = (ids: number[]): P => ({
    x: ids.reduce((s, i) => s + P(i).x, 0) / ids.length,
    y: ids.reduce((s, i) => s + P(i).y, 0) / ids.length,
  });
  const O = avg([IDX.eyeOuterL, IDX.eyeInnerL, IDX.eyeOuterR, IDX.eyeInnerR]);
  const chin = P(IDX.chin);
  const Lc = Math.hypot(chin.x - O.x, chin.y - O.y) || 1;
  const ey = { x: (chin.x - O.x) / Lc, y: (chin.y - O.y) / Lc };
  const ex = { x: ey.y, y: -ey.x };
  const faceW = Math.hypot(P(IDX.cheekL).x - P(IDX.cheekR).x, P(IDX.cheekL).y - P(IDX.cheekR).y);
  const sy = Lc / (MESH_REF.chinY - MESH_REF.eyeY);
  const sx = faceW / MESH_REF.faceW;
  const at = (x: number, y: number): P => {
    const a = (x - MESH_REF.cx) * sx, b = (y - MESH_REF.eyeY) * sy;
    return { x: O.x + ex.x * a + ey.x * b, y: O.y + ex.y * a + ey.y * b };
  };
  return { at, sx };
}

/** 노드 — 흰 점 + 번짐. 시안처럼 별(star)은 크게 빛난다 */
function MNode({ p, kind }: { p: P; kind: 'star' | 'mid' | 'dot' }) {
  const u = useU();
  const seg = { x1: p.x, y1: p.y, x2: p.x, y2: p.y, strokeLinecap: 'round' as const, ...STROKE };
  const halo = kind === 'star' ? 17 : kind === 'mid' ? 10 : 0;
  const core = kind === 'star' ? 7 : kind === 'mid' ? 4.6 : 3.6;
  return (
    <g>
      {halo > 0 && <line {...seg} stroke="#FFFFFF" strokeWidth={halo * u} strokeOpacity={0.1} />}
      {halo > 0 && <line {...seg} stroke="#FFFFFF" strokeWidth={halo * 0.55 * u} strokeOpacity={0.16} />}
      <line {...seg} stroke="#FFFFFF" strokeWidth={core * u} strokeOpacity={0.75} />
    </g>
  );
}

/** 점이 다각형 안에 있는지 */
function insidePoly(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** 다각형 둘레에서 p 와 가장 가까운 점 */
function nearestOnPoly(p: P, poly: P[]): P {
  let best = poly[0], bestD = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x, dy = b.y - a.y, len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const q = { x: a.x + dx * t, y: a.y + dy * t };
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < bestD) { bestD = d; best = q; }
  }
  return best;
}

export function baseGuide(pts: LandmarkPoint[], w: number, h: number): React.ReactNode {
  const { at } = meshFrame(pts, w, h);
  // 기준점마다 '전체 틀이 예측한 위치' 와 '실제 얼굴 좌표' 의 차이를 구해 둔다
  const O = ((): P => {
    const ids = [IDX.eyeOuterL, IDX.eyeInnerL, IDX.eyeOuterR, IDX.eyeInnerR].map(i => toPx(pts, i, w, h));
    return { x: ids.reduce((a, p) => a + p.x, 0) / 4, y: ids.reduce((a, p) => a + p.y, 0) / 4 };
  })();
  const chinP = toPx(pts, IDX.chin, w, h);
  const Lc = Math.hypot(chinP.x - O.x, chinP.y - O.y) || 1;
  const eyAxis = { x: (chinP.x - O.x) / Lc, y: (chinP.y - O.y) / Lc };
  // 윤곽선 위에서 '눈=0 · 턱=1' 높이가 t 인 점
  const contourAt = (side: 'L' | 'R', t: number): P => {
    const chain = OVAL_CHAIN[side].map(i => liftedPoint(pts, i, w, h));
    const ts = chain.map(p => ((p.x - O.x) * eyAxis.x + (p.y - O.y) * eyAxis.y) / Lc);
    for (let i = 0; i < chain.length - 1; i++) {
      if ((ts[i] <= t && t <= ts[i + 1]) || (ts[i] >= t && t >= ts[i + 1])) {
        const d = ts[i + 1] - ts[i] || 1, f = (t - ts[i]) / d;
        return { x: chain[i].x + (chain[i + 1].x - chain[i].x) * f, y: chain[i].y + (chain[i + 1].y - chain[i].y) * f };
      }
    }
    return t < ts[0] ? chain[0] : chain[chain.length - 1];
  };
  const residual: P[] = [
    ...MESH_ANCHORS.map(([rx, ry, lm]) => {
      // 이마 꼭대기(10)는 얼굴 좌표가 이마 중간이라, 헤어라인 쪽으로 올린 위치를 쓴다
      const g = at(rx, ry), t = lm === IDX.foreheadTop ? liftedPoint(pts, lm, w, h) : toPx(pts, lm, w, h);
      return { x: t.x - g.x, y: t.y - g.y };
    }),
    ...MESH_CONTOUR_ANCHORS.map(([rx, ry, side]) => {
      const g = at(rx, ry), t = contourAt(side, (ry - MESH_REF.eyeY) / (MESH_REF.chinY - MESH_REF.eyeY));
      return { x: t.x - g.x, y: t.y - g.y };
    }),
  ];
  const px0 = MESH_PTS.map(([x, y], i) => {
    const g = at(x, y), wp = MESH_WARP[i];
    if (!wp) return g;
    let dx = 0, dy = 0;
    wp.tri.forEach((k, j) => {
      if (k < residual.length) { dx += wp.w[j] * residual[k].x; dy += wp.w[j] * residual[k].y; }
    });
    return { x: g.x + dx, y: g.y + dy };
  });
  // 어떤 사진이든 메시가 얼굴 윤곽 밖으로 삐져나가지 않게 — 윤곽 밖으로 나간 노드는 윤곽선 안쪽으로 끌어들인다
  const outline = [
    ...OVAL_CHAIN.L.map(i => liftedPoint(pts, i, w, h)),
    ...OVAL_CHAIN.R.slice(1, -1).reverse().map(i => liftedPoint(pts, i, w, h)),
  ];
  const center = { x: outline.reduce((a, q) => a + q.x, 0) / outline.length, y: outline.reduce((a, q) => a + q.y, 0) / outline.length };
  const px = px0.map(p => {
    if (insidePoly(p, outline)) return p;
    const q = nearestOnPoly(p, outline);
    return { x: q.x + (center.x - q.x) * 0.015, y: q.y + (center.y - q.y) * 0.015 };
  });
  return (
    <g>
      {MESH_EDGES.map(([a, b]) => (
        <MLine key={`${a}-${b}`} a={px[a]} b={px[b]} />
      ))}
      {px.map((p, i) => MESH_USED.has(i) && (
        <MNode key={i} p={p} kind={MESH_STAR.has(i) ? 'star' : MESH_MID.has(i) ? 'mid' : 'dot'} />
      ))}
    </g>
  );
}

function MLine({ a, b }: { a: P; b: P }) {
  const u = useU();
  return (
    <line
      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
      stroke="#FFFFFF" strokeWidth={0.4 + 0.45 * u} strokeLinecap="round" strokeOpacity={0.45}
      {...STROKE}
    />
  );
}
