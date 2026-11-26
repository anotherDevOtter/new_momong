// 랜드마크 정답 — 사람이 찍을 점 목록과, 판정별로 묶은 입력 단계.
// 측정 모듈(lib/face-measure form.ts · prop.ts)의 판정 17개가 쓰는 위치를 해부학적 이름으로 다시 정리했다.
// L / R 은 '화면 기준' (사진의 왼쪽 · 오른쪽). 처음 위치는 MediaPipe 점(mp) — 지금 측정이 쓰는 번호.
// 채점 스크립트(tools/landmark-bench)도 이 id 를 쓴다. id 를 바꾸면 이미 저장한 정답과 맞지 않게 된다.

export interface TruthPoint {
  id: string;
  /** 화면에 점 옆에 붙는 짧은 이름 */
  short: string;
  /** 처음 위치로 쓸 MediaPipe 점 번호. null = MediaPipe 에 없는 점 (아래 seed 로 계산) */
  mp: number | null;
}

const P = (id: string, short: string, mp: number | null): TruthPoint => ({ id, short, mp });
const LR = (base: string, short: string, mpL: number, mpR: number): TruthPoint[] => [
  P(`${base}_l`, short, mpL),
  P(`${base}_r`, short, mpR),
];

export const TRUTH_POINTS: TruthPoint[] = [
  P('hairline', '헤어라인', null),
  P('menton', '턱끝', 152),
  ...LR('face_eye', '얼굴 끝', 127, 356),
  ...LR('zygion', '광대', 234, 454),
  ...LR('gonion', '턱각', 172, 397),
  P('glabella', '미간', 9),
  P('subnasale', '코 밑', 2),
  ...LR('eye_in', '눈머리', 133, 362),
  ...LR('eye_out', '눈꼬리', 33, 263),
  ...LR('eye_top', '위 눈꺼풀', 159, 386),
  ...LR('eye_bot', '아래 눈꺼풀', 145, 374),
  ...LR('brow_in', '눈썹 머리', 107, 336),
  ...LR('brow_out', '눈썹 꼬리', 70, 300),
  P('brow_low_l', '눈썹 아래', null),
  P('brow_low_r', '눈썹 아래', null),
  P('nasion', '코뿌리', 168),
  P('nose_tip', '코끝', 1),
  ...LR('alar', '콧망울', 48, 278),
  ...LR('mouth', '입꼬리', 61, 291),
  P('lip_top', '윗입술 위', 0),
  P('lip_upper_in', '윗입술 아래', 13),
  P('lip_lower_in', '아랫입술 위', 14),
  P('lip_bottom', '아랫입술 아래', 17),
];

export const POINT_BY_ID: Record<string, TruthPoint> = Object.fromEntries(TRUTH_POINTS.map((p) => [p.id, p]));

/** 예시 그림에 붙는 설명 (좌우 점은 _l / _r 를 뗀 이름으로) */
export const POINT_DESC: Record<string, string> = {
  hairline: '이마 가운데에서 피부가 끝나고 머리카락이 시작되는 곳. 잔머리 말고 굵은 머리카락이 모이기 시작하는 선. 앞머리로 가려졌으면 안 보임',
  menton: '얼굴 가운데 세로선에서 턱 피부의 가장 아래. 턱 밑 그림자(목) 말고 턱 끝 윤곽',
  face_eye: '눈 바깥 끝과 같은 높이에서 얼굴 피부가 끝나는 곳. 머리카락 · 귀는 빼고 피부 경계',
  zygion: '광대뼈 높이에서 얼굴 폭이 가장 넓은 곳의 피부 경계',
  gonion: '귀 아래에서 턱끝으로 내려오는 턱선이 가장 크게 꺾이는 모서리',
  glabella: '두 눈썹 머리 사이 한가운데',
  subnasale: '코 아래, 코와 인중이 만나는 가장 안쪽',
  eye_in: '눈머리 — 위아래 눈꺼풀이 코 쪽에서 만나는 끝 (분홍 눈물샘 살 말고 눈꺼풀이 만나는 곳)',
  eye_out: '눈꼬리 — 위아래 눈꺼풀이 바깥쪽에서 만나는 끝',
  eye_top: '눈동자 바로 위 윗눈꺼풀 테두리 (속눈썹 끝 말고 눈꺼풀 선)',
  eye_bot: '눈동자 바로 아래 아랫눈꺼풀 테두리',
  brow_in: '눈썹 머리 — 코 쪽 눈썹 끝',
  brow_out: '눈썹 꼬리 — 바깥쪽 눈썹 끝',
  brow_low: '눈동자 위쪽 세로선에서 눈썹 털의 아랫선',
  nasion: '두 눈 사이에서 콧대가 시작되는 곳 (정면에서는 콧대 그림자가 가장 좁아지는 높이)',
  nose_tip: '코에서 가장 앞으로 튀어나온 끝 (보통 가장 밝게 빛나는 곳)',
  alar: '콧망울(콧볼)에서 가장 바깥쪽',
  mouth: '입꼬리 — 윗입술과 아랫입술이 만나는 끝',
  lip_top: '가운데에서 윗입술 붉은 부분이 시작되는 선 (큐피드 활 가운데 오목한 곳)',
  lip_upper_in: '가운데에서 윗입술 붉은 부분이 끝나는 선',
  lip_lower_in: '가운데에서 아랫입술 붉은 부분이 시작되는 선 (입을 다물면 윗입술 아래와 거의 같은 곳)',
  lip_bottom: '가운데에서 아랫입술 붉은 부분이 끝나는 선',
};

export const descOf = (id: string) => POINT_DESC[id] ?? POINT_DESC[id.replace(/_[lr]$/, '')] ?? '';

/**
 * 얼굴 가운데 세로선 위의 점. '가운데 선 고정'을 켜면 이 점들은 미간–턱끝을 잇는 직선 위로만 움직인다.
 * 미간 · 턱끝은 선을 정하는 점이라 자유롭게 움직인다.
 */
export const MIDLINE_ANCHORS = ['glabella', 'menton'] as const;
export const MIDLINE_POINTS = ['hairline', 'nasion', 'nose_tip', 'subnasale', 'lip_top', 'lip_upper_in', 'lip_lower_in', 'lip_bottom'];

/** 선 — [점, 점, …] 을 잇는다. dashed = 기준선 */
export interface Guide {
  ids: string[];
  dashed?: boolean;
  /** 점들의 y 높이에 가로선을 긋는다 (삼등분) */
  horizontal?: boolean;
}

export interface TruthStep {
  id: string;
  title: string;
  /** 이 묶음의 점으로 하는 판정 */
  judgments: string[];
  /** 이 단계에서 확인 · 수정하는 점 */
  points: string[];
  /** 앞 단계에서 정한 점 중 같이 보여 줄 것 (흐리게, 못 옮김) */
  refs?: string[];
  guides: Guide[];
  tip: string;
  /** 예시 그림 — 받은 '기준시각화 다시.pdf' 의 페이지 (landmark-bench/examples/pageN.jpg) */
  examples: { page: number; title: string }[];
}

export const STEPS: TruthStep[] = [
  {
    id: 'contour',
    title: '얼굴 윤곽',
    judgments: ['얼굴 길이', '광대 발달', '페이스라인'],
    points: ['hairline', 'menton', 'face_eye_l', 'face_eye_r', 'zygion_l', 'zygion_r', 'gonion_l', 'gonion_r'],
    guides: [
      { ids: ['hairline', 'menton'], dashed: true },
      { ids: ['face_eye_l', 'face_eye_r'], dashed: true },
      { ids: ['zygion_l', 'zygion_r'], dashed: true },
      { ids: ['zygion_l', 'gonion_l', 'menton', 'gonion_r', 'zygion_r'] },
    ],
    tip: '헤어라인 = 이마 가운데 머리카락 시작 · 얼굴 끝 = 눈 높이의 피부 경계 · 광대 = 얼굴이 가장 넓은 곳 · 턱각 = 턱선이 가장 꺾이는 곳',
    examples: [{ page: 8, title: '형태 (턱 각도 · 광대 · 윤곽)' }, { page: 2, title: '얼굴 비율' }],
  },
  {
    id: 'thirds',
    title: '상중하안부',
    judgments: ['상중하안부 비율'],
    points: ['hairline', 'glabella', 'subnasale', 'menton'],
    guides: [{ ids: ['hairline', 'glabella', 'subnasale', 'menton'], horizontal: true, dashed: true }],
    tip: '헤어라인 · 미간(두 눈썹 사이) · 코 밑(코와 인중이 만나는 곳) · 턱끝',
    examples: [{ page: 2, title: '얼굴 비율 · 상중하안부' }, { page: 10, title: '비율 / 여백' }],
  },
  {
    id: 'eye',
    title: '눈',
    judgments: ['눈 형태', '눈꼬리', '눈 사이 거리', '눈 바깥 여백'],
    points: ['eye_in_l', 'eye_out_l', 'eye_top_l', 'eye_bot_l', 'eye_in_r', 'eye_out_r', 'eye_top_r', 'eye_bot_r'],
    guides: [
      { ids: ['eye_out_l', 'eye_in_l'] },
      { ids: ['eye_in_r', 'eye_out_r'] },
      { ids: ['eye_top_l', 'eye_bot_l'] },
      { ids: ['eye_top_r', 'eye_bot_r'] },
      { ids: ['eye_in_l', 'eye_in_r'], dashed: true },
    ],
    tip: '눈머리 · 눈꼬리 = 위아래 눈꺼풀이 만나는 끝 · 눈꺼풀 = 눈동자 위아래 테두리 (속눈썹 말고)',
    examples: [{ page: 4, title: '눈 분석' }, { page: 10, title: '비율 / 여백' }],
  },
  {
    id: 'brow',
    title: '눈썹',
    judgments: ['눈썹 형태', '눈썹~눈 거리'],
    points: ['brow_in_l', 'brow_out_l', 'brow_low_l', 'brow_in_r', 'brow_out_r', 'brow_low_r'],
    refs: ['eye_top_l', 'eye_top_r'],
    guides: [
      { ids: ['brow_in_l', 'brow_out_l'] },
      { ids: ['brow_in_r', 'brow_out_r'] },
      { ids: ['brow_low_l', 'eye_top_l'], dashed: true },
      { ids: ['brow_low_r', 'eye_top_r'], dashed: true },
    ],
    tip: '눈썹 머리 · 꼬리 = 눈썹 양 끝 · 눈썹 아래 = 눈동자 위쪽에서 눈썹 아랫선',
    examples: [{ page: 3, title: '눈썹 분석' }, { page: 4, title: '눈과 눈썹 사이' }],
  },
  {
    id: 'nose',
    title: '코',
    judgments: ['코 길이', '코 폭', '코 너비'],
    points: ['nasion', 'nose_tip', 'subnasale', 'alar_l', 'alar_r'],
    guides: [
      { ids: ['nasion', 'nose_tip', 'subnasale'] },
      { ids: ['alar_l', 'alar_r'], dashed: true },
    ],
    tip: '코뿌리 = 두 눈 사이 콧대 시작 · 코끝 · 코 밑 · 콧망울 = 콧볼 가장 바깥',
    examples: [{ page: 5, title: '코 분석' }],
  },
  {
    id: 'lips',
    title: '입',
    judgments: ['입술 두께', '입 폭', '인중 길이', '턱 길이'],
    points: ['mouth_l', 'mouth_r', 'lip_top', 'lip_upper_in', 'lip_lower_in', 'lip_bottom'],
    refs: ['subnasale', 'menton'],
    guides: [
      { ids: ['mouth_l', 'mouth_r'], dashed: true },
      { ids: ['lip_top', 'lip_upper_in'] },
      { ids: ['lip_lower_in', 'lip_bottom'] },
      { ids: ['subnasale', 'lip_top'], dashed: true },
      { ids: ['lip_bottom', 'menton'], dashed: true },
    ],
    tip: '입꼬리 · 윗입술 위아래 경계 · 아랫입술 위아래 경계 (붉은 부분 기준, 가운데)',
    examples: [{ page: 6, title: '하안부 분석' }],
  },
];

/** MediaPipe 에 없는 점의 처음 위치 */
export function seedPosition(id: string, lm: { x: number; y: number }[]): [number, number] {
  const faceH = lm[152].y - lm[10].y;
  if (id === 'hairline') return [lm[10].x, Math.max(0, lm[10].y - faceH * 0.08)];
  // 눈썹 아래: 위 눈꺼풀 중앙 바로 위, 눈썹 점(105 / 334)과의 사이 2/3 지점
  const [eye, brow] = id === 'brow_low_l' ? [lm[159], lm[105]] : [lm[386], lm[334]];
  return [eye.x, eye.y + (brow.y - eye.y) * 0.67];
}
