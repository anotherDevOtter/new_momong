# MERCI MOMONG — 기술 구조

> **어떻게 만들었는가** 의 single source of truth. 디렉토리, 데이터, 인프라, 배포 흐름.
> 제품 정의는 [PLANNING.md](./PLANNING.md), 실행 방법은 [README.md](./README.md).

---

## 1. 시스템 구성도

```
                          ┌────────────────────────────────────┐
                          │         사용자 (디자이너)           │
                          │      https://www.merci-momong.com  │
                          └─────────────────┬──────────────────┘
                                            │
                                            ▼
              ┌──────────────────────────────────────────────────┐
              │             user frontend (Next.js)               │
              │      AWS Amplify, repo path: frontend/user        │
              └──────┬────────────────────────────┬──────────────┘
                     │ JWT bearer                  │ direct PUT
                     ▼                              ▼
              ┌────────────────┐       ┌──────────────────────────┐
              │   backend EB    │◄──────┤  S3 momong-staging       │
              │   (NestJS)      │  GET  │  /face-analysis/<uid>/.. │
              │ Application:    │ presign│ /elasticbeanstalk-...    │
              │ momong-staging  │        └──────────────────────────┘
              └──┬──────────┬───┘
   PG TypeORM   │          │     POST /analyze-url
  ┌─────────────▼─┐        ▼
  │   RDS         │   ┌──────────────────────────────┐
  │  PostgreSQL   │   │  face_landmark Python EB     │
  │ tables: users │   │ (FastAPI, MediaPipe, OpenCV) │
  │ consultations │   │ Application:                  │
  │ face_analysis │   │ momong-face-analyze-staging  │
  │ _results 등    │   └──────────────────────────────┘
  └───────────────┘

                          ┌────────────────────────────────────┐
                          │      관리자 (운영팀)                │
                          │      https://admin.merci-momong.com │
                          └─────────────────┬──────────────────┘
                                            │
                                            ▼
              ┌──────────────────────────────────────────────────┐
              │            admin frontend (Next.js)               │
              │      AWS Amplify, repo path: frontend/admin       │
              └─────────────────────────┬────────────────────────┘
                                        │
                                        ▼ JWT bearer (admin)
                              (위와 동일한 backend EB 호출)
```

---

## 2. 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| Backend | NestJS 11 + TypeORM | port 3001 (local) |
| DB | PostgreSQL 15 | RDS (운영), 로컬 자체 설치 |
| Frontend (user) | Next.js 16 + React 19 + Tailwind v4 | port 3100 (local) |
| Frontend (admin) | Next.js 16 + React 19 + Tailwind v4 | port 3200 (local) |
| 인증 | JWT (HS256) | secret = `JWT_SECRET` env |
| 얼굴 분석 | FastAPI + MediaPipe + OpenCV | 별도 repo `face_landmark/` |
| 클라이언트 얼굴 검출 | `@mediapipe/tasks-vision` | CDN 모델, 픽스된 버전 0.10.35 |
| 애니메이션 | `motion/react` | |
| 이미지 저장 | AWS S3 (`momong-staging`) | presigned URL PUT/GET |
| E2E 테스트 | Playwright | `e2e/` 디렉토리 |
| 배포 (backend) | GitHub Actions → S3 → EB | `.github/workflows/deploy-backend.yml` |
| 배포 (frontend) | AWS Amplify (auto on push) | `amplify.yml` |

---

## 3. 디렉토리 구조

```
new_momong/
├─ backend/                       NestJS API 서버
│  ├─ src/
│  │  ├─ admin/                   어드민 인증 + 유저 관리
│  │  ├─ auth/                    매장(디자이너) 회원/로그인
│  │  ├─ customers/               고객 정보
│  │  ├─ consultations/           컨설팅 기록 (FIT/3WAY 공용)
│  │  ├─ shares/                  공유 링크
│  │  ├─ pre-surveys/             사전설문지 (공개 토큰 기반)
│  │  │  ├─ pre-surveys.entity.ts        (table: pre_surveys)
│  │  │  ├─ pre-surveys.service.ts       (토큰 생성/조회/저장 + photoDisplayUrls 매핑)
│  │  │  └─ pre-surveys.controller.ts    (인증 + 공개 토큰 endpoint)
│  │  ├─ feature-settings/        기능 플래그
│  │  ├─ face-analysis/           얼굴 분석 (Python 호출 + S3 + DB)
│  │  │  ├─ face-analysis.entity.ts        (table: face_analysis_results)
│  │  │  ├─ python-analysis.service.ts     (Python 호출 + S3 presign)
│  │  │  ├─ face-analysis.service.ts       (분석 호출 + DB 저장 + 기록 조회)
│  │  │  └─ face-analysis.controller.ts    (user/admin 분리 endpoint)
│  │  └─ common/                  미들웨어/필터
│  ├─ migrations/                 운영 DB 수동 마이그레이션 SQL
│  │  ├─ 001_create_face_analysis_results.sql
│  │  ├─ 002_add_source_to_face_analysis_results.sql
│  │  └─ 003_create_pre_surveys.sql
│  └─ Procfile                    EB 실행 (web: node dist/main)
├─ frontend/
│  ├─ user/                       디자이너용 (3100)
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ (app)/             공통 AppHeader layout (인증 필요)
│  │     │  │  ├─ /3way, /3way/consulting
│  │     │  │  ├─ /fit
│  │     │  │  ├─ /consulting/start
│  │     │  │  └─ /customers, /customers/[id]
│  │     │  ├─ login, signup, find-id, reset-password
│  │     │  ├─ share/[token]      컨설팅 결과 공유 (공개, 비밀번호)
│  │     │  └─ pre-survey/[token] 사전설문지 작성 (공개, 토큰만)
│  │     ├─ components/
│  │     │  ├─ steps/             FIT 컨설팅 step 컴포넌트
│  │     │  ├─ 3way/              3WAY 컨설팅 화면 (28+ 컴포넌트)
│  │     │  ├─ pre-survey/        사전설문 8섹션 + PageLayout + PhotoUploader
│  │     │  └─ ui/                공용 UI (Modal, ProgressBar 등)
│  │     ├─ contexts/             AuthContext, FeaturesContext
│  │     └─ utils/                api.ts, 3way-api.ts, face-analysis-api.ts, pre-survey-api.ts, image-resize.ts
│  └─ admin/                      운영자용 (3200)
│     └─ src/
│        ├─ app/                  /dashboard, /users, /features, /face-analysis-test
│        ├─ components/           AdminHeader, AdminFaceAnalysisCapture, FaceOverlay, useFaceDetector
│        └─ utils/                api.ts, face-analysis-api.ts, image-resize.ts
├─ .github/workflows/             deploy-backend.yml (GitHub Actions → EB)
├─ amplify.yml                    Amplify 빌드 설정 (user/admin 동시 정의)
├─ e2e/                           Playwright E2E
├─ figma/                         Figma Make 원본 (참고용)
├─ PLANNING.md                    제품 정의
├─ ARCHITECTURE.md                본 문서
├─ README.md                      실행/운영
└─ TODO.md                        남은 작업
```

---

## 4. 데이터 모델

> 컬럼 상세는 `backend/src/**/*.entity.ts` 가 정답. 여기는 개요.

| 엔티티 | 키 컬럼 | 비고 |
|---|---|---|
| `users` | id, email, store_name, owner_name, password_hash, phone, status, role | 디자이너 |
| `customers` | id, user_id, name, phone, gender, age_group, memo | 고객 |
| `consultations` | id, user_id, customer_id, visit_date, designer_name, after_note, client_info(jsonb), today_keyword, fashion_style, face_image_type, hair_condition, hair_style_proposal, today_design, next_direction, design_cycle_guide | FIT + 3WAY 공용 |
| `consultation_shares` | id, consultation_id, token, password, expires_at | 공유 링크 |
| `admin_accounts` | id, email, password_hash | 디자이너 users 와 별도 |
| `feature_settings` | id(=1), fit_enabled, three_way_enabled, course_*_enabled | 싱글톤 |
| `face_analysis_results` | id, user_id, customer_id, detection_type(WNC/SNH), source(consultation/admin_test), face_image_url, python_analysis_result(jsonb), client_provided_data(jsonb), detected_at | 한 분석 = WNC + SNH 2행 |
| `pre_surveys` | id, user_id, customer_id, token(unique), answers(jsonb), filled_at, created_at, updated_at | 디자이너 발급 토큰으로 고객이 방문 전 작성. 사진 URL 도 answers 안에 raw S3 URL 로 저장 |

### 4-1. consultation 에서 얼굴 분석 결과 참조

`consultations.client_info.threeWay.faceAnalysis` jsonb 안에:

```jsonc
{
  "wncId": "uuid-...",           // face_analysis_results FK 역할
  "snhId": "uuid-...",
  "wncFinal": "W",               // 빠른 조회용 캐시
  "snhFinal": "N",
  "imageType": "W / N",
  "faceImageUrl": "https://momong-staging.s3.../face-analysis/<uid>/<uuid>.jpg"
}
```

→ DB schema 변경 없이 jsonb 만으로 연결. 한 컨설팅 = 한 행 + face_analysis_results 의 2행.

### 4-2. face_analysis_results.python_analysis_result jsonb 구조

```jsonc
{
  "final": "W",                    // 다수결 W/N/C 또는 S/N/H
  "counts": { "W": 6, "N": 3, "C": 1 },
  "results": {
    "1": {
      "name": "피부톤",
      "grade": "W",
      "value": 1.42,                // optional, 모듈마다 다름
      "description": "...",          // optional
      "measurement": {               // 오버레이 그리기용
        "image_size": { "width": 800, "height": 1000 },
        "shapes": [
          { "type": "rectangle", "points": [...], "stroke": "#A52A2A", "dashed": true },
          { "type": "text", "point": {...}, "text": "1.42" }
        ]
      }
    }
  }
}
```

---

## 5. API 구조

> 정확한 시그니처/스키마는 Swagger 가 자동 생성: `http://localhost:3001/api/docs` (Basic Auth)

### 5-1. 인증/유저
- `POST /api/auth/signup`, `/login`, `/find-id`, `/reset-password`
- 디자이너 status: `pending` → admin 승인 → `approved`

### 5-2. 컨설팅
- `POST /api/consultations` — 저장
- `GET  /api/consultations/:id` — 조회
- `POST /api/shares` — 공유 링크 발급
- `GET  /api/shares/:token` — 공유 링크 조회

### 5-3. 얼굴 분석
- **user 흐름** (JwtAuthGuard):
  - `POST /api/face-analysis/upload-url` — PUT presigned URL 발급
  - `POST /api/face-analysis/analyze` — Python 호출 + DB 저장 (source=consultation)
- **admin 흐름** (AdminGuard):
  - `POST /api/face-analysis/admin/upload-url`
  - `POST /api/face-analysis/analyze-test` — source=admin_test
  - `GET  /api/face-analysis/admin/history?limit=N` — admin_test 기록 목록
  - `GET  /api/face-analysis/admin/:id` — 단건 상세
  - `DELETE /api/face-analysis/admin/:id` — 짝 삭제

### 5-5. 사전설문지
- **디자이너 흐름** (JwtAuthGuard, owner 확인):
  - `POST /api/pre-surveys` — 토큰 발급 (body: `{ customerId }`)
  - `GET  /api/pre-surveys/by-customer/:customerId` — 고객별 설문 목록
  - `GET  /api/pre-surveys/:id` — 단건 상세 (answers + photoDisplayUrls 매핑)
  - `DELETE /api/pre-surveys/:id`
- **고객 (공개)** — 인증 없음, 토큰 자체가 권한:
  - `GET  /api/pre-surveys/token/:token` — 설문 + 작성중 답변 + `photoDisplayUrls`(signed GET) 반환
  - `PATCH /api/pre-surveys/token/:token` — `{ answers, submit? }`. submit=true 면 `filled_at` 세팅 (제출 후 수정 불가)
  - `POST /api/pre-surveys/token/:token/upload-url` — 사진 업로드용 S3 PUT presigned URL (5MB 제한, 제출된 설문은 거부)
- 토큰은 `crypto.randomBytes(24).toString('base64url')` (192 bit), 만료 없음, 재발급 무제한

### 5-4. Admin
- `POST /api/admin/auth/login`
- `GET  /api/admin/users`, `/api/admin/stats`
- `PATCH /api/admin/users/:id/status` — 승인/거절
- `PATCH /api/admin/feature-settings` — 기능 토글

---

## 6. face_landmark Python 서버

별도 repo: `/Users/won/Development Project/momong/face_landmark/`

### 6-1. 구조
- FastAPI 앱 (`application.py`) — `/analyze`, `/analyze-url`, `/analyze-base64`, `/health`
- `analyze_face.py` — subprocess 진입점, 모듈 22개 호출
- `modules/` — WNC 10 + SNH 12 = 22 모듈 (`WNC_TYPE_01_skin_tone.py` 등)
- MediaPipe Face Mesh 468 landmarks + OpenCV 영상 분석

### 6-2. 분석 모듈 분류

**WNC (Warm / Neutral / Cool) — 10 모듈**
1 피부톤 · 2 턱각도 · 3 광대발달 · 4 윤곽라인 · 5 눈썹형태
6 눈형태 · 7 눈꼬리각도 · 8 코형태 · 9 입술두께 · 10 입술산형태

**SNH (Soft / Neutral / Hard) — 12 모듈**
1 피부톤밝기 · 2 얼굴길이 · 3 눈썹두께 · 4 눈썹-눈거리
5 눈사이거리 · 6 눈바깥여백 · 9 코길이 · 10 코너비
11 중안부비율 · 12 인중길이 · 13 입너비 · 14 턱길이

각 모듈은 `{grade, value, description, measurement}` 반환. measurement 는 오버레이 좌표 데이터.

### 6-3. measurement schema

frontend `FaceOverlay` 가 그릴 수 있는 도형:
- `point`, `line`, `polyline`, `polygon`, `rectangle`, `circle`, `text`
- 좌표는 원본 이미지 절대 픽셀 (image_size 기준)
- 색상/두께/dashed 등 스타일 옵션 포함

---

## 7. S3 / 환경 분리

| 환경 | S3 버킷 | EB 환경 | DB |
|---|---|---|---|
| 로컬 dev | `momong-dev` (localhost CORS) | localhost backend + Python | 로컬 PostgreSQL |
| 운영 | `momong-staging` (`*.merci-momong.com` CORS) | `Momong-staging-env` + `momong-face-analyze-staging-env` | RDS |

> 운영 EB 환경명에 'staging' 이 들어가지만 실제 운영용. 명칭 정리는 미루어둠.

### S3 키 구조
- 사용자 얼굴 사진: `face-analysis/<userId>/<uuid>.<ext>`
- admin 테스트: `face-analysis/admin/<uuid>.<ext>`
- 사전설문 사진: `pre-surveys/<customerId>/<uuid>.<ext>`
- backend 배포 아티팩트: `elasticbeanstalk-artifacts/fit-hair-deploy-<sha>.zip`

### S3Client 옵션 (브라우저 PUT 호환)
`PythonAnalysisService` 의 `S3Client` 인스턴스는 다음 옵션 필수:
```ts
new S3Client({
  region,
  credentials,
  requestChecksumCalculation: 'WHEN_REQUIRED',   // presigned URL 에 x-amz-checksum-* 자동 추가 끄기
  responseChecksumValidation: 'WHEN_REQUIRED',
})
```
AWS SDK v3 가 기본으로 추가하는 CRC32 체크섬 헤더 때문에 브라우저 fetch PUT 이 SignatureDoesNotMatch 로 거부되던 문제를 해결. face-analysis 와 pre-surveys 양쪽 모두에 영향.

### CORS 정책 (`momong-staging`)
```json
AllowedOrigins: ["http://localhost:3002", "https://*.merci-momong.com"]
AllowedMethods: ["PUT", "POST", "GET", "HEAD"]
```

---

## 8. 배포 흐름

### 8-1. Backend (자동)
1. `git push origin main` → GitHub Actions 트리거 ([.github/workflows/deploy-backend.yml](.github/workflows/deploy-backend.yml))
2. Node 22 build → zip → S3 업로드
3. EB `create-application-version` + `update-environment`
4. 5-10분 후 운영 반영

### 8-2. Frontend (자동)
- Amplify 가 GitHub `main` watch → push 감지 → 자동 빌드/배포
- user / admin 별도 앱으로 등록되어 있어야 양쪽 다 자동 배포
- `amplify.yml` 에 각 앱의 appRoot 정의 (`frontend/user`, `frontend/admin`)
- 빌드 시간: 각 3-5분

### 8-3. Python 서버 (face_landmark)
- 별도 EB 환경 (`momong-face-analyze-staging-env`)
- 별도 repo, 별도 배포 파이프라인 (해당 repo 의 CI 사용 또는 수동)

### 8-4. DB 마이그레이션 (수동)
- dev: TypeORM `synchronize: true` 자동 스키마 적용
- 운영: `backend/migrations/*.sql` 을 psql/pgAdmin 으로 수동 실행
  - `001_create_face_analysis_results.sql` (테이블 생성)
  - `002_add_source_to_face_analysis_results.sql` (source 컬럼)
  - `003_create_pre_surveys.sql` (pre_surveys 테이블 + 인덱스 3개)

---

## 9. 환경 변수 (운영 EB)

### Backend (`Momong-staging-env` Configuration)

| 키 | 용도 |
|---|---|
| `NODE_ENV=production` | TypeORM synchronize OFF + SSL ON |
| `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE` | RDS 접근 |
| `JWT_SECRET` | JWT 서명 |
| `ALLOWED_ORIGINS` | `https://www.merci-momong.com,https://admin.merci-momong.com` |
| `FRONTEND_URL` | 공유 링크 base URL |
| `PYTHON_SERVER_URL` | face_landmark EB URL |
| `AWS_REGION` | `ap-northeast-2` |
| `AWS_S3_BUCKET` | `momong-staging` |
| `AWS_ACCESS_KEY_ID` / `SECRET_ACCESS_KEY` | (또는 IAM Instance Profile) |
| `AWS_PRESIGNED_EXPIRES_IN` | 기본 300 |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | Swagger Basic Auth |

### Frontend (Amplify Environment Variables)

| 키 | 값 (운영) |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.merci-momong.com/api` (또는 backend EB URL) |

---

## 10. 로컬 개발 환경

> 자세한 실행 절차는 [README.md](./README.md). 여기는 인프라 차이점만.

| 항목 | 로컬 | 운영 |
|---|---|---|
| DB | localhost PostgreSQL | RDS |
| backend | `npm run start:dev` (3001) | EB (auto deploy) |
| user frontend | `PORT=3100 npm run dev` | Amplify |
| admin frontend | `PORT=3200 npm run dev` | Amplify |
| Python 서버 | `cd face_landmark && python application.py` (8000) | 별도 EB |
| S3 | `momong-dev` (CORS: localhost) | `momong-staging` (CORS: `*.merci-momong.com`) |
| 인증 | 자동 시드 admin (`admin@momong.com` / `!Password1234`) | env 통한 강한 시드 |

---

## 11. 보안/운영 메모

- **face_landmark 운영 환경명에 'staging'** — 별도 production 환경 분리 권장 (작업 미루어둠)
- **JWT secret** — env 로 강제. 운영에선 절대 default 사용 금지
- **얼굴 이미지 원본 보존 정책** — 현재 영구. S3 lifecycle 정책 (30일/90일) 추후 검토
- **Backend EB Application 이름이 `momong-staging`** — application name 만 그렇고 환경은 실제 운영
