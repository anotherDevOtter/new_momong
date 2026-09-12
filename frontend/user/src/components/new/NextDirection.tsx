'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit3, ChevronDown } from 'lucide-react';
import { BrandHeader } from './BrandHeader';
import { MONO } from './faceAnalysisData';

// ── Types ──────────────────────────────────────────────────────────────────

export type ServiceKey =
  | 'CUT' | 'BANG' | 'PERM' | 'ROOT_PERM' | 'STRAIGHT'
  | 'COLOR' | 'ROOT_COLOR' | 'BLEACH' | 'CLINIC' | 'SCALP';

export interface CycleEvent {
  offsetWeeks: number;
  label: string;       // 시점 텍스트: "약 7주 후"
  monthHint: string;   // 월 힌트: "10월"
  type: 'CARE' | 'DESIGN' | 'REVIEW';
  services: string[];  // 한글 시술명: ["뿌리펌"]
  purpose: string;     // 방문 목적: "뿌리 볼륨 확인"
  note: string;
}

/** 예전 리포트가 보던 월 단위 계획. 시안3 화면은 주 단위(cycleEvents)로 잡지만,
 *  리포트를 아직 안 바꿔서 여기서 월로 환산해 같이 실어 보낸다. (2026-09-11) */
export type ServiceType = 'cut' | 'perm' | 'color' | 'clinic';

export interface MonthCycleData {
  month: number;
  services: ServiceType[];
  memo: string;
}

export interface CycleData {
  todayServices: ServiceKey[];
  todayDetails: Partial<Record<string, string[]>>;
  gender: 'female' | 'male';
  nextCare: { minWeeks: number; maxWeeks: number; services: string[] } | null;
  nextDesign: { minWeeks: number; maxWeeks: number; services: string[] } | null;
  cycleEvents: CycleEvent[];
  /** 홈케어 요약 — 리포트 Page03 의 YOUR HOME CARE 가 쓴다 */
  homeCare?: string[];
  /** 방향별 세부 선택 (길이→미디움 등). 화면에만 있던 값이라 저장되지 않아
   *  공유 링크로 열면 리포트에서 사라졌다. (2026-09-11) */
  subSelections?: Record<string, string>;
  /** 방향별 메모 — 옵션으로 못 적는 얘기 (2026-09-12) */
  memos?: Record<string, string>;
  /** ↓ 아래 셋은 지금 리포트가 보는 값. 시안3 리포트로 갈아탈 때 정리한다. */
  selectedMonths: MonthCycleData[];
  directions?: DirectionOption[];
  changeLevel?: number;
}

interface NextDirectionProps {
  onBack: () => void;
  onNext: () => void;
  onCycleDataChange?: (data: CycleData) => void;
  onSubSelectionsChange?: (sel: Record<string, string>) => void;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  onBeforePhotoChange?: (url: string | null) => void;
  onAfterPhotoChange?: (url: string | null) => void;
  /** 저장된 상담을 다시 열 때 복원할 값 (같은 날 기록만) */
  initial?: CycleData | null;
}

export type DirectionOption = 'length' | 'color' | 'bangs' | 'perm' | 'recovery' | 'image';

interface DirectionItem {
  id: DirectionOption;
  label: string;
  sublabel: string;
  impact: number;
  en: string;
  options: string[];
}

// ── Service metadata ───────────────────────────────────────────────────────

type ServiceMeta = {
  label: string;
  ko: string;
  type: 'CARE' | 'DESIGN';
  femaleWeeks?: [number, number];
  maleWeeks?: [number, number];
  weeks?: [number, number];
  nextLabel: string;
  noAutoRepeat?: boolean;
};

const SERVICES: Record<ServiceKey, ServiceMeta> = {
  CUT:        { label: 'CUT',        ko: '커트',           type: 'DESIGN', femaleWeeks: [7, 9],   maleWeeks: [3, 4],   nextLabel: 'CUT CHECK' },
  BANG:       { label: 'BANG',       ko: '앞머리',          type: 'DESIGN', weeks: [3, 4],                               nextLabel: 'BANG CHECK' },
  PERM:       { label: 'PERM',       ko: '펌',              type: 'DESIGN', femaleWeeks: [18, 22], maleWeeks: [12, 14], nextLabel: 'PERM CHECK' },
  ROOT_PERM:  { label: 'ROOT PERM',  ko: '뿌리펌',          type: 'DESIGN', weeks: [7, 9],                               nextLabel: 'ROOT VOLUME CHECK' },
  STRAIGHT:   { label: 'STRAIGHT',   ko: '매직/스트레이트', type: 'DESIGN', weeks: [20, 22],                             nextLabel: 'STRAIGHT CHECK' },
  COLOR:      { label: 'COLOR',      ko: '전체 염색',       type: 'DESIGN', weeks: [7, 9],                               nextLabel: 'COLOR CHECK' },
  ROOT_COLOR: { label: 'ROOT COLOR', ko: '뿌리 염색',       type: 'DESIGN', weeks: [5, 7],                               nextLabel: 'ROOT COLOR CHECK' },
  BLEACH:     { label: 'BLEACH',     ko: '탈색',            type: 'CARE',   weeks: [3, 4],                               nextLabel: 'CONDITION CHECK', noAutoRepeat: true },
  CLINIC:     { label: 'CLINIC',     ko: '클리닉',          type: 'CARE',   weeks: [3, 4],                               nextLabel: 'CLINIC' },
  SCALP:      { label: 'SCALP',      ko: '두피 관리',       type: 'CARE',   weeks: [0, 0],                               nextLabel: 'SCALP CHECK' },
};

const SERVICE_ORDER: ServiceKey[] = [
  'CUT', 'BANG', 'PERM', 'ROOT_PERM', 'STRAIGHT',
  'COLOR', 'ROOT_COLOR', 'BLEACH', 'CLINIC', 'SCALP',
];

// ── Korean labels & visit-purpose copy ────────────────────────────────────

export const SERVICE_KO: Record<ServiceKey, string> = {
  CUT:        '커트',
  BANG:       '앞머리',
  PERM:       '펌',
  ROOT_PERM:  '뿌리펌',
  STRAIGHT:   '매직 / 스트레이트',
  COLOR:      '전체염색',
  ROOT_COLOR: '뿌리염색',
  BLEACH:     '탈색',
  CLINIC:     '클리닉',
  SCALP:      '두피관리',
};

// Per-service visit purposes — index = iteration (0-based)
const VISIT_PURPOSES: Record<ServiceKey, string[]> = {
  CUT:        ['커트 라인 확인',         '커트 형태 유지 확인',       '디자인 밸런스 확인'],
  BANG:       ['앞머리 형태 확인',        '앞머리 라인 정리',           '앞머리 밸런스 확인'],
  PERM:       ['컬 상태 확인',           '볼륨 및 컬 유지 확인',       '디자인 밸런스 확인'],
  ROOT_PERM:  ['뿌리 볼륨 확인',         '볼륨 유지 상태 확인',        '디자인 밸런스 확인'],
  STRAIGHT:   ['스트레이트 형태 확인',   '손상 및 형태 점검'],
  COLOR:      ['컬러 퇴색 확인',         '컬러 상태 유지 확인',        '전체 컬러 확인'],
  ROOT_COLOR: ['뿌리 자람 확인',         '컬러 유지 상태 확인',        '컬러 밸런스 확인'],
  BLEACH:     ['모발 상태 확인',         '탈색 컨디션 확인'],
  CLINIC:     ['손상도 및 컨디션 확인',  '모발 회복 상태 확인',        '컨디션 유지 확인'],
  SCALP:      ['두피 상태 확인',         '두피 컨디션 유지'],
};

function getVisitPurpose(key: ServiceKey, iter: number): string {
  const list = VISIT_PURPOSES[key];
  return list[Math.min(iter - 1, list.length - 1)];
}

function weekToKoLabel(week: number): string {
  if (week === 0) return '오늘';
  if (week <= 9) return `약 ${week}주 후`;
  // 4.5 로 나눠 올림하면 서로 다른 주차가 같은 '약 4개월 후' 로 뭉쳤다.
  // 실제 날짜의 월 차이로 센다. (2026-09-11)
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + week * 7);
  const months = Math.max(1, (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()));
  return `약 ${months}개월 후`;
}

function weekToMonthHint(week: number): string {
  const d = new Date();
  d.setDate(d.getDate() + week * 7);
  return `${d.getMonth() + 1}월`;
}

const SERVICE_DETAILS: Partial<Record<ServiceKey, string[]>> = {
  CUT:       ['전체 커트', '앞머리 커트', '레이어', '길이 조정', '숱 조절'],
  PERM:      ['C Curl', 'S Curl', 'C + S', 'Natural Wave', 'Volume Perm'],
  ROOT_PERM: ['뿌리 볼륨', '자연 볼륨'],
  COLOR:     ['Full Color', 'Tone Up', 'Tone Down', '색감 변경'],
  ROOT_COLOR:['뿌리 염색', '섀도 루트'],
  BLEACH:    ['Partial', 'Full', 'Highlight', 'Re-bleach'],
  CLINIC:    ['Moisture', 'Damage Care', 'Protein', 'Scalp'],
};

// ── After care content ─────────────────────────────────────────────────────

type CareTip = { label: string; text: string };
export type { CareTip };
export const AFTER_CARE: Record<ServiceKey, { title: string; tips: CareTip[] }> = {
  CUT: {
    title: 'CUT CARE',
    tips: [
      { label: 'DRYING',      text: '뿌리부터 먼저 말린 뒤 디자인된 방향에 맞춰 결을 정리합니다.' },
      { label: 'STYLING',     text: '무거운 제품보다 가벼운 크림이나 에센스를 소량 사용합니다.' },
      { label: 'VOLUME',      text: '볼륨이 필요한 부위는 완전히 마르기 전에 방향을 잡아주세요.' },
      { label: 'NEXT CHECK',  text: '남성: 3–4주 / 여성: 약 8주 후 점검' },
    ],
  },
  BANG: {
    title: 'BANG CARE',
    tips: [
      { label: 'DRYING',     text: '세안이나 샴푸 후 앞머리 뿌리를 바로 말립니다.' },
      { label: 'DIRECTION',  text: '원하는 방향 반대로 먼저 말린 뒤 최종 방향으로 정리합니다.' },
      { label: 'PRODUCT',    text: '뿌리에 무거운 제품 사용을 줄입니다.' },
      { label: 'NEXT CHECK', text: '3–4주 후 형태 점검 권장' },
    ],
  },
  PERM: {
    title: 'PERM CARE',
    tips: [
      { label: 'FIRST WASH', text: '첫 샴푸 시점은 담당 디자이너 안내에 따릅니다.' },
      { label: 'DRYING',     text: '젖은 머리를 강하게 비비지 않고 컬 방향대로 손으로 말립니다.' },
      { label: 'CURL',       text: '필요 시 디퓨저를 사용하고 컬을 손으로 감아 형태를 유지합니다.' },
      { label: 'HEAT',       text: '고열 아이론 사용을 줄이고 열 보호 제품을 사용합니다.' },
      { label: 'NEXT CHECK', text: '남성: 약 3개월 / 여성: 약 4–5개월' },
    ],
  },
  ROOT_PERM: {
    title: 'ROOT PERM CARE',
    tips: [
      { label: 'DRYING',     text: '뿌리를 눌러 말리지 않습니다.' },
      { label: 'VOLUME',     text: '원하는 볼륨 방향 반대쪽으로 먼저 건조한 후 최종 방향으로 정리합니다.' },
      { label: 'PRODUCT',    text: '두피 가까이에 무거운 오일이나 크림을 많이 사용하지 않습니다.' },
      { label: 'NEXT CHECK', text: '약 2개월 후 볼륨 상태 점검' },
    ],
  },
  STRAIGHT: {
    title: 'STRAIGHT CARE',
    tips: [
      { label: 'SHAPE',      text: '시술 직후 모발이 심하게 접히거나 강하게 묶이는 행동을 주의합니다.' },
      { label: 'HEAT',       text: '고열 사용을 줄입니다.' },
      { label: 'MOISTURE',   text: '건조한 부위에 트리트먼트 또는 컨디셔닝 제품을 사용합니다.' },
      { label: 'NEXT CHECK', text: '약 5개월 전후 전체 상태 재점검' },
    ],
  },
  COLOR: {
    title: 'COLOR CARE',
    tips: [
      { label: 'WATER',      text: '지나치게 뜨거운 물보다 미지근한 물을 사용합니다.' },
      { label: 'SHAMPOO',    text: '컬러 모발용 샴푸 또는 세정력이 강하지 않은 제품을 사용합니다.' },
      { label: 'HEAT',       text: '열기구 사용 시 열 보호 제품을 사용합니다.' },
      { label: 'UV',         text: '강한 자외선과 고열 노출을 줄입니다.' },
      { label: 'NEXT CHECK', text: 'Full Color: 약 2개월 후 컬러 상태 점검' },
    ],
  },
  ROOT_COLOR: {
    title: 'ROOT COLOR CARE',
    tips: [
      { label: 'SCALP',       text: '염색 직후 두피를 강하게 긁거나 문지르지 않습니다.' },
      { label: 'IRRITATION',  text: '자극이나 불편감이 지속되면 전문가 상담을 권장합니다.' },
      { label: 'NEXT CHECK',  text: '약 6주 후 뿌리 자람 상태 점검' },
    ],
  },
  BLEACH: {
    title: 'BLEACH CARE',
    tips: [
      { label: 'MOISTURE / PROTEIN', text: '수분과 단백질 밸런스 관리를 병행합니다.' },
      { label: 'HEAT',               text: '고열 아이론 사용을 최소화합니다.' },
      { label: 'WET HAIR',           text: '젖은 상태에서 강한 빗질이나 당김을 피합니다.' },
      { label: 'TREATMENT',          text: '컨디셔너 또는 트리트먼트를 사용합니다.' },
      { label: 'NEXT CHECK',         text: '3–4주 내 손상 상태 점검 권장. 재탈색 일정은 상태 확인 후 결정합니다.' },
    ],
  },
  CLINIC: {
    title: 'CLINIC CARE',
    tips: [
      { label: 'HOME CARE',  text: '홈케어 트리트먼트를 병행합니다.' },
      { label: 'HEAT',       text: '고열 사용을 줄입니다.' },
      { label: 'DAMAGE',     text: '반복 손상 부위를 집중 관리합니다.' },
      { label: 'NEXT CHECK', text: '3–4주 후 모발 상태 점검' },
    ],
  },
  SCALP: {
    title: 'SCALP CARE',
    tips: [
      { label: 'CONDITION',  text: '두피 상태에 따라 전문적인 관리를 진행합니다.' },
      { label: 'SHAMPOO',    text: '두피 유형에 맞는 샴푸를 선택합니다.' },
      { label: 'RINSE',      text: '샴푸 후 충분히 헹궈줍니다.' },
      { label: 'NOTE',       text: '이상 반응이 지속되면 의료 전문가 상담을 권장합니다.' },
    ],
  },
};

export const HOME_CARE_TIPS: Partial<Record<ServiceKey, string[]>> = {
  CUT:        ['뿌리부터 먼저 말리기', '열기구 사용 전 열 보호제 사용'],
  BANG:       ['세안 후 앞머리 뿌리 바로 말리기', '뿌리에 무거운 제품 사용 줄이기'],
  PERM:       ['젖은 머리 강하게 비비지 않기', '컬 방향대로 손으로 말리기', '열 보호제 사용'],
  ROOT_PERM:  ['뿌리를 눌러 말리지 않기', '두피 가까이 무거운 오일 사용 줄이기'],
  STRAIGHT:   ['시술 직후 심하게 접히거나 강하게 묶는 행동 주의', '고열 사용 줄이기'],
  COLOR:      ['미지근한 물로 샴푸하기', '열 보호제 사용', '자외선과 고열 노출 줄이기'],
  ROOT_COLOR: ['염색 직후 두피 강하게 긁거나 문지르지 않기', '미지근한 물로 샴푸하기'],
  BLEACH:     ['수분과 단백질 밸런스 관리', '고열 아이론 사용 최소화', '젖은 상태 강한 빗질 피하기'],
  CLINIC:     ['손상 부위 트리트먼트 관리', '고열 사용 줄이기', '젖은 모발을 강하게 빗지 않기'],
  SCALP:      ['충분히 헹구기', '지나치게 강한 세정 피하기'],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getServiceWeeks(key: ServiceKey, gender: 'female' | 'male'): [number, number] {
  const meta = SERVICES[key];
  if (gender === 'male' && meta.maleWeeks) return meta.maleWeeks;
  if (gender === 'female' && meta.femaleWeeks) return meta.femaleWeeks;
  return meta.weeks ?? [0, 0];
}

function computeNextCare(services: ServiceKey[], gender: 'female' | 'male') {
  const care = services.filter(s => SERVICES[s].type === 'CARE');
  if (!care.length) return null;
  let minW = Infinity, maxW = Infinity;
  const labels: string[] = [];
  for (const s of care) {
    const [mn, mx] = getServiceWeeks(s, gender);
    if (mn > 0) {
      if (mn < minW) { minW = mn; maxW = mx; }
      labels.push(SERVICES[s].nextLabel);
    }
  }
  return minW === Infinity ? null : { minWeeks: minW, maxWeeks: maxW, services: labels };
}

function computeNextDesign(services: ServiceKey[], gender: 'female' | 'male') {
  const design = services.filter(s => SERVICES[s].type === 'DESIGN');
  if (!design.length) return null;
  let minW = Infinity, maxW = Infinity;
  const labels: string[] = [];
  for (const s of design) {
    const [mn, mx] = getServiceWeeks(s, gender);
    if (mn > 0) {
      if (mn < minW) { minW = mn; maxW = mx; }
      labels.push(SERVICES[s].nextLabel);
    }
  }
  return minW === Infinity ? null : { minWeeks: minW, maxWeeks: maxW, services: labels };
}

function computeCycleEvents(services: ServiceKey[], gender: 'female' | 'male'): CycleEvent[] {
  const MAX_WEEKS = 26;

  // Raw events with key + iteration number
  const raw: { week: number; type: 'CARE' | 'DESIGN'; key: ServiceKey; iter: number }[] = [];
  for (const key of services) {
    const meta = SERVICES[key];
    const [minW] = getServiceWeeks(key, gender);
    if (minW === 0) continue;
    const maxIter = meta.noAutoRepeat ? 1 : Math.ceil(MAX_WEEKS / minW);
    let w = minW;
    for (let i = 0; i < maxIter && w <= MAX_WEEKS; i++) {
      raw.push({ week: w, type: meta.type, key, iter: i + 1 });
      w += minW;
    }
  }
  raw.sort((a, b) => a.week - b.week);

  // Cluster events within 2 weeks of each other
  const clusters: { min: number; max: number; types: Set<string>; items: { key: ServiceKey; iter: number }[] }[] = [];
  for (const ev of raw) {
    const last = clusters[clusters.length - 1];
    if (last && ev.week - last.max <= 2) {
      last.max = ev.week;
      last.types.add(ev.type);
      if (!last.items.find(i => i.key === ev.key && i.iter === ev.iter)) {
        last.items.push({ key: ev.key, iter: ev.iter });
      }
    } else {
      clusters.push({ min: ev.week, max: ev.week, types: new Set([ev.type]), items: [{ key: ev.key, iter: ev.iter }] });
    }
  }

  const events: CycleEvent[] = clusters.map(c => {
    const week = Math.round((c.min + c.max) / 2);
    const hasDesign = c.types.has('DESIGN');
    const type = hasDesign ? 'DESIGN' : 'CARE';

    // Unique service keys in this cluster
    const keySet = [...new Set(c.items.map(i => i.key))];
    const koServices = keySet.map(k => SERVICE_KO[k]);

    // Visit purpose — vary by iteration, combine if multiple services
    const purposeParts = c.items.reduce((acc, { key, iter }) => {
      const p = getVisitPurpose(key, iter);
      if (!acc.includes(p)) acc.push(p);
      return acc;
    }, [] as string[]);
    const purpose = purposeParts.slice(0, 2).join(' · ');

    return {
      offsetWeeks: week,
      label: weekToKoLabel(week),
      monthHint: weekToMonthHint(week),
      type,
      services: koServices,
      purpose,
      note: '',
    };
  });

  // Always close with a 6-month image review (deduplicate if near end)
  const lastW = events[events.length - 1]?.offsetWeeks ?? 0;
  if (lastW < 25) {
    events.push({
      offsetWeeks: 26,
      label: weekToKoLabel(26),
      monthHint: weekToMonthHint(26),
      type: 'REVIEW',
      services: [],
      purpose: '헤어 이미지 재확인',
      note: '',
    });
  } else if (events[events.length - 1]?.type !== 'REVIEW') {
    // last event is at ~26W but not a review — append it
    events.push({
      offsetWeeks: 26,
      label: weekToKoLabel(26),
      monthHint: weekToMonthHint(26),
      type: 'REVIEW',
      services: [],
      purpose: '헤어 이미지 재확인',
      note: '',
    });
  }

  return events;
}

function getHomeCare(services: ServiceKey[]): string[] {
  const seen = new Set<string>();
  const tips: string[] = [];
  for (const s of services) {
    for (const t of HOME_CARE_TIPS[s] ?? []) {
      if (!seen.has(t)) { seen.add(t); tips.push(t); }
    }
  }
  return tips.slice(0, 5);
}

/** 이동 방향 6개. 화면과 리포트가 같은 표를 본다. */
export const DIRECTION_ITEMS: DirectionItem[] = [
  { id: 'length',   label: '길이 변화',   sublabel: '롱 / 미디움 / 단발 / 숏',             en: 'LENGTH',   impact: 3, options: ['유지', '롱', '미디움', '단발', '숏'] },
  { id: 'bangs',    label: '앞머리 변화', sublabel: '시스루 / 풀뱅 / 처피뱅 / 사이드뱅',  en: 'BANG',     impact: 2, options: ['유지', '시스루뱅', '풀뱅', '처피뱅', '사이드뱅', '스틱뱅'] },
  { id: 'color',    label: '컬러 변화',   sublabel: '톤업 / 톤다운 / 컬러변경 / 탈색',    en: 'COLOR',    impact: 2, options: ['유지', '톤업', '톤다운', '컬러변경', '탈색'] },
  { id: 'perm',     label: '컬 / 볼륨',   sublabel: 'C컬 / CS컬 / 볼륨매직 / 웨이브',     en: 'PERM',     impact: 3, options: ['유지', 'C컬', 'CS컬', '볼륨매직', '웨이브'] },
  { id: 'recovery', label: '손상 회복',   sublabel: '홈케어 / 클리닉 진행',               en: 'RECOVERY', impact: 1, options: ['홈케어', '클리닉 진행'] },
  { id: 'image',    label: '이미지 변화', sublabel: '새로운 디자인 / 이미지 재분석',       en: 'IMAGE',    impact: 4, options: ['새로운 디자인', '이미지 재분석'] },
  ];


/** 변화 강도 1~4. changeLevel 0 은 '아직 안 고름'. */
export const CHANGE_LEVELS = [
  { level: 1, label: '안정 유지', color: 'bg-blue-500' },
  { level: 2, label: '소폭 변화', color: 'bg-green-500' },
  { level: 3, label: '중간 변화', color: 'bg-yellow-500' },
  { level: 4, label: '이미지 전환', color: 'bg-red-500' },
];

/**
 * 시안3 화면은 주 단위로 잡는데 지금 리포트는 월 단위(selectedMonths)를 본다.
 * 리포트를 시안3 구조로 갈아탈 때까지 여기서 환산해 같이 실어 보낸다. (2026-09-11)
 */
const SERVICE_TYPE_OF: Record<string, ServiceType> = {
  '커트': 'cut', '앞머리': 'cut',
  '펌': 'perm', '뿌리펌': 'perm', '매직 / 스트레이트': 'perm',
  '전체염색': 'color', '뿌리염색': 'color', '탈색': 'color',
  '클리닉': 'clinic', '두피관리': 'clinic',
};

function toMonthPlan(events: CycleEvent[]): MonthCycleData[] {
  const byMonth = new Map<number, MonthCycleData>();
  for (const ev of events) {
    const month = Math.max(1, Math.round(ev.offsetWeeks / 4.345));
    const entry = byMonth.get(month) ?? { month, services: [], memo: '' };
    for (const ko of ev.services) {
      const t = SERVICE_TYPE_OF[ko];
      if (t && !entry.services.includes(t)) entry.services.push(t);
    }
    entry.memo = entry.memo ? `${entry.memo} · ${ev.purpose}` : ev.purpose;
    byMonth.set(month, entry);
  }
  return [...byMonth.values()].sort((a, b) => a.month - b.month);
}

// ── Component ──────────────────────────────────────────────────────────────

export function NextDirection({
  onBack, onNext, onCycleDataChange, onSubSelectionsChange,
  beforePhoto, afterPhoto, onBeforePhotoChange, onAfterPhotoChange,
  initial,
}: NextDirectionProps) {

  // Direction select state
  const [selectedDirections, setSelectedDirections] = useState<DirectionOption[]>(initial?.directions ?? []);
  const [dirSubSel, setDirSubSel] = useState<Record<string, string>>(initial?.subSelections ?? {});
  // 방향별 메모 — 옵션만으로 못 적는 얘기를 디자이너가 남긴다. 리포트에도 실린다 (2026-09-12)
  const [dirMemo, setDirMemo] = useState<Record<string, string>>(initial?.memos ?? {});
  const [openSubItem, setOpenSubItem] = useState<DirectionOption | null>(null);

  // TODAY SERVICE state
  const [gender, setGender] = useState<'female' | 'male'>(initial?.gender ?? 'female');
  const [todayServices, setTodayServices] = useState<ServiceKey[]>(initial?.todayServices ?? []);
  const [todayDetails, setTodayDetails] = useState<Partial<Record<ServiceKey, string[]>>>((initial?.todayDetails ?? {}) as Partial<Record<ServiceKey, string[]>>);

  // NEXT CARE override
  const [careOverride, setCareOverride] = useState<{ minWeeks: number; maxWeeks: number; services: string[] } | null>(null);
  const [careEditMode, setCareEditMode] = useState(false);
  const [careWeeksInput, setCareWeeksInput] = useState('');

  // NEXT DESIGN override
  const [designOverride, setDesignOverride] = useState<{ minWeeks: number; maxWeeks: number; services: string[] } | null>(null);
  const [designEditMode, setDesignEditMode] = useState(false);
  const [designWeeksInput, setDesignWeeksInput] = useState('');

  // AFTER CARE accordion
  const [openAfterCare, setOpenAfterCare] = useState<ServiceKey | null>(null);

  // Photo input refs
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Computed
  const nextCareAuto = useMemo(() => computeNextCare(todayServices, gender), [todayServices, gender]);
  const nextDesignAuto = useMemo(() => computeNextDesign(todayServices, gender), [todayServices, gender]);
  const cycleEvents = useMemo(() => computeCycleEvents(todayServices, gender), [todayServices, gender]);
  const homeCare = useMemo(() => getHomeCare(todayServices), [todayServices]);

  const nextCare = careOverride ?? nextCareAuto;
  const nextDesign = designOverride ?? nextDesignAuto;

  useEffect(() => {
    onCycleDataChange?.({
      todayServices, todayDetails, gender, nextCare, nextDesign, cycleEvents,
      homeCare: getHomeCare(todayServices),
      subSelections: dirSubSel,
      memos: dirMemo,
      // 아래 셋은 아직 시안3 리포트로 갈아타지 않은 페이지들이 본다
      selectedMonths: toMonthPlan(cycleEvents),
      directions: selectedDirections,
      changeLevel: selectedDirections.length === 0 ? 0 : Math.min(4, Math.round(
        selectedDirections.reduce((sum, id) => sum + (DIRECTION_ITEMS.find(d => d.id === id)?.impact ?? 0), 0) /
        selectedDirections.length,
      )),
    });
  }, [todayServices, todayDetails, gender, careOverride, designOverride, selectedDirections, dirSubSel, dirMemo]);

  const directions = DIRECTION_ITEMS;

  const toggleDirection = (id: DirectionOption) => {
    setOpenSubItem(prev => prev === id ? null : id);
  };

  const pickSubOption = (id: DirectionOption, opt: string) => {
    const next = { ...dirSubSel, [id]: opt };
    setDirSubSel(next);
    setSelectedDirections(prev => {
      const active = opt !== '유지';
      if (active && !prev.includes(id)) return [...prev, id];
      if (!active) return prev.filter(i => i !== id);
      return prev;
    });
    setOpenSubItem(null);
    onSubSelectionsChange?.(next);
  };

  const toggleService = (key: ServiceKey) => {
    setTodayServices(prev => {
      if (prev.includes(key)) {
        setTodayDetails(d => { const n = { ...d }; delete n[key]; return n; });
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
    setCareOverride(null);
    setDesignOverride(null);
  };

  const toggleDetail = (key: ServiceKey, opt: string) => {
    setTodayDetails(prev => {
      const cur = prev[key] ?? [];
      return { ...prev, [key]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] };
    });
  };

  const SectionLabel = ({ children }: { children: string }) => (
    <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', color: '#AAAAAA', marginBottom: 20 }}>{children}</p>
  );

  const SectionHeader = ({ label, title, sub }: { label: string; title: string; sub?: string }) => (
    <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
      <SectionLabel>{label}</SectionLabel>
      <h2 style={{ fontSize: 27, fontWeight: 300, color: '#111111', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{title}</h2>
      {sub && <p style={{ fontSize: 12, color: '#AAAAAA', marginTop: 4, fontWeight: 300 }}>{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Pretendard Variable','Inter',-apple-system,sans-serif" }}>
      <BrandHeader />

      <div className="pt-20 pb-40 max-w-3xl mx-auto px-5">

        {/* Page header */}
        <div className="mb-6">
          <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: '#AAAAAA', marginBottom: 6 }}>NEXT DIRECTION</p>
          <div className="flex items-end justify-between">
            <h1 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#111111', letterSpacing: '-0.01em' }}>퍼스널 리포트</h1>
            <div className="flex items-center gap-2 mb-0.5">
              <button onClick={onBack}
                style={{ padding: '8px 12px', fontSize: 11, letterSpacing: '0.04em', border: '1px solid #E8E8E4', color: '#888888', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}>
                ← 돌아가기
              </button>
              <button onClick={onNext}
                style={{ padding: '9px 16px', fontSize: 11.5, letterSpacing: '0.06em', background: '#1A1A1A', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 500, borderRadius: 2 }}>
                리포트 생성 →
              </button>
            </div>
          </div>
          <div className="mt-4 h-px bg-[#E8E8E4]" />
        </div>

        {/* ── Section 1: NEXT DIRECTION ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }} className="mb-14">
          <SectionHeader label="DIRECTION SELECT" title="NEXT DIRECTION" sub="다음 디자인 제안 방향을 선택해주세요" />

          <div>
            {directions.map((dir, idx) => {
              const isSelected = selectedDirections.includes(dir.id);
              const isOpen = openSubItem === dir.id;
              const selectedOpt = dirSubSel[dir.id];
              return (
                <motion.div key={dir.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + idx * 0.04, duration: 0.35 }}>
                  <div
                    onClick={() => toggleDirection(dir.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '16px 4px',
                      borderBottom: isOpen ? 'none' : '1px solid #EEEEE9',
                      background: isSelected ? '#F8F7F4' : 'transparent',
                      transition: 'background 0.18s ease', cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? '#1A1A1A' : 'transparent',
                      border: `1.5px solid ${isSelected ? '#1A1A1A' : '#CCCCCA'}`,
                      transition: 'all 0.18s ease',
                    }} />
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: isSelected ? '#888880' : '#CCCCCA', width: 70, flexShrink: 0, transition: 'color 0.18s' }}>{dir.en}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: isSelected ? 500 : 300, color: isSelected ? '#111111' : '#777773', letterSpacing: '-0.01em', transition: 'all 0.18s', marginBottom: 2 }}>{dir.label}</p>
                      {/* 고른 값은 행을 펼쳐야만 보였다. 접힌 상태에서도 보이게. (2026-09-11) */}
                      <p style={{ fontSize: 11, fontWeight: 300, color: selectedOpt ? '#8A7B4E' : '#BBBBB6', letterSpacing: '-0.01em' }}>
                        {selectedOpt ?? dir.sublabel}
                      </p>
                      {dirMemo[dir.id] && (
                        <p style={{ fontSize: 11, fontWeight: 300, color: '#888880', marginTop: 2 }}>
                          {dirMemo[dir.id]}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {[1, 2, 3, 4].map(pip => (
                        <div key={pip} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected && pip <= dir.impact ? '#1A1A1A' : '#E0E0DC', transition: 'background 0.18s' }} />
                      ))}
                    </div>
                    <div style={{ marginLeft: 6, color: isOpen ? '#555550' : '#CCCCCA', display: 'flex', alignItems: 'center' }}>
                      <Edit3 size={12} strokeWidth={1.5} />
                    </div>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '10px 4px 14px 97px', borderBottom: '1px solid #EEEEE9', background: '#FAFAF8' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {dir.options.map(opt => {
                            const isCurrent = selectedOpt === opt;
                            return (
                              <button
                                key={opt}
                                onClick={e => { e.stopPropagation(); pickSubOption(dir.id, opt); }}
                                style={{
                                  padding: '7px 16px', fontSize: 13, fontWeight: isCurrent ? 500 : 300,
                                  background: isCurrent ? '#1A1A1A' : '#FFFFFF',
                                  color: isCurrent ? '#FFFFFF' : '#555550',
                                  border: `1px solid ${isCurrent ? '#1A1A1A' : '#E0E0DC'}`,
                                  cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                          {/* 메모 — 옵션만으로 못 적는 얘기를 남긴다 (2026-09-12) */}
                          <input
                            type="text"
                            value={dirMemo[dir.id] ?? ''}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setDirMemo({ ...dirMemo, [dir.id]: e.target.value })}
                            placeholder="메모 (선택)"
                            style={{
                              marginTop: 10, width: '100%', maxWidth: 460, padding: '8px 10px',
                              fontSize: 13, fontFamily: 'inherit', color: '#333330',
                              background: '#FFFFFF', border: '1px solid #E0E0DC', borderRadius: 2, outline: 'none',
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Section 2: Before / After ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="mb-14">
          <SectionHeader label="BEFORE / AFTER" title="시술 전 · 후 사진" sub="등록한 사진은 퍼스널 리포트에 자동으로 반영됩니다" />

          <input type="file" accept="image/*" ref={beforeInputRef} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onBeforePhotoChange?.(URL.createObjectURL(f)); e.target.value = ''; }} />
          <input type="file" accept="image/*" ref={afterInputRef} style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onAfterPhotoChange?.(URL.createObjectURL(f)); e.target.value = ''; }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { label: 'BEFORE', sub: '시술 전', photo: beforePhoto ?? null, onClick: () => beforeInputRef.current?.click(), onRemove: () => onBeforePhotoChange?.(null) },
              { label: 'AFTER',  sub: '시술 후', photo: afterPhoto ?? null,  onClick: () => afterInputRef.current?.click(),  onRemove: () => onAfterPhotoChange?.(null) },
            ] as const).map(({ label, sub, photo, onClick, onRemove }) => (
              <div key={label} style={{ position: 'relative' }}>
                <button onClick={onClick} style={{ display: 'block', width: '100%', aspectRatio: '3/4', overflow: 'hidden', border: '1px solid #E8E8E4', background: photo ? 'none' : '#F8F8F5', cursor: 'pointer', padding: 0, position: 'relative' }}>
                  {photo ? (
                    <>
                      <img src={photo} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.5) 0%, transparent 45%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', padding: '4px 10px', color: '#FFFFFF', background: label === 'BEFORE' ? 'rgba(17,17,17,0.75)' : 'rgba(184,150,60,0.85)' }}>{label}</span>
                      </div>
                      <p style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: MONO, letterSpacing: '0.1em' }}>TAP TO CHANGE</p>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #CCCCCA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 20, color: '#CCCCCA', lineHeight: 1 }}>+</span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.16em', color: label === 'BEFORE' ? '#555550' : '#B8963C', marginBottom: 4 }}>{label}</p>
                        <p style={{ fontSize: 11, color: '#AAAAAA', fontWeight: 300 }}>{sub} 사진 추가</p>
                      </div>
                    </div>
                  )}
                </button>
                {photo && (
                  <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#555550' }}>×</button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Section 3: TODAY SERVICE ──────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }} className="mb-14">
          <div className="pb-5 mb-8" style={{ borderBottom: '1px solid #E8E8E4' }}>
            <SectionLabel>TODAY SERVICE</SectionLabel>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 style={{ fontSize: 27, fontWeight: 300, color: '#111111', letterSpacing: '-0.01em', lineHeight: 1.1 }}>오늘의 시술</h2>
                <p style={{ fontSize: 12, color: '#AAAAAA', marginTop: 4, fontWeight: 300 }}>진행한 시술을 모두 선택해주세요</p>
              </div>
              <div style={{ display: 'flex', border: '1px solid #E0E0DC', overflow: 'hidden', flexShrink: 0 }}>
                {(['female', 'male'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => { setGender(g); setCareOverride(null); setDesignOverride(null); }}
                    style={{
                      padding: '10px 20px', fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em',
                      background: gender === g ? '#1A1A1A' : 'transparent',
                      color: gender === g ? '#FFFFFF' : '#AAAAAA',
                      border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{g === 'female' ? '여성' : '남성'}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5" style={{ gap: 6, marginBottom: 4 }}>
            {SERVICE_ORDER.map(key => {
              const meta = SERVICES[key];
              const isOn = todayServices.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleService(key)}
                  style={{
                    // 고른 버튼을 검정으로 꽉 채우면 시술 목록이 너무 무거워진다.
                    // 옅게 깔고 테두리만 검정으로 — 고른 건 알아보되 튀지 않게. (2026-09-11)
                    padding: '12px 6px', border: `1px solid ${isOn ? '#1A1A1A' : '#E0E0DC'}`,
                    background: isOn ? 'rgba(26,26,26,0.06)' : 'transparent',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: '#555550' }}>{meta.label}</span>
                  <span style={{ fontSize: 15, fontWeight: 400, color: '#AAAAAA' }}>{meta.ko}</span>
                </button>
              );
            })}
          </div>

          {/* Detail options */}
          <AnimatePresence>
            {todayServices.filter(k => SERVICE_DETAILS[k]).map(key => {
              const opts = SERVICE_DETAILS[key]!;
              const selected = todayDetails[key] ?? [];
              return (
                <motion.div key={key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '11px 0', borderTop: '1px solid #EEEEE9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.14em', color: '#AAAAAA', flexShrink: 0, minWidth: 62 }}>{SERVICES[key].label}</span>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {opts.map(opt => {
                        const active = selected.includes(opt);
                        return (
                          <button key={opt} onClick={() => toggleDetail(key, opt)} style={{
                            padding: '4px 11px', fontSize: 11, fontWeight: 300,
                            border: `1px solid ${active ? '#B8963C' : '#E0E0DC'}`,
                            background: active ? 'rgba(184,150,60,0.07)' : 'transparent',
                            color: active ? '#B8963C' : '#888880',
                            cursor: 'pointer', borderRadius: 1, transition: 'all 0.14s',
                          }}>{opt}</button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ── Section 4: AFTER CARE ─────────────────────────────────── */}
        <AnimatePresence>
          {todayServices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="mb-14">
              <SectionHeader label="AFTER CARE" title="관리 방법" sub="오늘 시술 후 홈케어 가이드" />

              {/* Home care summary */}
              {homeCare.length > 0 && (
                <div style={{ background: '#F8F7F4', padding: '18px 18px', marginBottom: 12 }}>
                  <p style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.18em', color: '#AAAAAA', marginBottom: 14 }}>HOME CARE SUMMARY</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {homeCare.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: MONO, fontSize: 8, color: '#B8963C', letterSpacing: '0.1em', flexShrink: 0, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ fontSize: 12.5, color: '#555550', fontWeight: 300, lineHeight: 1.65 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-service accordions */}
              <div>
                {todayServices.map(key => {
                  const care = AFTER_CARE[key];
                  const isOpen = openAfterCare === key;
                  return (
                    <div key={key} style={{ borderBottom: '1px solid #EEEEE9' }}>
                      <button
                        onClick={() => setOpenAfterCare(isOpen ? null : key)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 4px', textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.14em', color: '#AAAAAA', width: 60, flexShrink: 0 }}>{SERVICES[key].label}</span>
                          <span style={{ fontSize: 14, fontWeight: 300, color: '#333330', letterSpacing: '-0.005em' }}>{care.title}</span>
                        </div>
                        <ChevronDown size={14} color="#AAAAAA" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '4px 4px 20px 72px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {care.tips.map((tip, ti) => (
                                <div key={ti} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                  <span style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.12em', color: '#CCCCCA', flexShrink: 0, paddingTop: 3, minWidth: 82 }}>{tip.label}</span>
                                  <span style={{ fontSize: 12.5, color: '#555550', fontWeight: 300, lineHeight: 1.7 }}>{tip.text}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section 5: NEXT VISIT (NEXT CARE + NEXT DESIGN) ──────── */}
        <AnimatePresence>
          {todayServices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="mb-14">
              <SectionHeader label="NEXT VISIT" title="다음 방문 주기" sub="시술 주기를 기반으로 자동 계산됩니다" />

              <div className="grid grid-cols-2" style={{ gap: 10 }}>
                {/* NEXT CARE */}
                <div style={{ border: '1px solid #E8E8E4', padding: '18px 16px' }}>
                  <p style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.18em', color: '#AAAAAA', marginBottom: 14 }}>NEXT CARE</p>
                  {nextCare ? (
                    <>
                      <p style={{ fontSize: 24, fontWeight: 300, color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8 }}>
                        {nextCare.minWeeks === nextCare.maxWeeks
                          ? `${nextCare.minWeeks}W`
                          : `${nextCare.minWeeks}–${nextCare.maxWeeks}W`}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {nextCare.services.map(s => (
                          <span key={s} style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.09em', padding: '2px 7px', border: '1px solid #E0E0DC', color: '#888880' }}>{s}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em', color: careOverride ? '#B8963C' : '#CCCCCA' }}>{careOverride ? 'CUSTOM' : 'AUTO'}</span>
                        {careOverride && <button onClick={() => setCareOverride(null)} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#AAAAAA', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>RESET</button>}
                        {!careEditMode && <button onClick={() => { setCareEditMode(true); setCareWeeksInput(String(nextCare.minWeeks)); }} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#888880', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>}
                      </div>
                      <AnimatePresence>
                        {careEditMode && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input type="number" value={careWeeksInput} onChange={e => setCareWeeksInput(e.target.value)} min={1} max={52} style={{ width: 48, fontSize: 12, border: '1px solid #CCCCCA', padding: '4px 6px', outline: 'none', textAlign: 'center' }} />
                              <span style={{ fontSize: 11, color: '#AAAAAA' }}>주</span>
                              <button onClick={() => { const w = parseInt(careWeeksInput); if (w > 0) setCareOverride({ minWeeks: w, maxWeeks: w, services: nextCare.services }); setCareEditMode(false); }} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', padding: '4px 10px', background: '#1A1A1A', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>완료</button>
                              <button onClick={() => setCareEditMode(false)} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#AAAAAA', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: '#CCCCCA', fontWeight: 300 }}>케어 시술 없음</p>
                  )}
                </div>

                {/* NEXT DESIGN */}
                <div style={{ border: '1px solid #E8E8E4', padding: '18px 16px' }}>
                  <p style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.18em', color: '#AAAAAA', marginBottom: 14 }}>NEXT DESIGN</p>
                  {nextDesign ? (
                    <>
                      <p style={{ fontSize: 24, fontWeight: 300, color: '#111111', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8 }}>
                        {nextDesign.minWeeks === nextDesign.maxWeeks
                          ? `${nextDesign.minWeeks}W`
                          : `${nextDesign.minWeeks}–${nextDesign.maxWeeks}W`}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                        {nextDesign.services.map(s => (
                          <span key={s} style={{ fontFamily: MONO, fontSize: 7.5, letterSpacing: '0.09em', padding: '2px 7px', border: '1px solid #E0E0DC', color: '#888880' }}>{s}</span>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em', color: designOverride ? '#B8963C' : '#CCCCCA' }}>{designOverride ? 'CUSTOM' : 'AUTO'}</span>
                        {designOverride && <button onClick={() => setDesignOverride(null)} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#AAAAAA', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>RESET</button>}
                        {!designEditMode && <button onClick={() => { setDesignEditMode(true); setDesignWeeksInput(String(nextDesign.minWeeks)); }} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#888880', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>수정</button>}
                      </div>
                      <AnimatePresence>
                        {designEditMode && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input type="number" value={designWeeksInput} onChange={e => setDesignWeeksInput(e.target.value)} min={1} max={52} style={{ width: 48, fontSize: 12, border: '1px solid #CCCCCA', padding: '4px 6px', outline: 'none', textAlign: 'center' }} />
                              <span style={{ fontSize: 11, color: '#AAAAAA' }}>주</span>
                              <button onClick={() => { const w = parseInt(designWeeksInput); if (w > 0) setDesignOverride({ minWeeks: w, maxWeeks: w, services: nextDesign.services }); setDesignEditMode(false); }} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', padding: '4px 10px', background: '#1A1A1A', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>완료</button>
                              <button onClick={() => setDesignEditMode(false)} style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.1em', color: '#AAAAAA', background: 'none', border: 'none', cursor: 'pointer' }}>취소</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: '#CCCCCA', fontWeight: 300 }}>디자인 시술 없음</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Section 6: 6 MONTH DESIGN CYCLE ──────────────────────── */}
        <AnimatePresence>
          {todayServices.length > 0 && cycleEvents.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="mb-14">
              <SectionHeader label="6 MONTH DESIGN CYCLE" title="6개월 관리 주기" sub="방문일 기준 자동 계산 — 퍼스널 리포트에 반영됩니다" />

              <div>
                {/* ── 오늘 row ── */}
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {/* Left: 시점 */}
                  <div style={{ width: 100, flexShrink: 0 }}>
                    {/* 아래 줄들과 같은 위계로 — 월이 크고 시점이 작게 */}
                    <p style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', color: '#111111', marginBottom: 2, lineHeight: 1.3 }}>
                      {weekToMonthHint(0)}
                    </p>
                    <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: '#111111', fontWeight: 500, lineHeight: 1.4 }}>
                      오늘
                    </p>
                  </div>
                  {/* Right: 시술명 (TODAY에서는 시술이 primary) */}
                  <div style={{ flex: 1, paddingLeft: 16, borderLeft: '1px solid #E0E0DC', paddingBottom: 32 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
                      {todayServices.map(k => (
                        <span key={k} style={{
                          fontSize: 13, fontWeight: 400, color: '#111111',
                          padding: '2px 10px',
                          border: '1px solid #1A1A1A',
                          letterSpacing: '-0.01em',
                        }}>{SERVICE_KO[k]}</span>
                      ))}
                    </div>
                    <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.12em', color: '#CCCCCA', marginTop: 7 }}>오늘 진행한 시술</p>
                  </div>
                </div>

                {/* ── Future event rows ── */}
                {cycleEvents.map((ev, i) => {
                  const isReview = ev.type === 'REVIEW';
                  const isLast = i === cycleEvents.length - 1;
                  const purposeColor = isReview ? '#B8963C' : '#111111';
                  const borderColor = isLast ? 'transparent' : '#E0E0DC';

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
                      {/* Left: 시점 + 월 */}
                      <div style={{ width: 100, flexShrink: 0, paddingTop: 2 }}>
                        {/* 몇 월인지가 먼저 보여야 한다 — 예전에는 '약 3주 후' 가 크고
                            '10월' 은 10px 연회색이라 눈에 안 들어왔다. (2026-09-11) */}
                        <p className="text-left" style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.01em', color: isReview ? '#B8963C' : '#111111', marginBottom: 2, lineHeight: 1.3 }}>
                          {ev.monthHint}
                        </p>
                        <p className="text-left" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: isReview ? '#C9AE72' : '#AAAAA5', lineHeight: 1.4 }}>
                          {ev.label}
                        </p>
                      </div>

                      {/* Right: 방문 목적 (primary) + 시술명 (secondary) */}
                      <div style={{ flex: 1, paddingLeft: 16, borderLeft: `1px solid ${borderColor}`, paddingBottom: isLast ? 0 : 28 }}>
                        {/* 방문 목적 — primary text */}
                        <p style={{
                          fontSize: 15, fontWeight: 400,
                          color: purposeColor,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.35,
                          marginBottom: ev.services.length > 0 ? 7 : 0,
                          marginTop: 2,
                        }}>{ev.purpose}</p>

                        {/* 관련 시술명 — secondary chips */}
                        {ev.services.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ev.services.map(s => (
                              <span key={s} style={{
                                fontFamily: MONO, fontSize: 10, letterSpacing: '0.09em',
                                padding: '4px 10px',
                                border: `1px solid ${isReview ? 'rgba(184,150,60,0.35)' : '#DDDDD9'}`,
                                color: isReview ? '#B8963C' : '#AAAAAA',
                                background: isReview ? 'rgba(184,150,60,0.05)' : 'transparent',
                              }}>{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Fixed bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', borderTop: '1px solid #E8E8E4', padding: '14px 24px', zIndex: 40 }}>
        <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: '#CCCCCA', textAlign: 'center', lineHeight: 1.8 }}>
          디자인은 고정되지 않으며 얼굴 · 이미지 · 컨디션에 따라 매 방문마다 FIT은 달라질 수 있습니다.
        </p>
      </div>
    </div>
  );
}
