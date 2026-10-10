import type { AnalyzeResponse, Measurement } from '@/utils/face-analysis-api';
import { FORM, PROP, IMAP, computeScores, dominantOf, dominantIdx } from './faceAnalysisData';

// ─────────────────────────────────────────────────────────────────────────
// 실제 얼굴 측정 결과(브라우저 lib/face-measure)를 시안 화면이 읽는 posMap 으로 옮긴다.
//
// 시안 화면(AIFaceFeature · AIFaceResultDerived · HairConsulting)은
// posMap[항목id] = 0~1 위치값만 본다.
//     0.00 ~ 0.33  Warm / Soft
//     0.33 ~ 0.67  Neutral
//     0.67 ~ 1.00  Cool / Hard
// 우리 분석은 항목마다 grade('W'|'N'|'C' 또는 'S'|'N'|'H') 를 준다.
// 등급을 각 구간의 가운데 값으로 놓는다.
// ─────────────────────────────────────────────────────────────────────────

const POS_LOW = 0.17;   // W / S
const POS_MID = 0.50;   // N
const POS_HIGH = 0.83;  // C / H

// 측정 결과의 키 = 시안 항목 id (2026-10-10 부터. 예전 모듈 번호 키 기록은 migrations/005 로 바꿨다).
// 아래 목록에 있는 항목만 자동 측정된다. 없는 항목은 시안 기본값(defaultPos)이 그대로 쓰인다.
//
// ⚠ 근사로 이은 것 (라벨이 정확히 같지는 않다)
//     nosewidth ← 코 형태      · lips   ← 입술 두께
//     thirds    ← 중안부
// ⚠ 자동 측정 모듈이 아예 없는 것 — 기본값으로 남는다
//     browdir(눈썹 방향) · eyefront(눈 앞머리) · nosehigh(코 높이)
const FORM_MEASURED = ['faceline', 'cheek', 'browshape', 'eyeshape', 'eyetail', 'nosewidth', 'lips'];
const PROP_MEASURED = ['facelen', 'broweye', 'intereye', 'eyeouter', 'eyelid', 'noselen', 'thirds', 'philtrum', 'mouthwidth', 'chinlen'];

function gradeToPos(grade: string | undefined): number | null {
  switch (grade) {
    case 'W': case 'S': return POS_LOW;
    case 'N':           return POS_MID;
    case 'C': case 'H': return POS_HIGH;
    default:            return null;   // 등급이 없으면 시안 기본값을 쓰게 둔다
  }
}

export function faceAnalysisToPosMap(result: AnalyzeResponse | null | undefined): Record<string, number> {
  if (!result) return {};
  const posMap: Record<string, number> = {};

  const fill = (ids: string[], modules: Record<string, { grade?: string }> | undefined) => {
    if (!modules) return;
    for (const itemId of ids) {
      const pos = gradeToPos(modules[itemId]?.grade);
      if (pos !== null) posMap[itemId] = pos;
    }
  };

  fill(FORM_MEASURED, result.wnc?.results);
  fill(PROP_MEASURED, result.snh?.results);

  return posMap;
}

/**
 * 항목 id 별 실측 도형. AIFaceFeature 가 선택된 항목의 선을 실제 좌표로 그릴 때 쓴다.
 * 매핑 표에 없는 항목은 빠지므로, 화면에서는 시안 하드코딩 오버레이로 떨어진다.
 */
export function faceAnalysisToMeasurements(
  result: AnalyzeResponse | null | undefined,
): Record<string, Measurement | null> {
  if (!result) return {};
  const out: Record<string, Measurement | null> = {};

  const fill = (
    ids: string[],
    modules: Record<string, { measurement?: Measurement | null }> | undefined,
  ) => {
    if (!modules) return;
    for (const itemId of ids) {
      const m = modules[itemId]?.measurement;
      if (m) out[itemId] = m;
    }
  };

  fill(FORM_MEASURED, result.wnc?.results);
  fill(PROP_MEASURED, result.snh?.results);

  return out;
}

/**
 * 항목별 실측 '숫자'. description 문장 대신 값만 필요할 때 쓴다 (비율 표기 등).
 * 값을 주지 않는 모듈(등급만 내는 것)은 빠진다.
 */
export function faceAnalysisToNumbers(
  result: AnalyzeResponse | null | undefined,
): Record<string, number> {
  if (!result) return {};
  const out: Record<string, number> = {};

  const fill = (
    ids: string[],
    modules: Record<string, { value?: number | null }> | undefined,
  ) => {
    if (!modules) return;
    for (const itemId of ids) {
      const v = modules[itemId]?.value;
      if (typeof v === 'number' && Number.isFinite(v)) out[itemId] = v;
    }
  };

  fill(FORM_MEASURED, result.wnc?.results);
  fill(PROP_MEASURED, result.snh?.results);

  return out;
}

/** 항목별 실측 표시값. Python 이 준 description/value 를 그대로 쓴다. */
export function faceAnalysisToValues(
  result: AnalyzeResponse | null | undefined,
): Record<string, string> {
  if (!result) return {};
  const out: Record<string, string> = {};

  const fill = (
    ids: string[],
    modules: Record<string, { value?: number | null; description?: string | null }> | undefined,
  ) => {
    if (!modules) return;
    for (const itemId of ids) {
      const m = modules[itemId];
      if (!m) continue;
      const text = m.description ?? (m.value != null ? String(m.value) : null);
      if (text) out[itemId] = text;
    }
  };

  fill(FORM_MEASURED, result.wnc?.results);
  fill(PROP_MEASURED, result.snh?.results);

  return out;
}

/**
 * 우리 분석에 실제로 대응 모듈이 있는 항목 id 목록.
 * 여기 없는 항목은 화면에서 "미측정" 으로 표시하고, 디자이너가 직접 조정해야 한다.
 * (분석 결과 유무와 무관하게 매핑 표만 보므로, 건너뛰기로 넘어와도 같은 결과가 나온다.)
 */
export const ANALYZED_ITEM_IDS: string[] = [
  ...FORM_MEASURED,
  ...PROP_MEASURED,
];


/**
 * 항목별 위치값에서 최종 이미지타입을 낸다.
 * AIFaceResultDerived 가 화면에 그리는 것과 같은 계산 — 저장할 때 같은 값을 남기려고 뽑아뒀다.
 */
export function deriveImageType(posMap: Record<string, number>) {
  const { formScore, propScore } = computeScores(posMap);
  const col = dominantIdx(FORM, posMap);   // 0=Warm 1=Neutral 2=Cool — 화면과 같은 다수결
  const row = dominantIdx(PROP, posMap);   // 0=Soft 1=Neutral 2=Hard
  // 판정할 근거가 없으면 타입을 만들어내지 않는다 (저장도 안 된다).
  if (col == null || row == null) return null;
  const cell = IMAP[row][col];
  return {
    formScore,
    propScore,
    formDominant: dominantOf(FORM, posMap),   // Warm | Neutral | Cool
    propDominant: dominantOf(PROP, posMap),   // Soft | Neutral | Hard
    en: cell.en,                              // CHIC
    ko: cell.ko,                              // 시크한
  };
}
