// 화면 항목 id ↔ 예전 Python 모듈 번호.
// 결과 키는 2026-10-10 부터 화면 항목 id 다. 예전 Python 결과(번호 키)와 나란히 비교할 때 쓴다.
// 같은 표: backend/src/face-analysis/face-measure.ts · backend/migrations/005_face_measure_keys.sql

export const LEGACY_KEY: Record<'wnc' | 'snh', Record<string, string>> = {
  wnc: { faceline: '2', cheek: '3', browshape: '5', eyeshape: '6', eyetail: '7', nosewidth: '8', lips: '9' },
  snh: { facelen: '2', thirds: '11', broweye: '4', eyelid: '7', intereye: '5', eyeouter: '6', noselen: '9', philtrum: '12', mouthwidth: '13', chinlen: '14' },
};

/** Python 결과(번호 키)를 화면 항목 id 키로 바꾼다. 웹으로 옮기지 않은 7개 모듈은 번호 그대로 둔다 */
export function fromLegacyGroup<T extends { results: Record<string, unknown> }>(group: 'wnc' | 'snh', g: T): T {
  const back = Object.fromEntries(Object.entries(LEGACY_KEY[group]).map(([id, key]) => [key, id]));
  return { ...g, results: Object.fromEntries(Object.entries(g.results).map(([k, v]) => [back[k] ?? k, v])) };
}
