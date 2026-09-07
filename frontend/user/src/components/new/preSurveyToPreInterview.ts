import type { PreSurveyAnswers } from '@/utils/pre-survey-api';
import { LABEL_TO_IMAGE_ID } from '@/data/image-keywords';

// 'new' 코스의 사전 정보 한 벌. 원래 사전 인터뷰 화면이 들고 있던 모양인데,
// 그 화면을 흐름에서 뺀 뒤로는 사전설문이 유일한 공급처라 여기로 옮겼다.
export interface PreInterviewData {
  faceAreas: string[];
  faceAreasMemo: string;
  hairConcerns: string[];
  hairConcernsMemo: string;
  preferredImageIds: string[];
  preferredImageMemo: string;
  dislikedImageIds: string[];
  dislikedImageMemo: string;
  preferredStyles: string[];
  preferredStylesMemo: string;
  dislikedStyles: string[];
  dislikedStylesMemo: string;
}

// ─────────────────────────────────────────────────────────────────────────
// 고객이 방문 전 작성한 사전설문(/pre-survey) 답변을 'new' 코스의 요약 화면이
// 읽는 모양(PreInterviewData)으로 옮긴다.
//
// 'new' 흐름에서 사전 인터뷰 화면을 뺐기 때문에, 그 화면이 채워주던 값을
// 사전설문이 대신 채운다.
// ─────────────────────────────────────────────────────────────────────────

// 사전설문의 이미지 키워드 → 요약 화면 이미지맵의 9칸(영문 id).
//
// 2026-09-04 사전설문을 시안 형태로 바꾸면서 키워드가 9종이 되어 칸과 1:1 로 맞는다.
// 그 전에 제출된 답변은 10종 라벨이라 아래 '옛 라벨' 표로 함께 받는다.
// 옛 표에는 판단이 들어간 두 줄이 남아 있다 — 대응 칸이 없어 가장 가까운 곳으로 보냈다.
const IMAGE_KEYWORD_TO_ID: Record<string, string> = {
  // 현행 9종 (시안과 동일)
  ...LABEL_TO_IMAGE_ID,

  // 옛 10종 라벨 — 2026-09-04 이전 제출분
  '귀여운 / 사랑스러운': 'cute',
  '어려보이는': 'cute',          // ⚠ 대응 칸 없음
  '프레시한': 'fresh',
  '자연스러운': 'natural',
  '단아한': 'natural',           // ⚠ 자연스러운과 같은 칸
  '시크 / 세련된': 'chic',
  '부드러운 / 여성스러운': 'feminine',
  '우아한 / 클래식한': 'classic',
  '지적인 / 현대적인': 'modern',
  // '청초한' 은 현행 9종에도 같은 이름으로 있어 위에서 이미 처리된다
};

function toImageIds(labels: string[] | undefined): string[] {
  if (!labels?.length) return [];
  const ids = labels.map((l) => IMAGE_KEYWORD_TO_ID[l]).filter(Boolean);
  return Array.from(new Set(ids));   // '단아한' + '자연스러운' 이 겹치면 하나로
}

// 매핑되지 않은 라벨은 버리지 않고 메모로 남긴다 — 화면에서 사라지면 안 되는 정보다.
function unmappedNote(labels: string[] | undefined): string {
  const left = (labels ?? []).filter((l) => !IMAGE_KEYWORD_TO_ID[l]);
  return left.length ? `기타: ${left.join(', ')}` : '';
}

export const EMPTY_PRE_INTERVIEW: PreInterviewData = {
  faceAreas: [], faceAreasMemo: '',
  hairConcerns: [], hairConcernsMemo: '',
  preferredImageIds: [], preferredImageMemo: '',
  dislikedImageIds: [], dislikedImageMemo: '',
  preferredStyles: [], preferredStylesMemo: '',
  dislikedStyles: [], dislikedStylesMemo: '',
};

export function preSurveyToPreInterview(a: PreSurveyAnswers | null | undefined): PreInterviewData {
  if (!a) return EMPTY_PRE_INTERVIEW;

  return {
    // 그대로 옮겨지는 4개
    faceAreas: a.faceConcerns ?? [],
    faceAreasMemo: a.otherFaceConcern ?? '',
    hairConcerns: a.hairConcerns ?? [],
    hairConcernsMemo: a.otherHairConcern ?? '',

    // 항목 체계가 달라 표를 거치는 2개
    preferredImageIds: toImageIds(a.preferences),
    preferredImageMemo: unmappedNote(a.preferences),
    dislikedImageIds: toImageIds(a.dislikes),
    dislikedImageMemo: unmappedNote(a.dislikes),

    // 사전설문의 패션 문항 (2026-09-01 추가). 고객 성별에 맞는 사진 세트에서 고른 값이다.
    preferredStyles: a.preferredStyles ?? [],
    preferredStylesMemo: '',
    dislikedStyles: a.dislikedStyles ?? [],
    dislikedStylesMemo: '',
  };
}
