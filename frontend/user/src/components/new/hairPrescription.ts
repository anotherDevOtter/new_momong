/**
 * Layer 5 — 헤어 처방 (docs/8.10헤어맵핑.html)
 *
 * 이미지 좌표(모양축 W·N·C × 무게축 S·N·H)를 헤어 처방으로 옮기는 규칙.
 * 문서의 데이터를 손으로 옮겨 적지 않고 그대로 뽑아왔다 — 문구를 바꾸지 말 것.
 *
 *   모양축(W/N/C) 이 정하는 것 : 실루엣 · 라인 · 앞머리 질감
 *   무게축(S/N/H) 이 정하는 것 : 길이 · 무게감 · 텍스쳐 · 앞머리 유무
 *   두 축이 함께 정하는 것      : 컬 · 앞머리
 *
 * ⚠ 9칸 중 코너 4칸(CUTE·FRESH·FEMININE·MODERN)만 헤어 시트 사진으로 확정됐다.
 *   나머지 5칸은 문서가 스스로 "규칙 생성 · 사진 미검증" 이라고 표시해뒀다 → verified 플래그.
 */

type Line = [string, string];   // [처방, 부연]  부연이 없으면 ''

/** 모양축 — 둥근(W) ↔ 각진(C) */
const SHAPE_AXIS: Record<string, Record<string, Line>> = {
  W: {"실루엣":["옆으로 볼륨이 사는 모양","머리가 옆으로 부드럽게 퍼져요"],"컬":["둥글게 말리는 웨이브",""],"라인":["둥근 라인","머리 끝을 각지지 않게 둥글려요"],"뱅질감":["도톰하고 부드러운 앞머리",""]},
  N: {"실루엣":["자연스러운 모양","옆도 위아래도 튀지 않아요"],"컬":["살짝 흐르는 웨이브",""],"라인":["자연스러운 라인","각도 곡선도 세게 주지 않아요"],"뱅질감":["자연스러운 앞머리",""]},
  C: {"실루엣":["위아래로 길어 보이는 모양","옆을 눌러 세로로 길어 보이게 해요"],"컬":["컬 없는 생머리",""],"라인":["각진 라인","머리 끝 라인을 뚜렷하게 남겨요"],"뱅질감":["가볍고 시원한 앞머리",""]},
};

/** 무게축 — 가벼운(S) ↔ 무거운(H) */
const WEIGHT_AXIS: Record<string, Record<string, Line>> = {
  S: {"길이":["짧은 머리 ~ 단발",""],"무게감":["끝이 가벼워요","끝을 가볍게 쳐서 무게를 빼요"],"텍스쳐":["보송하고 살아있는 결",""],"뱅유무":["앞머리 있음",""]},
  N: {"길이":["단발 정도",""],"무게감":["적당한 무게","끝만 살짝 정리해요"],"텍스쳐":["과하지 않은 자연스러운 결",""],"뱅유무":["앞머리 있어도 없어도 OK","앞머리가 인상을 크게 바꾸지 않아요"]},
  H: {"길이":["단발 ~ 긴 머리",""],"무게감":["끝이 묵직해요","끝을 남겨 무게를 실어요"],"텍스쳐":["찰랑이고 촉촉한 결",""],"뱅유무":["이마를 드러내요",""]},
};

/** 컬 — 두 축이 함께 정한다 (모양이 굵기, 무게가 움직임) */
const CURL: Record<string, Line> = {
  'W-S': ["둥글게 말리는 웨이브","짧은 머리에 볼륨 웨이브"],
  'W-N': ["부드러운 웨이브","느슨하게 흐르는 웨이브"],
  'W-H': ["둥글게 말리는 웨이브","긴 기장을 타고 흐르는 웨이브"],
  'N-S': ["가볍게 움직이는 컬","뿌리를 살린 짧은 컬"],
  'N-N': ["살짝 흐르는 웨이브","과하지 않은 자연 컬"],
  'N-H': ["흐르는 웨이브","끝쪽만 살짝 말아요"],
  'C-S': ["자연스럽게 흐트러진 웨이브","생머리에 자연스러운 움직임"],
  'C-N': ["생머리에 가까운 살짝 웨이브","컬보다 결을 봐요"],
  'C-H': ["컬 없는 생머리","컬을 넣지 않아요"],
};

/** 앞머리 — 유무는 무게축, 질감은 모양축 */
const BANG: Record<string, Line> = {
  'W-S': ["앞머리 있음","도톰한 둥근 앞머리 · 풀뱅"],
  'W-N': ["앞머리 있어도 없어도 OK","부드러운 질감 · 얼굴선을 감싸도 좋아요"],
  'W-H': ["이마를 드러내요","옆으로 넘긴 앞머리 · 잔머리로 부드럽게"],
  'N-S': ["앞머리 있음","자연스러운 질감의 앞머리"],
  'N-N': ["앞머리 있어도 없어도 OK","있고 없고가 인상을 크게 안 바꿔요"],
  'N-H': ["이마를 드러내요","자연스러운 가르마 · 잔머리 OK"],
  'C-S': ["앞머리 있음","가볍고 시원한 앞머리 (시스루뱅·처피뱅)"],
  'C-N': ["가벼운 앞머리 또는 옆 앞머리","가벼운 질감으로만"],
  'C-H': ["이마를 드러내요","가운데·옆 가르마로 깔끔하게 넘겨요"],
};

/** 9타입 — [모양축, 무게축, 이름, 이미지 문구, 코너(사진 검증) 여부] */
const TYPES: Record<string, [string, string, string, string, number]> = {
  CUTE: ["W","S","귀여운","귀여운 · 어려보이는",1],
  FRESH: ["C","S","산뜻한","산뜻한 · 시원한",1],
  PURE: ["N","S","청초한","청초한 · 청순한",0],
  CASUAL: ["W","N","발랄한","발랄한 · 활동적인",0],
  NATURAL: ["N","N","자연스러운","자연스러운 · 담백한",0],
  CHIC: ["C","N","세련된","세련된 · 시크한",0],
  FEMININE: ["W","H","여성스러운","부드러운 · 여성스러운",1],
  CLASSIC: ["N","H","우아한","우아한 · 정제된",0],
  MODERN: ["C","H","도회적인","현대적인 · 지적인",1],
};


export type PrescriptionRow = {
  /** 항목 이름 — 앞머리 · 길이 · 실루엣 · 컬 · 라인 · 무게감 · 텍스쳐 */
  label: string;
  /** 처방 */
  value: string;
  /** 부연 설명. 없을 수 있다 */
  detail: string;
  /** 이 처방을 정한 축 — 상담에서 "왜 이렇게 나왔나" 를 말할 때 쓴다 */
  source: '모양' | '무게' | '함께';
};

export type Prescription = {
  type: string;            // CUTE · CHIC …
  typeName: string;        // 문서의 타입 이름 (우리 화면 이름과 다를 수 있다)
  impression: string;      // 이미지 문구
  shape: string;           // W | N | C
  weight: string;          // S | N | H
  /** 헤어 시트 사진으로 확정된 처방인가. false = 축 규칙으로 생성, 현장 검증 필요 */
  verified: boolean;
  rows: PrescriptionRow[];
};

const SHAPE_KEYS = ['W', 'N', 'C'];    // 0=Warm 1=Neutral 2=Cool
const WEIGHT_KEYS = ['S', 'N', 'H'];   // 0=Soft 1=Neutral 2=Hard

/**
 * 이미지맵 좌표 → 헤어 처방.
 * colIdx / rowIdx 는 dominantIdx() 가 낸 값을 그대로 넣는다 (미측정이면 null → 처방 없음).
 */
export function hairPrescription(
  colIdx: number | null | undefined,
  rowIdx: number | null | undefined,
): Prescription | null {
  if (colIdx == null || rowIdx == null) return null;
  const shape = SHAPE_KEYS[colIdx];
  const weight = WEIGHT_KEYS[rowIdx];
  if (!shape || !weight) return null;

  const entry = Object.entries(TYPES).find(([, v]) => v[0] === shape && v[1] === weight);
  if (!entry) return null;
  const [type, [, , typeName, impression, corner]] = entry;

  const key = `${shape}-${weight}`;
  const W = SHAPE_AXIS[shape];
  const S = WEIGHT_AXIS[weight];

  const row = (label: string, line: Line, source: PrescriptionRow['source']): PrescriptionRow => ({
    label, value: line[0], detail: line[1] ?? '', source,
  });

  return {
    type, typeName, impression, shape, weight,
    verified: corner === 1,
    // 순서는 문서의 처방 카드와 같다
    rows: [
      row('앞머리', BANG[key],   '함께'),
      row('길이',   S['길이'],   '무게'),
      row('실루엣', W['실루엣'], '모양'),
      row('컬',     CURL[key],   '함께'),
      row('라인',   W['라인'],   '모양'),
      row('무게감', S['무게감'], '무게'),
      row('텍스쳐', S['텍스쳐'], '무게'),
    ],
  };
}


// ─────────────────────────────────────────────────────────────────────────
// 처방 문구 → 우리 화면 옵션 id
//
// 처방은 "단발 ~ 긴 머리" 같은 범위로 나온다. 범위에 드는 옵션 전부에 추천을 붙인다
// (하나로 좁히려면 문서에 없는 규칙을 지어내야 한다).
//
// 원칙 — 문서가 이름을 대놓고 말한 것만 잇는다.
//   C컬·S컬·CS컬 은 문서에 아예 나오지 않아 추천하지 않는다. 문서의 컬 축은
//   '웨이브 ↔ 생머리' 두 방향뿐이다.
//   가르마·컬러도 문서 밖이라 지금처럼 디자이너가 고른다.
// 각 줄 옆 주석이 근거가 된 처방 문구다.
// ─────────────────────────────────────────────────────────────────────────

/** 길이 — 무게축(S/N/H)만으로 정해진다 */
const LENGTH_BY_WEIGHT: Record<string, string[]> = {
  S: ['short', 'bob'],            // "짧은 머리 ~ 단발"
  N: ['bob'],                     // "단발 정도"
  H: ['bob', 'medium', 'long'],   // "단발 ~ 긴 머리"
};

/** 앞머리 — 9칸 교차 규칙에서 이름이 나온 것만 */
const BANGS_BY_CELL: Record<string, string[]> = {
  'W-S': ['full'],                            // "도톰한 둥근 앞머리 · 풀뱅"
  'W-N': [],                                  // "앞머리 있어도 없어도 OK" — 추천하지 않는다
  'W-H': ['side', 'wispy'],                   // "옆으로 넘긴 앞머리 · 잔머리로 부드럽게"
  'N-S': [],                                  // "자연스러운 질감의 앞머리" — 특정 옵션을 지목하지 않는다
  'N-N': [],                                  // "있고 없고가 인상을 크게 안 바꿔요"
  'N-H': ['wispy'],                           // "자연스러운 가르마 · 잔머리 OK"
  'C-S': ['seethrough', 'choppy'],            // "가볍고 시원한 앞머리 (시스루뱅·처피뱅)"
  'C-N': ['seethrough', 'choppy', 'side'],    // "가벼운 앞머리 또는 옆 앞머리" (가벼운 = 위 C-S 정의)
  'C-H': [],                                  // "가운데·옆 가르마로 깔끔하게 넘겨요" — 앞머리를 지목하지 않는다
};

/** 컬 — 문서가 말하는 건 '웨이브' 와 '생머리' 뿐이다 */
const CURL_BY_CELL: Record<string, string[]> = {
  'W-S': ['wave'],                 // "둥글게 말리는 웨이브"
  'W-N': ['wave'],                 // "부드러운 웨이브"
  'W-H': ['wave'],                 // "둥글게 말리는 웨이브"
  'N-S': ['wave'],                 // "가볍게 움직이는 컬"
  'N-N': ['wave'],                 // "살짝 흐르는 웨이브"
  'N-H': ['wave'],                 // "흐르는 웨이브"
  'C-S': ['wave'],                 // "자연스럽게 흐트러진 웨이브"
  'C-N': ['straight', 'wave'],     // "생머리에 가까운 살짝 웨이브"
  'C-H': ['straight'],             // "컬 없는 생머리"
};

export type RecommendedOptions = {
  /** 축별 추천 옵션 id 목록. 빈 배열이면 그 축은 추천하지 않는다 */
  bangs: string[];
  length: string[];
  curl: string[];
  /** 헤어 시트 사진으로 확정된 칸인가. false 면 화면에 그 사실을 알려야 한다 */
  verified: boolean;
};

/** 이미지맵 좌표 → 추천할 옵션들. 미측정이면 null */
export function recommendedOptions(
  colIdx: number | null | undefined,
  rowIdx: number | null | undefined,
): RecommendedOptions | null {
  const rx = hairPrescription(colIdx, rowIdx);
  if (!rx) return null;
  const key = `${rx.shape}-${rx.weight}`;
  return {
    bangs: BANGS_BY_CELL[key] ?? [],
    length: LENGTH_BY_WEIGHT[rx.weight] ?? [],
    curl: CURL_BY_CELL[key] ?? [],
    verified: rx.verified,
  };
}


// ─────────────────────────────────────────────────────────────────────────
// 헤어디자인 제안 화면(components/3way/HairDesignProposal)용 사전.
//
// 같은 처방인데 이 화면은 옵션 이름이 다르다 — 길이를 '숏/단발' 이 아니라
// '턱 위 / 턱~쇄골 / 쇄골 / 쇄골 아래' 로, 앞머리에 '없음' 이 따로 있다.
// 그래서 축은 같고 id 만 다른 표를 하나 더 둔다.
// ─────────────────────────────────────────────────────────────────────────

/** 길이 — 무게축 */
const HD_LENGTH_BY_WEIGHT: Record<string, string[]> = {
  S: ['above-chin', 'chin-collarbone'],                  // "짧은 머리 ~ 단발"
  N: ['chin-collarbone'],                                // "단발 정도"
  H: ['chin-collarbone', 'collarbone', 'below-collarbone'], // "단발 ~ 긴 머리"
};

/** 앞머리 — 이 화면에는 '없음' 이 있어서 "이마를 드러내요" 를 그대로 옮길 수 있다 */
const HD_BANGS_BY_CELL: Record<string, string[]> = {
  'W-S': ['full'],                                 // "도톰한 둥근 앞머리 · 풀뱅"
  'W-N': [],                                       // "있어도 없어도 OK"
  'W-H': ['none', 'side'],                         // "이마를 드러내요 · 옆으로 넘긴 앞머리"
  'N-S': [],                                       // 특정 옵션을 지목하지 않는다
  'N-N': [],                                       // "있고 없고가 인상을 크게 안 바꿔요"
  'N-H': ['none'],                                 // "이마를 드러내요"
  'C-S': ['see-through', 'choppy'],                // "가볍고 시원한 앞머리 (시스루뱅·처피뱅)"
  'C-N': ['see-through', 'choppy', 'side'],        // "가벼운 앞머리 또는 옆 앞머리"
  'C-H': ['none'],                                 // "이마를 드러내요"
};

/** 컬 — 문서가 말하는 건 웨이브와 생머리뿐 (C컬·S컬·CS컬은 문서에 없다) */
const HD_CURL_BY_CELL: Record<string, string[]> = {
  'W-S': ['wave'], 'W-N': ['wave'], 'W-H': ['wave'],
  'N-S': ['wave'], 'N-N': ['wave'], 'N-H': ['wave'],
  'C-S': ['wave'], 'C-N': ['straight', 'wave'], 'C-H': ['straight'],
};

export type DesignScreenRecommendation = {
  length: string[];
  bangs: string[];
  curl: string[];
  /** 컬러는 문서에 없다 — 추천하지 않는다 */
  color: string[];
  /** 상단 '디자인 방향 키워드' 에 쓸 문구 */
  keyword: string;
  verified: boolean;
};

/** 헤어디자인 제안 화면용 추천. 미측정이면 null */
export function designScreenRecommendation(
  colIdx: number | null | undefined,
  rowIdx: number | null | undefined,
): DesignScreenRecommendation | null {
  const rx = hairPrescription(colIdx, rowIdx);
  if (!rx) return null;
  const key = `${rx.shape}-${rx.weight}`;
  return {
    length: HD_LENGTH_BY_WEIGHT[rx.weight] ?? [],
    bangs: HD_BANGS_BY_CELL[key] ?? [],
    curl: HD_CURL_BY_CELL[key] ?? [],
    color: [],
    keyword: rx.impression,
    verified: rx.verified,
  };
}

/**
 * 추천 전략 — 고유미에서 추구미까지의 거리로 정한다.
 * 헤어컨설팅 이미지맵이 쓰는 규칙과 같다 (같은 칸이거나 상하좌우 한 칸이면 '강조').
 */
export function strategyOf(
  colIdx: number | null | undefined,
  rowIdx: number | null | undefined,
  targetEn: string | null | undefined,
): '이미지 강조' | '이미지 중화 · 커버' | null {
  if (colIdx == null || rowIdx == null || !targetEn) return null;
  const shape = SHAPE_KEYS[colIdx];
  const weight = WEIGHT_KEYS[rowIdx];
  const t = TYPES[targetEn];
  if (!shape || !weight || !t) return null;
  const dc = Math.abs(SHAPE_KEYS.indexOf(t[0]) - colIdx);
  const dr = Math.abs(WEIGHT_KEYS.indexOf(t[1]) - rowIdx);
  if (dr + dc <= 1) return '이미지 강조';
  return '이미지 중화 · 커버';
}
