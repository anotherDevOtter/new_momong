-- 얼굴 분석이 실제로 쓰이고 있는지 확인 — 읽기 전용 (SELECT 만, 첫 줄에서 읽기 전용 트랜잭션을 연다)
-- 고객 이름 · 사진 주소는 나오지 않는다 (날짜 · 개수 · 설정만)
BEGIN READ ONLY;

-- 1. 얼굴 분석 — 출처별 전체 · 처음 · 마지막
SELECT source AS 출처, count(*) AS 분석수, min(detected_at)::date AS 처음, max(detected_at) AS 마지막
  FROM face_analysis_results
 WHERE detection_type = 'WNC'
 GROUP BY source;

-- 2. 최근 60일 날짜별 (측정기별: face-measure-web = 지금 사이트 기준 / 예전 Python)
SELECT detected_at::date AS 날짜, source AS 출처,
       coalesce(python_analysis_result->'engine'->>'name', '예전 Python') AS 측정기,
       count(*) AS 분석수
  FROM face_analysis_results
 WHERE detection_type = 'WNC' AND detected_at > now() - interval '60 days'
 GROUP BY 1, 2, 3
 ORDER BY 1 DESC, 2;

-- 3. 상담 · 고객 수 (전체 / 최근 60일)
SELECT 'consultations' AS 표, count(*) AS 전체,
       count(*) FILTER (WHERE created_at > now() - interval '60 days') AS 최근60일
  FROM consultations
UNION ALL
SELECT 'customers', count(*), count(*) FILTER (WHERE created_at > now() - interval '60 days')
  FROM customers;

-- 4. 열려 있는 코스
SELECT * FROM feature_settings;

-- 5. 1way 표에 보이는 항목
SELECT axis, module_key, label, display AS 보임
  FROM module_configs
 ORDER BY axis, sort_order;

ROLLBACK;
