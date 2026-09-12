'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { CycleData, ServiceKey, SERVICE_KO, AFTER_CARE, HOME_CARE_TIPS } from './NextDirection';
import { MONO, IMAP, FORM, PROP, dominantIdx, dominantOf } from './faceAnalysisData';
import { AREA_ITEMS, areaScores } from './AIFaceResultDerived';
import type { MItem } from './faceAnalysisData';
import {
  CONDITION_AXES, conditionOptionOf, type HairConsultingData,
  BANGS_OPTIONS, PARTING_OPTIONS, LENGTH_OPTIONS, CURL_OPTIONS, COLOR_OPTIONS,
} from './HairConsulting';

const COVER_IMAGE = '/new/report-cover.png';

/** 코스 코드 → 리포트에 인쇄할 이름 */
const COURSE_TITLE: Record<string, string> = { '1way': '1WAY', '3way': '3WAY', fit: 'FIT', new: '1WAY' };
const FALLBACK_PHOTO = '/new/face-photo.jpg';

/** 시안이 쓰던 HairStyleKey. 우리 HairConsulting 은 같은 id 를 문자열로 쓴다. */
type HairStyleKey = 'nutral' | 'cute' | 'feminine' | 'fresh' | 'modern';

/** 헤어컨설팅 화면의 스타일 가이드와 같은 표 */
const STYLE_MAP: Record<HairStyleKey, { img: string; en: string; ko: string; note: string }> = {
  nutral:   { img: '/new/style-guide-nutral.png',   en: 'Nutral',   ko: '내추럴',  note: '내추럴한 실루엣과 부드러운 질감이 잘 어울리는 타입입니다. 얼굴 비율, 이목구비의 특징, 라이프스타일을 반영하여 가장 조화로운 스타일을 제안해드립니다.' },
  cute:     { img: '/new/style-guide-cute.png',     en: 'Cute',     ko: '큐트',    note: '사랑스럽고 발랄한 에너지를 담은 스타일입니다. 짧은 기장과 경쾌한 볼륨감으로 생기 있는 인상을 연출합니다.' },
  feminine: { img: '/new/style-guide-feminine.png', en: 'Feminine', ko: '페미닌',  note: '부드럽고 여성스러운 실루엣을 강조한 스타일입니다. 웨이브와 레이어드로 우아하고 로맨틱한 분위기를 더합니다.' },
  fresh:    { img: '/new/style-guide-fresh.png',    en: 'Fresh',    ko: '프레시',  note: '선명하고 경쾌한 인상의 쿨톤 스타일입니다. 단정한 커트와 깔끔한 라인으로 세련된 도시적인 무드를 표현합니다.' },
  modern:   { img: '/new/style-guide-modern.png',   en: 'Modern',   ko: '모던',    note: '쿨하고 시크한 감성의 모던 스타일입니다. 직선적인 라인과 다크한 색감으로 강렬하고 미니멀한 분위기를 연출합니다.' },
};

export interface InfluenceFactor {
  key: string; label: string; score: number;
  result: string; interpretation: string; keywords: string[];
}
export interface ImageProfile {
  type: string; label: string; tone: string; mood: string; keywords: string[];
  /** 이미지맵 칸마다 달린 설명. 시안은 CHIC 문구가 고정이었다. (2026-09-11) */
  desc?: string;
}
export interface HairConditionEntry {
  value: number; level: string; leftLabel: string; rightLabel: string; impact: string;
}
export interface CyclePlanEntry {
  offsetWeeks: number; label: string; services: string[]; note: string;
  /** 9월 · 10월 … — 시점('약 3주 후')보다 이게 먼저 눈에 들어와야 한다 */
  monthHint?: string;
}
export interface CustomerSession {
  customer: { name: string; visitDate: string; designerName: string };
  /** 촬영본. 없으면 예시 사진 */
  facePhotoUrl?: string | null;
  /** 1WAY / 3WAY 등 실제 코스 이름 */
  courseLabel: string;
  report?: { reportNumber?: string; analysisVersion?: string };
  imageAnalysis: {
    finalType: string; finalTypeKo: string; tonePosition: string; moodPosition: string;
    keywords: string[]; warmCoolPct: number; softHardPct: number;
    influenceFactors: InfluenceFactor[];
    coreInterpretation: { headline: string; body: string; keywords: string[]; hairNote: string };
  };
  imageDirection: {
    currentImage: ImageProfile; desiredImage: ImageProfile;
    gapSummary: string; keep: string[]; add: string[]; avoid: string[];
  };
  hairCondition: {
    damage: HairConditionEntry; thickness: HairConditionEntry;
    density: HairConditionEntry; texture: HairConditionEntry;
    possibleDesigns: string[]; cautionDesigns: string[];
  };
  todayDesign: { services: string[]; summary: string };
  cyclePlan: CyclePlanEntry[];
  nextVisit: { minWeeks: number; maxWeeks: number; services: string[]; note: string };
  result: { beforeImage: string | null; afterImage: string | null };
}

// ── Design tokens ──────────────────────────────────────────────────

const G1 = '#111111';
const G2 = '#333333';
const G3 = '#555550';
const G4 = '#888882';
const G5 = '#AAAAAA';
const G6 = '#CCCCCA';
const G7 = '#E2E2DE';
const G8 = '#F2F2EE';
const G9 = '#F8F8F5';
const GOLD = '#B8963C';
const FF: React.CSSProperties = { fontFamily: "'Pretendard Variable','Inter',-apple-system,sans-serif" };

// ── Static data ────────────────────────────────────────────────────

// Map HairStyleKey to IMAP type string
const STYLE_TO_TYPE: Partial<Record<HairStyleKey, string>> = {
  nutral: 'NATURAL', cute: 'CUTE', feminine: 'FEMININE', fresh: 'FRESH', modern: 'MODERN',
};

// Map image type string to IMAP grid [row, col]
const TYPE_POS: Record<string, { row: number; col: number }> = {
  CUTE: { row: 0, col: 0 }, PURE: { row: 0, col: 1 }, FRESH: { row: 0, col: 2 },
  CASUAL: { row: 1, col: 0 }, NATURAL: { row: 1, col: 1 }, CHIC: { row: 1, col: 2 },
  FEMININE: { row: 2, col: 0 }, CLASSIC: { row: 2, col: 1 }, MODERN: { row: 2, col: 2 },
};

// Next visit weeks by service keyword (min, max)
const SERVICE_WEEKS: { keys: string[]; min: number; max: number }[] = [
  { keys: ['CUT', 'BANG', 'CLINIC', 'LAYER'], min: 3, max: 4 },
  { keys: ['ROOT VOLUME', 'ROOT PERM'], min: 4, max: 8 },
  { keys: ['COLOR ROOT'], min: 8, max: 10 },
  { keys: ['FULL COLOR', 'COLOR'], min: 12, max: 16 },
  { keys: ["MEN'S PERM"], min: 12, max: 14 },
  { keys: ["WOMEN'S PERM", 'MAGIC', 'STRAIGHT', 'PERM'], min: 24, max: 26 },
];

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const TL_DEFAULT = [
  { label: 'TODAY',   offsetWeeks: 0,  services: ['CUT', 'BANG', 'LAYER', 'COLOR'],         note: '현재 디자인 방향에 맞게 전체 정돈' },
  { label: 'MONTH 1', offsetWeeks: 5,  services: ['CUT', 'BANG CHECK'],                      note: '앞머리와 얼굴 주변 레이어 정돈' },
  { label: 'MONTH 2', offsetWeeks: 9,  services: ['CLINIC', 'CONDITION CHECK'],              note: '손상도와 모발 건조 상태 점검' },
  { label: 'MONTH 3', offsetWeeks: 13, services: ['CUT', 'COLOR CHECK'],                     note: '퇴색 상태와 전체 실루엣 재정돈' },
  { label: 'MONTH 4', offsetWeeks: 17, services: ['PERM / VOLUME CHECK'],                    note: '모발 상태에 따라 컬 또는 볼륨 추가 여부 결정' },
  { label: 'MONTH 5', offsetWeeks: 21, services: ['CUT', 'CLINIC'],                          note: '전체 상태 점검 및 필요 시 보정' },
  { label: 'MONTH 6', offsetWeeks: 26, services: ['IMAGE CHECK', 'NEW DESIGN CONSULTING'],   note: '현재 이미지 변화 + 다음 헤어 방향 재분석' },
];

// Hair style guide options (CURRENT vs DESIRED per category)

const CHAPTERS = [
  { num: '01', title: 'YOUR IMAGE',      ko: '이미지 분석',    items: ['최종 이미지 타입', '이미지를 결정짓는 요소', '핵심 해석'] },
  { num: '02', title: 'HAIR DIRECTION',  ko: '헤어 방향',      items: ['현재 이미지 & 원하는 이미지', '이미지 GAP', '모질 분석'] },
  { num: '03', title: 'PERSONAL DESIGN', ko: '퍼스널 디자인',  items: ['앞머리 · 가르마 · 길이', '컬감 · 컬러', '오늘의 시술 · 홈케어'] },
  { num: '04', title: 'NEXT & RESULT',   ko: '다음 방향 & 결과', items: ['Next Direction 선택', '6개월 방문 주기 플랜', 'Before / After 기록'] },
];

// ── Session helpers ────────────────────────────────────────────────

function parseVisitDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr + 'T00:00:00');
  const m = dateStr.match(/(\d{4})[.\s]+(\d{1,2})[.\s]+(\d{1,2})/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  return new Date();
}

function addWeeks(base: Date, weeks: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function monthLabel(d: Date): string {
  return MONTH_NAMES[d.getMonth()];
}

function imapDataFor(type: string): ImageProfile {
  const tones = ['Warm', 'Neutral', 'Cool'];
  const moods = ['Soft', 'Natural', 'Hard'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (IMAP[r][c].en.toUpperCase() === type.toUpperCase()) {
        return {
          type: IMAP[r][c].en.toUpperCase(),
          label: IMAP[r][c].ko,
          tone: tones[c],
          mood: moods[r],
          keywords: (IMAP[r][c].kw as string[]).map((k: string) => `#${k}`),
          desc: IMAP[r][c].desc,
        };
      }
    }
  }
  return { type, label: type, tone: 'Neutral', mood: 'Natural', keywords: [], desc: '' };
}

function calcNextVisit(services: string[]): { minWeeks: number; maxWeeks: number } {
  let minW = 999, maxW = 999;
  for (const svc of services) {
    const upper = svc.toUpperCase();
    for (const entry of SERVICE_WEEKS) {
      if (entry.keys.some(k => upper.includes(k))) {
        if (entry.min < minW) { minW = entry.min; maxW = entry.max; }
        break;
      }
    }
  }
  return minW === 999 ? { minWeeks: 3, maxWeeks: 4 } : { minWeeks: minW, maxWeeks: maxW };
}

function buildCyclePlan(cycleData: CycleData | null): CyclePlanEntry[] {
  if (cycleData?.cycleEvents && cycleData.cycleEvents.length > 0) {
    const svcLabel: Record<string, string> = {
      CUT: 'CUT', BANG: 'BANG', PERM: 'PERM', ROOT_PERM: 'ROOT PERM',
      STRAIGHT: 'STRAIGHT', COLOR: 'COLOR', ROOT_COLOR: 'ROOT COLOR',
      BLEACH: 'BLEACH', CLINIC: 'CLINIC', SCALP: 'SCALP',
    };
    const todayEntry: CyclePlanEntry = {
      offsetWeeks: 0,
      label: '오늘',
      monthHint: `${new Date().getMonth() + 1}월`,
      services: cycleData.todayServices.map(s => svcLabel[s] ?? s),
      note: '오늘 진행한 시술',
    };
    const entries: CyclePlanEntry[] = cycleData.cycleEvents.map(e => ({
      offsetWeeks: e.offsetWeeks,
      label: e.label,
      monthHint: e.monthHint,
      services: e.services,
      note: e.purpose || e.note,
    }));
    return [todayEntry, ...entries];
  }
  return TL_DEFAULT.map(t => ({ offsetWeeks: t.offsetWeeks, label: t.label, services: t.services, note: t.note }));
}

interface BuildArgs {
  customerName: string;
  consultDate: string;
  designerName: string;
  cycleData: CycleData | null;
  /** 이목구비 화면에서 확정한 축 위치 0~1. 여기서 고유 이미지타입이 나온다 */
  facePosMap: Record<string, number>;
  /** 헤어컨설팅 이미지맵에서 디자이너가 고른 추구미 */
  hairTargetType: string | null;
  hairCondition: HairConsultingData['condition'] | null;
  facePhotoUrl: string | null;
  courseLabel: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
}

function buildSession({
  customerName, consultDate, designerName, cycleData,
  facePosMap, hairTargetType, hairCondition, facePhotoUrl, courseLabel, beforePhoto, afterPhoto,
}: BuildArgs): CustomerSession {
  // 고유미 — 이목구비 20항목 다수결. 측정이 하나도 없으면 판정하지 않는다.
  const colIdx = dominantIdx(FORM, facePosMap);  // 0=Warm 1=Neutral 2=Cool
  const rowIdx = dominantIdx(PROP, facePosMap);  // 0=Soft 1=Neutral 2=Hard
  const cell = colIdx != null && rowIdx != null ? IMAP[rowIdx][colIdx] : null;
  const currentType = cell?.en ?? 'NATURAL';
  const desiredType = hairTargetType ?? currentType;
  const curImg = imapDataFor(currentType);
  const desImg = imapDataFor(desiredType);

  // 부위별 영향도 — 이목구비 화면의 '이미지를 결정짓는 요소' 와 같은 계산.
  // 측정이 없으면 0 이 되므로 그 부위는 빼고 보여준다. (2026-09-11)
  const FACTOR_KEY: Record<string, string> = {
    '눈': 'eyes', '코': 'nose', '입술': 'lips', '페이스라인': 'face_line', '눈썹': 'brow',
  };
  const measured = areaScores(facePosMap)
    .filter(a => a.value > 0)
    .sort((a, b) => b.value - a.value);

  const factors: InfluenceFactor[] = measured.map(({ area, value }) => {
    // 그 부위에서 가장 많이 치우친 항목을 대표로 뽑아 결과 문구를 만든다
    const ids = AREA_ITEMS.find(a => a.area === area)?.ids ?? [];
    const lead = ids
      .map(id => ({ id, pos: facePosMap[id] }))
      .filter((x): x is { id: string; pos: number } => x.pos != null)
      .sort((a, b) => Math.abs(b.pos - 0.5) - Math.abs(a.pos - 0.5))[0];
    const item: MItem | null = lead ? ([...FORM, ...PROP].find(it => it.id === lead.id) ?? null) : null;
    const side = lead && item ? (lead.pos >= 0.5 ? item.r : item.l) : '';
    return {
      key: FACTOR_KEY[area] ?? area,
      label: area,
      score: value,
      result: item ? `${item.title} ${side}` : '측정값 없음',
      interpretation: item?.desc ?? '',
      keywords: item?.tags ?? [],
    };
  });

  // 판정이 아예 없을 때 리포트가 텅 비지 않게 — 문구로 상태를 알린다
  const topFactor = factors[0] ?? {
    key: 'none', label: '이목구비', score: 0, result: '미측정',
    interpretation: '', keywords: [],
  };

  const gapSummary = currentType === desiredType
    ? `현재의 ${curImg.label} 이미지를 더욱 완성도 있게 발전시킵니다.`
    : `${curImg.label}의 특성은 유지하면서, ${desImg.label} 이미지로의 자연스러운 전환을 헤어로 표현합니다.`;

  // 오늘의 시술 — 퍼스널 리포트 화면에서 고른 값. 시안은 CUT/LAYER/COLOR 고정이었다.
  const todayServices = (cycleData?.todayServices ?? []).map(k => k.replace('_', ' '));
  const { minWeeks, maxWeeks } = calcNextVisit(todayServices);

  // Auto-generate report number from visit date
  const vd = parseVisitDate(consultDate);
  const reportNumber = `PH-${vd.getFullYear()}-${String(vd.getMonth() + 1).padStart(2, '0')}${String(vd.getDate()).padStart(2, '0')}-001`;

  // 모질 — 헤어컨설팅에서 고른 4축. 안 고른 축은 '미진단' 으로 남긴다. (2026-09-11)
  const CONDITION_META: Record<string, { left: string; right: string }> = {
    damage:    { left: '건강모', right: '초극손상' },
    thickness: { left: '얇음',   right: '굵음' },
    density:   { left: '적음',   right: '많음' },
    curl:      { left: '직모',   right: '강곱슬' },
  };
  const conditionEntries = Object.fromEntries(
    CONDITION_AXES.map(({ key }) => {
      const opt = conditionOptionOf(key, hairCondition?.[key]);
      const meta = CONDITION_META[key];
      // 슬라이더 위치는 고른 단계가 몇 번째인지로 잡는다 (id 가 '1','2','3'…)
      const step = Number(hairCondition?.[key]);
      const value = Number.isFinite(step) ? Math.min(1, Math.max(0, (step - 0.5) / 4)) : 0.5;
      return [key === 'curl' ? 'texture' : key, {
        value,
        level: opt?.label ?? '미진단',
        leftLabel: meta.left,
        rightLabel: meta.right,
        impact: opt?.note ?? '이번 컨설팅에서 진단하지 않았습니다.',
      }];
    }),
  ) as Pick<CustomerSession['hairCondition'], 'damage' | 'thickness' | 'density' | 'texture'>;

  return {
    customer: { name: customerName || '', visitDate: consultDate, designerName: designerName || '' },
    facePhotoUrl,
    courseLabel,
    report: { reportNumber },
    imageAnalysis: {
      finalType: curImg.type,
      finalTypeKo: curImg.label,
      tonePosition: curImg.tone,
      moodPosition: curImg.mood,
      keywords: curImg.keywords,
      warmCoolPct: curImg.tone === 'Cool' ? 72 : curImg.tone === 'Warm' ? 28 : 50,
      softHardPct: curImg.mood === 'Hard' ? 75 : curImg.mood === 'Soft' ? 15 : 40,
      influenceFactors: factors,
      coreInterpretation: {
        headline: factors.length
          ? `${topFactor.label}이(가) 인상을 결정한다`
          : '아직 얼굴 분석 결과가 없습니다',
        body: factors.length
          ? `${topFactor.score}%의 영향도를 가진 ${topFactor.label}의 ${topFactor.result}이(가) 전체 인상의 핵심입니다. ${curImg.label} 분위기는 이 요소에서 출발합니다.`
          : '이목구비 분석을 진행하면 어떤 부위가 인상을 끌고 가는지 여기에 정리됩니다.',
        keywords: (cell?.kw ?? []).map(k => `#${k}`),
        hairNote: '선명한 이목구비를 가리지 않는 헤어 디자인이 효과적입니다. 얼굴 선이 보이는 스타일링이 이미지를 강화합니다.',
      },
    },
    imageDirection: {
      currentImage: curImg,
      desiredImage: desImg,
      gapSummary,
      keep: curImg.keywords.slice(0, 3).map(k => k.replace('#', '')),
      add: desImg.keywords.slice(0, 3).map(k => k.replace('#', '')),
      avoid: ['과도한 무게감', '강한 직선', '플랫함'],
    },
    hairCondition: {
      ...conditionEntries,
      possibleDesigns: ['CUT', 'BANG', 'LAYER', 'COLOR'],
      cautionDesigns: ['STRONG PERM', 'BLEACH'],
    },
    todayDesign: {
      services: todayServices,
      summary: todayServices.length
        ? `현재의 ${curImg.label} 인상은 유지하면서 얼굴 주변에 자연스러운 움직임을 더합니다.`
        : '오늘 진행한 시술을 선택하지 않았습니다.',
    },
    cyclePlan: buildCyclePlan(cycleData),
    nextVisit: {
      minWeeks,
      maxWeeks,
      services: minWeeks <= 4 ? ['CUT', 'BANG CHECK'] : ['COLOR TOUCH'],
      note: `현재 디자인 유지 기준, 약 ${minWeeks}–${maxWeeks}주 후 첫 디자인 점검을 권장합니다.`,
    },
    result: { beforeImage: null, afterImage: null },
  };
}

// ── Shared primitives ──────────────────────────────────────────────

function SectionLabel({ children, gold }: { children: string; gold?: boolean }) {
  return <p className="text-center" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.26em', color: gold ? GOLD : G4, marginBottom: 12 }}>{children}</p>;
}
function HDivider({ mt = 56, mb = 56 }: { mt?: number; mb?: number }) {
  return null;
}
function Chip({ label, muted }: { label: string; muted?: boolean }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', border: `1px solid ${G7}`, color: muted ? G5 : G3, background: muted ? G9 : '#FFFFFF', whiteSpace: 'nowrap' }}>{label}</span>;
}
function ScaleBar({ value, leftLabel, rightLabel }: { value: number; leftLabel: string; rightLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
      <span style={{ fontFamily: MONO, fontSize: 9, color: G5, width: 48, textAlign: 'right', flexShrink: 0 }}>{leftLabel}</span>
      <div style={{ flex: 1, height: 1, background: G7, position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: `${value * 100}%`, transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: G1, border: '1.5px solid #FFF', boxShadow: `0 0 0 1px ${G1}` }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9, color: G5, width: 48, flexShrink: 0 }}>{rightLabel}</span>
    </div>
  );
}
function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-10" style={{ paddingTop: 64, paddingBottom: 80 }}>
      {children}
    </div>
  );
}

// ── Sticky report header ───────────────────────────────────────────

function ReportHeader({ page, onBack, onPrev, onNext }: { page: number; onBack: () => void; onPrev: () => void; onNext: () => void }) {
  const LABELS = ['', 'YOUR IMAGE', 'HAIR DIRECTION', 'NEXT DIRECTION', 'YOUR RESULT'];
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(255,255,255,0.97)', borderBottom: `1px solid ${G8}`, backdropFilter: 'blur(8px)' }}>
      <div className="max-w-3xl mx-auto px-5 lg:px-10" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 60 }}>
        <div>
          <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.28em', color: G4 }}>MERCI MOMONG · PERSONAL HAIR REPORT</p>
          {page > 0 && <p style={{ fontFamily: MONO, fontSize: 10, color: G1, fontWeight: 600, marginTop: 2, letterSpacing: '0.1em' }}>{String(page).padStart(2, '0')} / 04 · {LABELS[page]}</p>}
        </div>
        {page > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontSize: 13, color: page === 1 ? G6 : G3, fontFamily: MONO, minHeight: 44 }}>← 이전</button>
            <div style={{ display: 'flex', gap: 5 }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ width: i === page ? 20 : 6, height: 5, borderRadius: 3, background: i === page ? G1 : G7, transition: 'all 0.25s' }} />)}
            </div>
            <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontSize: 13, color: page === 4 ? G6 : G1, fontFamily: MONO, fontWeight: 500, minHeight: 44 }}>
              {page === 4 ? '완료' : '다음 →'}
            </button>
          </div>
        )}
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', minHeight: 44 }}>
          <ArrowLeft size={13} color={G3} strokeWidth={1.5} />
          <span style={{ fontSize: 13, color: G3, fontFamily: MONO, letterSpacing: '0.06em' }}>돌아가기</span>
        </button>
      </div>
    </div>
  );
}

// ── COVER ──────────────────────────────────────────────────────────

function Cover({ onStart, session }: { onStart: () => void; session: CustomerSession }) {
  return (
    <motion.div key="cover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div className="max-w-3xl mx-auto" style={{ position: 'relative', height: 'calc(100vh - 60px)', minHeight: 520, overflow: 'hidden' }}>
        <img src={COVER_IMAGE} alt="MERCI MOMONG Personal Hair Report" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.65) 0%, rgba(10,8,6,0.08) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <div className="max-w-3xl mx-auto px-5 lg:px-10" style={{ paddingBottom: 56 }}>
            <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>YOUR PERSONAL REPORT</p>
            {session.customer.name && (
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.26em', color: 'rgba(255,255,255,0.35)', marginBottom: 7 }}>FOR</p>
                <p style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.04em', lineHeight: 1.2 }}>{session.customer.name}</p>
              </div>
            )}
            <p style={{ fontSize: 32, fontWeight: 200, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.35, marginBottom: 10 }} className="text-[26px] lg:text-[32px]">'Be yourself'</p>
            <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36 }}>모든 사람들이 자신의 아름다움을 발견하고<br />스스로를 사랑할 수 있도록 돕습니다.</p>
            <button onClick={onStart} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '14px 28px', background: '#FFFFFF', border: 'none', cursor: 'pointer', minHeight: 52 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: G1, letterSpacing: '0.14em' }}>리포트 시작하기</span>
              <ArrowRight size={12} color={G1} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
      <div style={{ borderBottom: `1px solid ${G7}` }}>
        <div className="max-w-3xl mx-auto px-5 lg:px-10">
          <div style={{ borderLeft: `1px solid ${G7}`, display: 'flex' }}>
            {[
              { label: 'CLIENT',        value: session.customer.name || '—' },
              { label: 'ANALYSIS DATE', value: session.customer.visitDate || '—' },
              ...(session.customer.designerName ? [{ label: 'DESIGNER', value: session.customer.designerName }] : []),
              { label: 'REPORT', value: '01 – 04' },
            ].map(r => (
              <div key={r.label} style={{ padding: '18px 20px', borderRight: `1px solid ${G7}`, flex: 1 }}>
                <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.22em', color: G5, marginBottom: 5 }}>{r.label}</p>
                <p style={{ fontSize: 13, color: G1, fontWeight: 300 }}>{r.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── PAGE 01: YOUR IMAGE ────────────────────────────────────────────

function Page01({ session }: { session: CustomerSession }) {
  const [openFactor, setOpenFactor] = useState<number | null>(null);
  const { imageAnalysis } = session;
  const factors = [...imageAnalysis.influenceFactors].sort((a, b) => b.score - a.score);
  const ci = imageAnalysis.coreInterpretation;

  const { customer, report } = session;
  const hasName = !!customer.name;
  const hasDesigner = !!customer.designerName;
  const hasReportNo = !!report?.reportNumber;

  return (
    <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      <Wrap>

        {/* ── Client Information Header ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-8 sm:gap-12 lg:gap-16" style={{ marginBottom: 56, paddingBottom: 52, borderBottom: `1px solid ${G7}` }}>

          {/* Left: name block */}
          <div>
            <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.28em', color: G5, marginBottom: 16 }}>CLIENT</p>
            <p style={{ fontSize: hasName ? 34 : 18, fontWeight: 300, color: hasName ? G1 : G5, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 12 }}>
              {hasName ? customer.name : '고객 이름 미입력'}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.22em', color: G6 }}>{session.courseLabel} PERSONAL HAIR CONSULTING</p>
          </div>

          {/* Right: meta — 라벨 위 / 값 아래로 한 줄씩 쌓는다.
              시안은 분석일과 리포트번호가 가로로 붙어 있었다. (2026-09-11)
              오른쪽 끝으로 붙인다 — 왼쪽 CLIENT 블록과 양 끝에서 마주보게 (2026-09-12) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, alignItems: 'flex-end', textAlign: 'right' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.24em', color: G5, marginBottom: 6 }}>ANALYSIS DATE</p>
                <p style={{ fontSize: 13, color: G2, fontWeight: 300 }}>{customer.visitDate || '—'}</p>
              </div>
              {hasReportNo && (
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.24em', color: G5, marginBottom: 6 }}>REPORT NO.</p>
                  <p style={{ fontFamily: MONO, fontSize: 10, color: G3, letterSpacing: '0.04em' }}>{report!.reportNumber}</p>
                </div>
              )}
              {hasDesigner && (
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 7, letterSpacing: '0.24em', color: G5, marginBottom: 6 }}>DESIGNER</p>
                  <p style={{ fontSize: 13, color: G2, fontWeight: 300 }}>{customer.designerName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <SectionLabel>FINAL IMAGE TYPE</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, letterSpacing: '-0.01em', marginBottom: 48 }}>최종 이미지 타입</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16" style={{ marginBottom: 0, alignItems: 'start' }}>
          <div style={{ background: G9 }}>
            <img src={session.facePhotoUrl || FALLBACK_PHOTO} alt="얼굴 분석" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
          </div>
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', color: G4, marginBottom: 8 }}>{imageAnalysis.finalType} TYPE · 고유미</p>
            <p style={{ fontSize: 64, fontWeight: 700, color: G1, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{imageAnalysis.finalType}</p>
            <p style={{ fontSize: 24, fontWeight: 300, color: G3, marginBottom: 28 }}>{imageAnalysis.finalTypeKo}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
              {imageAnalysis.keywords.map(k => <Chip key={k} label={k} />)}
            </div>
            <p style={{ fontSize: 15, color: G2, lineHeight: 1.85, fontWeight: 300, marginBottom: 40 }}>
              {imapDataFor(session.imageAnalysis.finalType).desc}
            </p>
            <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: G4, marginBottom: 16 }}>IMAGE POSITION</p>
            {[
              { left: 'WARM', right: 'COOL', pct: imageAnalysis.warmCoolPct },
              { left: 'SOFT', right: 'HARD', pct: imageAnalysis.softHardPct },
            ].map(bar => (
              <div key={bar.left} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: G5 }}>{bar.left}</span>
                  <span style={{ fontFamily: MONO, fontSize: 8, color: G5 }}>{bar.right}</span>
                </div>
                <div style={{ height: 2, background: G8, borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', background: G1, borderRadius: 2 }} initial={{ width: 0 }} animate={{ width: `${bar.pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </div>
            ))}
            <div style={{ padding: '16px 0', borderTop: `1px solid ${G8}`, marginTop: 8 }}>
              <p style={{ fontFamily: MONO, fontSize: 8, color: G5, marginBottom: 4 }}>YOUR POSITION</p>
              <p style={{ fontSize: 20, fontWeight: 600, color: G1 }}>{imageAnalysis.tonePosition} × {imageAnalysis.moodPosition}</p>
            </div>
          </div>
        </div>

        <HDivider />

        <SectionLabel>IMAGE DECISION FACTORS</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, letterSpacing: '-0.01em', marginBottom: 48 }}>이미지를 결정짓는 요소</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-10">
          <div>
            {factors.map((f, i) => (
              <div key={f.key}>
                <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: `1px solid ${G8}` }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, color: i === 0 ? GOLD : G6, width: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={{ width: 80, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: G2 }}>{f.label}</span>
                    <span style={{ fontFamily: MONO, fontSize: 8, color: G5, display: 'block', marginTop: 2 }}>{f.key.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div style={{ flex: 1, height: 2, background: G8, borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', background: i === 0 ? G1 : G6, borderRadius: 2 }} initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: i === 0 ? G1 : G4, fontWeight: i === 0 ? 700 : 400, width: 36, textAlign: 'right', flexShrink: 0 }}>{f.score}%</span>
                </div>
                <div className="block sm:hidden">
                  <button onClick={() => setOpenFactor(openFactor === i ? null : i)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12, padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${G8}`, minHeight: 56 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: i === 0 ? GOLD : G6, width: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: G1 }}>{f.label}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: i === 0 ? G1 : G4 }}>{f.score}%</span>
                      </div>
                      <div style={{ height: 1.5, background: G8, overflow: 'hidden', borderRadius: 2 }}>
                        <motion.div style={{ height: '100%', background: i === 0 ? G1 : G6 }} initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 0.9, delay: i * 0.05 }} />
                      </div>
                    </div>
                    <ChevronDown size={14} color={G5} style={{ transform: openFactor === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                  </button>
                  <AnimatePresence>
                    {openFactor === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '12px 32px 16px' }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: G2, marginBottom: 6 }}>{f.result}</p>
                          <p style={{ fontSize: 13, color: G4, lineHeight: 1.7, fontWeight: 300 }}>{f.interpretation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
          <div className="sm:border-l sm:border-[#E2E2DE] sm:pl-8">
            <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G4, marginBottom: 20 }}>CORE INTERPRETATION</p>
            <p style={{ fontSize: 22, fontWeight: 600, color: G1, marginBottom: 16 }}>{ci.headline}</p>
            <p style={{ fontSize: 15, color: G2, lineHeight: 1.85, fontWeight: 300, marginBottom: 32 }}>{ci.body}</p>
            <div style={{ height: 1, background: G8, marginBottom: 24 }} />
            <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G4, marginBottom: 12 }}>TOP KEYWORDS</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 32 }}>
              {ci.keywords.map(k => <Chip key={k} label={k} />)}
            </div>
            <div style={{ padding: '20px', background: G9 }}>
              <p style={{ fontFamily: MONO, fontSize: 8, color: G5, marginBottom: 8 }}>HAIR DIRECTION NOTE</p>
              <p style={{ fontSize: 13, color: G3, lineHeight: 1.75, fontWeight: 300 }}>{ci.hairNote}</p>
            </div>
          </div>
        </div>
      </Wrap>
    </motion.div>
  );
}

// ── PAGE 02: YOUR HAIR DIRECTION ───────────────────────────────────

function Page02({ session, hairStyle, guideStyles = [] }: {
  session: CustomerSession;
  /** 헤어컨설팅에서 고른 스타일 5축 */
  hairStyle: HairConsultingData['style'] | null;
  guideStyles?: HairStyleKey[];
}) {
  const [clickedCell, setClickedCell] = useState<{ row: number; col: number } | null>(null);

  const { imageDirection, hairCondition } = session;
  const CURRENT = TYPE_POS[imageDirection.currentImage.type] ?? { row: 1, col: 2 };
  const DESIRED = TYPE_POS[imageDirection.desiredImage.type] ?? { row: 1, col: 1 };

  const conditions = [
    { id: 'damage',    en: 'DAMAGE',    ko: '손상도',    ...hairCondition.damage },
    { id: 'thickness', en: 'THICKNESS', ko: '모발 굵기', ...hairCondition.thickness },
    { id: 'density',   en: 'DENSITY',   ko: '모발 숱',   ...hairCondition.density },
    { id: 'texture',   en: 'TEXTURE',   ko: '곱슬 정도', ...hairCondition.texture },
  ];

  return (
    <motion.div key="p2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      <Wrap>
        <SectionLabel>IMAGE MAP</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, letterSpacing: '-0.01em', marginBottom: 48 }}>현재 이미지와 원하는 이미지</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-10 sm:gap-12 lg:gap-16 items-stretch">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', marginBottom: 6, paddingLeft: 40 }}>
              {['Warm', 'Neutral', 'Cool'].map(c => <div key={c} style={{ flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 8, color: G6, letterSpacing: '0.12em' }}>{c}</div>)}
            </div>
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              <div style={{ width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {['Soft', 'Natural', 'Hard'].map(r => <div key={r} style={{ fontFamily: MONO, fontSize: 7, color: G6, writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.12em', alignSelf: 'center', padding: '14px 0' }}>{r}</div>)}
              </div>
              <div style={{ flex: 1, border: `1px solid ${G7}`, display: 'flex', flexDirection: 'column' }}>
                {[0, 1, 2].map(row => (
                  <div key={row} style={{ display: 'flex', flex: 1 }}>
                    {[0, 1, 2].map(col => {
                      const cell = IMAP[row][col];
                      const isCur = row === CURRENT.row && col === CURRENT.col;
                      const isDes = row === DESIRED.row && col === DESIRED.col;
                      const isCl = clickedCell?.row === row && clickedCell?.col === col;
                      return (
                        <button key={col} onClick={() => setClickedCell(isCl ? null : { row, col })} style={{ flex: 1, border: 'none', borderRight: col < 2 ? `1px solid ${G8}` : 'none', borderBottom: row < 2 ? `1px solid ${G8}` : 'none', padding: '18px 8px', cursor: 'pointer', background: isCur ? '#EEEDE8' : isDes ? 'rgba(184,150,60,0.06)' : '#FFFFFF', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 96 }}>
                          {isCur && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: G1 }} />}
                          {isDes && <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: GOLD }} />}
                          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: isCur ? G1 : isDes ? '#7A6020' : G5 }}>{cell.en}</span>
                          <span style={{ fontSize: 11, fontWeight: 300, color: isCur ? G3 : isDes ? '#9A7C2A' : G6 }}>{cell.ko}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {clickedCell && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <div style={{ padding: '14px 16px', background: G9, border: `1px solid ${G7}`, marginTop: 12 }}>
                    <p style={{ fontFamily: MONO, fontSize: 8, color: G5, marginBottom: 6 }}>{IMAP[clickedCell.row][clickedCell.col].en} · {IMAP[clickedCell.row][clickedCell.col].ko}</p>
                    <p style={{ fontSize: 13, color: G2, lineHeight: 1.7, fontWeight: 300 }}>{IMAP[clickedCell.row][clickedCell.col].desc}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ padding: '20px', border: `1px solid ${G7}` }}>
              <p style={{ fontFamily: MONO, fontSize: 8, color: G4, marginBottom: 8 }}>CURRENT IMAGE</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: G1, marginBottom: 4 }}>{imageDirection.currentImage.type}</p>
              <p style={{ fontSize: 13, color: G4, marginBottom: 12 }}>{imageDirection.currentImage.label} · {imageDirection.currentImage.tone} × {imageDirection.currentImage.mood}</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {imageDirection.currentImage.keywords.map(k => <Chip key={k} label={k} muted />)}
              </div>
            </div>
            {imageDirection.desiredImage.type !== imageDirection.currentImage.type ? (
              <div style={{ padding: '20px', border: `1px solid rgba(184,150,60,0.3)`, background: 'rgba(184,150,60,0.03)' }}>
                <p style={{ fontFamily: MONO, fontSize: 8, color: GOLD, marginBottom: 8 }}>DESIRED IMAGE</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#7A6020', marginBottom: 4 }}>{imageDirection.desiredImage.type}</p>
                <p style={{ fontSize: 13, color: '#9A7C2A', marginBottom: 12 }}>{imageDirection.desiredImage.label} · {imageDirection.desiredImage.tone} × {imageDirection.desiredImage.mood}</p>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {imageDirection.desiredImage.keywords.map(k => <Chip key={k} label={k} muted />)}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', border: `1px solid ${G7}`, background: G9 }}>
                <p style={{ fontFamily: MONO, fontSize: 8, color: G5, marginBottom: 8 }}>DESIRED IMAGE</p>
                <p style={{ fontSize: 14, color: G4, fontWeight: 300 }}>원하는 이미지를 선택해주세요</p>
              </div>
            )}
            <div style={{ padding: '20px', borderLeft: `2px solid ${GOLD}`, background: 'rgba(184,150,60,0.04)' }}>
              <p style={{ fontFamily: MONO, fontSize: 8, color: GOLD, marginBottom: 8 }}>YOUR GAP</p>
              <p style={{ fontSize: 14, color: G2, lineHeight: 1.75, fontWeight: 300 }}>{imageDirection.gapSummary}</p>
            </div>
          </div>
        </div>


        {/* ── STYLE GUIDE REFERENCE ────────────────────────────────── */}
        {guideStyles.length > 0 && (
          <>
            <HDivider />
            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 0, border: `1px solid ${G7}` }}>

              {/* Left: keyword grid */}
              <div style={{ borderRight: `1px solid ${G7}`, padding: '32px 28px 28px' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', color: G3, marginBottom: 2 }}>STYLE CONSULTING</p>
                <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G5, marginBottom: 24 }}>HAIR STYLE GUIDE</p>

                {/* 3×3 IMAP keyword grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: G7 }}>
                  {IMAP.flat().map(cell => {
                    const hKey = (Object.entries(STYLE_TO_TYPE) as [HairStyleKey, string][]).find(([, v]) => v === cell.en)?.[0];
                    const isSel = hKey ? guideStyles.includes(hKey) : false;
                    return (
                      <div
                        key={cell.en}
                        style={{
                          background: isSel ? G9 : '#FFFFFF',
                          padding: '18px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          minHeight: 72,
                          position: 'relative',
                        }}
                      >
                        {isSel && (
                          <div style={{
                            position: 'absolute',
                            inset: 6,
                            border: `1.5px solid ${G3}`,
                            borderRadius: '50%',
                            pointerEvents: 'none',
                          }} />
                        )}
                        <span style={{
                          fontSize: 13,
                          fontWeight: isSel ? 500 : 300,
                          color: isSel ? G1 : G5,
                          letterSpacing: '-0.01em',
                        }}>{cell.en.toLowerCase()}</span>
                        <span style={{
                          fontSize: 10,
                          color: isSel ? G3 : G6,
                          fontWeight: 300,
                        }}>{cell.ko}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom: selected style names */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${G8}`, display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G5, flexShrink: 0 }}>FIND YOUR STYLE</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {guideStyles.map(k => (
                      <span key={k} style={{ fontSize: 16, fontWeight: 600, color: G1, letterSpacing: '-0.01em' }}>
                        {STYLE_MAP[k].en}
                        <span style={{ fontSize: 12, color: G4, fontWeight: 300, marginLeft: 6 }}>{STYLE_MAP[k].ko}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: photo(s) with overlay */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${G8}` }}>
                  <div style={{ flex: 1, height: 1, background: G8 }} />
                  <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G5, flexShrink: 0 }}>FIND YOUR STYLE</p>
                </div>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: guideStyles.length > 1 ? 'repeat(2, 1fr)' : '1fr', gap: 1, background: G7 }}>
                  {guideStyles.map(key => {
                    const s = STYLE_MAP[key];
                    return (
                      <div key={key} style={{ position: 'relative', aspectRatio: guideStyles.length > 1 ? '3/4' : '4/3', overflow: 'hidden' }}>
                        <img src={s.img} alt={s.en} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          padding: '20px 18px',
                        }}>
                          <p style={{ fontSize: guideStyles.length > 1 ? 22 : 28, fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{s.en}</p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 300, marginTop: 4 }}>{s.ko}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Note for first selected style */}
                <div style={{ padding: '16px 24px', borderTop: `1px solid ${G8}` }}>
                  <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.18em', color: G5, marginBottom: 6 }}>STYLE NOTE</p>
                  <p style={{ fontSize: 12, color: G3, lineHeight: 1.7, fontWeight: 300 }}>{STYLE_MAP[guideStyles[0]].note}</p>
                </div>
              </div>

            </div>
          </>
        )}

        <HDivider />

        <SectionLabel>HAIR CONDITION</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, marginBottom: 48 }}>모질 분석</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: G7, border: `1px solid ${G7}` }}>
          {conditions.map(c => (
            <div key={c.id} style={{ background: '#FFFFFF', display: 'grid', gridTemplateColumns: '88px 1fr' }}>
              <div style={{ padding: '22px 14px', borderRight: `1px solid ${G7}`, background: G9, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', color: G4 }}>{c.en}</p>
                <p style={{ fontSize: 13, color: G2, fontWeight: 500 }}>{c.ko}</p>
              </div>
              <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <span style={{ fontSize: 18, fontWeight: 500, color: G1, letterSpacing: '-0.01em' }}>{c.level}</span>
                <p style={{ fontSize: 12, color: G5, lineHeight: 1.55, fontWeight: 300, maxWidth: 280, textAlign: 'right' }}>{c.impact}</p>
              </div>
            </div>
          ))}
        </div>

        <HDivider />

        <SectionLabel>PERSONAL DESIGN</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, marginBottom: 12 }}>퍼스널 헤어 디자인</h2>
        <p style={{ fontSize: 15, color: G4, fontWeight: 300, lineHeight: 1.65, marginBottom: 40 }}>얼굴 이미지 + 원하는 이미지 + 모질 상태를 함께 반영한 세부 디자인입니다.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: G7, border: `1px solid ${G7}` }}>
          {DESIGN_AXES.map(({ key, en, label, opts }) => {
            const opt = opts.find(o => o.id === hairStyle?.[key]);
            return (
              <div key={key} style={{ background: '#FFFFFF', display: 'grid', gridTemplateColumns: '88px 1fr' }}>
                <div style={{ padding: '22px 14px', borderRight: `1px solid ${G7}`, background: G9, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                  <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', color: G4 }}>{en}</p>
                  <p style={{ fontSize: 13, color: G2, fontWeight: 500 }}>{label}</p>
                </div>
                <div style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  {opt ? (
                    <>
                      <span style={{ fontSize: 18, fontWeight: 500, color: G1, letterSpacing: '-0.01em' }}>{opt.label}</span>
                      <p style={{ fontSize: 12, color: G5, lineHeight: 1.55, fontWeight: 300, maxWidth: 280, textAlign: 'right' }}>
                        {opt.tags.map(t => `#${t}`).join(' ')}
                      </p>
                    </>
                  ) : (
                    <span style={{ fontSize: 14, color: G6, fontWeight: 300 }}>이번 컨설팅에서 선택하지 않았습니다</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Wrap>
    </motion.div>
  );
}

/**
 * 퍼스널 디자인 5축 — 헤어컨설팅 화면에서 디자이너가 고른 값을 그대로 싣는다.
 * 시안은 BEST/GOOD/CAUTION 등급표가 박혀 있었는데, 실제로는 화면에서 이미 하나를
 * 고르므로 그 값과 태그를 보여주는 게 맞다. (2026-09-11)
 */
const DESIGN_AXES = [
  { key: 'bangs'   as const, en: 'BANGS',  label: '앞머리', opts: BANGS_OPTIONS },
  { key: 'parting' as const, en: 'PART',   label: '가르마', opts: PARTING_OPTIONS },
  { key: 'length'  as const, en: 'LENGTH', label: '길이',   opts: LENGTH_OPTIONS },
  { key: 'curl'    as const, en: 'CURL',   label: '컬감',   opts: CURL_OPTIONS },
  { key: 'color'   as const, en: 'COLOR',  label: '컬러',   opts: COLOR_OPTIONS },
];

// ── Photo upload slot ─────────────────────────────────────────────

function PhotoSlot({ label, sub, photo, setPhoto, inputRef }: {
  label: 'BEFORE' | 'AFTER';
  sub: string;
  photo: string | null;
  setPhoto: (url: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const isBefore = label === 'BEFORE';
  return (
    <div>
      <input type="file" accept="image/*" ref={inputRef} style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) setPhoto(URL.createObjectURL(f));
          e.target.value = '';
        }}
      />
      <button onClick={() => inputRef.current?.click()}
        style={{ display: 'block', width: '100%', border: `1px solid ${G7}`, background: photo ? 'none' : G9, cursor: 'pointer', position: 'relative', aspectRatio: '3/4', overflow: 'hidden', padding: 0 }}>
        {photo ? (
          <>
            <img src={photo} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.55) 0%, transparent 45%)' }} />
            <div style={{ position: 'absolute', top: 16, left: 16 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, padding: '5px 12px', background: isBefore ? 'rgba(17,17,17,0.75)' : 'rgba(184,150,60,0.85)', color: '#FFFFFF', letterSpacing: '0.14em' }}>{label}</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>{sub}</p>
              <p style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em' }}>TAP TO CHANGE</p>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: `1.5px solid ${G6}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRight size={16} color={G6} style={{ transform: 'rotate(-45deg)' }} strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.16em', color: isBefore ? G3 : GOLD, marginBottom: 6 }}>{label}</p>
              <p style={{ fontSize: 13, color: G5, fontWeight: 300 }}>{sub} 사진 추가</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

// ── NEXT DIRECTION items (shared by Page03 + Page04) ──────────────
const NEXT_ITEMS = [
  { id: 'length',   en: 'LENGTH',   ko: '길이 변화',   options: ['유지', '롱', '미디움', '단발', '숏'] },
  { id: 'bangs',    en: 'BANG',     ko: '앞머리 변화', options: ['유지', '시스루뱅', '풀뱅', '처피뱅', '사이드뱅', '스틱뱅'] },
  { id: 'color',    en: 'COLOR',    ko: '컬러 변화',   options: ['유지', '톤업', '톤다운', '컬러변경', '탈색'] },
  { id: 'perm',     en: 'PERM',     ko: '컬 / 볼륨',   options: ['유지', 'C컬', 'CS컬', '볼륨매직', '웨이브'] },
  { id: 'recovery', en: 'RECOVERY', ko: '손상 회복',   options: ['홈케어', '클리닉 진행'] },
  { id: 'image',    en: 'IMAGE',    ko: '이미지 변화', options: ['새로운 디자인', '이미지 재분석'] },
];

// ── PAGE 03: NEXT DIRECTION ────────────────────────────────────────

function Page03({ session, cycleData = null, subSel, setSubSel, beforePhoto = null, afterPhoto = null, onBeforePhotoChange, onAfterPhotoChange }: {
  session: CustomerSession;
  cycleData?: CycleData | null;
  subSel: Record<string, string>;
  setSubSel: (s: Record<string, string>) => void;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  onBeforePhotoChange?: (url: string | null) => void;
  onAfterPhotoChange?: (url: string | null) => void;
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const beforeInputRef = React.useRef<HTMLInputElement>(null);
  const afterInputRef = React.useRef<HTMLInputElement>(null);

  const selectedIds = Object.keys(subSel).filter(k => subSel[k] && subSel[k] !== '유지');
  const { todayDesign, cyclePlan } = session;

  // AFTER CARE data derived from cycleData
  const reportServices = (cycleData?.todayServices ?? []) as ServiceKey[];
  const homeCare: string[] = (() => {
    const seen = new Set<string>();
    const tips: string[] = [];
    for (const s of reportServices) {
      for (const t of HOME_CARE_TIPS[s] ?? []) {
        if (!seen.has(t)) { seen.add(t); tips.push(t); }
      }
    }
    return tips.slice(0, 5);
  })();

  return (
    <motion.div key="p3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      <Wrap>
        <SectionLabel>WHAT'S NEXT?</SectionLabel>
        {/* 시안3 코드에는 'NEXT DIRECTION' 이라고 돼 있지만 기획서
            (personal-hair-report-1.md) 문구가 이쪽이다. (2026-09-11) */}
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, marginBottom: 48 }}>다음에는 무엇을 바꾸고 싶나요?</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            {NEXT_ITEMS.map(item => (
              <div key={item.id}>
                <button onClick={() => setOpenItem(openItem === item.id ? null : item.id)} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 14, padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${G8}`, minHeight: 56 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${subSel[item.id] && subSel[item.id] !== '유지' ? GOLD : G6}`, background: subSel[item.id] && subSel[item.id] !== '유지' ? GOLD : 'transparent', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', color: G4, display: 'block', marginBottom: 2 }}>{item.en}</span>
                    <span style={{ fontSize: 15, fontWeight: 300, color: G3 }}>
                      {item.ko}{subSel[item.id] ? <span style={{ color: GOLD, fontWeight: 500 }}> · {subSel[item.id]}</span> : ''}
                    </span>
                  </div>
                  <ChevronDown size={14} color={G5} style={{ transform: openItem === item.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                <AnimatePresence>
                  {openItem === item.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '8px 0 16px 32px', borderBottom: `1px solid ${G8}` }}>
                        {item.options.map(opt => (
                          <button key={opt} onClick={() => { setSubSel({ ...subSel, [item.id]: opt }); setOpenItem(null); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${subSel[item.id] === opt ? G1 : G6}`, background: subSel[item.id] === opt ? G1 : 'transparent', flexShrink: 0 }} />
                            <span style={{ fontSize: 14, color: subSel[item.id] === opt ? G1 : G3, fontWeight: subSel[item.id] === opt ? 500 : 300 }}>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: G4 }}>MY NEXT DIRECTION</p>
            {selectedIds.length === 0 ? (
              <div style={{ padding: '32px 24px', background: G9, border: `1px solid ${G7}` }}>
                <p style={{ fontSize: 14, color: G5, lineHeight: 1.75, fontWeight: 300 }}>왼쪽 목록에서 다음에 바꾸고 싶은 항목을 선택해주세요.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ padding: '24px', background: 'rgba(184,150,60,0.04)', border: `1px solid rgba(184,150,60,0.2)`, marginBottom: 12 }}>
                  <p style={{ fontFamily: MONO, fontSize: 8, color: GOLD, marginBottom: 12 }}>SELECTED</p>
                  {selectedIds.map(id => {
                    const item = NEXT_ITEMS.find(i => i.id === id);
                    return (
                      <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid rgba(184,150,60,0.15)` }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: G5 }}>{item?.en}</span>
                        <span style={{ fontSize: 13, color: G1, fontWeight: 500 }}>{subSel[id]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ padding: '20px 24px', borderLeft: `2px solid ${GOLD}` }}>
                  <p style={{ fontSize: 14, color: G2, lineHeight: 1.8, fontWeight: 300 }}>
                    {selectedIds.includes('bangs') ? '앞머리와 얼굴 주변 레이어를 먼저 조정합니다.' : `${selectedIds.map(id => NEXT_ITEMS.find(i => i.id === id)?.ko || '').join(' + ')} 방향으로 단계적으로 진행합니다.`}
                  </p>
                </div>
              </motion.div>
            )}
            <div style={{ padding: '24px', background: G9, border: `1px solid ${G7}` }}>
              <p style={{ fontFamily: MONO, fontSize: 8, color: G5, marginBottom: 8 }}>TODAY'S DESIGN</p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {todayDesign.services.length > 0
                  ? todayDesign.services.map(s => <span key={s} style={{ fontFamily: MONO, fontSize: 8, padding: '3px 10px', background: G1, color: '#FFFFFF', letterSpacing: '0.08em' }}>{s}</span>)
                  : <span style={{ fontSize: 13, color: G5 }}>시술 정보 없음</span>
                }
              </div>
              <p style={{ fontSize: 13, color: G3, lineHeight: 1.65, fontWeight: 300 }}>{todayDesign.summary}</p>
            </div>
          </div>
        </div>

        <HDivider />

        <SectionLabel>BEFORE / AFTER</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, marginBottom: 12 }}>시술 전 · 후 사진</h2>
        <p style={{ fontSize: 14, color: G4, fontWeight: 300, lineHeight: 1.65, marginBottom: 40 }}>사진을 등록하면 리포트에 함께 기록됩니다.</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PhotoSlot label="BEFORE" sub="시술 전" photo={beforePhoto} setPhoto={url => onBeforePhotoChange?.(url)} inputRef={beforeInputRef} />
          <PhotoSlot label="AFTER"  sub="시술 후" photo={afterPhoto}  setPhoto={url => onAfterPhotoChange?.(url)}  inputRef={afterInputRef} />
        </div>

        {/* ── TODAY SERVICE + AFTER CARE ── auto-generated from today's services ── */}
        {reportServices.length > 0 && (
          <>
            <HDivider />

            {/* TODAY SERVICE */}
            <SectionLabel>TODAY SERVICE</SectionLabel>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, letterSpacing: '-0.01em', marginBottom: 24 }}>오늘 진행한 시술</h2>

            {/* Service chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {reportServices.map(key => (
                <span key={key} style={{ padding: '6px 16px', border: `1.5px solid ${G2}`, fontSize: 14, fontWeight: 400, color: G1, letterSpacing: '-0.01em' }}>
                  {SERVICE_KO[key]}
                </span>
              ))}
            </div>

            {/* Per-service detail lines */}
            <div style={{ marginBottom: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reportServices.map(key => {
                const details = cycleData?.todayDetails?.[key];
                const detailText = details && details.length > 0 ? details.join(' / ') : AFTER_CARE[key]?.title;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: G1 }}>{SERVICE_KO[key]}</span>
                    {detailText && (
                      <>
                        <span style={{ fontSize: 13, color: G5 }}>·</span>
                        <span style={{ fontSize: 13, color: GOLD, fontWeight: 300 }}>{detailText}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* YOUR HOME CARE */}
            {homeCare.length > 0 && (
              <>
                <SectionLabel>YOUR HOME CARE</SectionLabel>
                <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, letterSpacing: '-0.01em', marginBottom: 8 }}>오늘 이후 관리</h2>
                <div style={{ marginBottom: 24 }}>
                  {homeCare.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '18px 0', borderBottom: `1px solid ${G8}` }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, color: G5, letterSpacing: '0.08em', flexShrink: 0, paddingTop: 2 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: 14, color: G2, fontWeight: 300, lineHeight: 1.65 }}>{tip}</span>
                    </div>
                  ))}
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, color: GOLD, textDecoration: 'underline', letterSpacing: '0.01em', textUnderlineOffset: 3 }}
                  onClick={() => {}}
                >
                  관리방법 자세히 보기
                </button>
              </>
            )}
          </>
        )}

        <HDivider />

        <SectionLabel>6 MONTH DESIGN CYCLE</SectionLabel>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: G1, marginBottom: 48 }}>방문 후 6개월 관리 플랜</h2>

        {/* Timeline — horizontal scroll on mobile, full-width on desktop */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ display: 'flex', minWidth: `${cyclePlan.length * 140}px`, position: 'relative', paddingBottom: 8 }}>
            {/* connecting line at circle level */}
            <div style={{ position: 'absolute', top: 5, left: '7%', right: '7%', height: 1, background: G7, zIndex: 0 }} />

            {cyclePlan.map((item, i) => {
              const isToday = i === 0;
              const isLast = i === cyclePlan.length - 1;
              const title = item.services.join(' · ');
              const sub = item.note;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, padding: '0 6px' }}>
                  {/* 선(점)이 맨 위 → 얼마나 후 → 월 순서 (2026-09-11) */}
                  <div style={{
                    width: isToday ? 11 : 9,
                    height: isToday ? 11 : 9,
                    borderRadius: '50%',
                    background: isToday ? G1 : '#FFFFFF',
                    border: isToday ? `2px solid ${G1}` : `1.5px solid ${G5}`,
                    marginBottom: 14,
                    flexShrink: 0,
                  }} />
                  <p style={{
                    fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em',
                    color: isToday ? G4 : G5,
                    marginBottom: 2, textAlign: 'center', whiteSpace: 'nowrap', fontWeight: 300,
                  }}>{item.label}</p>
                  <p style={{
                    fontSize: 15, fontWeight: 500, letterSpacing: '-0.01em',
                    color: isToday ? G1 : G2,
                    marginBottom: 16, textAlign: 'center', whiteSpace: 'nowrap',
                  }}>{item.monthHint ?? item.label}</p>

                  {/* title */}
                  <p style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: G1,
                    textAlign: 'center',
                    lineHeight: 1.45,
                    marginBottom: 6,
                    wordBreak: 'keep-all',
                  }}>{title}</p>

                  {/* subtitle / purpose */}
                  <p style={{
                    fontSize: 12,
                    color: isLast ? GOLD : G4,
                    textAlign: 'center',
                    lineHeight: 1.5,
                    fontWeight: 300,
                    wordBreak: 'keep-all',
                  }}>{sub}</p>
                </div>
              );
            })}
          </div>
        </div>

        <HDivider />

        {/* ── NEXT VISIT: CARE + DESIGN cards ── */}
        {(() => {
          const nc = cycleData?.nextCare;
          const nd = cycleData?.nextDesign;
          const fmtWeeks = (min: number, max: number) =>
            min === max ? `약 ${min}주 후` : `${min}–${max}주 후`;

          const CARE_NOTE = '손상 상태와 컬러 후 컨디션을 확인하는 관리 방문입니다.';
          const DESIGN_NOTE = '현재 디자인과 컬러 균형을 다시 확인하는 다음 디자인 시점입니다.';

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
              {/* NEXT CARE */}
              <div style={{ border: `1px solid ${G7}`, padding: '32px 28px 36px', background: '#FFFFFF' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: G5, marginBottom: 20 }}>NEXT CARE</p>
                <p style={{ fontSize: 44, fontWeight: 300, color: G1, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
                  {nc ? fmtWeeks(nc.minWeeks, nc.maxWeeks) : '3–4주 후'}
                </p>
                <p style={{ fontSize: 13, color: GOLD, fontWeight: 500, marginBottom: 16, lineHeight: 1.5 }}>
                  {nc?.services?.join(' · ') || '클리닉 · 모발 상태 점검'}
                </p>
                <p style={{ fontSize: 13, color: G4, lineHeight: 1.75, fontWeight: 300 }}>{CARE_NOTE}</p>
              </div>

              {/* NEXT DESIGN */}
              <div style={{ border: `1px solid ${GOLD}`, padding: '32px 28px 36px', background: '#FFFFFF' }}>
                <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.2em', color: GOLD, marginBottom: 20 }}>NEXT DESIGN</p>
                <p style={{ fontSize: 44, fontWeight: 300, color: G1, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 14 }}>
                  {nd ? fmtWeeks(nd.minWeeks, nd.maxWeeks) : '약 8주 후'}
                </p>
                <p style={{ fontSize: 13, color: GOLD, fontWeight: 500, marginBottom: 16, lineHeight: 1.5 }}>
                  {nd?.services?.join(' · ') || '커트 · 컬러 상태 점검'}
                </p>
                <p style={{ fontSize: 13, color: G4, lineHeight: 1.75, fontWeight: 300 }}>{DESIGN_NOTE}</p>
              </div>
            </div>
          );
        })()}
      </Wrap>
    </motion.div>
  );
}

// ── PAGE 04: REPORT COMPLETE ───────────────────────────────────────

function Page04({ session, subSel = {}, onBack, onRestart, onDownloadPdf, printing = false, embedded = false }: {
  session: CustomerSession;
  subSel?: Record<string, string>;
  onBack: () => void;
  onRestart: () => void;
  onDownloadPdf?: () => void;
  printing?: boolean;
  /** 공유 페이지에서만 '링크 공유' 가 의미 있다 — 그 주소가 곧 공유 링크다 */
  embedded?: boolean;
}) {
  const nextSelEntries = NEXT_ITEMS.filter(item => subSel[item.id] && subSel[item.id] !== '유지');
  const { imageDirection, nextVisit } = session;
  const cur = imageDirection.currentImage;
  const des = imageDirection.desiredImage;
  return (
    <motion.div key="p4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      <Wrap>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingBottom: 64, borderBottom: `1px solid ${G7}`, marginBottom: 100 }}>
          <p style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.32em', color: GOLD, marginBottom: 100 }}>REPORT COMPLETE</p>
          <h2 style={{ fontSize: 36, fontWeight: 200, color: G1, lineHeight: 1.35, letterSpacing: '-0.02em', marginBottom: 10 }} className="text-[28px] lg:text-[36px]">'BE yourself'</h2>
          <p className="m-[10px]" style={{ fontSize: 10, color: G4, lineHeight: 1.1, fontWeight: 300 }}>모든 사람들이 자신의 아름다움을 발견하고<br /> 스스로를 사랑할 수 있도록 돕습니다.</p>
          <p className="m-[60px]" style={{ fontSize: 15, color: G4, lineHeight: 2.1, fontWeight: 300 }}>오늘의 분석부터 원하는 이미지, 세부 디자인<br /> 앞으로의 관리 주기까지 하나의 리포트로 완성했습니다.</p>
        </div>

        {/* ── FINAL DIRECTION + NEXT VISIT ──────────────────────── */}
        

        {/* ── NEXT DIRECTION summary ───────────────────────────────── */}
        {nextSelEntries.length > 0 && (
          <div style={{ marginBottom: 64 }}>
            <SectionLabel>NEXT DIRECTION</SectionLabel>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: G1, marginBottom: 28, letterSpacing: '-0.01em' }}>다음 방향</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: G7, border: `1px solid ${G7}` }}>
              {nextSelEntries.map(item => (
                <div key={item.id} style={{ background: '#FFFFFF', display: 'grid', gridTemplateColumns: '88px 1fr' }}>
                  <div style={{ padding: '20px 14px', borderRight: `1px solid ${G7}`, background: G9 }}>
                    <p style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '0.14em', color: G4, marginBottom: 4 }}>{item.en}</p>
                    <p style={{ fontSize: 13, color: G2, fontWeight: 500 }}>{item.ko}</p>
                  </div>
                  <div style={{ padding: '20px 20px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: 17, fontWeight: 500, color: G1, letterSpacing: '-0.01em' }}>{subSel[item.id]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORT INCLUDES ──────────────────────────────────────── */}
        <HDivider mt={0} mb={48} />
        <SectionLabel>REPORT INCLUDES</SectionLabel>
        <h2 style={{ fontSize: 28, fontWeight: 300, color: G1, marginBottom: 40, letterSpacing: '-0.01em' }}>이 리포트에 담긴 것</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: G7, border: `1px solid ${G7}`, marginBottom: 72 }}>
          {CHAPTERS.map(ch => (
            <div key={ch.num} style={{ background: '#FFFFFF', padding: '28px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 16 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: G6, flexShrink: 0 }}>{ch.num}</span>
                <div>
                  <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: G1, marginBottom: 3 }}>{ch.title}</p>
                  <p style={{ fontSize: 12, color: G5, fontWeight: 300 }}>{ch.ko}</p>
                </div>
              </div>
              <div style={{ height: 1, background: G8, marginBottom: 14 }} />
              {ch.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 3, height: 3, borderRadius: '50%', background: G6, flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: G3, fontWeight: 300 }}>{item}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── SAVE & SHARE ─────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${G7}`, paddingTop: 56 }}>
          <SectionLabel>KEEP YOUR REPORT</SectionLabel>
          <h2 className="text-center" style={{ fontSize: 24, fontWeight: 300, color: G1, marginBottom: 10, letterSpacing: '-0.01em' }}>리포트를 저장하거나 공유하세요</h2>
          <p className="text-center" style={{ fontSize: 14, color: G4, fontWeight: 300, lineHeight: 1.85, marginBottom: 36 }}>
            언제든 다시 확인할 수 있도록<br />리포트를 저장하거나 링크로 공유할 수 있습니다.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ marginBottom: 16 }}>
            <button onClick={onDownloadPdf} disabled={printing}
              style={{ padding: '16px 24px', background: G1, border: 'none', cursor: 'pointer', color: '#FFFFFF', fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', minHeight: 52 }}>
              {printing ? 'PDF 만드는 중…' : '리포트 저장하기 (PDF)'}
            </button>
            {embedded && <button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('링크가 복사되었습니다.'))}
              style={{ padding: '16px 24px', background: '#FFFFFF', border: `1px solid ${G7}`, cursor: 'pointer', color: G2, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', minHeight: 52 }}>
              링크 공유
            </button>}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${G8}` }}>
            <button onClick={onRestart}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: G4, letterSpacing: '0.1em', padding: '12px 0', minHeight: 44 }}>
              리포트 다시 보기
            </button>
            <span style={{ color: G7 }}>·</span>
            <button onClick={onBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: G5, letterSpacing: '0.1em', padding: '12px 0', minHeight: 44 }}>
              다음 방문 일정 확인
            </button>
          </div>
        </div>

      </Wrap>
    </motion.div>
  );
}

// ── Main PremiumReport ─────────────────────────────────────────────

interface PremiumReportProps {
  onBack: () => void;
  customerName: string;
  consultDate: string;
  designerName: string;
  cycleData: CycleData | null;
  selectedCourse?: string;
  customerPhone?: string;
  guideStyles?: HairStyleKey[];
  /** 이목구비 화면에서 확정한 축 위치 — 고유 이미지타입이 여기서 나온다 */
  facePosMap?: Record<string, number>;
  /** 헤어컨설팅 이미지맵에서 고른 추구미 */
  hairTargetType?: string | null;
  hairCondition?: HairConsultingData['condition'] | null;
  /** 헤어컨설팅에서 고른 스타일 5축 — 퍼스널 디자인 표가 이걸 그린다 */
  hairStyle?: HairConsultingData['style'] | null;
  facePhotoUrl?: string | null;
  /** 페이지 안에 그대로 얹을 때 (공유 페이지) */
  embedded?: boolean;
  initialDesigns?: Record<string, string>;
  initialSubSel?: Record<string, string>;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  onBeforePhotoChange?: (url: string | null) => void;
  onAfterPhotoChange?: (url: string | null) => void;
}

export function PremiumReport({
  onBack, customerName, consultDate, designerName, cycleData,
  guideStyles = [],
  initialDesigns = {},
  initialSubSel = {},
  beforePhoto = null, afterPhoto = null,
  onBeforePhotoChange, onAfterPhotoChange,
  facePosMap = {}, hairTargetType = null, hairCondition = null, facePhotoUrl = null,
  hairStyle = null, embedded = false, selectedCourse,
}: PremiumReportProps) {
  const [page, setPage] = useState(0);
  const [subSel, setSubSel] = useState<Record<string, string>>(initialSubSel);

  const session = buildSession({
    customerName, consultDate, designerName, cycleData,
    facePosMap, hairTargetType, hairCondition, facePhotoUrl, beforePhoto, afterPhoto,
    courseLabel: COURSE_TITLE[selectedCourse ?? ''] ?? '1WAY',
  });

  // PDF — 한 장씩 넘기며 캡쳐하면 전환 애니메이션 때문에 반쯤 그려진 화면이 찍힌다.
  // 숨은 영역에 4장을 한꺼번에 그려 놓고 장마다 캡쳐한다. (V1 과 같은 방식) (2026-09-11)
  const printRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);

  const handleDownloadPdf = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      const root = printRef.current;
      if (!root) return;
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas-pro'),
      ]);
      const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const nodes = Array.from(root.children) as HTMLElement[];
      for (let i = 0; i < nodes.length; i++) {
        const canvas = await html2canvas(nodes[i], { scale: 2, backgroundColor: '#FFFFFF', logging: false });
        const img = canvas.toDataURL('image/jpeg', 0.92);
        let w = pw;
        let h = (canvas.height * w) / canvas.width;
        if (h > ph) { h = ph; w = (canvas.width * h) / canvas.height; }
        if (i > 0) pdf.addPage();
        pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, h);
      }
      pdf.save(`${customerName || '고객'}_이미지설계리포트_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF 를 만들지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setPrinting(false);
    }
  };

  const goTo = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    // 리포트는 상담 화면 '위에' 덮인다. 시안은 한 화면씩 갈아끼우는 구조라
    // 그냥 두면 상담 화면 아래에 이어 붙는다. 공유 페이지(embedded)에서는
    // 페이지 안에 그대로 얹으므로 덮지 않는다. (2026-09-11)
    <div
      style={embedded
        ? { background: '#FFFFFF', ...FF }
        : { position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto', background: '#FFFFFF', ...FF }}
    >
    <div style={{ minHeight: '100vh', background: '#FFFFFF', ...FF }}>
      <ReportHeader
        page={page}
        onBack={page === 0 ? onBack : () => { if (page === 1) { setPage(0); window.scrollTo(0, 0); } else goTo(page - 1); }}
        onPrev={() => { if (page > 1) goTo(page - 1); else { setPage(0); window.scrollTo(0, 0); } }}
        onNext={() => { if (page > 0 && page < 4) goTo(page + 1); else if (page === 4) onBack(); }}
      />
      <AnimatePresence mode="wait">
        {page === 0 && <Cover key="cover" onStart={() => goTo(1)} session={session} />}
        {page === 1 && <Page01 key="p1" session={session} />}
        {page === 2 && <Page02 key="p2" session={session} hairStyle={hairStyle} guideStyles={guideStyles} />}
        {page === 3 && <Page03 key="p3" session={session} cycleData={cycleData} subSel={subSel} setSubSel={setSubSel} beforePhoto={beforePhoto} afterPhoto={afterPhoto} onBeforePhotoChange={onBeforePhotoChange} onAfterPhotoChange={onAfterPhotoChange} />}
        {page === 4 && <Page04 key="p4" session={session} subSel={subSel} onBack={onBack} onRestart={() => goTo(1)} onDownloadPdf={handleDownloadPdf} printing={printing} embedded={embedded} />}
      </AnimatePresence>
      {/* PDF 캡쳐용 — 화면에는 안 보이지만 레이아웃은 잡혀 있어야 한다 */}
      <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, width: 900 }}>
        <div ref={printRef}>
          <div style={{ background: '#FFFFFF' }}><Page01 session={session} /></div>
          <div style={{ background: '#FFFFFF' }}><Page02 session={session} hairStyle={hairStyle} guideStyles={guideStyles} /></div>
          <div style={{ background: '#FFFFFF' }}><Page03 session={session} cycleData={cycleData} subSel={subSel} setSubSel={() => {}} beforePhoto={beforePhoto} afterPhoto={afterPhoto} /></div>
          <div style={{ background: '#FFFFFF' }}><Page04 session={session} subSel={subSel} onBack={() => {}} onRestart={() => {}} /></div>
        </div>
      </div>
      {page > 0 && (
        <div style={{ borderTop: `1px solid ${G8}`, background: '#FFFFFF' }}>
          <div className="max-w-3xl mx-auto px-5 lg:px-10" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
            <button onClick={() => { if (page > 1) goTo(page - 1); else { setPage(0); window.scrollTo(0, 0); } }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', fontSize: 14, color: G3, fontFamily: MONO, letterSpacing: '0.08em', minHeight: 48 }}>
              <ArrowLeft size={14} color={G3} strokeWidth={1.5} />이전
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4].map(i => (
                <button key={i} onClick={() => goTo(i)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: i === page ? 24 : 6, height: 6, borderRadius: 3, background: i === page ? G1 : G7, transition: 'all 0.25s' }} />
                </button>
              ))}
            </div>
            <button onClick={() => { if (page < 4) goTo(page + 1); else onBack(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', fontSize: 14, color: page === 4 ? G5 : G1, fontFamily: MONO, letterSpacing: '0.08em', fontWeight: 500, minHeight: 48 }}>
              {page === 4 ? '완료' : '다음'}{page < 4 && <ArrowRight size={14} color={G1} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
