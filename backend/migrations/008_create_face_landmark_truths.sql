-- ============================================================================
-- 008_create_face_landmark_truths.sql
--
-- 랜드마크 정답 — 관리자가 사진마다 직접 찍은 '진짜 점 위치'. 여러 검출 방법을 이 정답으로 채점한다.
-- 사진 한 장 = 한 행, 저장할 때마다 덮어쓴다 (예전 값은 남기지 않는다).
--   photo   운영: 상담 사진 주소 (face_analysis_results.face_image_url 과 같은 값)
--           로컬 시험 폴더 사진: 'local:<파일 이름>'
--   points  { 점이름: [x, y] | null }  x, y 는 사진 크기 대비 0~1, null = 사진에서 안 보이는 점
-- 기존 표는 건드리지 않는다. 007(랜드마크 검수)과 상관없이 따로 적용할 수 있다.
-- 되돌리기: 008_create_face_landmark_truths.down.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS face_landmark_truths (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo         varchar(1000) NOT NULL,
  image_width   integer       NOT NULL,
  image_height  integer       NOT NULL,
  points        jsonb         NOT NULL DEFAULT '{}',
  updated_by    varchar(255),
  updated_at    timestamp     NOT NULL DEFAULT now(),
  CONSTRAINT uq_face_landmark_truths_photo UNIQUE (photo),
  CONSTRAINT ck_face_landmark_truths_size CHECK (image_width > 0 AND image_height > 0)
);
