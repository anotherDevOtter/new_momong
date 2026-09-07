/**
 * 이미지 키워드 9종 — 시안(figma/1way (Copy)) 의 사전 인터뷰 Section 03·04 와 같은 표.
 *
 * 배열 순서가 화면의 3×3 배치이고, 그 배치가 곧 헤어 이미지맵의 좌표다.
 *   Soft    cute · pure · fresh
 *   Neutral casual · natural · chic
 *   Hard    feminine · classic · modern
 *
 * 저장은 `ko`(한글 라벨) 문자열로 한다. 사전설문 답변은 원래 한글 라벨 배열이라
 * 저장 형식이 그대로 유지되고, 고객 상세의 답변 칩도 손댈 필요가 없다.
 *
 * 2026-09-04 이전 사전설문은 라벨 10종을 쓴다 (예: '귀여운 / 사랑스러운').
 * 옛 답변 변환표는 preSurveyToPreInterview.ts 에 있다.
 */
export interface ImageCard {
  id: string;
  en: string;
  ko: string;
  /** 카드 아래 작게 붙는 연관어 */
  keywords: string[];
}

export const IMAGE_CARDS: ImageCard[] = [
  { id: 'cute',     en: 'CUTE',     ko: '귀여운',   keywords: ['사랑스러운', '귀여운', '순진한'] },
  { id: 'pure',     en: 'PURE',     ko: '청초한',   keywords: ['맑은', '청초한', '청순한'] },
  { id: 'fresh',    en: 'FRESH',    ko: '프레시한', keywords: ['산뜻한', '시원한', '깨끗한'] },
  { id: 'casual',   en: 'CASUAL',   ko: '캐주얼',   keywords: ['발랄한', '활동적인', '생기있는'] },
  { id: 'natural',  en: 'NATURAL',  ko: '내추럴',   keywords: ['수수한', '자연스러운', '단아한'] },
  { id: 'chic',     en: 'CHIC',     ko: '시크한',   keywords: ['샤프한', '시크한', '세련된'] },
  { id: 'feminine', en: 'FEMININE', ko: '페미닌',   keywords: ['화려한', '여성스러운', '부드러운'] },
  { id: 'classic',  en: 'CLASSIC',  ko: '클래식',   keywords: ['고상한', '우아한', '정제된'] },
  { id: 'modern',   en: 'MODERN',   ko: '모던',     keywords: ['지적인', '도회적인', '현대적인'] },
];

/** 저장되는 한글 라벨 9종 */
export const IMAGE_KEYWORD_LABELS: string[] = IMAGE_CARDS.map((c) => c.ko);

/** 한글 라벨 → 이미지맵 id (1:1). 옛 10종 라벨은 여기에 없다 */
export const LABEL_TO_IMAGE_ID: Record<string, string> = Object.fromEntries(
  IMAGE_CARDS.map((c) => [c.ko, c.id]),
);
