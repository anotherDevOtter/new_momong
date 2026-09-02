import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandHeader } from './BrandHeader';
import { FORM, PROP, MONO, IMAP, dominantOf, dominantIdx } from './faceAnalysisData';
import { recommendedOptions } from './hairPrescription';
// 스타일 제안 사진은 옵션 id 로 찾는다 — /new/style/<축>-<옵션id>.png
// (시안이 준 A4 시트 4장에서 옵션별로 잘라낸 것. 시트 통짜를 쓰면 카드마다 같은 그림이 나온다.)
const stylePhoto = (axis: string, id: string) => `/new/style/${axis}-${id}.png`;

const imgHairMap = '/new/hair-map.png';
const imgHairMap37 = '/new/hair-map-37.png';
const imgDamage1 = '/new/damage-1.png';
const imgDamage2 = '/new/damage-2.png';
const imgDamage3 = '/new/damage-3.png';
const imgDamage4 = '/new/damage-4.png';
const imgDamage5 = '/new/damage-5.png';
const imgDamage6 = '/new/damage-6.png';
/** 이 화면에서 디자이너가 고른 값 — 저장용으로 상위에 올린다. */
export interface HairConsultingData {
  /** 현재 이미지타입 (자동 판정) */
  currentType: { en: string; ko: string } | null;
  /** 목표로 고른 이미지타입 (3×3 맵에서 클릭) */
  targetType: { en: string; ko: string } | null;
  /** 스타일 제안 5개 축 */
  style: {
    bangs: string | null;
    parting: string | null;
    length: string | null;
    curl: string | null;
    color: string | null;
  };
  /** 모질 4개 축 (damage · thickness · density · curl) */
  condition: Record<string, string | null>;
}

interface Props {
  posMap: Record<string, number>;
  onNext: () => void;
  onBack?: () => void;
  /** 선택이 바뀔 때마다 상위로 보고 — 저장은 page.tsx 가 한다 */
  onChange?: (data: HairConsultingData) => void;
}

// ── Option data ───────────────────────────────────────────────────────

export const BANGS_OPTIONS = [
  { id: 'full',       label: '풀뱅',    tags: ['시크한', '귀여운'] },
  { id: 'choppy',     label: '처피뱅',  tags: ['유니크한', '귀여운'] },
  { id: 'seethrough', label: '시스루뱅', tags: ['여성스러운', '내추럴한'] },
  { id: 'side',       label: '사이드뱅', tags: ['여성스러운', '화려한'] },
  { id: 'wispy',      label: '잔머리',  tags: ['발랄한', '세련된'] },
  { id: 'stick',      label: '스틱뱅',  tags: ['시크한', '유니크한'] },
];

export const PARTING_OPTIONS = [
  { id: '55', label: '5:5 가르마', tags: ['내추럴한', '깔끔한'] },
  { id: '64', label: '6:4 가르마', tags: ['여성스러운', '깔끔한'] },
  { id: '73', label: '7:3 가르마', tags: ['화려한', '섹시한'] },
];

export const LENGTH_OPTIONS = [
  { id: 'short',  label: '숏',    tags: ['귀여운', '세련된', '보이쉬'] },
  { id: 'bob',    label: '단발',  tags: ['귀여운', '깔끔한', '우아한'] },
  { id: 'medium', label: '미디움', tags: ['내추럴한', '지적인', '차분한'] },
  { id: 'long',   label: '롱',    tags: ['여성스러운', '화려한'] },
];

export const CURL_OPTIONS = [
  { id: 'straight', label: '스트레이트', tags: ['깔끔한', '세련된', '청순한'] },
  { id: 'wave',     label: '웨이브',    tags: ['여성스러운', '화려한', '러블리한'] },
  { id: 'ccurl',    label: 'C컬',       tags: ['차분한', '깔끔한'] },
  { id: 'scurl',    label: 'S컬',       tags: ['여성스러운', '내추럴한'] },
  { id: 'cscurl',   label: 'CS컬',      tags: ['여성스러운', '세련된'] },
];

export const COLOR_OPTIONS = [
  {
    id: 'tonedown',
    code: '#6B5B4E',
    label: '톤다운',
    tags: ['차분한', '고급스러운', '안정감'],
    desc: '차분하고 고급스러운 분위기로 피부 톤을 안정감 있게 연출',
  },
  {
    id: 'toneup',
    code: '#A1866C',
    label: '톤업',
    tags: ['화사한', '생기있는', '밝은인상'],
    desc: '얼굴빛을 화사하게 밝혀주는 컬러로 생기 있고 밝은 인상 연출',
  },
  {
    id: 'roots',
    code: '#5A4A40',
    label: '뿌리',
    tags: ['자연스러운', '연결감', '밸런스'],
    desc: '자연스러운 뿌리 연결로 전체적인 컬러 밸런스 유지',
  },
  {
    id: 'bleach',
    code: '#D0B896',
    label: '탈색',
    tags: ['밝고 투명한', '세련된', '탈색 베이스'],
    desc: '밝고 투명한 컬러 표현을 위한 탈색 베이스',
  },
  {
    id: 'keep',
    code: '#2E2420',
    label: '현재 상태 유지',
    tags: ['자연스러운', '건강한', '유지 관리'],
    desc: '지금의 컬러를 건강하게 유지하며 윤기와 톤 케어',
  },
];

// 리포트가 저장된 옵션 id(full · 55 · short …)를 사람이 읽는 이름으로 되돌릴 때 쓴다.
// 화면과 리포트가 같은 표를 보게 해서 문구가 갈라지지 않도록 한다.
export const STYLE_AXES = {
  bangs:   { title: '앞머리', options: BANGS_OPTIONS },
  parting: { title: '가르마', options: PARTING_OPTIONS },
  length:  { title: '길이',   options: LENGTH_OPTIONS },
  curl:    { title: '컬',     options: CURL_OPTIONS },
  color:   { title: '컬러',   options: COLOR_OPTIONS },
} as const;

export type StyleAxis = keyof typeof STYLE_AXES;

/** 옵션 id → { 이름, 태그 }. 없는 id 면 null. */
export function styleOptionOf(axis: StyleAxis, id: string | null | undefined) {
  if (!id) return null;
  const found = STYLE_AXES[axis].options.find((o) => o.id === id);
  return found ? { label: found.label, tags: [...found.tags] } : null;
}

// ── Hair Condition Data ───────────────────────────────────────────────

export const DAMAGE_LEVELS = [
  { id: '1', label: '건강모',   pct: '0 ~ 20%',   desc: '큐티클이 촘촘하고\n탄력이 있는 건강한 모발',         cuticleFill: 0.1 },
  { id: '2', label: '약손상',   pct: '20 ~ 40%',  desc: '약간의 큐티클 손상이 있으며\n컬러/열 시술 이력이 있는 모발', cuticleFill: 0.3 },
  { id: '3', label: '중손상',   pct: '40 ~ 60%',  desc: '큐티클 일부 손상과\n거칠어짐이 느껴지는 모발',        cuticleFill: 0.5 },
  { id: '4', label: '강손상',   pct: '60 ~ 80%',  desc: '큐티클 손상이 심하고\n푸석함과 끊어짐이 있는 모발',    cuticleFill: 0.68 },
  { id: '5', label: '극손상',   pct: '80 ~ 100%', desc: '큐티클이 대부분 손실되고\n탄력 저하가 심한 모발',       cuticleFill: 0.85 },
  { id: '6', label: '초극손상', pct: '100% 이상', desc: '심한 손상으로 끊어짐이 잦고\n매우 건조한 모발',         cuticleFill: 1.0 },
];

export const DAMAGE_DETAIL: Record<string, {
  cuticle: number; elastic: number; moisture: number; shine: number; breakage: number;
  cuticleLabel: string; elasticLabel: string; moistureLabel: string; shineLabel: string; breakageLabel: string;
  guide: string;
}> = {
  '1': { cuticle:1, elastic:5, moisture:5, shine:5, breakage:1, cuticleLabel:'닫힘',    elasticLabel:'우수',      moistureLabel:'풍부',   shineLabel:'우수',   breakageLabel:'없음',    guide:'모발 상태가 매우 건강합니다. 어떤 화학 시술도 부담 없이 진행 가능하며, 현재 관리 루틴을 유지하세요.' },
  '2': { cuticle:2, elastic:3, moisture:3, shine:3, breakage:2, cuticleLabel:'약간 열림', elasticLabel:'보통',     moistureLabel:'보통',   shineLabel:'보통',   breakageLabel:'약간 있음', guide:'열·화학 시술 시 손상 가능성이 있으므로, 보습 및 단백질 케어를 병행하고 시술 간격을 조절하는 것이 좋습니다.' },
  '3': { cuticle:3, elastic:2, moisture:2, shine:2, breakage:3, cuticleLabel:'부분 열림', elasticLabel:'저하',     moistureLabel:'건조',   shineLabel:'저하',   breakageLabel:'보통',    guide:'추가 화학 시술 전 집중 트리트먼트가 필요합니다. 열 시술 온도를 낮추고 단백질 앰플 처치를 권장합니다.' },
  '4': { cuticle:4, elastic:2, moisture:2, shine:1, breakage:4, cuticleLabel:'많이 열림', elasticLabel:'많이 저하', moistureLabel:'많이 건조', shineLabel:'거의 없음', breakageLabel:'많음', guide:'화학 시술은 최소화하고 집중 복구 케어에 집중하세요. 스팀 트리트먼트와 케라틴 처치를 우선 권장합니다.' },
  '5': { cuticle:5, elastic:1, moisture:1, shine:1, breakage:4, cuticleLabel:'심각',    elasticLabel:'없음',      moistureLabel:'극건조', shineLabel:'없음',   breakageLabel:'심함',    guide:'화학 시술은 피하고 단계적인 복구 프로그램이 필요합니다. 전문 트리트먼트 집중 시술을 권장합니다.' },
  '6': { cuticle:5, elastic:1, moisture:1, shine:1, breakage:5, cuticleLabel:'완전 손상', elasticLabel:'없음',     moistureLabel:'없음',   shineLabel:'없음',   breakageLabel:'극심',    guide:'즉각적인 복구 처치가 필요합니다. 화학 시술은 절대 금지이며 커트를 통한 손상 제거가 가장 효과적입니다.' },
};

export const CONDITION_SECTIONS = [
  {
    key: 'thickness',
    levels: [
      { id: 'fine',   label: '가는 모발', desc: '가볍고 볼륨 처지기 쉬움' },
      { id: 'medium', label: '중간',      desc: '일반적인 굵기' },
      { id: 'coarse', label: '굵은 모발', desc: '묵직하고 스타일 잡기 힘듦' },
    ],
    note: '모발 굵기는 볼륨감, 펌 로드 선택, 컷트 기법에 영향을 줍니다. 가는 모발은 레이어드, 굵은 모발은 텍스처 기법이 효과적입니다.',
  },
  {
    key: 'density',
    levels: [
      { id: 'thin',   label: '적은 숱',  desc: '숱이 적어 볼륨 부족' },
      { id: 'normal', label: '보통',     desc: '일반적인 숱 밀도' },
      { id: 'thick',  label: '많은 숱',  desc: '숱이 많아 무거운 느낌' },
    ],
    note: '숱의 양은 헤어 실루엣과 무게감을 결정합니다. 숱이 많으면 슬라이딩·틴닝, 숱이 적으면 볼륨 펌이나 레이어드 컷트를 권장합니다.',
  },
  {
    key: 'curl',
    levels: [
      { id: 'straight',   label: '직모',      desc: '완전한 직모, 웨이브 없음' },
      { id: 'frizzy',     label: '부시시',    desc: '습도에 의해 부풀고 퍼지는 모발' },
      { id: 'form',       label: '형태 곱슬', desc: 'S·C자 웨이브가 형태로 나타남' },
      { id: 'resistant',  label: '저항성 곱슬', desc: '매직·교정에도 복원되는 강한 곱슬' },
    ],
    note: '곱슬 유형에 따라 시술 방법이 달라집니다. 부시시는 수분 케어, 형태 곱슬은 리본 펌, 저항성 곱슬은 매직·클리닉을 권장합니다.',
  },
];

/**
 * 모질 4축(damage · thickness · density · curl) 에서 고른 값을 찾는다.
 * 리포트 5페이지와 이 화면이 같은 표를 보게 하려고 여기 둔다 — styleOptionOf 과 짝이다.
 */
export function conditionOptionOf(axis: string, id: string | null | undefined) {
  if (!id) return null;
  if (axis === 'damage') {
    const level = DAMAGE_LEVELS.find((l) => l.id === id);
    return level ? { label: level.label, note: level.pct } : null;
  }
  const section = CONDITION_SECTIONS.find((sec) => sec.key === axis);
  const level = section?.levels.find((l) => l.id === id);
  return level ? { label: level.label, note: level.desc } : null;
}

// 리포트에 쓰는 축 이름. 화면의 탭 이름과 같다.
export const CONDITION_AXES: { key: string; title: string }[] = [
  { key: 'damage',    title: '손상도' },
  { key: 'thickness', title: '굵기'   },
  { key: 'density',   title: '숱'     },
  { key: 'curl',      title: '곱슬'   },
];

// ── Main component ────────────────────────────────────────────────────

export function HairConsulting({ posMap, onNext, onBack, onChange }: Props) {
  const formDominant = dominantOf(FORM, posMap);
  const propDominant = dominantOf(PROP, posMap);

  // 칸도 라벨과 같은 다수결에서 나온다 (7.14 Layer 1). 조준점은 (row+0.5)·(col+0.5) 로 칸 중앙에 찍히므로
  // 점·칸·라벨 셋이 항상 같은 판정을 가리킨다.
  const colIdx = dominantIdx(FORM, posMap);   // null = 형태축을 판정할 근거가 없다
  const rowIdx = dominantIdx(PROP, posMap);
  const measured = colIdx != null && rowIdx != null;
  // 미측정일 때는 아무것도 그리지 않는다. 아래 숫자는 계산이 터지지 않게 두는 자리표시일 뿐이다.
  const col = colIdx ?? 1;
  const row = rowIdx ?? 1;
  const imageType = measured ? IMAP[row][col] : null;

  // 8.10 Layer 5 헤어 처방에서 나온 추천 옵션. 얼굴 판정이 없으면 추천도 없다.
  const rec = recommendedOptions(colIdx, rowIdx);
  // 헤어 시트 사진으로 확정된 칸(코너 4칸)만 추천을 띄운다.
  // 문서가 "규칙 생성 · 사진 미검증" 이라고 표시한 5칸은 아무 표시도 하지 않는다.
  const isRecommended = (axis: 'bangs' | 'length' | 'curl', id: string) =>
    !!rec && rec.verified && rec[axis].includes(id);

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const targetRow = selectedCell?.[0];
  const targetCol = selectedCell?.[1];
  const targetType = (targetRow != null && targetCol != null) ? IMAP[targetRow][targetCol] : null;

  const getApproach = (tRow: number, tCol: number): 'accentuate' | 'cover' => {
    const dr = Math.abs(tRow - row);
    const dc = Math.abs(tCol - col);
    if (dr === 0 && dc === 0) return 'accentuate';
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) return 'accentuate';
    return 'cover';
  };

  // 강조 활용 · 커버 중화는 고유미에서 얼마나 떨어진 칸인지로 나온다.
  // 고유미가 미측정이면 기준점이 없으므로 판단하지 않는다.
  const approach = (measured && targetRow != null && targetCol != null) ? getApproach(targetRow, targetCol) : null;

  const [showHairMap, setShowHairMap] = useState(false);
  const [activeStyle, setActiveStyle] = useState<'bangs' | 'parting' | 'length' | 'curl' | 'color'>('bangs');
  const [selectedBangs, setSelectedBangs] = useState<string | null>(null);
  const [selectedParting, setSelectedParting] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(null);
  const [selectedCurl, setSelectedCurl] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [activeCondition, setActiveCondition] = useState<'damage' | 'thickness' | 'density' | 'curl'>('damage');
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string | null>>({});

  /**
   * 컬러 추천(RECOMMENDED 뱃지).
   * 지금 근거로 쓸 수 있는 것은 모발 손상도뿐이다 — 4단계(강손상) 부터는 이 화면의 진단 문구가
   * "화학 시술은 최소화" · "화학 시술 절대 금지" 라고 이미 못박고 있어서, 그때는 '현재 상태 유지'
   * 를 권한다. 그 밖의 경우는 아직 추천 근거가 없으므로 뱃지를 띄우지 않는다.
   * (8.10 문서의 헤어 처방 엔진이 들어오면 그 결과로 바꾼다.)
   */
  const damageLevel = Number(selectedConditions['damage'] ?? 0);
  const recommendedColor = damageLevel >= 4 ? 'keep' : null;

  // 선택이 바뀔 때마다 상위로 보고한다. 이 화면은 시안에서 그대로 가져와
  // 값을 자기 안에만 들고 있었고, 그래서 컨설팅을 끝내도 DB 에 아무것도 남지 않았다.
  useEffect(() => {
    onChange?.({
      currentType: imageType ? { en: imageType.en, ko: imageType.ko } : null,
      targetType: targetType ? { en: targetType.en, ko: targetType.ko } : null,
      style: {
        bangs: selectedBangs,
        parting: selectedParting,
        length: selectedLength,
        curl: selectedCurl,
        color: selectedColor,
      },
      condition: selectedConditions,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBangs, selectedParting, selectedLength, selectedCurl, selectedColor,
      selectedConditions, selectedCell, imageType?.en]);

  const allSelected = selectedBangs && selectedParting && selectedLength && selectedCurl && selectedColor;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard Variable','Inter',-apple-system,sans-serif" }}>
      <BrandHeader />

      <div className="pt-20 pb-40 max-w-3xl mx-auto px-5">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.22em] text-[#AAAAAA] mb-1.5" style={{ fontFamily: MONO }}>HAIR CONSULTING</p>
          <div className="flex items-end justify-between">
            <h1 className="text-[1.5rem] font-light text-[#111111] tracking-tight">헤어컨설팅</h1>
            <div className="flex items-center gap-2 mb-0.5">
              {onBack && (
                <button onClick={onBack}
                  className="px-3 py-2 text-[11px] tracking-[0.04em] rounded-sm border border-[#E8E8E4] text-[#888888]"
                  style={{ background: 'transparent', cursor: 'pointer' }}>
                  ← 돌아가기
                </button>
              )}
              <button onClick={onNext}
                className="px-4 py-2.5 text-[11.5px] tracking-[0.06em] rounded-sm"
                style={{ background: '#1A1A1A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                다음 단계 →
              </button>
            </div>
          </div>
          <div className="mt-4 h-px bg-[#E8E8E4]" />
        </div>

        {/* ── Image Map / Hair Map ─────────────────────────────────── */}
        <div className="mb-12">

          {/* Toggle header */}
          <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
            <p className="text-[9px] tracking-[0.22em] text-[#AAAAAA] mb-5" style={{ fontFamily: MONO }}>IMAGE MAP</p>
            <div className="text-center mb-6">
              <h2 className="text-[27px] text-[#111111] tracking-tight" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                컨설팅 방향
              </h2>
            </div>
            <div className="flex items-center justify-center gap-0">
              {([
                { key: false, label: '이미지맵' },
                { key: true,  label: '헤어이미지맵' },
              ] as const).map(({ key, label }, idx) => {
                const isActive = showHairMap === key;
                return (
                  <button
                    key={label}
                    onClick={() => setShowHairMap(key)}
                    style={{
                      position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 22px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                  >
                    {idx > 0 && (
                      <span style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-60%)',
                        color: '#DDDDD8', fontSize: 14, pointerEvents: 'none',
                      }}>|</span>
                    )}
                    <span style={{ fontSize: 17, fontWeight: isActive ? 500 : 300, color: isActive ? '#111111' : '#C4C4C0', letterSpacing: '-0.01em', transition: 'all 0.2s' }}>
                      {label}
                    </span>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 22, right: 22, height: 1.5,
                      background: '#111111', opacity: isActive ? 1 : 0, transition: 'opacity 0.2s',
                    }} />
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
          {!showHairMap ? (
          <motion.div key="imap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <div className="flex gap-6 items-start">

            {/* Coordinate grid */}
            <div className="flex-1 min-w-0">

              {/* Top axis */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #C8C8C4)' }} />
                <p className="text-[9px] tracking-[0.28em] text-[#999997]" style={{ fontFamily: MONO }}>SOFT</p>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #C8C8C4)' }} />
              </div>

              <div className="flex items-stretch gap-2">

                {/* Left axis label */}
                <div className="flex flex-col items-center justify-center shrink-0 gap-1" style={{ width: 14 }}>
                  <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, #C8C8C4)' }} />
                  <p className="text-[8px] tracking-[0.22em] text-[#AAAAAA]"
                    style={{ fontFamily: MONO, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.28em' }}>WARM</p>
                  <div className="flex-1 w-px" style={{ background: 'linear-gradient(to top, transparent, #C8C8C4)' }} />
                </div>

                {/* Grid container — square aspect ratio */}
                <div className="relative flex-1" style={{ aspectRatio: '1', border: '1px solid #CCCCC8' }}>

                  {/* Clickable cells */}
                  {[0, 1, 2].flatMap(r => [0, 1, 2].map(c => {
                    const cell = IMAP[r][c];
                    const isCurrent = measured && r === row && c === col;
                    const isTarget = r === targetRow && c === targetCol && !(measured && targetRow === row && targetCol === col);
                    const isAcc = approach === 'accentuate';
                    return (
                      <button key={`${r}-${c}`}
                        onClick={() => setSelectedCell(prev =>
                          prev?.[0] === r && prev?.[1] === c ? null : [r, c]
                        )}
                        style={{
                          position: 'absolute',
                          left: `${c * 33.333}%`, top: `${r * 33.333}%`,
                          width: '33.334%', height: '33.334%',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'flex-start', justifyContent: 'center',
                          padding: '10px 12px',
                          border: '1px solid #E4E4E0',
                          background: isCurrent ? '#F5F3EE'
                            : isTarget && isAcc ? '#FBF7F0'
                            : isTarget ? '#F3F3F1'
                            : '#FFFFFF',
                          cursor: 'pointer', textAlign: 'left',
                        }}>
                        <span style={{
                          display: 'block',
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2,
                          color: isCurrent ? '#111111'
                            : isTarget && isAcc ? '#8B6F3E'
                            : isTarget ? '#4A4A4A'
                            : '#AAAAAA',
                        }}>{cell.en}</span>
                        <span style={{
                          display: 'block',
                          fontSize: 11, fontWeight: 300,
                          color: isCurrent ? '#333333'
                            : isTarget && isAcc ? '#7A5C28'
                            : isTarget ? '#555555'
                            : '#CCCCCA',
                        }}>{cell.ko}</span>
                      </button>
                    );
                  }))}

                  {/* SVG overlay — rendered AFTER cells so it's on top */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <marker id="hc-arr-acc" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                        <path d="M0 1 L9 5 L0 9" fill="none" stroke="#B8963C" strokeWidth="1.4" strokeLinecap="square" />
                      </marker>
                      <marker id="hc-arr-cov" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                        <path d="M0 1 L9 5 L0 9" fill="none" stroke="#3A3A38" strokeWidth="1.4" strokeLinecap="square" />
                      </marker>
                    </defs>

                    {/* 고유미 axis hairlines — solid gold. 미측정이면 그리지 않는다 */}
                    {measured && <line x1="0" y1={(row + 0.5) * 100} x2="300" y2={(row + 0.5) * 100}
                      stroke="#B8963C" strokeWidth="0.7" opacity="0.6" />}
                    {measured && <line x1={(col + 0.5) * 100} y1="0" x2={(col + 0.5) * 100} y2="300"
                      stroke="#B8963C" strokeWidth="0.7" opacity="0.6" />}

                    {/* 추구미 axis hairlines — dashed */}
                    {targetRow != null && targetCol != null && !(measured && targetRow === row && targetCol === col) && (() => {
                      const isAcc = approach === 'accentuate';
                      const c = isAcc ? '#B8963C' : '#3A3A38';
                      return (
                        <g strokeDasharray="4 7" opacity="0.35">
                          <line x1="0" y1={(targetRow + 0.5) * 100} x2="300" y2={(targetRow + 0.5) * 100} stroke={c} strokeWidth="0.7" />
                          <line x1={(targetCol + 0.5) * 100} y1="0" x2={(targetCol + 0.5) * 100} y2="300" stroke={c} strokeWidth="0.7" />
                        </g>
                      );
                    })()}

                    {/* Arrow: 고유미 → 추구미 */}
                    {measured && targetRow != null && targetCol != null && !(targetRow === row && targetCol === col) && (() => {
                      const x1 = (col + 0.5) * 100, y1 = (row + 0.5) * 100;
                      const x2 = (targetCol + 0.5) * 100, y2 = (targetRow + 0.5) * 100;
                      const dx = x2 - x1, dy = y2 - y1;
                      const len = Math.sqrt(dx * dx + dy * dy);
                      const pad = 18;
                      const isAcc = approach === 'accentuate';
                      return (
                        <line
                          x1={x1 + (dx / len) * pad} y1={y1 + (dy / len) * pad}
                          x2={x2 - (dx / len) * pad} y2={y2 - (dy / len) * pad}
                          stroke={isAcc ? '#B8963C' : '#2A2A28'}
                          strokeWidth="1.2"
                          markerEnd={isAcc ? 'url(#hc-arr-acc)' : 'url(#hc-arr-cov)'} />
                      );
                    })()}

                    {/* 고유미 marker — precision scope: ring + ticks + filled dot + label */}
                    {measured && (() => {
                      const cx = (col + 0.5) * 100, cy = (row + 0.5) * 100;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r="15" fill="none" stroke="#B8963C" strokeWidth="0.8" opacity="0.5" />
                          <line x1={cx - 20} y1={cy} x2={cx - 11} y2={cy} stroke="#B8963C" strokeWidth="1" />
                          <line x1={cx + 11} y1={cy} x2={cx + 20} y2={cy} stroke="#B8963C" strokeWidth="1" />
                          <line x1={cx} y1={cy - 20} x2={cx} y2={cy - 11} stroke="#B8963C" strokeWidth="1" />
                          <line x1={cx} y1={cy + 11} x2={cx} y2={cy + 20} stroke="#B8963C" strokeWidth="1" />
                          <circle cx={cx} cy={cy} r="5.5" fill="#B8963C" />
                          <circle cx={cx} cy={cy} r="2" fill="white" />
                          {/* 라벨은 자기 칸 위쪽에 둔다 (칸 이름은 가운데 왼쪽이라 안 겹친다).
                              단 상대 마커가 왼쪽 위에 있으면 화살표가 이 모서리를 지나므로 오른쪽 위로 보낸다. */}
                          {(() => {
                            const awayLeft = targetRow != null && targetCol != null && targetCol < col && targetRow < row;
                            return (
                              <text
                                x={awayLeft ? col * 100 + 94 : col * 100 + 6}
                                y={row * 100 + 11}
                                textAnchor={awayLeft ? 'end' : 'start'}
                                fontSize="7" letterSpacing="0.14em"
                                fill="#8A6C28" fontFamily="sans-serif" fontWeight="600">고유미</text>
                            );
                          })()}
                        </g>
                      );
                    })()}

                    {/* 추구미 marker — double ring + center dot + label */}
                    {targetRow != null && targetCol != null && !(measured && targetRow === row && targetCol === col) && (() => {
                      const isAcc = approach === 'accentuate';
                      const color = isAcc ? '#B8963C' : '#2A2A28';
                      const labelColor = isAcc ? '#8A6C28' : '#2A2A28';
                      const cx = (targetCol + 0.5) * 100, cy = (targetRow + 0.5) * 100;
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r="15" fill="none" stroke={color} strokeWidth="1" opacity="0.55" />
                          <circle cx={cx} cy={cy} r="9" fill="none" stroke={color} strokeWidth="0.8" opacity="0.75" />
                          <circle cx={cx} cy={cy} r="3.5" fill={color} />
                          {(() => {
                            const awayLeft = measured && col < targetCol && row < targetRow;
                            return (
                              <text
                                x={awayLeft ? targetCol * 100 + 94 : targetCol * 100 + 6}
                                y={targetRow * 100 + 11}
                                textAnchor={awayLeft ? 'end' : 'start'}
                                fontSize="7" letterSpacing="0.14em"
                                fill={labelColor} fontFamily="sans-serif" fontWeight="600">추구미</text>
                            );
                          })()}
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                {/* Right axis label */}
                <div className="flex flex-col items-center justify-center shrink-0 gap-1" style={{ width: 14 }}>
                  <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, #C8C8C4)' }} />
                  <p className="text-[8px] text-[#AAAAAA]"
                    style={{ fontFamily: MONO, writingMode: 'vertical-rl', letterSpacing: '0.28em' }}>COOL</p>
                  <div className="flex-1 w-px" style={{ background: 'linear-gradient(to top, transparent, #C8C8C4)' }} />
                </div>
              </div>

              {/* Bottom axis */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #C8C8C4)' }} />
                <p className="text-[9px] tracking-[0.28em] text-[#999997]" style={{ fontFamily: MONO }}>HARD</p>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #C8C8C4)' }} />
              </div>

              {/* Keywords strip — below the map */}
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #EEEEE9' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.18em', color: '#B8963C', flexShrink: 0 }}>고유미</span>
                  <div style={{ width: 1, height: 10, background: '#E0E0DC' }} />
                  <div className="flex gap-2 flex-wrap">
                    {(imageType?.kw ?? []).map(k => (
                      <span key={k} style={{ fontSize: 10, color: '#888882', letterSpacing: '0.04em' }}>{k}</span>
                    ))}
                  </div>
                </div>
                {targetRow != null && targetCol != null && !(measured && targetRow === row && targetCol === col) && (
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.18em', color: approach === 'accentuate' ? '#8A6C28' : '#4A4A48', flexShrink: 0 }}>추구미</span>
                    <div style={{ width: 1, height: 10, background: '#E0E0DC' }} />
                    <div className="flex gap-2 flex-wrap">
                      {IMAP[targetRow][targetCol].kw.map(k => (
                        <span key={k} style={{ fontSize: 10, color: approach === 'accentuate' ? '#A08050' : '#666660', letterSpacing: '0.04em' }}>{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right panel — editorial readout */}
            <div className="shrink-0 flex flex-col" style={{ width: 132, paddingTop: 28 }}>

              {/* 고유 */}
              <div className="mb-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <circle cx="7" cy="7" r="3.5" fill="rgba(196,178,148,0.95)" />
                    <line x1="0" y1="7" x2="14" y2="7" stroke="rgba(196,178,148,0.6)" strokeWidth="0.6" />
                    <line x1="7" y1="0" x2="7" y2="14" stroke="rgba(196,178,148,0.6)" strokeWidth="0.6" />
                  </svg>
                  <span className="text-[8px] tracking-[0.22em] text-[#AAAAAA]" style={{ fontFamily: MONO }}>고유</span>
                </div>
                {imageType ? (
                  <>
                    <p className="text-[24px] font-bold text-[#1A1A1A] tracking-tight leading-none mb-0.5">{imageType.en}</p>
                    <p className="text-[13px] font-light text-[#555550] mb-1.5">{imageType.ko}</p>
                    <p className="text-[9px] text-[#BBBBBA] tracking-[0.06em]" style={{ fontFamily: MONO }}>
                      {formDominant} × {propDominant}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[15px] font-light text-[#999995] leading-snug mb-1">미측정</p>
                    <p className="text-[9px] text-[#BBBBBA] leading-relaxed">
                      얼굴 분석 결과가 없어 고유 이미지타입을 판정하지 않았습니다.
                    </p>
                  </>
                )}
              </div>

              {targetType && !(measured && targetRow === row && targetCol === col) && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

                  {/* Approach connector — 고유미가 있어야 방향을 말할 수 있다 */}
                  {approach && <div className="flex flex-col gap-1 my-5" style={{ paddingLeft: 6 }}>
                    <div style={{ width: 1, height: 16, background: approach === 'accentuate' ? 'rgba(139,111,62,0.3)' : 'rgba(0,0,0,0.12)' }} />
                    <span style={{
                      alignSelf: 'flex-start',
                      fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em',
                      padding: '2px 8px',
                      color: approach === 'accentuate' ? '#8B6F3E' : '#666660',
                      border: `0.5px solid ${approach === 'accentuate' ? 'rgba(139,111,62,0.4)' : 'rgba(0,0,0,0.15)'}`,
                      background: approach === 'accentuate' ? 'rgba(139,111,62,0.06)' : 'rgba(0,0,0,0.03)',
                    }}>
                      {approach === 'accentuate' ? '강조 활용' : '커버 · 중화'}
                    </span>
                    <div style={{ width: 1, height: 16, background: approach === 'accentuate' ? 'rgba(139,111,62,0.3)' : 'rgba(0,0,0,0.12)' }} />
                  </div>}

                  {/* 미측정이면 목표만 있고 이동 방향은 없다 — 그 사실을 적어 준다 */}
                  {!approach && <div className="my-5">
                    <p className="text-[9px] text-[#BBBBBA] leading-relaxed">
                      고유 이미지타입이 없어 이동 방향(강조 · 커버)은 표시하지 않습니다.
                    </p>
                  </div>}

                  {/* 추구 */}
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="3.5" fill={approach === 'accentuate' ? '#8B6F3E' : '#5A5A5A'} />
                        <line x1="0" y1="7" x2="14" y2="7" stroke={approach === 'accentuate' ? 'rgba(139,111,62,0.5)' : 'rgba(90,90,90,0.4)'} strokeWidth="0.6" />
                        <line x1="7" y1="0" x2="7" y2="14" stroke={approach === 'accentuate' ? 'rgba(139,111,62,0.5)' : 'rgba(90,90,90,0.4)'} strokeWidth="0.6" />
                      </svg>
                      <span className="text-[8px] tracking-[0.22em]" style={{
                        fontFamily: MONO,
                        color: approach === 'accentuate' ? '#8B6F3E' : '#888882',
                      }}>추구</span>
                    </div>
                    <p className="text-[24px] font-bold tracking-tight leading-none mb-0.5"
                      style={{ color: approach === 'accentuate' ? '#7A5C28' : '#3A3A38' }}>
                      {targetType.en}
                    </p>
                    <p className="text-[13px] font-light mb-1.5"
                      style={{ color: approach === 'accentuate' ? '#A87844' : '#666660' }}>
                      {targetType.ko}
                    </p>
                    <p className="text-[9px] tracking-[0.06em] text-[#BBBBBA] mb-2" style={{ fontFamily: MONO }}>
                      {(['Warm', 'Neutral', 'Cool'] as const)[targetCol!]} × {(['Soft', 'Neutral', 'Hard'] as const)[targetRow!]}
                    </p>
                    {approach && (
                      <p className="text-[9px] leading-[1.7]"
                        style={{ color: approach === 'accentuate' ? '#8B6F3E' : '#888882' }}>
                        {approach === 'accentuate' ? '자연 이미지를\n강조하는 방향' : '자연 이미지를\n중화·커버하는 방향'}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          </motion.div>
          ) : (
          <motion.div key="hairmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>

            {/* Top: SOFT */}
            <div className="flex items-center mb-2" style={{ paddingLeft: 20 }}>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #C4C0BA)' }} />
              <span className="mx-3" style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.28em', color: '#AAAAAA' }}>SOFT</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #C4C0BA)' }} />
              <div style={{ width: 20 }} />
            </div>

            <div className="flex items-stretch gap-2">
              {/* WARM axis */}
              <div className="flex flex-col items-center justify-center shrink-0" style={{ width: 16 }}>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, #C4C0BA, transparent)' }} />
                <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.22em', color: '#AAAAAA', writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '8px 0' }}>WARM</span>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to top, #C4C0BA, transparent)' }} />
              </div>

              {/* Hair photo — editorial floating collage */}
              <div className="flex-1 relative overflow-hidden bg-white">
                <img src={imgHairMap37} alt="헤어이미지맵" className="w-full h-auto block" />
              </div>

              {/* COOL axis */}
              <div className="flex flex-col items-center justify-center shrink-0" style={{ width: 16 }}>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, #C4C0BA, transparent)' }} />
                <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.22em', color: '#AAAAAA', writingMode: 'vertical-rl', margin: '8px 0' }}>COOL</span>
                <div className="flex-1 w-px" style={{ background: 'linear-gradient(to top, #C4C0BA, transparent)' }} />
              </div>
            </div>

            {/* Bottom: HARD */}
            <div className="flex items-center mt-2" style={{ paddingLeft: 20 }}>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #C4C0BA)' }} />
              <span className="mx-3" style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.28em', color: '#AAAAAA' }}>HARD</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #C4C0BA)' }} />
              <div style={{ width: 20 }} />
            </div>

          </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* ── Hair Condition (toggled) ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-14"
        >
          <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
            <p className="text-[9px] tracking-[0.22em] text-[#AAAAAA] mb-5" style={{ fontFamily: MONO }}>HAIR CONDITION</p>
            <div className="text-center mb-6">
              <h2 className="text-[27px] text-[#111111] tracking-tight" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                모질 분석 및 컨디션
              </h2>
            </div>
            <div className="flex items-center justify-center gap-0">
              {([
                { key: 'damage',    label: '손상도' },
                { key: 'thickness', label: '굵기' },
                { key: 'density',   label: '숱' },
                { key: 'curl',      label: '곱슬정도' },
              ] as const).map(({ key, label }, idx) => {
                const isActive = activeCondition === key;
                return (
                  <button key={key} onClick={() => setActiveCondition(key)} style={{
                    position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 18px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    {idx > 0 && (
                      <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-60%)', color: '#DDDDD8', fontSize: 14, pointerEvents: 'none' }}>|</span>
                    )}
                    <span style={{ fontSize: 16, fontWeight: isActive ? 500 : 300, color: isActive ? '#111111' : '#C4C4C0', letterSpacing: '-0.01em', transition: 'all 0.2s' }}>{label}</span>
                    <div style={{ position: 'absolute', bottom: 0, left: 18, right: 18, height: 1.5, background: '#111111', opacity: isActive ? 1 : 0, transition: 'opacity 0.2s' }} />
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── 손상도 — rich layout ── */}
            {activeCondition === 'damage' && (() => {
              const selId = selectedConditions['damage'] ?? null;
              const detail = selId ? DAMAGE_DETAIL[selId] : null;
              const selLevel = DAMAGE_LEVELS.find(l => l.id === selId);

              // SVG cuticle icon per level (abstract hair fiber cross-section)
              const CuticleIcon = ({ fill, size = 68 }: { fill: number; size?: number }) => {
                const spikes = Math.round(fill * 10);
                const paths = Array.from({ length: 7 }, (_, i) => {
                  const y = 8 + i * 10;
                  const jag = fill * 6;
                  return `M4,${y} Q${4 + jag * (i % 2 === 0 ? 1 : -0.5)},${y - 4} ${12},${y - 2} L${12},${y + 2} Q${4 + jag * (i % 2 === 0 ? 0.5 : -1)},${y + 4} 4,${y}`;
                });
                return (
                  <svg width={size} height={size} viewBox="0 0 80 80" style={{ display: 'block' }}>
                    <rect width="80" height="80" fill="#F0EDE8" />
                    {/* hair shaft */}
                    <rect x="24" y="4" width="32" height="72" rx="2" fill="#2A1E14" opacity="0.85" />
                    {/* cuticle layers */}
                    {Array.from({ length: 8 }, (_, i) => {
                      const y = 6 + i * 9;
                      const lift = fill * 18;
                      const pts = `24,${y} ${24 + lift * 0.6},${y - lift * 0.7} ${56 + lift * 0.4},${y - lift * 0.5} 56,${y + 3}`;
                      return <polygon key={i} points={pts} fill={`rgba(80,55,35,${0.6 - fill * 0.2})`} stroke="rgba(60,40,20,0.3)" strokeWidth="0.5" />;
                    })}
                  </svg>
                );
              };

              // Dot bar metric
              const DotBar = ({ val, max = 5, filled = '#1A1A1A', empty = '#E0E0DC' }: { val: number; max?: number; filled?: string; empty?: string }) => (
                <div style={{ display: 'flex', gap: 3, justifyContent: 'center', margin: '8px 0 4px' }}>
                  {Array.from({ length: max }, (_, i) => (
                    <div key={i} style={{ width: 14, height: 10, background: i < val ? filled : empty }} />
                  ))}
                </div>
              );

              // Arc gauge
              const ArcGauge = ({ pct, label }: { pct: string; label: string }) => {
                const midPct = selId === '6' ? 1.0 : (parseFloat(pct.split('~')[0] ?? '0') + parseFloat((pct.split('~')[1] ?? pct).replace('%','').replace('이상','100'))) / 2 / 100;
                const r = 52, cx = 70, cy = 70;
                const startAngle = -210, endAngle = 30;
                const totalArc = endAngle - startAngle;
                const fillArc = totalArc * Math.min(midPct, 1);
                const toRad = (d: number) => (d * Math.PI) / 180;
                const sx = cx + r * Math.cos(toRad(startAngle));
                const sy = cy + r * Math.sin(toRad(startAngle));
                const ex = cx + r * Math.cos(toRad(startAngle + fillArc));
                const ey = cy + r * Math.sin(toRad(startAngle + fillArc));
                const exFull = cx + r * Math.cos(toRad(endAngle));
                const eyFull = cy + r * Math.sin(toRad(endAngle));
                const la = totalArc > 180 ? 1 : 0;
                const laFill = fillArc > 180 ? 1 : 0;
                return (
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <path d={`M${sx},${sy} A${r},${r} 0 ${la},1 ${exFull},${eyFull}`} fill="none" stroke="#EAEAE6" strokeWidth="10" strokeLinecap="round" />
                    {midPct > 0 && <path d={`M${sx},${sy} A${r},${r} 0 ${laFill},1 ${ex},${ey}`} fill="none" stroke="#1A1A1A" strokeWidth="10" strokeLinecap="round" />}
                    <text x="70" y="62" textAnchor="middle" fontSize="9" fill="#AAAAAA" letterSpacing="0.1em">손상도</text>
                    <text x="70" y="82" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1A1A1A">{pct}</text>
                    <text x="70" y="99" textAnchor="middle" fontSize="11" fill="#555550">{label}</text>
                  </svg>
                );
              };

              return (
                <motion.div key="damage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                  {/* 3×2 card grid */}
                  <div className="mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {DAMAGE_LEVELS.map(level => {
                      const isSel = selId === level.id;
                      return (
                        <button key={level.id}
                          onClick={() => setSelectedConditions(prev => ({ ...prev, damage: isSel ? null : level.id }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            background: isSel ? '#F5F3EE' : '#FAFAF8',
                            border: isSel ? '2px solid #1A1A1A' : '1px solid #EAEAE6',
                            position: 'relative', height: '100%',
                          }}>
                            {/* Cuticle photo */}
                            <div style={{ flexShrink: 0, width: 68, height: 68, overflow: 'hidden' }}>
                              <img
                                src={level.id === '1' ? imgDamage1 : level.id === '2' ? imgDamage2 : level.id === '3' ? imgDamage3 : level.id === '4' ? imgDamage4 : level.id === '5' ? imgDamage5 : imgDamage6}
                                alt={level.label}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            </div>
                            {/* Text */}
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 14, fontWeight: isSel ? 700 : 500, color: '#111111', marginBottom: 5, letterSpacing: '-0.01em' }}>{level.label}</p>
                              <p style={{ fontSize: 10, color: '#888882', lineHeight: 1.65, fontWeight: 300, whiteSpace: 'pre-line', marginBottom: 8 }}>{level.desc}</p>
                              <div style={{ width: 24, height: 1, background: '#D8D4CE', marginBottom: 5 }} />
                              <p style={{ fontSize: 10, color: isSel ? '#555550' : '#AAAAAA', fontFamily: MONO, letterSpacing: '0.04em' }}>손상도 {level.pct}</p>
                            </div>
                            {/* Check / warning badge */}
                            {isSel ? (
                              <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ color: '#FFF', fontSize: 10, fontWeight: 700 }}>✓</span>
                              </div>
                            ) : parseInt(level.id) >= 4 ? (
                              <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', border: '1px solid #CCCCCA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 9, color: '#AAAAAA' }}>!</span>
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail panel — shown when selected */}
                  {selLevel && detail && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                      style={{ border: '1px solid #E8E8E4', background: '#FAFAF8', marginBottom: 8 }}>
                      <div style={{ display: 'flex', borderBottom: '1px solid #EEEEE9' }}>
                        {/* Left: gauge */}
                        <div style={{ width: 180, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 12px', borderRight: '1px solid #EEEEE9' }}>
                          <p style={{ fontSize: 9, color: '#AAAAAA', letterSpacing: '0.12em', marginBottom: 8, fontFamily: MONO }}>선택된 상태</p>
                          <p style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{selLevel.label}</p>
                          <ArcGauge pct={selLevel.pct} label={selLevel.label} />
                        </div>
                        {/* Right: 5 metrics */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px' }}>
                          <p style={{ fontSize: 9, color: '#AAAAAA', letterSpacing: '0.12em', marginBottom: 14, fontFamily: MONO }}>모발 상태 지표</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, flex: 1 }}>
                            {[
                              { label: '큐티클 상태', val: detail.cuticle,  subLabel: detail.cuticleLabel,  icon: '≡' },
                              { label: '탄력도',      val: detail.elastic,  subLabel: detail.elasticLabel,  icon: '≈' },
                              { label: '수분도',      val: detail.moisture, subLabel: detail.moistureLabel, icon: '◇' },
                              { label: '광택도',      val: detail.shine,    subLabel: detail.shineLabel,    icon: '✦' },
                              { label: '끊어짐',      val: detail.breakage, subLabel: detail.breakageLabel, icon: '✂' },
                            ].map(m => (
                              <div key={m.label} style={{ textAlign: 'center', padding: '8px 4px', borderRight: '1px solid #F0F0EC' }}>
                                <p style={{ fontSize: 10, color: '#555550', marginBottom: 6, letterSpacing: '-0.01em' }}>{m.label}</p>
                                <div style={{ fontSize: 22, color: '#2A2A28', marginBottom: 2, lineHeight: 1 }}>{m.icon}</div>
                                <DotBar val={m.val} filled="#1A1A1A" empty="#E8E8E4" />
                                <p style={{ fontSize: 10, color: '#888882', marginTop: 2 }}>{m.subLabel}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Guide footer */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 18px' }}>
                        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.2em', color: '#AAAAAA', flexShrink: 0 }}>해석 가이드</span>
                        <div style={{ width: 1, height: 14, background: '#E0E0DC' }} />
                        <p style={{ fontSize: 11, color: '#555550', lineHeight: 1.65, fontWeight: 300 }}>{detail.guide}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })()}

            {/* ── 기타 컨디션 — bar meter layout ── */}
            {activeCondition !== 'damage' && CONDITION_SECTIONS.filter(s => s.key === activeCondition).map(section => (
              <motion.div key={section.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.levels.length}, 1fr)`, gap: 8 }}>
                  {section.levels.map((level, li) => {
                    const isSel = selectedConditions[section.key] === level.id;
                    return (
                      <button key={level.id} onClick={() => setSelectedConditions(prev => ({ ...prev, [section.key]: isSel ? null : level.id }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', alignSelf: 'start' }}>
                        <div style={{ marginBottom: 10, padding: '16px 12px 14px', background: isSel ? '#F5F3EE' : '#FAFAF9', border: isSel ? '1.5px solid #1A1A1A' : '1px solid #EAEAE6', position: 'relative' }}>
                          {isSel && (
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#FFF', fontSize: 7, fontWeight: 700 }}>✓</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginBottom: 10 }}>
                            {section.levels.map((_, bi) => (
                              <div key={bi} style={{ height: 3, flex: 1, background: bi <= li ? (isSel ? '#1A1A1A' : '#C4C0BA') : '#E8E8E4', borderRadius: 1 }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 12, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 5, letterSpacing: '-0.01em' }}>{level.label}</p>
                          <p style={{ fontSize: 9.5, color: '#AAAAAA', lineHeight: 1.6, fontWeight: 300 }}>{level.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
                  <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>CONSULTING NOTE</span>
                  <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
                  <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>{section.note}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ── Style Sections (toggled) ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="mb-14"
        >
          {/* Toggle header */}
          <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
            <p className="text-[9px] tracking-[0.22em] text-[#AAAAAA] mb-5" style={{ fontFamily: MONO }}>STYLE CONSULTING</p>
            <div className="text-center mb-6">
              <h2 className="text-[27px] text-[#111111] tracking-tight" style={{ fontWeight: 300, letterSpacing: '-0.01em' }}>
                스타일 제안
              </h2>
            </div>
            {/* Tab buttons */}
            <div className="flex items-center justify-center gap-0">
              {([
                { key: 'bangs',   label: '앞머리' },
                { key: 'parting', label: '가르마' },
                { key: 'length',  label: '길이' },
                { key: 'curl',    label: '컬감' },
                { key: 'color',   label: '컬러' },
              ] as const).map(({ key, label }, idx) => {
                const isActive = activeStyle === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveStyle(key)}
                    style={{
                      position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 22px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                    }}
                  >
                    {idx > 0 && (
                      <span style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-60%)',
                        color: '#DDDDD8', fontSize: 14, pointerEvents: 'none',
                      }}>|</span>
                    )}
                    <span style={{ fontSize: 17, fontWeight: isActive ? 500 : 300, color: isActive ? '#111111' : '#C4C4C0', letterSpacing: '-0.01em', transition: 'all 0.2s' }}>
                      {label}
                    </span>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 22, right: 22, height: 1.5,
                      background: '#111111', opacity: isActive ? 1 : 0, transition: 'opacity 0.2s',
                    }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section content — AnimatePresence crossfade */}
          <AnimatePresence mode="wait">

        {/* ── SECTION 01: 앞머리 ───────────────────────────────────── */}
        {activeStyle === 'bangs' && <motion.div key="bangs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {/* 6-card grid */}
          <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {BANGS_OPTIONS.map(opt => {
              const isSel = selectedBangs === opt.id;
              const photo = stylePhoto('bangs', opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedBangs(isSel ? null : opt.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', alignSelf: 'start' }}
                >
                  {/* Photo */}
                  <div style={{
                    position: 'relative', overflow: 'hidden', aspectRatio: '2/3', marginBottom: 10,
                    outline: isSel ? '2px solid #1A1A1A' : '2px solid transparent',
                    outlineOffset: -2,
                  }}>
                    <img
                      src={photo}
                      alt={opt.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSel ? 'none' : 'brightness(0.93)' }}
                    />
                    {isSel && (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)' }} />
                        <div style={{
                          position: 'absolute', top: 6, right: 6, width: 18, height: 18,
                          background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>✓</span>
                        </div>
                      </>
                    )}
                    {isRecommended('bangs', opt.id) && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6,
                        background: '#1A1A1A', color: '#FFFFFF',
                        fontSize: 8, letterSpacing: '0.08em', padding: '3px 7px', fontFamily: MONO,
                      }}>
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  {/* Name */}
                  <p style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 6, letterSpacing: '-0.01em' }}>
                    {opt.label}
                  </p>
                  {/* Hairline */}
                  <div style={{ width: 18, height: 1, background: '#D8D4CE', margin: '0 auto 6px' }} />
                  {/* Tags */}
                  {opt.tags.map(t => (
                    <p key={t} style={{ fontSize: 10, lineHeight: 1.75, color: isSel ? '#555555' : '#AAAAAA', fontWeight: 300 }}>{t}</p>
                  ))}
                </button>
              );
            })}
          </div>

          {/* Consulting note bar */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>
              CONSULTING NOTE
            </span>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
            <div>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>
                앞머리는 전체 인상의 균형을 좌우하는 중요한 요소입니다.
              </p>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>
                얼굴 비율, 이목구비의 특성, 라이프스타일을 반영하여 가장 잘 어울리는 스타일을 제안해드립니다.
              </p>
            </div>
          </div>
        </motion.div>}

        {/* ── SECTION 02: 가르마 ──────────────────────────────────── */}
        {activeStyle === 'parting' && <motion.div key="parting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {PARTING_OPTIONS.map(opt => {
              const isSel = selectedParting === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedParting(isSel ? null : opt.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', alignSelf: 'start' }}
                >
                  <div style={{
                    position: 'relative', overflow: 'hidden', aspectRatio: '8/9', marginBottom: 10,
                    outline: isSel ? '2px solid #1A1A1A' : '2px solid transparent', outlineOffset: -2,
                  }}>
                    <img src={stylePhoto('parting', opt.id)} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSel ? 'none' : 'brightness(0.93)' }} />
                    {isSel && (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)' }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>✓</span>
                        </div>
                      </>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 6, letterSpacing: '-0.01em' }}>{opt.label}</p>
                  <div style={{ width: 18, height: 1, background: '#D8D4CE', margin: '0 auto 6px' }} />
                  {opt.tags.map(t => (
                    <p key={t} style={{ fontSize: 10, lineHeight: 1.75, color: isSel ? '#555555' : '#AAAAAA', fontWeight: 300 }}>{t}</p>
                  ))}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>CONSULTING NOTE</span>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
            <div>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>가르마는 얼굴형 비율과 이마 형태에 따라 최적의 위치가 달라집니다.</p>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>얼굴 비율과 이목구비의 위치를 고려하여 가장 조화로운 가르마를 제안해드립니다.</p>
            </div>
          </div>
        </motion.div>}

        {/* ── SECTION 03: 길이 ────────────────────────────────────── */}
        {activeStyle === 'length' && <motion.div key="length" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {LENGTH_OPTIONS.map(opt => {
              const isSel = selectedLength === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedLength(isSel ? null : opt.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', alignSelf: 'start' }}
                >
                  <div style={{
                    position: 'relative', overflow: 'hidden', aspectRatio: '2/3', marginBottom: 10,
                    outline: isSel ? '2px solid #1A1A1A' : '2px solid transparent', outlineOffset: -2,
                  }}>
                    <img src={stylePhoto('length', opt.id)} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSel ? 'none' : 'brightness(0.93)' }} />
                    {isSel && (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)' }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>✓</span>
                        </div>
                      </>
                    )}
                    {isRecommended('length', opt.id) && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6,
                        background: '#1A1A1A', color: '#FFFFFF',
                        fontSize: 8, letterSpacing: '0.08em', padding: '3px 7px', fontFamily: MONO,
                      }}>
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 6, letterSpacing: '-0.01em' }}>{opt.label}</p>
                  <div style={{ width: 18, height: 1, background: '#D8D4CE', margin: '0 auto 6px' }} />
                  {opt.tags.map(t => (
                    <p key={t} style={{ fontSize: 10, lineHeight: 1.75, color: isSel ? '#555555' : '#AAAAAA', fontWeight: 300 }}>{t}</p>
                  ))}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>CONSULTING NOTE</span>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
            <div>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>헤어 길이는 전체 실루엣과 라이프스타일을 좌우하는 핵심 요소입니다.</p>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>얼굴형의 세로·가로 비율과 개인의 취향을 반영하여 가장 어울리는 길이를 제안해드립니다.</p>
            </div>
          </div>
        </motion.div>}

        {/* ── SECTION 04: 컬 ──────────────────────────────────────── */}
        {activeStyle === 'curl' && <motion.div key="curl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {CURL_OPTIONS.map(opt => {
              const isSel = selectedCurl === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedCurl(isSel ? null : opt.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'center', alignSelf: 'start' }}
                >
                  <div style={{
                    position: 'relative', overflow: 'hidden', aspectRatio: '2/3', marginBottom: 10,
                    outline: isSel ? '2px solid #1A1A1A' : '2px solid transparent', outlineOffset: -2,
                  }}>
                    <img src={stylePhoto('curl', opt.id)} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSel ? 'none' : 'brightness(0.93)' }} />
                    {isSel && (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)' }} />
                        <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>✓</span>
                        </div>
                      </>
                    )}
                    {isRecommended('curl', opt.id) && (
                      <div style={{
                        position: 'absolute', top: 6, left: 6,
                        background: '#1A1A1A', color: '#FFFFFF',
                        fontSize: 8, letterSpacing: '0.08em', padding: '3px 7px', fontFamily: MONO,
                      }}>
                        RECOMMENDED
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 6, letterSpacing: '-0.01em' }}>{opt.label}</p>
                  <div style={{ width: 18, height: 1, background: '#D8D4CE', margin: '0 auto 6px' }} />
                  {opt.tags.map(t => (
                    <p key={t} style={{ fontSize: 10, lineHeight: 1.75, color: isSel ? '#555555' : '#AAAAAA', fontWeight: 300 }}>{t}</p>
                  ))}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>CONSULTING NOTE</span>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
            <div>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>컬감은 전체적인 분위기와 텍스처를 결정짓는 중요한 요소입니다.</p>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>이미지타입과 개인의 라이프스타일에 맞는 최적의 컬감을 제안해드립니다.</p>
            </div>
          </div>
        </motion.div>}

        {/* ── SECTION 05: 컬러 ────────────────────────────────────── */}
        {activeStyle === 'color' && <motion.div key="color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, alignItems: 'stretch' }}>
            {COLOR_OPTIONS.map(opt => {
              const isSel = selectedColor === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedColor(isSel ? null : opt.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', height: '100%' }}
                >
                  <div style={{
                    border: isSel ? '2px solid #1A1A1A' : '2px solid transparent',
                    background: '#FAFAF8',
                    padding: '14px 12px 12px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* 컬러 사진 — 단색 그라디언트가 아니라 실제 모발 사진 (문서 02) */}
                    <div style={{
                      width: '100%', aspectRatio: '4/3',
                      marginBottom: 12,
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <img
                        src={`/new/style/color-${opt.id}.png`}
                        alt={opt.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isSel ? 'none' : 'brightness(0.93)' }}
                      />
                      {isSel && (
                        <>
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)' }} />
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#FFF', fontSize: 8, fontWeight: 700 }}>✓</span>
                          </div>
                        </>
                      )}
                      {recommendedColor === opt.id && (
                        <div style={{ position: 'absolute', top: 6, left: 6, background: '#1A1A1A', color: '#FFF', fontSize: 8, letterSpacing: '0.08em', padding: '3px 7px', fontFamily: MONO }}>
                          RECOMMENDED
                        </div>
                      )}
                    </div>
                    {/* Label */}
                    <p style={{ fontSize: 13, fontWeight: isSel ? 600 : 400, color: '#111111', marginBottom: 8, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{opt.label}</p>
                    <div style={{ width: 18, height: 1, background: '#D8D4CE', marginBottom: 8 }} />
                    {/* Tags — 문서 02 처럼 낱개 뱃지 */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {opt.tags.map(t => (
                        <span key={t} style={{ fontSize: 9, color: isSel ? '#555555' : '#AAAAAA', fontFamily: MONO, letterSpacing: '0.04em', background: '#F2F2F0', border: '1px solid #E6E6E2', padding: '2px 6px' }}>#{t}</span>
                      ))}
                    </div>
                    {/* Desc */}
                    <p style={{ fontSize: 10, color: isSel ? '#444444' : '#AAAAAA', lineHeight: 1.65, fontWeight: 300, marginBottom: 10 }}>{opt.desc}</p>
                    {/* COLOR CODE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 8, borderTop: '1px solid #EAEAE6', marginTop: 'auto' }}>
                      <span style={{ fontSize: 8, letterSpacing: '0.14em', color: '#AAAAAA', fontFamily: MONO }}>COLOR CODE</span>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: opt.code, border: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: '#666666', fontFamily: MONO }}>{opt.code}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, padding: '14px 18px', background: '#F7F7F5', border: '1px solid #EFEFED' }}>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: '#AAAAAA', flexShrink: 0, paddingTop: 2 }}>CONSULTING NOTE</span>
            <div style={{ width: 1, alignSelf: 'stretch', background: '#E0E0DC' }} />
            <div>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>헤어 컬러는 이미지타입과 피부 톤을 고려하여 선택해야 가장 자연스럽고 완성도 있는 연출이 가능합니다.</p>
              <p style={{ fontSize: 11, color: '#666666', lineHeight: 1.75, fontWeight: 300 }}>고유미를 살리거나 추구미 방향으로 보완하는 컬러 전략을 제안해드립니다.</p>
            </div>
          </div>
        </motion.div>}

          </AnimatePresence>
        </motion.div>

        {/* ── Selection Summary ───────────────────────────────────── */}
        {(selectedBangs || selectedParting || selectedLength || selectedCurl || selectedColor) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 p-4"
            style={{ background: '#F7F7F5', border: '1px solid #EBEBEB', borderRadius: 2 }}
          >
            <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-3" style={{ fontFamily: MONO }}>
              CONSULTING SUMMARY
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'bangs',   label: '앞머리', id: selectedBangs,   opts: BANGS_OPTIONS },
                { key: 'parting', label: '가르마', id: selectedParting, opts: PARTING_OPTIONS },
                { key: 'length',  label: '길이',   id: selectedLength,  opts: LENGTH_OPTIONS },
                { key: 'curl',    label: '컬',     id: selectedCurl,    opts: CURL_OPTIONS },
                { key: 'color',   label: '컬러',   id: selectedColor,   opts: COLOR_OPTIONS },
              ].map(({ key, label, id, opts }) => id ? (
                <div key={key} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[#BBBBBB]">{label}</span>
                  <span className="text-[11px] font-medium text-[#1A1A1A] px-2 py-0.5"
                    style={{ background: '#E8E8E4', borderRadius: 2 }}>
                    {opts.find(o => o.id === id)?.label}
                  </span>
                </div>
              ) : null)}
            </div>
          </motion.div>
        )}

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className="border-t border-[#E8E8E4] pt-5">
          <p className="text-[9px] tracking-[0.18em] text-[#AAAAAA] mb-3" style={{ fontFamily: MONO }}>HAIR CONSULTING</p>
          <button onClick={onNext}
            className="w-full py-5 text-[12px] tracking-[0.08em] text-white flex items-center justify-center gap-3 transition-colors"
            style={{
              background: allSelected ? '#111111' : '#CCCCCC',
              border: 'none',
              cursor: allSelected ? 'pointer' : 'default',
              fontWeight: 500,
              borderRadius: 0,
            }}>
            {allSelected
              ? '다음 단계로 진행 →'
              : `선택 완료 후 다음 단계 가능 (${[selectedBangs, selectedParting, selectedLength, selectedCurl, selectedColor].filter(Boolean).length}/5)`}
          </button>
        </div>
      </div>
    </div>
  );
}
