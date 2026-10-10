-- ============================================================================
-- 005_face_measure_keys.down.sql — 005_face_measure_keys.sql 되돌리기
--
-- 화면 항목 id('facelen' …) → 모듈 번호('2' …). 표는 005 와 같다.
-- ⚠ 005 이후 브라우저 측정으로 새로 저장된 기록도 함께 번호 키로 바뀐다.
--   그 기록의 engine 필드는 남으므로 구분할 수 있다.
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

UPDATE face_analysis_results f
SET python_analysis_result = jsonb_set(
  f.python_analysis_result,
  '{results}',
  COALESCE(
    (SELECT jsonb_object_agg(COALESCE(m.old_key, r.key), r.value)
       FROM jsonb_each(f.python_analysis_result -> 'results') r
       LEFT JOIN _face_key_map m ON m.axis = f.detection_type AND m.new_key = r.key),
    '{}'::jsonb
  )
)
WHERE jsonb_typeof(f.python_analysis_result -> 'results') = 'object'
  AND EXISTS (
    SELECT 1 FROM jsonb_object_keys(f.python_analysis_result -> 'results') k
    JOIN _face_key_map m ON m.axis = f.detection_type AND m.new_key = k
  );

UPDATE module_configs c
SET module_key = m.old_key, updated_at = now()
FROM _face_key_map m
WHERE c.axis = m.axis
  AND c.module_key = m.new_key
  AND NOT EXISTS (SELECT 1 FROM module_configs x WHERE x.axis = m.axis AND x.module_key = m.old_key);

COMMIT;
