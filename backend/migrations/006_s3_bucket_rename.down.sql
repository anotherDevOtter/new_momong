-- ============================================================================
-- 006_s3_bucket_rename.down.sql — 006_s3_bucket_rename.sql 되돌리기
--
-- 새 버킷 주소 → 옛 버킷 주소. 변수는 006 과 같게 준다:
--   psql -d momong_prod -v old_bucket=momong-staging -v new_bucket=momong-prod -f 006_s3_bucket_rename.down.sql
-- 006 에서 지운 서명(?X-Amz-...)은 되살리지 않는다 (이미 만료된 값이었다).
-- ============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- 주소 패턴: https://<버킷>.s3.<리전>.amazonaws.com/<키>[?서명]
SELECT
  'https://' || :'new_bucket' || '\.s3\.([a-z0-9-]+)\.amazonaws\.com/([^"?\s\\]*)(\?[^"\s\\]*)?' AS pat,
  'https://' || :'old_bucket' || '.s3.\1.amazonaws.com/\2'                                       AS rep
\gset

UPDATE face_analysis_results
SET face_image_url = regexp_replace(face_image_url, :'pat', :'rep', 'g')
WHERE face_image_url ~ :'pat';

UPDATE pre_surveys
SET answers = regexp_replace(answers::text, :'pat', :'rep', 'g')::jsonb
WHERE answers::text ~ :'pat';

UPDATE consultations
SET client_info = regexp_replace(client_info::text, :'pat', :'rep', 'g')::jsonb
WHERE client_info::text ~ :'pat';

-- 남은 옛 버킷 주소가 있으면 실패시킨다 (다른 형태의 주소가 섞여 있다는 뜻)
SELECT set_config('momong.old_bucket', :'new_bucket', true);   -- 되돌린 뒤엔 새 버킷 주소가 남으면 안 된다
DO $$
DECLARE n int;
BEGIN
  SELECT
    (SELECT count(*) FROM face_analysis_results WHERE face_image_url LIKE '%' || current_setting('momong.old_bucket') || '.s3%') +
    (SELECT count(*) FROM pre_surveys WHERE answers::text LIKE '%' || current_setting('momong.old_bucket') || '.s3%') +
    (SELECT count(*) FROM consultations WHERE client_info::text LIKE '%' || current_setting('momong.old_bucket') || '.s3%')
  INTO n;
  IF n > 0 THEN
    RAISE EXCEPTION '새 버킷 주소가 % 행에 남아 있다', n;
  END IF;
END $$;

COMMIT;
