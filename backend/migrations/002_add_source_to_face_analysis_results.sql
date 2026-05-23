-- ============================================================================
-- 002_add_source_to_face_analysis_results.sql
--
-- 운영 DB 에 한 번만 실행. dev 환경은 TypeORM synchronize 가 자동 처리.
--
-- 배경: admin 테스트 분석과 실제 컨설팅 분석을 구분하기 위해 source 컬럼 추가.
-- 'consultation' = 실제 3WAY 컨설팅 (기본값)
-- 'admin_test'   = admin 페이지에서 테스트 호출
--
-- 실행 예시:
--   psql -h <DB_HOST> -U <USER> -d <DB_NAME> -f 002_add_source_to_face_analysis_results.sql
-- ============================================================================

ALTER TABLE face_analysis_results
  ADD COLUMN IF NOT EXISTS source varchar(20) NOT NULL DEFAULT 'consultation';

CREATE INDEX IF NOT EXISTS idx_face_analysis_source ON face_analysis_results(source);

-- 검증:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'face_analysis_results' AND column_name = 'source';
