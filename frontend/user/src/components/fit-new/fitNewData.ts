import { DAMAGE_LEVELS, STYLE_AXES, styleIds, type HairConsultingData } from '@/components/new/HairConsulting';
import type { ConsultationData, FaceImageType, HairCondition, HairStyleProposal } from '@/types';

// ─────────────────────────────────────────────────────────────────────────
// FIT-NEW ↔ 기존 FIT 데이터 변환 (2026-10-28)
//
// 'FIT 헤어스타일 제안' 화면은 new 코스 HairConsulting 을 쓰므로 값이 옵션 id 로 나온다.
// 그런데 공유 링크·고객 상세·TodayDesign 은 기존 FIT 의 한글 값(약손상 · 굵다 …)을 읽는다.
// 그래서 id 는 hairStyleProposal 에 따로 두고, 기존 칸에는 한글 값을 채운다.
// ─────────────────────────────────────────────────────────────────────────

// HairConsulting 옵션 id → 기존 FIT HairConditionStep 의 선택지
const THICKNESS_KO: Record<string, string> = { fine: '가늘다', medium: '보통', coarse: '굵다' };
const DENSITY_KO: Record<string, string> = { thin: '적다', normal: '보통', thick: '많다' };
const CURL_KO: Record<string, string> = { straight: '직모', semi: '반곱슬', strong: '곱슬' };

const STYLE_KEYS = ['bangs', 'parting', 'length', 'curl', 'color'] as const;

/** HairConsulting 화면 값 → 상담 데이터의 hairCondition · hairStyleProposal */
export function fromHairConsulting(hc: HairConsultingData): Pick<ConsultationData, 'hairCondition' | 'hairStyleProposal'> {
  const c = hc.condition;
  const style = Object.fromEntries(STYLE_KEYS.map(k => [k, styleIds(hc.style[k])])) as NonNullable<HairStyleProposal['style']>;

  const hairCondition: HairCondition = {
    damageLevel: DAMAGE_LEVELS.find(l => l.id === c.damage)?.label ?? '',
    hairType: c.curl && CURL_KO[c.curl] ? [CURL_KO[c.curl]] : [],
    thickness: (c.thickness && THICKNESS_KO[c.thickness]) || '',
    density: (c.density && DENSITY_KO[c.density]) || '',
    curl: '',   // 기존 FIT 의 '곱슬 없음/부분/전체' 축은 새 화면에 없다 — 곱슬정도는 hairType 으로 간다
  };

  const hairStyleProposal: HairStyleProposal = {
    // 기존 FIT 길이 값(롱·미디움·단발·숏)과 HairConsulting 길이 이름이 같다
    length: style.length.map(id => STYLE_AXES.length.options.find(o => o.id === id)?.label).filter(Boolean).join(', '),
    referenceImage: '',
    flow: 'fit-new',
    style,
    conditionIds: c,
  };

  return { hairCondition, hairStyleProposal };
}

/** 저장된 상담 → HairConsulting 복원값. FIT-NEW 기록이 아니면 null */
export function toHairConsultingInitial(data: ConsultationData): HairConsultingData | null {
  const p = data.hairStyleProposal;
  if (p.flow !== 'fit-new') return null;
  return {
    currentType: null,
    targetType: null,
    style: {
      bangs: p.style?.bangs ?? [],
      parting: p.style?.parting ?? [],
      length: p.style?.length ?? [],
      curl: p.style?.curl ?? [],
      color: p.style?.color ?? [],
    },
    condition: p.conditionIds ?? {},
  };
}

/** 스타일 제안 5개 축을 결과 페이지에 보여줄 이름으로 */
export function styleRows(p: HairStyleProposal): { label: string; value: string }[] {
  if (!p.style) return [];
  const titles: Record<(typeof STYLE_KEYS)[number], string> = { bangs: '앞머리', parting: '가르마', length: '길이', curl: '컬감', color: '컬러' };
  return STYLE_KEYS.map(k => ({
    label: titles[k],
    value: p.style![k].map(id => STYLE_AXES[k].options.find(o => o.id === id)?.label).filter(Boolean).join(', '),
  })).filter(r => r.value);
}

/** 원장님 요청 — 색조(웜톤/쿨톤) 대신 'WARM타입 · COOL타입' 으로 부른다 */
export function imageTypeLabel(type: FaceImageType['type']): string {
  return type ? `${type.toUpperCase()}타입` : '';
}
