#!/usr/bin/env bash
# 운영 DB 에 migrations/ 의 SQL 파일 하나를 적용한다. 맥에서 실행. 새 키 · psql 이 필요 없다.
#   서버에 SSH 로 들어가 api 컨테이너 안에서 run-sql.cjs 를 돌린다 (DB 접속 정보는 서버 .env.prod 그대로).
#   한 트랜잭션 — 실패하면 아무것도 바뀌지 않는다.
#
# 사용 (new_momong 에서):
#   bash tools/prod-db/apply-migration.sh <서버 고정IP> backend/migrations/008_create_face_landmark_truths.sql ["확인용 SELECT"]
#   (키 위치가 다르면 SSH_KEY=… bash …)
set -euo pipefail

HOST="${1:?서버 고정 IP 를 주세요}"
FILE="${2:?SQL 파일을 주세요}"
CHECK="${3:-}"
KEY="${SSH_KEY:-$HOME/.ssh/momong-prod.pem}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

[ -f "$FILE" ] || { echo "파일이 없다: $FILE"; exit 1; }
SQL_B64=$(base64 < "$FILE" | tr -d '\n')
CHECK_B64=$(printf '%s' "$CHECK" | base64 | tr -d '\n')

echo "적용: $(basename "$FILE") → 운영 DB"
ssh -i "$KEY" -o ConnectTimeout=15 "ubuntu@$HOST" \
  "cd ~/momong && docker compose exec -T -e SQL_B64=$SQL_B64 -e CHECK_B64=$CHECK_B64 api node -" \
  < "$ROOT/tools/prod-db/run-sql.cjs"
