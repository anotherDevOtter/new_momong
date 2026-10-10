// 얼굴 자동 측정 — Python face_landmark 를 브라우저로 옮긴 것.
// 결과 모양은 Python 응답의 data(wnc · snh)와 같고, results 키만 화면 항목 id 다.
//
//   analyzeFace({ landmarks, image }) → { wnc: { results: { faceline: {...}, … }, final, counts }, snh: {...} }
//
// 어느 Python 모듈에서 왔는지는 form.ts · prop.ts 의 각 함수 주석에 있다.

import * as form from './form';
import * as prop from './prop';
import type { MeasureFn, MeasureInput, MeasureResult } from './types';

export type { LandmarkPoint, RgbImage, MeasureInput, MeasureResult, Measurement, MeasurementShape } from './types';

/** 저장할 때 함께 남기는 측정기 표시 — 예전 Python 결과와 구분된다 */
export const ENGINE = { name: 'face-measure-web', version: '1.0-mp0.10.35' } as const;

/** 형태 (화면 FORM) — 모듈이 없는 browdir · eyefront · nosehigh 는 빠진다 */
export const FORM_MEASURES: Record<string, MeasureFn> = {
  faceline: form.faceline,
  cheek: form.cheek,
  browshape: form.browshape,
  eyeshape: form.eyeshape,
  eyetail: form.eyetail,
  nosewidth: form.nosewidth,
  lips: form.lips,
  // 1way 표에만 있는 항목 — 예전 모듈 번호 키 그대로 (module_configs · FaceAnalysisResult 가 '1' 을 쓴다)
  '1': form.skintone,
};

/** 비율 (화면 PROP) */
export const PROP_MEASURES: Record<string, MeasureFn> = {
  facelen: prop.facelen,
  thirds: prop.thirds,
  broweye: prop.broweye,
  eyelid: prop.eyelid,
  intereye: prop.intereye,
  eyeouter: prop.eyeouter,
  noselen: prop.noselen,
  philtrum: prop.philtrum,
  mouthwidth: prop.mouthwidth,
  chinlen: prop.chinlen,
  // 1way 표에만 있는 항목 — 예전 모듈 번호 키 그대로 ('10' = 코 폭)
  '10': prop.nosebreadth,
};

export interface GroupResult<G extends string> {
  results: Record<string, MeasureResult>;
  final: G | 'Unknown';
  counts: Record<G, number>;
}

export interface FaceMeasureResult {
  wnc: GroupResult<'W' | 'N' | 'C'>;
  snh: GroupResult<'S' | 'N' | 'H'>;
}

function runGroup<G extends string>(fns: Record<string, MeasureFn>, input: MeasureInput, cats: G[]): GroupResult<G> {
  const results: Record<string, MeasureResult> = {};
  for (const [id, fn] of Object.entries(fns)) {
    try {
      const r = fn(input);
      if (r && r.grade) results[id] = r;
    } catch (e) {
      // Python 처럼 한 모듈이 실패해도 나머지는 계속한다
      console.warn(`[face-measure] ${id} 실패`, e);
    }
  }
  const counts = Object.fromEntries(cats.map((c) => [c, 0])) as Record<G, number>;
  for (const r of Object.values(results)) if (r.grade in counts) counts[r.grade as G]++;
  return { results, final: finalGrade(results, counts, cats), counts };
}

/** Python determine_final_grade: 다수결, 동점에 중립(N)이 있으면 N, 아니면 앞선 등급 */
function finalGrade<G extends string>(results: Record<string, MeasureResult>, counts: Record<G, number>, cats: G[]): G | 'Unknown' {
  if (!Object.keys(results).length) return 'Unknown';
  const max = Math.max(...cats.map((c) => counts[c]));
  const winners = cats.filter((c) => counts[c] === max);
  if (winners.length > 1 && winners.includes(cats[1])) return cats[1];
  return winners[0];
}

export function analyzeFace(input: MeasureInput): FaceMeasureResult {
  return {
    wnc: runGroup(FORM_MEASURES, input, ['W', 'N', 'C']),
    snh: runGroup(PROP_MEASURES, input, ['S', 'N', 'H']),
  };
}
