# MERCI MOMONG

헤어 디자이너용 디지털 컨설팅 도구. **FIT 컨설팅** 과 **3WAY 컨설팅** 두 가지 흐름을 제공하고, 매장 운영자가 활성 기능을 토글할 수 있다.

> 제품 설계 문서: [PLANNING.md](./PLANNING.md)

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | NestJS 11 + TypeORM + PostgreSQL |
| Frontend (User) | Next.js 16 (App Router) + React 19 + Tailwind v4 |
| Frontend (Admin) | Next.js 16 + React 19 + Tailwind v4 |
| 인증 | JWT |
| 애니메이션 | `motion/react` |
| E2E 테스트 | Playwright |
| 배포 | AWS Amplify (frontend), 자체 (backend) |

---

## 디렉토리

```
new_momong/
├─ backend/                  NestJS API 서버 (port 3001)
│  └─ src/
│     ├─ admin/              어드민 인증 + 유저 관리
│     ├─ auth/               매장(디자이너) 회원/로그인
│     ├─ customers/          고객 정보
│     ├─ consultations/      컨설팅 기록
│     ├─ shares/             공유 링크
│     ├─ feature-settings/   기능 플래그 (FIT/3WAY/코스 on/off)
│     └─ common/             미들웨어/필터
├─ frontend/
│  ├─ user/                  디자이너용 (port 3100)
│  │  └─ src/
│  │     ├─ app/             /, /3way, /login, /signup, /share/[token] 등
│  │     ├─ components/
│  │     │  ├─ steps/        FIT 컨설팅 step 컴포넌트
│  │     │  ├─ 3way/         3WAY 컨설팅 화면 (28개)
│  │     │  └─ ui/           공용 UI (Button, Input, CheckboxGroup …)
│  │     ├─ contexts/        AuthContext, FeaturesContext
│  │     └─ utils/           api.ts, 3way-api.ts, api-error.ts
│  └─ admin/                 운영자용 (port 3200)
│     └─ src/app/
│        ├─ dashboard/       통계 + 승인 대기 유저
│        ├─ users/           유저 관리
│        └─ features/        기능 플래그 토글
├─ docs/                     이전 기획 문서 (참고용)
├─ figma/                    Figma Make 원본 (참고용)
├─ e2e/                      Playwright E2E 테스트
├─ PLANNING.md               제품 설계 문서
└─ README.md                 본 문서
```

---

## 사전 준비

1. **Node.js 20+** 설치
2. **PostgreSQL 15+** 로컬 설치 (예: [Postgres.app](https://postgresapp.com))
3. **DB 준비**
   ```bash
   # 기본 superuser 로 postgres 비밀번호 설정 + DB 생성 (한 번만)
   createuser -s postgres
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';"
   psql -U postgres -c "CREATE DATABASE fit_hair;"
   ```
   - 비밀번호와 DB명을 다르게 쓰려면 `backend/.env` 의 `DB_PASSWORD`, `DB_DATABASE` 를 맞춰서 변경

---

## 빠른 시작

각 폴더에서 의존성 설치 후 dev 서버 실행. 3개 터미널 필요.

```bash
# 1) backend (.env 자동 사용)
cd backend
cp .env.example .env       # 처음 한 번만
npm install
npm run start:dev          # http://localhost:3001

# 2) user frontend
cd frontend/user
cp .env.example .env.local # 처음 한 번만
npm install
PORT=3100 npm run dev      # http://localhost:3100

# 3) admin frontend
cd frontend/admin
cp .env.example .env.local # 처음 한 번만
npm install
PORT=3200 npm run dev      # http://localhost:3200
```

### 접속

| 서비스 | URL |
|---|---|
| API 서버 | http://localhost:3001 |
| Swagger 문서 | http://localhost:3001/api/docs (Basic Auth: `admin` / `admin1234`) |
| User 프론트 | http://localhost:3100 |
| Admin 프론트 | http://localhost:3200 |

### 기본 계정

| 종류 | 계정 |
|---|---|
| Admin (자동 시드) | `admin@momong.com` / `!Password1234` |
| 디자이너 | 직접 `/signup` 으로 가입 → 어드민에서 승인 |

> `feature_settings`, `admin_accounts` 는 백엔드 부팅 시 비어 있으면 자동 시드됨.
> 운영 배포 시 비번을 반드시 변경할 것 (env 또는 즉시 PATCH).

---

## 환경 변수

상세는 각 폴더의 `.env.example` 참고.

### backend/.env

| 키 | 기본 | 설명 |
|---|---|---|
| `PORT` | 3001 | API 포트 |
| `NODE_ENV` | development | `production` 이면 TypeORM `synchronize` OFF + SSL ON |
| `DB_HOST`/`PORT`/`USERNAME`/`PASSWORD`/`DATABASE` | localhost/5432/postgres/password/fit_hair | PostgreSQL |
| `JWT_SECRET` | momong_jwt_secret_change_in_production | 토큰 서명 키 (운영 변경 필수) |
| `ALLOWED_ORIGINS` | `http://localhost:3000,3100,3200` | CORS 허용 origin (콤마 구분) |
| `FRONTEND_URL` | http://localhost:3100 | 공유 링크 base URL |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | (미지정) | env 어드민 계정 (DB와 별개) |
| `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` | `admin@momong.com` / `!Password1234` | 부팅 시 자동 생성될 기본 어드민 |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | admin / admin1234 | Swagger UI Basic Auth |

### frontend/{user,admin}/.env.local

| 키 | 예 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` (로컬) 또는 원격 staging URL |

> dev 시 환경변수 직접 오버라이드도 가능:
> `NEXT_PUBLIC_API_URL=http://localhost:3001/api PORT=3100 npm run dev`

---

## 개발 워크플로

### Backend

```bash
cd backend
npm run start:dev      # 핫리로드 (TypeORM synchronize ON in dev)
npm run lint           # ESLint 자동 수정
npm test               # Jest 단위 테스트
npm run build          # 프로덕션 빌드 → dist/
npm run start:prod     # 빌드된 코드 실행
```

### Frontend (user / admin 동일)

```bash
cd frontend/user      # 또는 frontend/admin
npm run dev
npm run build
npm run start
npm run lint
```

### E2E

```bash
cd e2e
npx playwright install  # 처음 한 번
npx playwright test
```

---

## 자주 하는 작업

### 새 어드민 계정 추가

방법 1) Swagger 에서 `POST /api/admin/auth/register` (기존 어드민 토큰 필요)
방법 2) DB에 직접 bcrypt 해시 INSERT

### 디자이너 가입 승인

1. 디자이너가 user 프론트 `/signup` 으로 가입 → `status: pending`
2. 어드민 `/dashboard` → 승인 대기 유저 목록에서 "승인" 클릭

### 기능 on/off (FIT/3WAY/코스)

어드민 `/features` 에서 토글. 백엔드 `PATCH /api/admin/feature-settings` 호출됨.
**user 프론트는 새로고침해야 반영됨** (캐시 정책 추후 개선 예정).

### DB 스키마 변경

dev 환경에선 엔티티만 수정하면 부팅 시 `synchronize: true` 로 자동 반영. 운영은 별도 마이그레이션 작성 필요 (현재 미설정).

---

## 트러블슈팅

| 증상 | 원인/해결 |
|---|---|
| `database "X" does not exist` | `backend/.env` 의 `DB_DATABASE` 와 실제 DB 이름 불일치. `CREATE DATABASE` 또는 env 수정 |
| CORS 차단 | `backend/.env` 의 `ALLOWED_ORIGINS` 에 프론트 origin 추가 후 백엔드 재시작 |
| 어드민 로그인 안됨 | 부팅 시 자동 시드된 `admin@momong.com` / `!Password1234` 시도. 안되면 `admin_accounts` 비워서 재부팅 |
| 디자이너 로그인 "관리자 승인 대기" | 어드민 `/dashboard` 에서 해당 유저 승인 |
| Swagger 401 | Basic Auth 팝업에 `admin` / `admin1234` (env로 변경 가능) |
| 기능 토글 변경이 안 보임 | user 프론트 새로고침 (캐시) |
| `EADDRINUSE: :::3100` | 기존 dev 서버가 해당 포트 점유 중. `lsof -ti:3100 \| xargs kill -9` |

---

## 라이선스 / 소유권

내부 프로젝트.
