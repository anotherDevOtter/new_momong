#!/usr/bin/env bash
# 운영 서버(Lightsail)에서 실행 — 얼굴 분석이 실제로 쓰이고 있는지 읽기 전용으로 확인한다.
#   DB 연결을 읽기 전용(default_transaction_read_only)으로 열어서 아무것도 쓰지 않는다.
#   고객 이름 · 사진 주소는 출력하지 않는다 (날짜 · 개수 · 설정만).
#
# 사용 (맥에서):
#   scp -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem tools/prod-check/face-usage.sh ubuntu@<고정IP>:~/
#   ssh -i ~/Downloads/LightsailDefaultKey-ap-northeast-2.pem ubuntu@<고정IP> 'bash ~/face-usage.sh; rm ~/face-usage.sh'
set -euo pipefail

ENV_FILE="${ENV_FILE:-$HOME/momong/.env.prod}"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a
export PGPASSWORD="$DB_PASSWORD"
export PGOPTIONS='-c default_transaction_read_only=on'

psql "host=$DB_HOST port=${DB_PORT:-5432} user=$DB_USERNAME dbname=$DB_DATABASE sslmode=require" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
\echo '== 1. 얼굴 분석 — 전체 · 마지막 =='
SELECT source AS 출처, count(*) AS 분석수, min(detected_at)::date AS 처음, max(detected_at) AS 마지막
  FROM face_analysis_results WHERE detection_type = 'WNC' GROUP BY source;

\echo '== 2. 최근 60일 날짜별 (측정기별) =='
SELECT detected_at::date AS 날짜, source AS 출처,
       coalesce(python_analysis_result->'engine'->>'name', '예전 Python') AS 측정기,
       count(*) AS 분석수
  FROM face_analysis_results
 WHERE detection_type = 'WNC' AND detected_at > now() - interval '60 days'
 GROUP BY 1, 2, 3 ORDER BY 1 DESC, 2;

\echo '== 3. 상담 · 고객 (최근 60일) =='
SELECT 'consultations' AS 표, count(*) AS 전체, count(*) FILTER (WHERE created_at > now() - interval '60 days') AS 최근60일 FROM consultations
UNION ALL
SELECT 'customers', count(*), count(*) FILTER (WHERE created_at > now() - interval '60 days') FROM customers;

\echo '== 4. 열려 있는 코스 (feature_settings) =='
SELECT * FROM feature_settings;

\echo '== 5. 1way 표에 보이는 항목 (module_configs) =='
SELECT axis, module_key, label, display AS 보임 FROM module_configs ORDER BY axis, sort_order;
SQL
