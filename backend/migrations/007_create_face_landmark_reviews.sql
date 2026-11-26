-- ============================================================================
-- 007_create_face_landmark_reviews.sql
--
-- 랜드마크 검수 — admin 이 저장된 얼굴 사진 위 MediaPipe 랜드마크가 맞게 찍혔는지 가/부를 남긴다.
-- 사진 한 장(face_image_url) = 검수 한 건. 측정 결과(face_analysis_results)는 건드리지 않는다.
-- 되돌리기: 007_create_face_landmark_reviews.down.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS face_landmark_reviews (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  face_image_url  varchar(1000) NOT NULL,
  verdict         varchar(10)   NOT NULL,             -- 'ok' | 'bad'
  bad_parts       jsonb         NOT NULL DEFAULT '[]', -- 부일 때 틀린 부위: ["brow","eye",…]
  note            text,
  reviewed_at     timestamp     NOT NULL DEFAULT now(),
  CONSTRAINT uq_face_landmark_reviews_url UNIQUE (face_image_url),
  CONSTRAINT ck_face_landmark_reviews_verdict CHECK (verdict IN ('ok', 'bad'))
);
