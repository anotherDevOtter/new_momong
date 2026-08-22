# MERCI MOMONG

헤어 디자이너용 디지털 컨설팅 도구. FIT / 3WAY 두 가지 컨설팅과 face_landmark 기반 얼굴 분석을 제공.

> - 제품 정의: [PLANNING.md](./PLANNING.md)
> - 기술 구조: [ARCHITECTURE.md](./ARCHITECTURE.md)
> - 남은 작업: [TODO.md](./TODO.md)

---

## 사전 준비

1. **Node.js 20+** 설치
2. **PostgreSQL 15+** 로컬 설치 (예: [Postgres.app](https://postgresapp.com))
3. **DB 준비** (한 번만):
   ```bash
   createuser -s postgres
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password';"
   psql -U postgres -c "CREATE DATABASE fit_hair;"
   ```
4. **(얼굴 분석 사용 시) Python 3.9 + face_landmark repo** 별도 clone

---

## 빠른 시작

4개 터미널 (얼굴 분석 미사용 시 Python 생략 가능):

```bash
# 1) backend
cd backend
cp .env.example .env       # 처음 한 번만 (그리고 AWS 키/Python URL 채우기)
npm install
npm run start:dev          # http://localhost:3001

# 2) user frontend
cd frontend/user
cp .env.example .env.local
npm install
PORT=3100 npm run dev      # http://localhost:3100

# 3) admin frontend
cd frontend/admin
cp .env.example .env.local
npm install
PORT=3200 npm run dev      # http://localhost:3200

# 4) Python 얼굴 분석 서버 (선택 — 분석 기능 안 쓰면 생략)
cd ../face_landmark
source venv/bin/activate
python application.py      # http://localhost:8000
```

### 접속

| 서비스 | URL |
|---|---|
| API 서버 | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs (`admin` / `admin1234`) |
| User 프론트 | http://localhost:3100 |
| Admin 프론트 | http://localhost:3200 |
| Python 분석 | http://localhost:8000 |

### 기본 계정

| 종류 | 계정 |
|---|---|
| Admin (자동 시드) | `admin@momong.com` / `!Password1234` |
| 디자이너 | `/signup` 가입 → admin `/dashboard` 에서 승인 |

---

## 환경 변수

상세는 각 폴더의 `.env.example`. **운영 환경 변수 매트릭스는 [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-환경-변수-운영-eb)**.

### backend/.env (로컬 dev)

| 키 | 기본 | 설명 |
|---|---|---|
| `PORT` | 3001 | API 포트 |
| `NODE_ENV` | development | `production` 이면 synchronize OFF + SSL ON |
| `DB_*` | localhost/postgres/password/fit_hair | PostgreSQL |
| `JWT_SECRET` | (default) | 토큰 서명 키 (운영 변경 필수) |
| `ALLOWED_ORIGINS` | `http://localhost:3100,3200` | CORS |
| `FRONTEND_URL` | http://localhost:3100 | 공유 링크 base |
| `ADMIN_SEED_EMAIL` / `_PASSWORD` | `admin@momong.com` / `!Password1234` | 부팅 시 자동 어드민 |
| `PYTHON_SERVER_URL` | http://localhost:8000 | face_landmark 서버 |
| `AWS_REGION` | ap-northeast-2 | S3 region |
| `AWS_S3_BUCKET` | momong-dev | dev 전용 버킷 (CORS: localhost) |
| `AWS_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` | (자체 발급) | S3 접근 |
| `AWS_PRESIGNED_EXPIRES_IN` | 300 | (선택) presigned URL 만료 초 |
| `SWAGGER_USER` / `_PASSWORD` | admin / admin1234 | Swagger Basic Auth |

### frontend/{user,admin}/.env.local

| 키 | 예 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` |

---

## 자주 하는 작업

### 디자이너 가입 승인
1. 디자이너가 user `/signup` → `status: pending`
2. admin `/dashboard` → 승인 대기 목록 → "승인" 클릭

### 기능 on/off (FIT/3WAY/코스)
admin `/features` 토글. user 프론트는 **새로고침해야 반영**.

### 얼굴 분석 테스트 (admin)
1. admin 로그인 → `/face-analysis-test` 탭
2. "얼굴 분석하기" 탭 — 카메라/파일 업로드 → 분석 → 결과 + 오버레이
3. "이전 기록 보기" 탭 — 과거 admin 테스트 기록 + 삭제

### 얼굴분석 표 항목 조정 (admin)
admin `/face-modules` 에서 모듈별 **라벨 / 순서 / 노출 / 단위** 를 편집. 배포 없이 즉시 반영되고,
user 얼굴분석 결과 표가 이 설정대로 렌더된다. 새 Python 모듈이 추가되면 숨김 상태로 자동 등록되므로 여기서 켜면 된다.

### 새 어드민 추가
- Swagger `POST /api/admin/auth/register` (기존 어드민 토큰 필요)
- 또는 DB 에 직접 bcrypt 해시 INSERT

### DB 스키마 변경
- dev: 엔티티 수정만 → `synchronize: true` 가 자동 반영
- 운영: `backend/migrations/*.sql` 작성 + 운영 DB 에 수동 실행

### 운영 배포
- `git push origin main` → GitHub Actions (backend EB) + Amplify (frontend) **자동 트리거**
- DB 마이그레이션 필요 시 push 전에 운영 DB 에 수동 실행
- 자세한 흐름: [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-배포-흐름)

---

## 디렉토리 (요약)

```
new_momong/
├─ backend/             NestJS API (3001)
│  │                    auth / admin / customers / consultations / shares
│  │                    pre-surveys / face-analysis / feature-settings / module-configs
│  └─ migrations/       운영 DB 수동 마이그레이션 SQL (001~004)
├─ frontend/
│  ├─ user/             디자이너용 (3100)
│  └─ admin/            운영자용 (3200)
├─ e2e/                 Playwright
├─ docs/                기능별 상세 설계 노트 (얼굴분석 매핑/동적구조 등)
├─ figma/               Figma Make 원본 (참고)
├─ PLANNING.md          제품 정의
├─ ARCHITECTURE.md      기술 구조
├─ TODO.md              남은 작업
└─ README.md            본 문서
```

> 별도 repo: `face_landmark/` (Python 얼굴 분석 서버) — 같이 clone 후 venv 셋업 필요

---

## 트러블슈팅

| 증상 | 원인/해결 |
|---|---|
| `database "fit_hair" does not exist` | 위 "사전 준비" 의 `CREATE DATABASE` 실행 |
| CORS 차단 | backend `ALLOWED_ORIGINS` 에 프론트 origin 추가 후 backend 재시작 |
| 어드민 로그인 안됨 | 자동 시드 계정 시도. 안되면 `admin_accounts` 비우고 재부팅 |
| 디자이너 "관리자 승인 대기" | admin `/dashboard` 에서 해당 유저 승인 |
| Swagger 401 | `admin` / `admin1234` (env 로 변경 가능) |
| 기능 토글 변경 안 보임 | user 프론트 새로고침 |
| 카메라 권한 거부됨 | HTTPS 또는 localhost 에서만 동작. 권한 거부 후엔 브라우저 주소창 자물쇠 → 카메라 재허용 |
| 얼굴 분석 호출 시 ECONNREFUSED | Python 서버 (`python application.py`) 실행 중인지 확인 |
| S3 PUT 403 | `momong-dev` 버킷의 CORS 에 `http://localhost:3100` 포함되어 있는지 확인 |
| `EADDRINUSE: :::3100` | `lsof -ti:3100 \| xargs kill -9` |

---

## 라이선스 / 소유권

내부 프로젝트.
