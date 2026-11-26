#!/usr/bin/env bash
# 운영 서버(Lightsail)에서 실행 — 얼굴 사진 목록만 CSV 로 뽑는다. 읽기 전용.
#   내보내는 것: 사진 주소 · 출처(consultation/admin_test) · 분석 시각. 고객 · 디자이너 정보는 없다.
#   DB 연결 자체를 읽기 전용으로 연다 (default_transaction_read_only) — 무엇도 쓰지 않는다.
#
# 사용 (서버에서):
#   bash export-prod-photos.sh > ~/prod-photos.csv
set -euo pipefail

ENV_FILE="${ENV_FILE:-$HOME/momong/.env.prod}"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

export PGPASSWORD="$DB_PASSWORD"
export PGOPTIONS='-c default_transaction_read_only=on'

psql "host=$DB_HOST port=${DB_PORT:-5432} user=$DB_USERNAME dbname=$DB_DATABASE sslmode=require" \
  -v ON_ERROR_STOP=1 -q -c "\copy (
    SELECT DISTINCT ON (face_image_url) face_image_url, source, detected_at
      FROM face_analysis_results
     WHERE detection_type = 'WNC'
     ORDER BY face_image_url, detected_at DESC
  ) TO STDOUT WITH CSV HEADER"
