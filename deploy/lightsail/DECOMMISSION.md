# 예전 인프라 내리기 — EB · RDS · S3 (prod 전환 뒤 정리)

2026-10-11 에 운영을 Lightsail 로 옮겼다 (런북: [README.md](README.md)).
예전 구성은 1주 동안 켜 둔 채 지켜본 뒤 이 문서 순서대로 내린다.

| 일정 | 할 일 |
|---|---|
| **2026-10-18** (1주 뒤) | 0 → 1 → 2 → 3 → 4 → 5 → 6 |
| **2026-11-11** (한 달 뒤) | 7 |
| 2026-11 청구서 나온 뒤 | 8 |

표시: 🧑 사용자(AWS 콘솔 · GitHub) · 🤖 Claude(코드) · 🖥 서버

> **되돌릴 수 있는 선:** RDS 를 지우기 전까지는 DNS 만 되돌리면 예전 구성으로 돌아갈 수 있다.
> RDS 를 지운 뒤에는 최종 스냅샷에서 복원해야 한다. 그래서 RDS 는 EB 다음, 마지막 확인 뒤에 지운다.

---

## 0. 🧑🖥 내리기 전 확인 (모두 통과해야 진행)

- [ ] 1주 동안 매장에서 오류 보고 없음
- [ ] 서버 로그에 반복되는 오류 없음
  ```bash
  ssh -i ~/.ssh/momong-prod.pem ubuntu@3.36.224.81 'cd ~/momong && docker compose logs --since 168h api | grep -iE "error|exception" | tail -30'
  ```
- [ ] 새 DB 에 1주 동안 상담이 쌓였는지 (DataGrip `lightsail` → `momong_prod`)
  ```sql
  select count(*) from consultations;                                  -- 전환 시 379
  select max(created_at) from consultations;                           -- 최근 날짜여야 함
  ```
- [ ] 예전 서버로 오는 요청이 없는지: EB 콘솔 → `Momong-staging-env` → 모니터링 → 요청 수가 1주 동안 0 에 가까움
- [ ] Lightsail DB 백업이 있는지: Lightsail → 데이터베이스 → `momong-prod-db` → **백업 및 복원**
  - 자동 백업 **켜짐** 확인
  - **수동 스냅샷 하나 만들기**: 이름 `momong-prod-db-2026-10-18`

---

## 1. 🧑 Elastic Beanstalk 환경 2개 종료

> ⚠️ **먼저 확인:** EB 콘솔 → 환경 → **구성(Configuration) → 데이터베이스** 칸이 **비어 있어야** 한다.
> EB 안에서 만든 DB 라면 환경을 종료할 때 DB 도 같이 지워진다. (momong-staging RDS 는 따로 만든 것으로 보이지만 확인하고 진행)

1. EB 콘솔 → 환경 → **`momong-face-analyze-staging-env`** (Python 얼굴 분석) → 작업 → **환경 종료** → 이름 입력 → 종료
2. 같은 방법으로 **`Momong-staging-env`** (예전 백엔드) 종료
3. 둘 다 "종료됨" 이 되면 (10분 정도) EB → **애플리케이션** → `momong-face-analyze-staging`, `momong-staging` 삭제
   - "애플리케이션 버전 삭제" 를 체크한다
4. 확인 (같이 사라졌어야 함)
   - EC2 → 인스턴스: 예전 EB 인스턴스 없음
   - EC2 → 로드 밸런서: 없음
   - EC2 → 탄력적 IP: 남은 것 없음 (남아 있으면 연결 해제 후 **릴리스** — 안 쓰는 IP 도 요금이 나온다)

## 2. 🧑 EB 버킷 삭제 — `elasticbeanstalk-ap-northeast-2-840811954516`

EB 가 배포 파일 · 로그를 넣던 버킷이다. 사진은 없다.

1. S3 → 버킷 → **권한 → 버킷 정책 → 삭제**
   - EB 가 "삭제 금지" 정책을 걸어 두어서 이걸 먼저 지워야 버킷이 지워진다
2. 버킷 선택 → **비우기** → `영구 삭제` 입력
3. 버킷 선택 → **삭제** → 버킷 이름 입력

## 3. 🧑 RDS `momong-staging` 삭제 (최종 스냅샷 후)

안에 운영 DB `fit_hair` 와 안 쓰는 `momong-staging` · `momong-dev` 가 같이 들어 있다.
맥에도 덤프가 있다: `W007-MerciMomong/momong-database/migration-backup/prod_final.sql`

1. RDS → 데이터베이스 → `momong-staging` → **수정**
   - **삭제 방지** 가 켜져 있으면 끈다 → 계속 → **즉시 적용**
2. `momong-staging` 선택 → 작업 → **삭제**
   - **최종 스냅샷 생성: 체크**, 이름 `momong-staging-final-2026-10-18`
   - 자동 백업 보존: 체크 해제 (최종 스냅샷으로 충분)
   - `delete me` 입력 → 삭제
3. RDS → 스냅샷 에서 `momong-staging-final-2026-10-18` 이 "사용 가능" 인지 확인
   - 스냅샷은 용량만큼 소액 요금이 나온다. 2026-10-10 수동 스냅샷과 함께 몇 달 두었다가 지운다

## 4. 🧑 GitHub · IAM 정리

- **`face_landmark` 배포 끄기:** GitHub `momong_face_landmark` → Actions → "Deploy to AWS Elastic Beanstalk" → `···` → **Disable workflow**
  (EB 가 없으니 push 하면 실패만 한다)
- **예전 배포용 비밀값 삭제:** 두 저장소 Settings → Secrets and variables → Actions 에서 EB 배포에만 쓰던 AWS 키 삭제
  - `new_momong` 에는 `LIGHTSAIL_HOST` · `LIGHTSAIL_USER` · `LIGHTSAIL_SSH_KEY` 만 남기면 된다
- **예전 IAM 키 끄기:** IAM → 사용자 → EB 배포 · 예전 백엔드가 쓰던 사용자 → 보안 자격 증명 → 액세스 키
  - "마지막 사용" 이 전환일(2026-10-11) 이전이면 **비활성화** → 일주일 뒤 문제없으면 삭제
  - `momong-prod-s3` 는 **건드리지 않는다** (지금 운영이 쓰는 키)

## 5. 🤖🧑 코드 정리 · 배포

- 🤖 `test` 코스 · 비교 화면 제거 (INFRA-MIGRATION C5)
  - `CourseSelection.tsx` 의 `test` 카드, `consulting/page.tsx` 의 `test` 분기
  - `components/new/FaceMeasureCompare.tsx`, `lib/face-measure/legacy.ts`, `dev-screens` 의 `?v=compare`
- 🤖 예전 흔적 정리 (2026-10-11 전체 점검에서 발견, 운영 영향 없음)
  - `backend/Procfile` 삭제 (EB 전용)
  - 사용자 웹 `/dev-screens` 페이지 삭제 — 운영에서 로그인 없이 열린다 (예시 화면뿐, 고객 데이터 없음)
- 🧑🖥 운영 DB 의 빈 예전 테이블 4개 삭제 검토 — `image_detection_results` · `image_detection_types` · `image_analysis_result_files` · `manager` (모두 0건, 옛 momong_backend 것, 코드에서 안 씀). 운영 DB 변경이라 승인 후 서버에서:
  ```sql
  -- 먼저 0건인지 다시 확인
  select (select count(*) from image_detection_results), (select count(*) from image_detection_types),
         (select count(*) from image_analysis_result_files), (select count(*) from manager);
  drop table image_analysis_result_files, image_detection_results, image_detection_types, manager;
  drop type if exists image_analysis_result_files_type_enum;
  ```
- DB 칸 이름 `python_analysis_result` 는 그대로 둔다 (이름만 예전 것, 바꾸면 코드 · 데이터 동시 변경이 필요)
- 🤖 `INFRA-MIGRATION.md` 상태표 "완료" 로, 이 문서 결과 칸 채우기 → 커밋
- 🧑 `main` push → 사용자 웹 · 백엔드 자동 배포
- 🧑 **관리자 웹 배포 브랜치 정리:** Amplify → `new_momong-admin` → 앱 설정 → 브랜치 설정에서 프로덕션 브랜치를 `main` 으로
  - 바꾸기 전까지는 `main` 을 바꿀 때마다 `git push origin origin/main:admin` 을 해야 관리자 웹이 바뀐다
  - 바꾼 뒤 `admin.merci-momong.com` 도메인 연결 · 환경변수가 그대로인지 확인
- 🧑 (선택) Amplify 이름 → `momong-prod-user` · `momong-prod-admin`, 8개월 전 버전인 `momong_web` 은 쓰는 곳이 없으면 삭제

## 6. 🧑 Lightsail 알람

Lightsail → 각 리소스 → **지표(Metrics)** → 알람 추가 (알림은 이메일 · SMS)

| 대상 | 지표 | 기준 |
|---|---|---|
| `momong-prod-api` | CPU 사용률 | 5분 평균 80% 이상 |
| `momong-prod-api` | 상태 확인 실패 | 1회 이상 |
| `momong-prod-db` | CPU 사용률 | 5분 평균 80% 이상 |
| `momong-prod-db` | 남은 저장 공간 | 2GB 이하 |

- 인스턴스 → 스냅샷 → **자동 스냅샷 켜기** (매일, 7개 보관)

## 7. 🧑 한 달 뒤 (2026-11-11) — 예전 사진 버킷

- S3 `momong-staging` 삭제 (비우기 → 삭제)
  - 사진 1,481개는 전환 때 `momong-prod` 로 복사했고, DB 에 예전 버킷 주소는 0개다
  - 지우기 전 확인 (DataGrip `momong_prod`, 결과가 모두 0 이어야 함):
    ```sql
    select count(*) from face_analysis_results where face_image_url like '%momong-staging.s3%';
    select count(*) from consultations where client_info::text like '%momong-staging.s3%';
    select count(*) from pre_surveys where answers::text like '%momong-staging.s3%';
    ```
- 맥 로컬 백업 `momong-database/migration-backup/` 을 계속 둘지 결정 (고객 개인정보 포함)

## 8. 🧑 청구서 확인

- 2026-11 청구서에서 EB · ELB · EC2 · RDS · 퍼블릭 IPv4 항목이 사라졌는지
- 목표 월 약 $27~33 (9월 약 $120). 남은 항목이 있으면 Cost Explorer 에서 서비스별로 찾는다

---

## 결과 기록

| 단계 | 날짜 | 결과 |
|---|---|---|
| 0 확인 | | |
| 1 EB 종료 | | |
| 2 EB 버킷 | | |
| 3 RDS | | |
| 4 GitHub · IAM | | |
| 5 코드 · 배포 | | |
| 6 알람 | | |
| 7 사진 버킷 | | |
| 8 청구서 | | |
