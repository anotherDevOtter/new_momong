import type { PreSurveyAnswers } from '@/utils/pre-survey-api';

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

// 사전설문의 이미지 키워드는 10종(한글 라벨), 요약 화면의 이미지맵은 9칸(영문 id).
// 수가 맞지 않아 아래 세 가지는 판단이 들어가 있다 — 확정 전까지 잠정값이다.
//
//   · '어려보이는'  → cute    (대응 칸이 없다. 가장 가까운 곳으로 보냈다)
//   · '단아한'      → natural ('자연스러운' 과 같은 칸으로 겹친다)
//   · casual 칸     → 사전설문에서는 나올 수 없다 (대응하는 선택지가 없다)
//
// 원장님 확인 후 이 표만 고치면 된다.
const IMAGE_KEYWORD_TO_ID: Record<string, string> = {
  '귀여운 / 사랑스러운': 'cute',
  '어려보이는': 'cute',          // ⚠ 잠정
  '청초한': 'pure',
  '프레시한': 'fresh',
  '자연스러운': 'natural',
  '단아한': 'natural',           // ⚠ 잠정 (자연스러운과 중복)
  '시크 / 세련된': 'chic',
  '부드러운 / 여성스러운': 'feminine',
  '우아한 / 클래식한': 'classic',
  '지적인 / 현대적인': 'modern',
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
