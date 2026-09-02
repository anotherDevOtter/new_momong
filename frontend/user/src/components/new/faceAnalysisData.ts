// Shared face analysis data used by AIFaceFeature and AIFaceResultDerived

export interface MItem {
  id: string; num: number; title: string;
  l: string; r: string; defaultPos: number;
  vType: string; defaultValue: string; desc: string;
  tags: string[];
  breakdown: { label: string; pct: number }[];
}

export const FORM: MItem[] = [
  { id: 'faceline',  num:  1, title: '페이스라인',   l: '둥근',    r: '각진',         defaultPos: 0.68, vType: 'Cool',    defaultValue: '각진 편',  tags: ['#세련된', '#도시적인', '#지적인', '#성숙한'], desc: '세련되고 도시적이며 성숙한 인상을 줍니다.', breakdown: [{ label: 'Cool', pct: 44 }, { label: 'Neutral', pct: 34 }, { label: 'Warm', pct: 22 }] },
  { id: 'cheek',     num:  2, title: '광대 발달',    l: '미발달',  r: '발달',         defaultPos: 0.55, vType: 'Neutral', defaultValue: '표준',     tags: ['#자연스러운', '#균형잡힌'], desc: '광대 발달이 균형 잡힌 범위로 자연스러운 인상을 만듭니다.', breakdown: [{ label: 'Neutral', pct: 48 }, { label: 'Cool', pct: 30 }, { label: 'Warm', pct: 22 }] },
  { id: 'browshape', num:  3, title: '눈썹 형태',    l: '둥근형',  r: '각진형',       defaultPos: 0.70, vType: 'Cool',    defaultValue: '각진형',   tags: ['#선명한', '#각진', '#정돈된'], desc: '눈썹 산에 각이 있어 이목구비를 선명하게 정돈해 줍니다.', breakdown: [{ label: 'Cool', pct: 46 }, { label: 'Neutral', pct: 32 }, { label: 'Warm', pct: 22 }] },
  { id: 'browdir',   num:  4, title: '눈썹 방향',    l: '내려간',  r: '올라간',       defaultPos: 0.72, vType: 'Cool',    defaultValue: '+8°',      tags: ['#또렷한', '#상승감', '#시크한'], desc: '눈썹 꼬리가 위로 올라가 또렷하고 상승감 있는 인상을 줍니다.', breakdown: [{ label: 'Cool', pct: 52 }, { label: 'Neutral', pct: 28 }, { label: 'Warm', pct: 20 }] },
  { id: 'eyeshape',  num:  5, title: '눈 형태',      l: '둥근 눈', r: '가로로 긴 눈', defaultPos: 0.74, vType: 'Cool',    defaultValue: '28.6mm',   tags: ['#시원한', '#세련된', '#강한'], desc: '눈이 가로로 길어 시원하고 세련된 인상을 줍니다.', breakdown: [{ label: 'Cool', pct: 50 }, { label: 'Neutral', pct: 30 }, { label: 'Warm', pct: 20 }] },
  { id: 'eyetail',   num:  6, title: '눈꼬리',       l: '내려간',  r: '올라간',       defaultPos: 0.74, vType: 'Cool',    defaultValue: '+6.2°',    tags: ['#시크한', '#또렷한', '#상승감'], desc: '눈꼬리가 올라가 시크하고 또렷한 인상을 줍니다.', breakdown: [{ label: 'Cool', pct: 54 }, { label: 'Neutral', pct: 26 }, { label: 'Warm', pct: 20 }] },
  { id: 'eyefront',  num:  7, title: '눈 앞머리',    l: '부드러운',r: '날카로운',     defaultPos: 0.70, vType: 'Cool',    defaultValue: '날카로운', tags: ['#선명한', '#날카로운'], desc: '눈 앞머리 각이 날카로워 인상의 시작점을 선명하게 만듭니다.', breakdown: [{ label: 'Cool', pct: 45 }, { label: 'Neutral', pct: 35 }, { label: 'Warm', pct: 20 }] },
  { id: 'nosewidth', num:  8, title: '코 너비',      l: '넓다',    r: '좁다',         defaultPos: 0.50, vType: 'Neutral', defaultValue: '표준',     tags: ['#자연스러운', '#균형'], desc: '콧볼 너비가 표준 범위로 인상을 중립적으로 유지합니다.', breakdown: [{ label: 'Neutral', pct: 50 }, { label: 'Cool', pct: 28 }, { label: 'Warm', pct: 22 }] },
  { id: 'nosehigh',  num:  9, title: '코 높이',      l: '낮음',    r: '높음',         defaultPos: 0.66, vType: 'Cool',    defaultValue: '높은 편',  tags: ['#입체적', '#세련된', '#또렷한'], desc: '콧대가 높아 얼굴 중앙에 입체감과 세련된 인상을 더합니다.', breakdown: [{ label: 'Cool', pct: 46 }, { label: 'Neutral', pct: 32 }, { label: 'Warm', pct: 22 }] },
  { id: 'lips',      num: 10, title: '입술 두께',    l: '도톰',    r: '얇음',         defaultPos: 0.72, vType: 'Cool',    defaultValue: '얇음',     tags: ['#절제된', '#정돈된', '#차분한'], desc: '입술 두께가 얇아 절제되고 정돈된 인상을 줍니다.', breakdown: [{ label: 'Cool', pct: 44 }, { label: 'Neutral', pct: 36 }, { label: 'Warm', pct: 20 }] },
];

export const PROP: MItem[] = [
  { id: 'facelen',    num:  1, title: '얼굴 길이',       l: '짧음',       r: '김',              defaultPos: 0.46, vType: 'Neutral', defaultValue: '비율 1.42',   tags: ['#균형', '#자연스러운'], desc: '세로/가로 비율이 표준 범위로 전체 실루엣의 기준선을 형성합니다.', breakdown: [{ label: 'Neutral', pct: 50 }, { label: 'Soft', pct: 28 }, { label: 'Hard', pct: 22 }] },
  { id: 'thirds',     num:  2, title: '상중하안부 비율',  l: '상↑',        r: '하↑',             defaultPos: 0.54, vType: 'Neutral', defaultValue: '1:0.98:1.04', tags: ['#균형', '#안정적'], desc: '이마·중안부·하안부 세 구간의 균형이 고른 편입니다.', breakdown: [{ label: 'Neutral', pct: 55 }, { label: 'Soft', pct: 25 }, { label: 'Hard', pct: 20 }] },
  { id: 'broweye',    num:  3, title: '눈썹~눈 거리',    l: '멀다',       r: '가까움',          defaultPos: 0.55, vType: 'Neutral', defaultValue: '표준',        tags: ['#자연스러운'], desc: '눈썹과 눈 사이 간격이 표준으로 눈매의 인상 강도를 중립적으로 유지합니다.', breakdown: [{ label: 'Neutral', pct: 52 }, { label: 'Soft', pct: 26 }, { label: 'Hard', pct: 22 }] },
  { id: 'eyelid',     num:  4, title: '쌍꺼풀',          l: '무쌍 · 속쌍', r: '인아웃 · 세미아웃', defaultPos: 0.70, vType: 'Hard',    defaultValue: '인아웃',      tags: ['#선명한', '#또렷한', '#강한'], desc: '쌍꺼풀 라인이 선명하게 눈매의 존재감을 높이는 Hard 성향입니다.', breakdown: [{ label: 'Hard', pct: 48 }, { label: 'Neutral', pct: 32 }, { label: 'Soft', pct: 20 }] },
  { id: 'intereye',   num:  5, title: '눈 사이 거리',    l: '넓다',       r: '좁다',            defaultPos: 0.36, vType: 'Soft',    defaultValue: '34.1mm',      tags: ['#부드러운', '#편안한', '#친근한'], desc: '두 눈 사이가 넓어 부드럽고 편안한 인상을 만듭니다.', breakdown: [{ label: 'Soft', pct: 48 }, { label: 'Neutral', pct: 30 }, { label: 'Hard', pct: 22 }] },
  { id: 'eyeouter',   num:  6, title: '눈 바깥 여백',    l: '넓음',       r: '좁음',            defaultPos: 0.50, vType: 'Neutral', defaultValue: '표준',        tags: ['#균형', '#안정적'], desc: '눈꼬리에서 얼굴 외곽선까지 여백이 표준 범위로 눈매와 윤곽의 균형을 유지합니다.', breakdown: [{ label: 'Neutral', pct: 50 }, { label: 'Soft', pct: 28 }, { label: 'Hard', pct: 22 }] },
  { id: 'noselen',    num:  7, title: '코 길이',          l: '짧음',       r: '김',              defaultPos: 0.52, vType: 'Neutral', defaultValue: '표준',        tags: ['#균형', '#자연스러운'], desc: '미간에서 코끝까지의 세로 길이가 표준 범위로 중안부 비율의 기준선을 잡아 줍니다.', breakdown: [{ label: 'Neutral', pct: 52 }, { label: 'Soft', pct: 26 }, { label: 'Hard', pct: 22 }] },
  { id: 'philtrum',   num:  8, title: '인중 길이',        l: '짧음',       r: '김',              defaultPos: 0.48, vType: 'Neutral', defaultValue: '표준',        tags: ['#자연스러운'], desc: '코 밑에서 윗입술까지 인중 길이가 표준입니다.', breakdown: [{ label: 'Neutral', pct: 55 }, { label: 'Soft', pct: 25 }, { label: 'Hard', pct: 20 }] },
  { id: 'mouthwidth', num:  9, title: '입 폭',            l: '작음',       r: '큼',              defaultPos: 0.46, vType: 'Neutral', defaultValue: '표준',        tags: ['#균형'], desc: '입의 가로 폭이 표준 범위입니다.', breakdown: [{ label: 'Neutral', pct: 52 }, { label: 'Soft', pct: 26 }, { label: 'Hard', pct: 22 }] },
  { id: 'chinlen',    num: 10, title: '턱 길이',          l: '짧음',       r: '김',              defaultPos: 0.66, vType: 'Hard',    defaultValue: '긴 편',       tags: ['#강한', '#또렷한', '#입체적'], desc: '턱 길이가 긴 편으로 골격의 존재감이 드러나는 입체적인 인상을 줍니다.', breakdown: [{ label: 'Hard', pct: 46 }, { label: 'Neutral', pct: 32 }, { label: 'Soft', pct: 22 }] },
];

export const MONO = "'JetBrains Mono', ui-monospace, monospace";

// 3×3 image type map
export const IMAP = [
  [
    { en: 'CUTE',     ko: '귀여운',   kw: ['사랑스러운', '귀여운', '순진한'],   desc: '사랑스럽고 순수한 인상 — 밝고 생기있는 에너지가 느껴지는 이미지' },
    { en: 'PURE',     ko: '청초한',   kw: ['맑은', '청초한', '청순한'],         desc: '맑고 청순한 인상 — 깨끗하고 투명한 분위기를 주는 이미지' },
    { en: 'FRESH',    ko: '프레시한', kw: ['산뜻한', '시원한', '깨끗한'],       desc: '시원하고 산뜻한 인상 — 깨끗하고 경쾌한 느낌을 주는 이미지' },
  ],
  [
    { en: 'CASUAL',   ko: '캐주얼',   kw: ['발랄한', '활동적인', '생기있는'],   desc: '발랄하고 친근한 인상 — 자연스럽고 활동적인 느낌의 이미지' },
    { en: 'NATURAL',  ko: '내추럴',   kw: ['수수한', '자연스러운', '단아한'],   desc: '수수하고 자연스러운 인상 — 편안하고 단아한 분위기를 주는 이미지' },
    { en: 'CHIC',     ko: '시크한',   kw: ['샤프한', '시크한', '세련된'],       desc: '시크하고 세련된 인상 — 완성도 높고 스타일리시하게 느껴지는 이미지' },
  ],
  [
    { en: 'FEMININE', ko: '페미닌',   kw: ['화려한', '여성스러운', '부드러운'], desc: '화려하고 여성스러운 인상 — 우아하고 성숙한 아름다움이 있는 이미지' },
    { en: 'CLASSIC',  ko: '클래식',   kw: ['고상한', '우아한', '정제된'],       desc: '고상하고 우아한 인상 — 정제되고 품위 있는 분위기를 주는 이미지' },
    { en: 'MODERN',   ko: '모던',     kw: ['지적인', '도회적인', '현대적인'],   desc: '지적이고 도회적인 인상 — 세련되고 현대적인 감각이 돋보이는 이미지' },
  ],
];
// Row 0 = Soft, Row 1 = Natural, Row 2 = Hard
// Col 0 = Warm, Col 1 = Neutral, Col 2 = Cool

export function computeScores(posMap: Record<string, number>) {
  const formScore = Math.round(FORM.reduce((s, it) => s + (posMap[it.id] ?? it.defaultPos), 0) / FORM.length * 100);
  const propScore = Math.round(PROP.reduce((s, it) => s + (posMap[it.id] ?? it.defaultPos), 0) / PROP.length * 100);
  return { formScore, propScore };
}

/**
 * 축 판정 — 항목별 밴드를 세서 가장 많은 쪽을 고른다 (다수결).
 *
 * 7.14 알고리즘 문서 Layer 1 이 정한 방식이다:
 *   "축1 다수결(W/N/C) + 축2 다수결(S/N/H) → 교차 좌표 → 9개 타입 중 1개 확정"
 *
 * 예전에는 이미지타입 칸을 computeScores() 의 '평균' 으로 골라서, 화면 라벨(다수결)과
 * 칸(평균)이 어긋날 수 있었다 — Warm 이라고 써 놓고 NATURAL 칸에 찍히는 식.
 * 판정은 이 함수 하나로만 한다. 평균(computeScores)은 참고 점수 표시용으로만 남는다.
 *
 * @returns 0 = Warm/Soft · 1 = Neutral · 2 = Cool/Hard
 */
export function dominantIdx(items: MItem[], posMap: Record<string, number>): number | null {
  const tally = [0, 0, 0];
  let voted = 0;
  items.forEach(it => {
    // 값이 없는 항목은 표를 던지지 않는다.
    // posMap 에는 (1) 분석 모듈이 등급을 준 항목 (2) 디자이너가 직접 조정한 항목만 들어온다.
    // 예전에는 시안 기본값(defaultPos)으로 메꿔서, 재지도 않은 눈썹 방향·눈 앞머리·코 높이가
    // 전부 Cool 쪽 표를 던졌다 — 촬영을 안 해도 CHIC 이 나오던 원인.
    const pos = posMap[it.id];
    if (pos == null) return;
    tally[pos < 0.33 ? 0 : pos < 0.67 ? 1 : 2] += 1;
    voted += 1;
  });
  if (voted === 0) return null;          // 판정할 근거가 하나도 없다 = 미측정
  const max = Math.max(...tally);
  // 동점이면 가운데(Neutral)로 둔다 — 한쪽으로 단정할 근거가 없다.
  const winners = tally.map((v, i) => (v === max ? i : -1)).filter(i => i >= 0);
  return winners.length === 1 ? winners[0] : 1;
}

/** 위 판정을 사람이 읽는 이름으로. 축 이름은 형태축(FORM)이냐 비율축이냐로 갈린다. */
export function dominantOf(items: MItem[], posMap: Record<string, number>): string {
  const axis = items === FORM ? ['Warm', 'Neutral', 'Cool'] : ['Soft', 'Neutral', 'Hard'];
  const idx = dominantIdx(items, posMap);
  return idx == null ? '미측정' : axis[idx];
}

// bandIdx(평균 점수 → 밴드) 는 지웠다. 타입 판정은 dominantIdx(다수결) 하나로만 한다.
// 판정 경로가 둘이면 화면 라벨과 칸이 갈라지는 문제가 다시 생긴다.
