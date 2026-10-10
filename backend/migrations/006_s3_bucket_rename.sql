-- ============================================================================
-- 006_s3_bucket_rename.sql
--
-- DB 에 저장된 사진 주소의 버킷을 바꾼다 (운영: momong-staging → momong-prod, INFRA-MIGRATION §10).
-- S3 버킷은 이름을 바꿀 수 없어서 새 버킷으로 사진을 복사하고, 주소는 이 SQL 로 고친다.
--
-- 대상 (2026-10-10 운영 덤프 기준 1,231개)
--   face_analysis_results.face_image_url   (문자열)      180
--   pre_surveys.answers                    (jsonb 안)   1,024
--   consultations.client_info              (jsonb 안)      27  ← 전부 서명(presigned) 주소
--
-- 서명 주소(?X-Amz-...)는 서명 없는 원래 주소로 바꾼다. 서명은 호스트에 묶여 있어 버킷을 바꾸면
-- 어차피 무효이고, 5분짜리라 저장 시점부터 이미 만료된 값이었다.
--
-- 실행 (버킷 이름은 변수로):
--   psql -d momong_prod -v old_bucket=momong-staging -v new_bucket=momong-prod -f 006_s3_bucket_rename.sql
-- 되돌리기: 006_s3_bucket_rename.down.sql (같은 변수, 서명은 되살리지 않는다)
-- 여러 번 실행해도 결과가 같다.
-- ============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- 주소 패턴: https://<버킷>.s3.<리전>.amazonaws.com/<키>[?서명]
SELECT
  'https://' || :'old_bucket' || '\.s3\.([a-z0-9-]+)\.amazonaws\.com/([^"?\s\\]*)(\?[^"\s\\]*)?' AS pat,
  'https://' || :'new_bucket' || '.s3.\1.amazonaws.com/\2'                                       AS rep
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
SELECT set_config('momong.old_bucket', :'old_bucket', true);
DO $$
DECLARE n int;
BEGIN
  SELECT
    (SELECT count(*) FROM face_analysis_results WHERE face_image_url LIKE '%' || current_setting('momong.old_bucket') || '.s3%') +
    (SELECT count(*) FROM pre_surveys WHERE answers::text LIKE '%' || current_setting('momong.old_bucket') || '.s3%') +
    (SELECT count(*) FROM consultations WHERE client_info::text LIKE '%' || current_setting('momong.old_bucket') || '.s3%')
  INTO n;
  IF n > 0 THEN
    RAISE EXCEPTION '옛 버킷 주소가 % 행에 남아 있다 — 되돌리고 형태를 확인할 것', n;
  END IF;
END $$;

COMMIT;
