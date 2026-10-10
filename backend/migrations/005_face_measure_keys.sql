-- ============================================================================
-- 005_face_measure_keys.sql
--
-- 얼굴 자동 측정 결과의 키를 모듈 번호('2', '11' …) → 화면 항목 id('facelen', 'thirds' …)로 바꾼다.
-- 측정이 Python 서버에서 브라우저로 옮겨가면서 결과 키를 화면 항목 id 로 쓰기로 했다
-- (INFRA-MIGRATION §6 "모듈 키 변경", 2026-10-10).
--
-- 대상
--   1) face_analysis_results.python_analysis_result -> 'results' 의 키
--   2) module_configs.module_key
-- 웹으로 옮긴 17개만 바꾼다. 옮기지 않은 7개(WNC 1·4·10, SNH 1·3·8·10)는 예전 번호 그대로 둔다
-- — 화면 항목 id 와 겹치지 않아 뜻이 헷갈리지 않는다.
--
-- 여러 번 실행해도 결과가 같다 (이미 바뀐 키는 표에 없으므로 그대로).
-- 되돌리기: 005_face_measure_keys.down.sql
-- 적용 시점: 새 백엔드(브라우저 측정 저장)를 띄우기 직전. 같은 표가 backend/src/face-analysis/face-measure.ts 에 있다.
-- ============================================================================

BEGIN;

CREATE TEMP TABLE _face_key_map (axis varchar(4), old_key text, new_key text) ON COMMIT DROP;
INSERT INTO _face_key_map (axis, old_key, new_key) VALUES
  ('WNC', '2', 'faceline'),
  ('WNC', '3', 'cheek'),
  ('WNC', '5', 'browshape'),
  ('WNC', '6', 'eyeshape'),
  ('WNC', '7', 'eyetail'),
  ('WNC', '8', 'nosewidth'),
  ('WNC', '9', 'lips'),
  ('SNH', '2', 'facelen'),
  ('SNH', '11', 'thirds'),
  ('SNH', '4', 'broweye'),
  ('SNH', '7', 'eyelid'),
  ('SNH', '5', 'intereye'),
  ('SNH', '6', 'eyeouter'),
  ('SNH', '9', 'noselen'),
  ('SNH', '12', 'philtrum'),
  ('SNH', '13', 'mouthwidth'),
  ('SNH', '14', 'chinlen');

-- 1) 분석 결과 — results 객체의 키만 바꾸고 값 · final · counts 는 그대로
UPDATE face_analysis_results f
SET python_analysis_result = jsonb_set(
  f.python_analysis_result,
  '{results}',
  COALESCE(
    (SELECT jsonb_object_agg(COALESCE(m.new_key, r.key), r.value)
       FROM jsonb_each(f.python_analysis_result -> 'results') r
       LEFT JOIN _face_key_map m ON m.axis = f.detection_type AND m.old_key = r.key),
    '{}'::jsonb
  )
)
WHERE jsonb_typeof(f.python_analysis_result -> 'results') = 'object'
  AND EXISTS (
    SELECT 1 FROM jsonb_object_keys(f.python_analysis_result -> 'results') k
    JOIN _face_key_map m ON m.axis = f.detection_type AND m.old_key = k
  );

-- 2) 표시 설정 — 같은 축에 새 키가 이미 있으면(새 백엔드가 먼저 자동 생성한 경우) 건너뛴다
UPDATE module_configs c
SET module_key = m.new_key, updated_at = now()
FROM _face_key_map m
WHERE c.axis = m.axis
  AND c.module_key = m.old_key
  AND NOT EXISTS (SELECT 1 FROM module_configs x WHERE x.axis = m.axis AND x.module_key = m.new_key);

COMMIT;
