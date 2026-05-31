-- ============================================================================
-- 003_create_pre_surveys.sql
--
-- 운영 DB에 한 번만 실행. dev 환경은 TypeORM synchronize 가 자동 생성하므로 불필요.
--
-- 사전 인터뷰 설문지: 디자이너가 발급한 공개 토큰 URL을 고객이 방문 전 작성.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pre_surveys (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id   uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token         varchar(64) NOT NULL UNIQUE,
  answers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  filled_at     timestamp,
  created_at    timestamp NOT NULL DEFAULT now(),
  updated_at    timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pre_surveys_user_id     ON pre_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_pre_surveys_customer_id ON pre_surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_pre_surveys_token       ON pre_surveys(token);
