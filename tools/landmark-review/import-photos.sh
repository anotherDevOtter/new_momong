#!/usr/bin/env bash
# 로컬(맥)에서 실행 — export-prod-photos.sh 로 받은 CSV 를 로컬 DB 의 landmark_review_photos 에 넣는다.
# 로컬 DB(DB_HOST=localhost)가 아니면 아무것도 하지 않고 멈춘다.
# 다시 실행하면 목록을 새 CSV 로 바꾼다. 이미 남긴 검수(face_landmark_reviews)는 그대로 둔다.
#
# 사용 (new_momong 에서):
#   bash tools/landmark-review/import-photos.sh ~/Downloads/prod-photos.csv
set -euo pipefail

CSV="${1:?CSV 파일 경로를 주세요}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="$ROOT/backend/.env"

DB_HOST=$(grep -E '^DB_HOST=' "$ENV_FILE" | cut -d= -f2-)
DB_PORT=$(grep -E '^DB_PORT=' "$ENV_FILE" | cut -d= -f2- || true)
DB_USERNAME=$(grep -E '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2-)
DB_DATABASE=$(grep -E '^DB_DATABASE=' "$ENV_FILE" | cut -d= -f2-)
export PGPASSWORD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)

if [ "$DB_HOST" != "localhost" ] && [ "$DB_HOST" != "127.0.0.1" ]; then
  echo "멈춤: backend/.env 의 DB_HOST 가 로컬이 아닙니다 ($DB_HOST)" >&2
  exit 1
fi

head -1 "$CSV" | grep -q '^face_image_url,source,detected_at' || { echo "멈춤: CSV 첫 줄이 예상과 다릅니다" >&2; exit 1; }

psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USERNAME" -d "$DB_DATABASE" -v ON_ERROR_STOP=1 -q <<SQL
CREATE TABLE IF NOT EXISTS landmark_review_photos (
  face_image_url varchar(1000) PRIMARY KEY,
  source         varchar(20)   NOT NULL,
  detected_at    timestamp     NOT NULL
);
BEGIN;
TRUNCATE landmark_review_photos;
\copy landmark_review_photos (face_image_url, source, detected_at) FROM '$CSV' WITH CSV HEADER
COMMIT;
SELECT source, count(*) AS 사진수, min(detected_at)::date AS 처음, max(detected_at)::date AS 마지막
  FROM landmark_review_photos GROUP BY source;
SQL
