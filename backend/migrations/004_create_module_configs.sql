-- ============================================================================
-- 004_create_module_configs.sql
--
-- 운영 DB에 한 번만 실행. dev 환경은 TypeORM synchronize 가 자동 생성하므로 불필요.
--
-- 얼굴분석 모듈의 "표시 설정"(전역). 측정(파이썬)과 분리된 표시 SSOT.
-- 시드(22개 모듈)는 백엔드 ModuleConfigsService.onModuleInit 이 비어있을 때 자동 삽입.
-- (테이블 생성 직후 첫 부팅 시 채워짐 — 별도 INSERT 불필요)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS module_configs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  axis        varchar(4)   NOT NULL,             -- 'WNC' | 'SNH'
  module_key  varchar(10)  NOT NULL,             -- 파이썬 응답 키(모듈번호)
  label       varchar(100) NOT NULL,
  sort_order  integer      NOT NULL DEFAULT 999,
  display     boolean      NOT NULL DEFAULT true,
  unit        varchar(20),
  updated_at  timestamp    NOT NULL DEFAULT now(),
  CONSTRAINT uq_module_configs_axis_key UNIQUE (axis, module_key)
);
