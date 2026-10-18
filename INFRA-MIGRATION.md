# 인프라 이전 계획

> 목표: 월 인프라 비용을 **약 $120 → $27~33** 으로 줄인다.
> 작성: 2026-10-07. 수정: 2026-10-10 (진행 구조 변경, 모듈 키 방식 결정).
> 상태: **완료.** 2026-10-11 Lightsail 로 전환, 2026-10-18 예전 EB · RDS 정리 ([deploy/lightsail/DECOMMISSION.md](./deploy/lightsail/DECOMMISSION.md)).
> 남은 것: 2026-11-11 예전 사진 버킷 `momong-staging` 삭제, 11월 청구서 확인.
> 관련: [ARCHITECTURE.md](./ARCHITECTURE.md) (현재 구조), [TODO.md](./TODO.md) (D1 등 남은 작업).

---

## 1. 요약

코드 변경을 **모두 로컬에서 먼저 끝내고**, 그다음 인프라를 옮긴다.

| 구분 | 단계 | 내용 | 위치 | 상세 |
|---|---|---|---|---|
| 인프라 옮기기 전 | **1** | 얼굴 판단을 브라우저로 넘기기 | 로컬 (별도 브랜치) | §6 |
| | **2** | 백엔드 API · DB 수정 (Python 호출 제거, D1, 모듈 키 변경) | 로컬 (별도 브랜치) | §6, §7 사전 준비 2-1 |
| 인프라 옮기기 | **3** | DB · 설정값 백업 (지금의 0단계 확인 포함) | 운영 (조회 · 백업) | §5, §7 |
| | **4** | 인프라 설정 (Lightsail 생성 · 전환) | 운영 | §7 |

웹(user · admin)은 **Amplify 그대로**, 사진 저장은 **S3 그대로** 둔다.

**아직 정하지 않은 것**
- 1·2단계 코드를 언제 배포할지: (a) 지금 EB에 먼저 배포해서 확인한 뒤 인프라 이전 / (b) 인프라 이전 때 함께
- 이전 후 정리 단계(1주 관찰 → EB 두 개 · RDS 종료)를 4단계에 넣을지 따로 둘지

---

## 1-1. 지금 할 일 — 인프라 옮기기 전 (2026-10-10 확정)

순서: **A. 모듈 이식 마무리 · 테스트 → B. 로컬 백엔드 · DB 수정 → C. 로컬 전체 확인**. 전부 로컬 · 브랜치 `feat/face-measure-web` 에서 하고, 운영 배포는 인프라 옮기기 때 한다.

### A. 모듈 이식 마무리 · 테스트

| # | 작업 | 완료 기준 | 상태 |
|---|---|---|---|
| A1 | 17개 모듈 TS 이식 + 비교 도구 + `test` 코스 | Python 랜드마크로 15개 완전 일치, 실제 웹 등급 일치 95%+ | ✅ |
| A2 | **`test` 코스 실사용 확인** — 로그인 → 촬영 → S3 → 비교 화면 → 이목구비 → 저장 | 한 바퀴 오류 없음 | ✅ 2026-10-10 헤드리스 E2E (사진 업로드 경로). `new` 코스도 확인. 카메라 촬영 경로는 실기기에서 |
| A3 | **매장 iPad(Safari) 확인** — 속도 · 메모리 · 모델 로딩 · 얼굴 못 찾을 때 | 측정 3초 이내, 실패 시 안내 후 다시 촬영 | ✅ 2026-10-10 사용자 확인 통과 |
| A4 | **다양한 사진 10장+** — 남녀 · 연령 · 안경 · 조명. 기준값(`make_baseline.py`) → 비교(`compare.ts` · `render.ts`) | 통과 기준(Q2) 합의 후 통과 | ✅ 2026-10-10 사용자 확인 통과 |
| A5 | **admin 앱에 이식** — `lib/face-measure` 를 admin 에 복사, `/face-analysis-test` 를 웹 측정으로 | admin 테스트 페이지 동작 | ✅ 2026-10-10 admin E2E — 측정 → S3 → 저장 → 결과 표 17개 |
| A6 | **최종 판정(final) 처리** — 24개 → 17개 다수결로 바뀜 (Q9) | 결정 + 반영 | ✅ 추천안대로 17개 다수결, 서버가 다시 계산 (Q9 확인 필요) |

### B. 로컬 백엔드 · DB 수정

| # | 작업 | 완료 기준 |
|---|---|---|
| B1 | **D1** — `synchronize` 를 환경과 무관하게 `false`. 로컬도 스키마는 SQL 마이그레이션으로만 바꾼다 | ✅ 백엔드 기동 시 스키마 변경 없음 |
| B2 | **로컬 스키마를 운영과 맞추기** — 운영 덤프의 스키마만(데이터 제외)으로 임시 DB 를 만들어 비교 | ✅ **앱이 쓰는 9개 테이블은 컬럼 · 제약 · 인덱스 완전히 같음.** 차이는 예전 테이블(manager · image_*)뿐. 확장 `uuid-ossp` |
| B3 | **S3 presign 분리** — `src/storage/s3.service.ts` (얼굴 분석 · 사전설문이 같이 씀) | ✅ 업로드 · 다시 읽기 확인 |
| B4 | **`POST /face-analysis/analyze` 변경** — 검증(`src/face-analysis/face-measure.ts`) 후 저장, final · counts 는 서버가 다시 계산, 촬영본은 우리 버킷 URL 만 | ✅ `tools/face-baseline/api-smoke.ts` 14개 통과 |
| B5 | **`analyze-test`(admin)** 도 같은 방식 | ✅ admin E2E 로 저장 확인. 이전 기록 탭에서 키 변환된 예전 Python 기록도 정상 표시 |
| B6 | **키 변환 SQL `005`** (+ `.down.sql`). 옮기지 않는 7개는 예전 번호 그대로 둠 (Q7) | ✅ 로컬 복사본: 적용 · 재적용 무변화 · 되돌리기 원본과 완전 일치. 로컬 `fit_hair` 에 적용함 (86 + 17행) |
| B7 | **Python 정리** — `PythonAnalysisService` 삭제, `.env.example` 에서 `PYTHON_SERVER_URL` 제거 | ✅ 백엔드가 Python 없이 기동 · 저장. (`test` 코스 비교 화면만 로컬 Python 을 직접 부른다) |

### C. 프론트 연결 · 로컬 전체 확인

| # | 작업 | 완료 기준 |
|---|---|---|
| C1 | **촬영 화면 연결** — 측정(업로드 전 파일) → 업로드 → B4. 얼굴 못 찾으면 올리지 않고 안내 | ✅ new · test 코스 E2E |
| C2 | **화면 키 전환** — `faceAnalysisToPosMap` · 구 3WAY · admin 정렬 | ✅ 새 기록 이목구비 화면 · admin 예전 기록 표시 확인 |
| C3 | **로컬 E2E** — 로그인 → 촬영 → 이목구비 → 헤어컨설팅 → 저장 → 리포트 → 공유 링크 | ✅ 2026-10-11 헤드리스 11단계 통과, 콘솔 오류 0. 저장된 상담에 위치값 20 · 측정값 17(새 키) · 최종 타입, 분석 기록은 engine=face-measure-web · user_id 있음. 로그아웃 상태 공유 링크 + 비밀번호로 리포트 열림 |
| C4 | **정리** — 안 쓰는 API · 코드 · 문서 정리, 문서 갱신, 커밋 | ✅ 정리 · 문서 (2026-10-10, 아래). 커밋은 남음 |
| C5 | **`test` 코스 · 비교 화면 제거** — `test` 코스 카드 · `FaceMeasureCompare` · `legacy.ts` · `dev-screens` ✅ 2026-10-18 삭제 (배포 · 1주 운영 확인 후) |

**C4 정리 내역 (2026-10-10)**
- API 삭제: `GET /consultations/by-customer/:phone` · `PATCH /customers/:id` · `GET /face-analysis/admin/:id` · `POST /admin/auth/register` (화면에서 안 씀. register 는 관리자 0명일 때 인증 없이 열리던 것)
- 프론트 함수 삭제: `getConsults` · `getCustomers` · `searchCustomers` · `getConsultationsByCustomerPhone` · `updateCustomer` · (admin) `getAdminRecord`
- 백엔드 패키지 삭제: `@nestjs/axios` · `axios`
- 문서 보관: `docs/archive/` 로 5개 (목록 · 이유는 그 폴더 README). `DEPLOY-NEW.md` 는 O4(1way ← new 교체) 절차라 남김
- 문서 갱신: README · ARCHITECTURE (브라우저 측정 · 빈 DB 기준 SQL · Python 은 선택) · TODO D1
- 추가: `backend/migrations/000_baseline_schema.sql` — synchronize 를 끄면서 빈 DB 에 테이블이 안 생겨 추가. 빈 DB 에 적용 → 백엔드 기동 · 시드까지 확인

### 진행 중 발견 · 고친 것 (2026-10-10)

- **user_id 저장 버그 (원래 있던 것)** — 얼굴 분석 컨트롤러가 `req.user.sub` 를 읽었으나 JWT 검증은 `{ id }` 를 준다 → 분석 기록 user_id 가 전부 비고 S3 경로가 `anonymous` 였다. `.id` 로 고침. 예전 기록의 user_id 는 비어 있는 채로 남는다.
- **이목구비 가이드선 CORS (원래 있던 것)** — 같은 화면 `<img>` 가 S3 사진을 CORS 없이 먼저 캐시해서 가이드선용 재요청이 막혔다. `useFaceLandmarks` 가 캐시 없이 받아 오도록 고침.
- 로컬 Python 서버는 `application.py` 가 8000 고정이라 `python -m uvicorn application:app --port 3201` 로 띄운다 (README 와 다름).
- admin 앱에 MediaPipe INFO 로그 억제가 없어 개발 오버레이에 'Issue' 가 떴다 → user 앱 `mediapipeLog` 복사해 적용.
- 로컬 확인용 계정 `claude-e2e@local.dev` · 고객 `E2E 테스트 고객` 을 만들었다 (로컬 DB 만).

### 결정 (2026-10-10 사용자 확인)

- **Q2** 통과 — 사용자가 실사용 · 다양한 사진으로 확인 (A3 · A4)
- **Q7** 옮기지 않는 7개 모듈의 예전 결과는 예전 번호 키 그대로 남긴다
- **(2026-10-11 전환 전 점검에서 정정)** 매장이 실제로 쓰는 **1way 코스 표**는 피부톤(WNC 1) · 코 폭(SNH 10)도 쓴다 (운영 module_configs 에서 표시 중).
  "화면에서 안 쓰는 7개"는 new 코스 기준이라 이 둘을 빠뜨렸다 → 두 모듈도 TS 로 옮겼다. 키는 예전 번호 `1` · `10` 그대로 (module_configs · 1way 표와 맞음).
  기준 사진 8장 등급 8/8 일치. 그래서 웹 측정은 **19개**(화면 17 + 1way 전용 2), 옮기지 않은 것은 5개 (WNC 4 · 10, SNH 1 · 3 · 8)
- **Q9** 최종 판정은 17개 다수결, 서버가 다시 계산
- **Q10** 운영 고객 데이터는 로컬에 복원하지 않았다 (스키마만 사용)

### (이전) 결정이 필요했던 것

- **Q2** 웹 · Python 일치 통과 기준 (예: 등급 일치 95%+, 불일치는 기준값 근처만)
- **Q7** 옮기지 않는 7개 모듈의 예전 결과 — 남김(`legacy` 로) / 버림
- **Q9** 최종 판정(final) — 17개로 다시 계산 / 저장하지 않음 (이목구비 화면은 안 씀)
- **Q10** B2 · B6 리허설에 **운영 덤프(실제 고객 데이터)를 로컬에 복원**해도 되는지 — 안 되면 로컬 데이터로만 확인
- (나중) 원본 Python 문제 3가지(눈썹 형태 · 턱 길이 · 고정 픽셀) 수정 여부 — 이식이 끝난 뒤 별도로

---

## 2. 비용

### 현재 (2026-09 청구, 세금 포함 약 $120)

| 항목 | 금액 | 내용 (금액으로 역산한 추정) |
|---|---|---|
| Elastic Load Balancing | $32.41 | 로드밸런서 2개 (EB 두 환경 각각) |
| EC2 | $28.09 | EB 인스턴스 2대 |
| VPC | $25.22 | 퍼블릭 IPv4 약 7개 ($3.65/개) |
| RDS | $20.62 | 가장 작은 단일 구성 |
| 세금 | $10.89 | |
| 기타 | $2.60 | S3 · Amplify 등 |

→ 실제 서버보다 **로드밸런서 + IP 비용이 절반**이다.

### 이전 후 (추정)

| 항목 | 월 |
|---|---|
| Lightsail 인스턴스 (NestJS) | $7~12 |
| Lightsail 관리형 DB (PostgreSQL) | $15 |
| S3 · Amplify | ~$2.6 |
| 세금 | ~$2.5~3 |
| **합계** | **약 $27~33** |

> 단가는 작성 시점 기준 추정이다. 생성 화면에서 서울 리전 실제 금액을 확인할 것.

---

## 3. 목표 구조

```
지금                                          이후
─────────────────────────────────            ─────────────────────────────────
Amplify (user, admin)                         Amplify (user, admin)      ← 그대로
   │                                             │  얼굴 측정은 브라우저에서
   ▼                                             ▼
ALB → EB  NestJS ──→ ALB → EB  Python        Lightsail 인스턴스  NestJS (Docker + Caddy)
            │                                    │  (Lightsail 내부망)
            ▼                                    ▼
          RDS PostgreSQL                      Lightsail 관리형 DB (PostgreSQL)
S3 momong-staging                             S3 momong-staging          ← 그대로
```

---

## 4. 전체 원칙

1. **`main` push = 자동 배포**다 (GitHub Actions → EB, Amplify). 준비되기 전에는 push · merge 하지 않는다.
2. **1단계는 로컬에서만** 진행한다. 운영 DB · S3 · EB 에 접근하지 않는다.
3. **2단계는 운영 작업**이다. 시작 전에 "로컬 전용" 원칙 해제와 운영 담당의 일정 합의를 받는다.
4. 기존 자원(EB · RDS)은 **새 환경이 안정된 것을 확인한 뒤에** 내린다. 내리기 전 최종 스냅샷을 남긴다.
5. 비밀값(DB 비밀번호, JWT, AWS 키)은 Git 에 넣지 않는다.

---

## 5. 0단계 — 사전 확인

콘솔에서 **조회만** 한다. 결과는 이 문서 하단 "확인 결과" 에 적는다.

| # | 확인 항목 | 어디서 | 왜 |
|---|---|---|---|
| 0-1 | EB 두 환경의 **환경 변수 전체** (값 포함) | EB 콘솔 → 구성 → 소프트웨어 | Lightsail 에 그대로 옮겨야 함. 아래 목록 참고 |
| 0-2 | **`NODE_ENV` 값** | 위와 같음 | `production` 이 아니면 지금까지 `synchronize` 가 운영 스키마를 바꿔 왔다는 뜻 (TODO D1) |
| 0-3 | RDS **PostgreSQL 버전**, 용량, 사용 중인 확장(extension) | RDS 콘솔 / `\dx` | Lightsail DB 를 같은 메이저 버전으로 만들어야 함 |
| 0-4 | `004_create_module_configs.sql` 이 운영 DB 에 **적용됐는지** | `\dt module_configs` | TODO 에 "push 전 실행 필수" 로 남아 있음. 이미 origin 에 push 되어 있어 상태 확인 필요 |
| 0-5 | API 도메인(`manager-api.merci-momong.com`) **DNS 관리처**와 권한 | 도메인 등록처 / Route 53 | 2단계 전환 때 바꿔야 함 |
| 0-6 | HTTPS 인증서가 어디에 걸려 있는지 | EB 로드밸런서 리스너 | 로드밸런서를 없애면 서버에서 직접 처리해야 함 |
| 0-7 | Cost Explorer 를 **사용 유형(Usage type)** 으로 보기 | Billing | 위 비용 추정 검증 |

**NestJS 가 쓰는 환경 변수** (코드 기준):
`NODE_ENV` `PORT` `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_DATABASE` `JWT_SECRET`
`AWS_REGION` `AWS_ACCESS_KEY_ID` `AWS_SECRET_ACCESS_KEY` `AWS_PRESIGNED_EXPIRES_IN`
`PYTHON_SERVER_URL` (1단계 후 제거) `ALLOWED_ORIGINS` `FRONTEND_URL`
`ADMIN_EMAIL` `ADMIN_PASSWORD` `ADMIN_SEED_EMAIL` `ADMIN_SEED_PASSWORD` `SWAGGER_USER` `SWAGGER_PASSWORD`

---

## 6. 1단계 — 얼굴 자동 측정을 웹으로

### 현재 흐름

```
브라우저 ─ 사진 업로드 ─→ S3 (presigned PUT)
브라우저 ─ POST /face-analysis/analyze ─→ NestJS ─ POST /analyze-url ─→ Python (MediaPipe + OpenCV)
NestJS ─ 결과 저장 ─→ face_analysis_results (WNC 1행 + SNH 1행), module_configs 자동 생성
```

Python 결과(`wnc`, `snh`)를 쓰는 곳:
- `faceAnalysisToPosMap.ts` — 측정값 → 화면 20항목 위치값
- `FaceOverlay.tsx` — 사진 위 실측 도형
- `module-configs.service.ts` `ensureModules()` — 처음 보는 모듈 키를 숨김 상태로 자동 생성
- admin `/face-analysis-test` — 결과 확인용 페이지
- 구 3WAY 코스 `FaceAnalysisResult.tsx`

### 바뀌는 흐름

```
브라우저 ─ 사진 업로드 ─→ S3                       (그대로 — 리포트·기록에 사진이 필요)
브라우저 ─ FaceLandmarker(이미 사용 중) + TS 판정 로직 ─→ wnc / snh 결과 생성
브라우저 ─ POST /face-analysis/analyze { 결과 } ─→ NestJS ─ 저장만 ─→ face_analysis_results
```

**핵심 원칙: 웹 판정 로직은 Python 과 같은 구조(`grade` · `value` · `description` · `measurement`)의 결과를 만든다.**
단, 결과의 **키는 모듈 번호 대신 화면 항목 id** 로 바꾼다 (아래 "모듈 키 변경").

### 옮길 모듈 (17개) — 2026-10-10 확정

화면은 형태 10 + 비율 10 = 20 항목. Python 은 WNC 10 + SNH 14 = 24 모듈.
화면에 연결된 17개만 옮긴다.

| 화면 항목 id | 화면 이름 | 현재 Python 모듈 | 난이도 |
|---|---|---|---|
| `faceline` | 페이스라인 | WNC 02 턱 각도 | 쉬움 |
| `cheek` | 광대 발달 | WNC 03 광대 | 쉬움 |
| `browshape` | 눈썹 형태 | WNC 05 눈썹 형태 | 어려움 (Canny · Sobel) |
| `eyeshape` | 눈 형태 | WNC 06 눈 형태 | 쉬움 |
| `eyetail` | 눈꼬리 | WNC 07 눈꼬리 각도 | 쉬움 |
| `nosewidth` | 코 너비 | WNC 08 코 형태 (근사) | 쉬움 — ⚠ SNH 10 코 너비와 어느 쪽을 쓸지 확인 |
| `lips` | 입술 두께 | WNC 09 입술 두께 | 쉬움 |
| `facelen` | 얼굴 길이 | SNH 02 | 중간 (Haar 검출 → 점 기반으로 재설계, 기준값 재조정) |
| `thirds` | 상중하안부 비율 | SNH 11 중안부 (근사) | 쉬움 |
| `broweye` | 눈썹~눈 거리 | SNH 04 | 어려움 (Canny) |
| `eyelid` | 쌍꺼풀 | SNH 07 | 어려움 (Canny · Sobel · 모폴로지) |
| `intereye` | 눈 사이 거리 | SNH 05 | 쉬움 |
| `eyeouter` | 눈 바깥 여백 | SNH 06 | 쉬움 |
| `noselen` | 코 길이 | SNH 09 | 쉬움 |
| `philtrum` | 인중 길이 | SNH 12 | 쉬움 |
| `mouthwidth` | 입 폭 | SNH 13 | 쉬움 |
| `chinlen` | 턱 길이 | SNH 14 | 중간 (Haar 상자 높이 → 점 기반, 기준값 재조정) |

- **모듈 없는 화면 항목 3개** (`browdir` 눈썹 방향 · `eyefront` 눈 앞머리 · `nosehigh` 코 높이): 이번에는 만들지 않는다. 지금처럼 디자이너가 직접 조정.
- **옮기지 않는 Python 모듈 7개**: WNC 01 피부톤 · 04 윤곽라인 · 10 입술산 / SNH 01 피부톤(밝기) · 03 눈썹 두께 · 08 눈 밑 지방 · 10 코 너비. 구 3WAY 화면과 admin 테스트 페이지에서만 쓴다.
- 확인된 문제: WNC 05 눈썹 형태는 기준 사진 7장 모두 각도 약 67°로 C 판정 — 지금도 측정이 잘못된 것으로 보인다. 어려운 모듈 처리(Q1) 때 함께 본다.

### 모듈 키 변경 — 2026-10-10 결정 (A안)

결과 키를 모듈 번호(`'2'`, `'4'` …)에서 **화면 항목 id**(`facelen`, `broweye` …)로 바꾼다.

- 이유: 번호를 1~10 으로 다시 매기면 같은 번호가 예전 · 지금 다른 뜻이 된다. 화면 항목 id 는 이미 상담 기록(`faceItemPositions` · `faceValues` · `faceNumbers`)에 쓰이고 있다.
- `faceAnalysisToPosMap` 의 번호 연결표(`FORM_TO_WNC` · `PROP_TO_SNH`)가 필요 없어진다.
- 영향과 처리:

| 곳 | 처리 | 단계 |
|---|---|---|
| `face_analysis_results.python_analysis_result` 예전 기록 | 키를 새 id 로 변환하는 SQL. 옮기지 않는 7개 모듈 결과는 남겨 둘지 결정 필요 | 2단계에서 작성 · 로컬 검증, 운영은 인프라 옮길 때 적용 |
| `module_configs` (admin 표시 설정) | 같은 방식으로 변환 | 위와 같음 |
| admin 분석 기록 · `/face-analysis-test` | 새 키로 수정 | 1단계 |
| 구 3WAY `FaceAnalysisResult.tsx` | 새 키에 맞춤 (닫힌 코스) | 1단계 |
| 상담 기록 · 공유 리포트 | 영향 없음 (이미 화면 항목 id) | — |

- `module_configs.module_key` 는 `varchar(10)` — 가장 긴 id `mouthwidth` 가 10자로 들어간다. 더 긴 id 를 추가하면 컬럼을 늘려야 한다.

### 작업 순서

| # | 작업 | 완료 기준 |
|---|---|---|
| 1-1 | **모듈 목록 정리** — 24개 모듈 중 화면에 실제로 쓰이는 것만 추림 | ✅ 17개 확정 (위 표) |
| 1-2 | **기준값 만들기** — 로컬 Python 으로 테스트 사진을 돌려 결과 JSON 저장. 도구: `tools/face-baseline/make_baseline.py` (opencv < 5 venv 필요) | 기존 9장 완료. **서로 다른 얼굴 사진 10장 이상 추가 필요** (지금 사진들은 결과가 거의 같음) |
| 1-3 | **17개 모듈 TS 이식** — `frontend/user/src/lib/face-measure/` (form.ts · prop.ts · imageops.ts). CLAHE · Canny · Sobel · 모폴로지도 직접 구현 (opencv.js 안 씀). 결과 키는 화면 항목 id | ✅ Python 랜드마크로 돌리면 15개 모듈이 값 · 등급 · 문구까지 Python 과 완전히 같음 |
| 1-4 | **어려운 모듈** — 얼굴 길이 · 턱 길이는 Haar 상자를 랜드마크로 추정 (prop.ts `HAAR_*`). 눈썹 형태는 원본 그대로 옮김(원본 측정 오류도 그대로 — Q1) | 이식 완료. 얼굴 길이 등급 3/7 불일치 (값이 기준 1.3 근처에 몰림) |
| 1-5 | **비교 도구** — `tools/face-baseline/compare.ts` (등급 일치 · 값 차이), `render.ts` (사진 위 측정선 비교 이미지), `extract-web-landmarks/` (브라우저 랜드마크 추출) | 실제 웹 파이프라인 등급 일치 **113/119 (95.0%)** — 불일치: 얼굴 길이 4, 인중 2. 통과 기준(Q2) 합의 필요 |
| 1-6 | **admin 앱 반영** — user · admin 은 독립 앱이라 판정 코드를 양쪽에 둬야 함 (ARCHITECTURE §3-1). 분석 기록 · `/face-analysis-test` 를 새 키로 | `/face-analysis-test` 동작 |

**2단계 (백엔드 API · DB 수정)** 로 넘어가는 것:

| # | 작업 | 완료 기준 |
|---|---|---|
| 2-A | **D1** — `synchronize: false` 고정 (§7 의 2-1) | 로컬 기동 시 스키마 변경 없음 |
| 2-B | **`/face-analysis/analyze` 변경** — Python 을 부르지 않고 받은 결과를 검증(크기 · 형태) 후 저장. `ensureModules` 는 새 키로 유지. `PYTHON_SERVER_URL` 제거 | 로컬 E2E 통과 |
| 2-C | **키 변환 SQL** — 예전 분석 기록 · `module_configs` 를 새 키로 (위 "모듈 키 변경") | 로컬 DB 에서 변환 · 되돌리기 확인 |
| 2-D | **로컬 전체 흐름 확인** — 사진 → 측정 → 상담 저장 → 리포트 · 공유 | 정상 |

배포와 Python EB 종료는 인프라 옮기기(3 · 4단계)에서 함께 정한다. Python EB 종료 시 `face_landmark` 자동 배포 워크플로도 끈다.

### 어려운 모듈

| 모듈 | 이유 | 선택지 |
|---|---|---|
| `SNH_TYPE_07_eyelid` (쌍꺼풀) | 사진 픽셀에서 윤곽선 검출 (Canny · Sobel · 모폴로지) | ① opencv.js (약 8MB, 이 화면에서만 지연 로드) ② 점 기반으로 단순화 ③ 자동 측정 포기, 디자이너가 직접 선택 |
| `WNC_TYPE_05_eyebrow_shape` (눈썹 형태) | 위와 같음 | 위와 같음 |
| `SNH_TYPE_04_eyebrow_eye_distance` | Canny 사용 | 위와 같음 |
| `SNH_TYPE_02_face_length`, `SNH_TYPE_14_chin_length` | 구형 Haar 얼굴 검출기 사용 | MediaPipe 점으로 대체 (어렵지 않음) |

### 1단계 주의점

- **결과가 100% 같지 않다.** Python 은 MediaPipe 0.10.14 (`FaceMesh`), 웹은 0.10.35 (`FaceLandmarker`) 이다. 점 개수(478)는 같지만 위치가 조금씩 다를 수 있어 **경계값 근처 항목은 등급이 바뀔 수 있다.** 1-5 비교로 확인하고, 허용 기준을 미리 정한다.
- **좌표계 확인.** Python 은 픽셀 좌표, 웹은 0~1 정규화 좌표다. 사진 리사이즈 여부도 맞춰야 수치가 같다.
- **GPU 실패 대비.** 일부 기기·브라우저는 WebGL 이 실패한다 (헤드리스 브라우저에서 실제로 실패 확인). CPU 모드로 다시 시도하고, 그래도 안 되면 "자동 측정 실패 → 직접 조정" 으로 넘어가게 한다.
- **모델 파일.** 지금은 CDN 에서 받는다. 매장 네트워크가 불안하면 `public/` 에 모델 파일을 두는 것을 검토한다.
- **키 변경은 한 번에.** `module_configs` 의 라벨·순서·표시 설정이 키로 연결되어 있다. 코드 · 예전 기록 · `module_configs` 를 같은 배포에서 함께 바꾼다.
- **클라이언트가 보낸 결과를 저장**하게 되므로 백엔드에서 크기·형태를 검증한다 (보안 민감 데이터는 아님).
- 구 3WAY 코스(`FaceAnalysisResult.tsx`)도 같은 결과를 쓴다. 코스가 닫혀 있어도 같은 형태를 유지하면 영향 없음.

### 1단계 롤백

Python EB 는 1-8 에서 **1주 관찰 후** 내린다. 그 전에 문제가 생기면 백엔드를 이전 버전으로 되돌리기만 하면 된다 (`PYTHON_SERVER_URL` 유지).

---

## 7. 2단계 — NestJS + DB 를 Lightsail 로

### 사전 준비 (점검 전 며칠)

| # | 작업 | 메모 |
|---|---|---|
| 2-1 | **TODO D1 처리** — `app.module.ts` 의 `synchronize` 를 `false` 로 고정 | 새 DB 에 붙는 순간 스키마가 바뀌는 사고 방지. **최우선** |
| 2-2 | Lightsail **관리형 DB** 생성 — 서울, RDS 와 같은 PostgreSQL 메이저 버전, **공개 모드 끔** | 0-3 결과 기준 |
| 2-3 | Lightsail **인스턴스** 생성 — 서울, 1GB(Python 없으면 충분), **고정 IP 연결**, 방화벽 80/443 만 공개 + SSH 는 관리자 IP 만 | 고정 IP 는 인스턴스에 붙어 있으면 무료 |
| 2-4 | 인스턴스에 Docker + **Caddy** (HTTPS 자동 발급) 설치, NestJS 이미지 실행 | Lightsail 로드밸런서($18)는 쓰지 않음 |
| 2-5 | **S3 전용 IAM 사용자** 생성 — `momong-staging` 버킷의 필요한 경로만 허용, 키를 환경변수로 | EB 는 인스턴스 역할로 S3 접근했을 수 있음. Lightsail 은 키가 필요 |
| 2-6 | 0-1 에서 받은 **환경 변수 이식** (`DB_*` 는 Lightsail DB, `NODE_ENV=production`) | `PYTHON_SERVER_URL` 제외 |
| 2-7 | **임시 도메인**(예: `api-new.merci-momong.com`)으로 새 서버 동작 확인 | Caddy 인증서 발급 · CORS · S3 업로드까지 |
| 2-8 | **배포 방식 변경** — GitHub Actions 를 EB 대신 Lightsail(이미지 빌드 → SSH 로 재시작)로 | 전환 당일 함께 반영. EB 내린 뒤 기존 워크플로가 실패하지 않게 |
| 2-9 | API 도메인 **DNS TTL 을 60초로 낮춤** | 전환 하루 전 |
| 2-10 | **리허설** — 운영 덤프로 Lightsail DB 복원을 한 번 해 보고 걸리는 시간 측정 | 당일 일정 산정 |

### 전환 당일 (점검 1~2시간)

| # | 작업 | 확인 |
|---|---|---|
| D-1 | 매장에 점검 공지, **쓰기 중지** (EB 환경 일시 중지 또는 점검 페이지) | 새 상담 저장이 없는지 |
| D-2 | RDS 에서 **`pg_dump`** (EB 인스턴스에서 실행 — RDS 와 같은 내부망) | `--no-owner --no-privileges`, pg_dump 버전 ≥ 서버 버전 |
| D-3 | 덤프 파일을 Lightsail 인스턴스로 복사 → **Lightsail DB 에 복원** (Lightsail 내부망) | 오류 0 |
| D-4 | **검증** — 테이블별 행 수, 최근 상담·고객 몇 건, 시퀀스 값 대조 | 원본과 일치 |
| D-5 | 새 서버 재시작 → 임시 도메인으로 로그인 · 고객 조회 · 상담 저장 · 사진 업로드 확인 | 정상 |
| D-6 | **API 도메인 DNS 를 Lightsail 고정 IP 로 전환** → Caddy 가 인증서 발급 | `https://manager-api…` 응답 |
| D-7 | user · admin 화면에서 전체 흐름 한 번 | 정상이면 점검 종료 |

### 정리 (1주 관찰 후)

- RDS **최종 스냅샷** 남기고 삭제 (스냅샷은 한 달 정도 보관 후 삭제)
- NestJS EB 환경 종료 → 로드밸런서 · EC2 · IP 함께 사라짐
- 남은 퍼블릭 IP · 스냅샷 · S3 의 EB 배포 zip(`elasticbeanstalk-artifacts/`) 정리
- 다음 달 청구서로 절감액 확인

### 2단계 주의점

- **D1 을 먼저 막지 않으면** 새 DB 에 연결하는 순간 TypeORM 이 스키마를 자동 변경한다. 2-1 을 건너뛰지 않는다.
- **스키마 출처.** 마이그레이션 SQL 은 001~004 뿐이고 나머지 테이블은 `synchronize` 로 만들어진 것으로 보인다. 그래서 새 DB 는 마이그레이션이 아니라 **운영 덤프의 스키마를 그대로** 쓴다. 이후 엔티티를 바꾸면 반드시 SQL 마이그레이션을 따로 만든다.
- **덤프 위치.** Lightsail 에서는 RDS 에 직접 붙을 수 없다. 덤프는 EB 인스턴스(같은 내부망)에서 뜨고 파일로 옮긴다. Lightsail DB 공개 모드는 켜지 않는다.
- **확장(extension).** RDS 에서 쓰는 확장(`uuid-ossp`, `pgcrypto` 등)이 Lightsail DB 에서 지원되는지 2-10 리허설에서 확인한다.
- **S3 권한.** 키는 최소 권한으로 만들고, 버킷 CORS 는 그대로 둔다.
- **HTTPS 인증서 공백.** DNS 전환 직후 Caddy 가 인증서를 받기까지 몇십 초 걸린다. 점검 시간 안에 처리한다.
- **서버 관리 책임이 늘어난다.** EB 가 해 주던 것(재시작, 로그, OS 업데이트)을 직접 챙겨야 한다. Docker `restart: always`, 로그 회전, Lightsail 경보(CPU · 상태 확인), 외부 가동 확인(uptime) 을 설정한다.
- **Lightsail DB 사양 올리기**는 스냅샷 → 새 플랜 생성 방식이라 바로 바뀌지 않는다. 용량 경보를 걸어 둔다.

### 2단계 롤백

- **점검 중 (D-1~D-7)** 에 문제가 생기면: DNS 를 되돌리지 않은 상태이므로 EB 를 다시 켜면 끝. 데이터 유실 없음.
- **전환 후** 에 되돌리면: 그 사이 새 DB 에 쌓인 데이터를 RDS 로 다시 옮겨야 한다. 그래서 **전환 후 24~48시간을 판단 구간**으로 정하고, 그 안에 결정한다. RDS · EB 는 1주 관찰이 끝날 때까지 지우지 않는다.

---

## 8. 결정이 필요한 것

| # | 결정 | 누가 |
|---|---|---|
| Q1 | 어려운 모듈 3개(쌍꺼풀 · 눈썹 형태 · 눈썹~눈 거리) 처리 방식 | 사용자 / 원장님 |
| Q2 | 웹 판정이 Python 과 얼마나 같아야 통과인지 (예: 등급 일치 95%) | 사용자 |
| Q3 | 2단계 점검 일정 · 공지 방법 | 운영 담당 |
| Q4 | 2단계 콘솔 작업(EB 환경변수 조회, DNS 변경 등)을 누가 하는지 | 운영 담당 |
| Q5 | Lightsail 인스턴스 · DB 플랜 크기 | 0단계 결과 보고 결정 |
| Q6 | 화면 "코 너비"(`nosewidth`)를 WNC 08 코 형태 · SNH 10 코 너비 중 어느 쪽 판정으로 할지 | 사용자 |
| Q7 | 키 변환 때 옮기지 않는 7개 모듈의 예전 결과를 남길지 버릴지 | 사용자 |
| Q8 | 1·2단계 코드 배포 시점 — 지금 EB 에 먼저 / 인프라 이전 때 함께 | 사용자 |
| ~~Q9~~ | ~~결과 키 방식~~ → 화면 항목 id 로 결정 (2026-10-10) | |

---

## 9. 확인 결과 (0단계에서 채움)

| # | 항목 | 결과 |
|---|---|---|
| 0-1 | EB 환경 변수 | |
| 0-2 | `NODE_ENV` | |
| 0-3 | PostgreSQL 버전 / 용량 / 확장 | **17.9** (2026-10-10 pg_dump 헤더로 확인). 용량 · 확장은 미확인. pg_dump 는 17 이상 필요 — 이 Mac 기본 `pg_dump` 는 16.15 라 거부됨 |
| 0-4 | `module_configs` 적용 여부 | **적용됨** — 운영 `fit_hair` 에 24행, 생성 2026-09-02 (2026-10-10 데이터 백업으로 확인) |
| 0-5 | DNS 관리처 | |
| 0-6 | 인증서 위치 | |
| 0-7 | 사용 유형별 비용 | |

### 운영 RDS 의 DB 구성 (2026-10-10, 사용자 DB 도구 화면 기준)

RDS 인스턴스(이름 `momong-staging`) 안에 DB 가 3개 있다.

| DB | 테이블 | 판단 |
|---|---|---|
| `fit_hair` | 13 — admin_accounts · consultation_shares · consultations · customers · face_analysis_results · feature_settings · module_configs · pre_surveys · users + 빈 예전 테이블 4개(image_analysis_result_files · image_detection_results · image_detection_types · manager) | **운영 앱이 쓰는 DB** — 데이터가 2026-10-10 까지 쌓여 있음 (백업 날짜 확인) |
| `momong-staging` | 5 — customers · image_analysis_result_files · image_detection_results · image_detection_types · manager | 개편 전 예전 시스템 DB — 마지막 데이터 2026-01~02 |
| `momong-dev` | 6 — 위 5개 + admin | 위와 같음 |

- 사용자 DB 도구의 계정으로는 `fit_hair` 에 접속되지 않는다 → 운영 앱 계정(EB `DB_USERNAME`)과 다른 것으로 보임.
- DB 이름 `momong-staging` · `momong-dev` 는 S3 버킷 이름과 같아 헷갈리기 쉽다.
- 2단계 이전 대상은 운영 앱이 쓰는 DB 1개. 예전 DB 2개는 덤프로 보관 여부를 정한다.

### 백업

- **데이터 백업 (2026-10-10, 사용자)** — DB 3개 전부, 테이블마다 CSV 1개 (헤더 없음, 데이터만)
  - 위치: `W007-MerciMomong/momong-database/migration-backup/` (처음엔 W004 폴더에 받았다가 옮김. Git 저장소 아님)
  - 검사: 24개 파일 모두 파싱 정상, 줄마다 열 수 일정, `fit_hair` 열 수는 로컬 스키마와 일치

    | `fit_hair` 테이블 | 행 | 가장 최근 |
    |---|---|---|
    | customers | 484 | 2026-10-09 |
    | consultations | 379 | 2026-10-08 |
    | consultation_shares | 304 | 2026-10-10 |
    | face_analysis_results | 180 | 2026-10-08 |
    | pre_surveys | 174 | 2026-10-09 |
    | module_configs | 24 | 2026-09-02 |
    | users | 4 | 2026-06-09 |
    | admin_accounts · feature_settings | 1 · 1 | |
    | 예전 테이블 4개 | 0 | |

    `momong-staging`: customers 6 · image_detection_results 18 · image_detection_types 2 · manager 10 / `momong-dev`: manager 1, 나머지 0
  - ⚠ CSV 에는 **스키마(테이블 정의 · 제약 · 인덱스 · 시퀀스)와 열 이름이 없다.** 보관용으로는 되지만 이전(D-2)에는 `pg_dump` 가 따로 필요하다.
  - ⚠ **사진(S3 `momong-staging` 버킷)은 포함되지 않는다.**
- **pg_dump (2026-10-10, 사용자, pg_dump 17.6 · 평문 SQL) — 같은 폴더**

  | 파일 | DB | 크기 | 내용 | CSV 대조 |
  |---|---|---|---|---|
  | `…22_35_41-dump.sql` | `fit_hair` (운영) | 2.9MB | 테이블 13 · 제약 31 · 인덱스 2 · `uuid-ossp` | 전 테이블 일치. 고객 · 사전설문만 +1 — CSV 이후 생긴 행(2026-10-10 09:10 UTC) |
  | `…22_35_47-dump.sql` | `momong-dev` (예전) | 10KB | 테이블 6 · 시퀀스 2 | 일치 |
  | `…22_35_51-dump.sql` | `momong-staging` (예전) | 37KB | 테이블 5 | 일치 |
  | `…22_33_39-dump.sql` | (첫 시도) | 685B | 테이블 0 — 빈 파일 | 지워도 됨 (사용자 승인 후) |

  → **이전(D-2~D-4)의 기준 덤프로 쓸 수 있다.** 확장은 `uuid-ossp` 하나 — Lightsail DB 지원 여부 확인 필요 (2-10 리허설).
- **RDS 스냅샷: 완료** (2026-10-10, 사용자)
- **S3 사진: 백업하지 않음** — 이전에서 S3 는 건드리지 않는다 (2026-10-10 사용자 결정)

---

## 10. 환경 · 이름 정리 — `staging` 없애고 `prod` / `dev` 로 (2026-10-11 계획)

### 원칙

- 환경은 둘뿐이다. **prod = AWS 에 올라간 것 (실제 운영)**, **dev = 로컬**.
- 지금 `staging` 이 붙은 것은 이름만 그렇고 **전부 실제 운영**이다. 별도 스테이징 환경은 없다.
- AWS 자원 이름: `momong-prod-<역할>` · 로컬/개발 자원: `momong-dev…` · Postgres DB 이름은 하이픈 대신 밑줄 (`momong_prod`, `momong_dev`).
- 인프라 이전(§7)에서 **새로 만드는 자원은 처음부터 prod 이름**으로 만든다. 이름만 바꾸려고 따로 작업하지 않는다.

### 바뀌는 이름

| 대상 | 지금 | 바뀐 뒤 | 언제 · 어떻게 |
|---|---|---|---|
| 백엔드 서버 | EB 앱 `momong-staging` / 환경 `Momong-staging-env` | Lightsail 인스턴스 `momong-prod-api` | 2단계 생성 시. EB 는 관찰 후 삭제 |
| Python 서버 | EB `momong-face-analyze-staging(-env)` | (없어짐) | 브라우저 측정 배포 · 관찰 후 삭제 |
| DB 서버 | RDS 인스턴스 `momong-staging` | Lightsail DB `momong-prod-db` | 2단계 생성 시. RDS 는 관찰 후 삭제 |
| 운영 DB 이름 | `fit_hair` | `momong_prod` | 전환 당일 복원할 때 새 이름으로 (덤프는 DB 이름과 무관) |
| 예전 DB 2개 | RDS 안 `momong-staging` · `momong-dev` | (옮기지 않음) | 2026-10-10 덤프 · CSV 로 보관 완료. RDS 와 함께 삭제 |
| 로컬 DB 이름 | `fit_hair` | `momong_dev` | 지금. `ALTER DATABASE … RENAME` + `.env` · 기본값 · 문서 |
| 운영 사진 버킷 | S3 `momong-staging` | `momong-prod` ✅ | 전환 때 같이 (아래 "S3 버킷" A안) |
| 개발 사진 버킷 | S3 `momong-dev` | 그대로 | 이미 dev 이름 |
| 배포 산출물 | S3 `momong-staging/elasticbeanstalk-artifacts/` | (없어짐) | Lightsail 배포는 이미지 빌드 → SSH. 정리 때 삭제 |
| 웹 (Amplify) | 앱 이름 확인 필요 | `momong-prod-user` · `momong-prod-admin` *(N3)* | Amplify 콘솔에서 이름만 변경 (주소 · 배포 무관) |
| 도메인 | `manager-api` · `www` · `admin.merci-momong.com` | 그대로 | 고객 · 매장이 쓰는 주소라 유지 |
| 백엔드 배포 워크플로 | `deploy-backend.yml` → EB `momong-staging` | Lightsail `momong-prod-api` 로 | 2-8 과 함께 |
| Python 배포 워크플로 | `face_landmark/.github/workflows/deploy.yml` → EB staging | 끈다 | 1-8 |
| DataGrip 연결 | `momong-staging` (기본 DB `postgres`) · `Local-Momong-Dev` | `Momong Prod` (기본 DB `momong_prod`) · `Momong Dev` | 사용자. 기본 DB 를 `postgres` 로 두면 덤프가 빈 파일이 된다 (2026-10-10 첫 덤프) |

### S3 버킷 — 결정 필요 (N1)

S3 버킷은 이름을 바꿀 수 없다. `momong-prod` 로 바꾸려면 새 버킷을 만들어 옮겨야 하고, **DB 안에 저장된 사진 주소 1,231개**도 함께 고쳐야 한다
(2026-10-10 운영 덤프 기준: `pre_surveys` 1,024 · `face_analysis_results` 180 · `consultations` 27).

| 안 | 내용 | 일 |
|---|---|---|
| **A. 이번 전환 때 같이** (추천) | 새 버킷 `momong-prod` + CORS · 수명주기 복사 → 사진 미리 복사(`aws s3 sync`) → 전환 당일 남은 것 한 번 더 복사 → 복원한 DB 에서 주소 일괄 치환 SQL → 백엔드 `AWS_S3_BUCKET=momong-prod` | 점검 시간 +10~20분. 옛 버킷은 1주 관찰 후 삭제 |
| B. 그대로 둔다 | 버킷만 `momong-staging` 이름 유지. 문서에 "이름만 staging, 실제 prod" 로 적는다 | 없음. 이름 불일치가 남는다 |
| C. 나중에 따로 | 인프라 이전이 안정된 뒤 같은 절차를 별도 점검으로 | 점검 한 번 더 |

> 2026-10-10 에는 "S3 는 건드리지 않는다" 로 정했다. A · C 를 고르면 그 결정을 바꾸는 것이다.

### 순서

| # | 작업 | 위치 | 언제 |
|---|---|---|---|
| N-1 | 이 표 확정 (N1 · N2 · N3 결정) | — | 지금 |
| N-2 | **로컬 정리** — DB `fit_hair` → `momong_dev`, `backend/.env` · `app.module.ts` 기본값 · `.env.example` · 문서의 staging 표현, `TEST-NEW` 등 | 로컬 | ✅ 2026-10-11. DB 이름은 사용자가 바꿈, 설정 · 문서는 정리. `backend/.env.example` 의 사진 버킷이 운영 버킷으로 적혀 있던 것도 `momong-dev` 로 고침. 남은 staging 표기는 실제 운영 자원 이름(EB · RDS · 버킷 · 배포 워크플로)뿐 — 전환 때 바뀐다 |
| N-3 | **배포 워크플로 · 설정을 prod 이름으로 준비** — Lightsail 용 `deploy-backend.yml`, 서버 `.env.prod` 목록 (값은 Git 밖) | 로컬 | ✅ 2026-10-11 — 아래 파일 |

**전환 준비 파일 (2026-10-11, 브랜치 `feat/face-measure-web`)**
- 런북: [`deploy/lightsail/README.md`](./deploy/lightsail/README.md) — A 준비 · B 당일 · C 명령어 · D 정리, 되돌리기
- 서버: `backend/Dockerfile` · `deploy/lightsail/docker-compose.yml`(api + Caddy) · `Caddyfile` · `setup-server.sh` · `.env.prod.example`(키별 [EB]/[새]/[고정])
- 배포: `.github/workflows/deploy-backend.yml` 를 EB → Lightsail 로 교체 (main 에 merge 될 때부터 동작)
- 사진 주소: `backend/migrations/006_s3_bucket_rename.sql` (+ down). 로컬 복사본에서 적용 · 재적용 · 되돌리기 확인, 운영 덤프의 주소 문자열 1,231개 전부 정상 변환 확인 (운영 데이터는 복원하지 않음)
- 확인 못 한 것: Docker 이미지 빌드 (이 맥에 Docker 없음) — 첫 배포(C-5) 때 서버에서 확인
- 발견 · 수정: 상담 기록의 사진 주소가 5분짜리 서명 주소로 저장되고 있었다 (같은 날 다시 열면 사진이 안 보임). 2026-10-11 수정 — 저장은 서명 없는 원래 주소, 읽을 때 백엔드가 새로 서명 (`S3Service.refreshOwnUrls`, 상담 조회 · 공유 확인). 예전에 서명째 저장된 기록도 다시 열린다 (로컬 확인). 006 은 버킷 이전 때 주소를 원래 형태로 정리한다
| N-4 | **AWS 새 자원 생성** — `momong-prod-api` · `momong-prod-db`(DB `momong_prod`) · (A 안이면) S3 `momong-prod` + IAM `momong-prod-s3` | 운영 | 2단계 준비 (2-2 ~ 2-5) |
| N-5 | **전환 당일** — 덤프 → `momong_prod` 에 복원 → 005 키 변환 → (A 안) 사진 마지막 복사 + 주소 치환 → DNS | 운영 | D-1 ~ D-7 |
| N-6 | **정리** — EB 2개 · RDS(예전 DB 2개 포함) · (A 안) 옛 버킷 삭제, Amplify 이름 변경, DataGrip 연결 이름 | 운영 | 1주 관찰 후 |

### 결정이 필요한 것

- **N1** S3 버킷 — ✅ **바꾼다** (2026-10-11 사용자). 시점은 A안(이번 전환 때 같이)으로 계획
- **N2** DB 이름 — ✅ `momong_prod` / `momong_dev` (로컬은 2026-10-11 변경 완료)
- **N3** Amplify 앱 이름도 바꿀지 (기능 영향 없음)
