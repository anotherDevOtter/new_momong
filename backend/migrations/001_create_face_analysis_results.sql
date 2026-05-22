-- ============================================================================
-- 001_create_face_analysis_results.sql
--
-- 운영 DB 에 한 번만 실행. dev 환경은 TypeORM synchronize 가 자동 생성하므로 불필요.
--
-- 배경: 옛 momong_backend 의 image_detection_results 테이블은 detection_type_id (FK),
-- detected_by_manager_id (manager FK) 등 신규 entity 와 schema 가 달라서
-- 새 테이블명 face_analysis_results 로 분리한다.
--
-- 실행 예시:
--   psql -h <DB_HOST> -U <USER> -d <DB_NAME> -f 001_create_face_analysis_results.sql
-- ============================================================================

-- uuid_generate_v4() 사용을 위한 확장 (이미 켜져 있으면 no-op)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS face_analysis_results (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_id             uuid REFERENCES customers(id) ON DELETE SET NULL,
  detection_type          varchar(10) NOT NULL,
  face_image_url          varchar(1000) NOT NULL,
  python_analysis_result  jsonb NOT NULL,
  client_provided_data    jsonb,
  detected_at             timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_analysis_user_id     ON face_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_face_analysis_customer_id ON face_analysis_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_face_analysis_detected_at ON face_analysis_results(detected_at DESC);

-- 검증 쿼리
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'face_analysis_results'
-- ORDER BY ordinal_position;
