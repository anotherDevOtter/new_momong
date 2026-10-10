# MERCI MOMONG

헤어 디자이너용 디지털 컨설팅 도구. FIT / 3WAY 두 가지 컨설팅과 얼굴 자동 측정을 제공.
얼굴 측정은 브라우저에서 한다 (`frontend/*/src/lib/face-measure`, 2026-10-10 부터. 그 전에는 Python `face_landmark` 서버).

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
   psql -U postgres -c "CREATE DATABASE momong_dev;"
   psql -U postgres -d momong_dev -f backend/migrations/000_baseline_schema.sql   # 테이블 생성
   ```
   > 백엔드는 DB 구조를 자동으로 바꾸지 않는다(`synchronize: false`). 빈 DB 는 위 기준 SQL 로 테이블을 만들고,
   > 이후 구조 변경은 `backend/migrations/` 에 번호를 붙인 SQL 로 한다.
4. **(선택) Python 3.9 + face_landmark repo** — `test` 코스의 웹 · Python 측정 비교 화면에서만 쓴다

---

## 로컬 포트 (고정)

이 프로젝트는 로컬에서 **3200번대**를 쓴다. 다른 포트로 띄우지 말 것 —
CORS(`ALLOWED_ORIGINS`) · 공유링크(`FRONTEND_URL`) 가
전부 이 값에 맞춰져 있다.

| 포트 | 서비스 | 실행 |
|:--:|---|---|
| **3200** | backend (NestJS) | `cd backend && npm run start:dev` |
| **3201** | (선택) Python 얼굴분석 — `test` 코스 비교용 | `cd face_landmark && source venv/bin/activate && python -m uvicorn application:app --port 3201` |
| **3202** | admin 프론트 (Next.js) | `cd frontend/admin && PORT=3202 npm run dev` |
| **3203** | user 프론트 (Next.js) | `cd frontend/user && PORT=3203 npm run dev` |

> ℹ️ **3200 번대를 고른 이유** — 3000·3001·3002·4000·4001·4002 는 개발 머신에서
> 다른 프로젝트가 흔히 점유하고, **5000·7000 은 macOS AirPlay 수신 모드가 잡는다.**
> 3200~3203 은 충돌이 없다.

> ℹ️ `python application.py` 로 띄우면 8000 번에 고정으로 뜬다 — 3201 은 위처럼 uvicorn 으로 지정한다.
> venv 의 OpenCV 는 `<5` 여야 한다 (5 에는 Haar 파일이 없어 얼굴 길이 · 턱 길이가 실패).

포트가 비었는지 확인:
```bash
for p in 3200 3201 3202 3203; do lsof -nP -iTCP:$p -sTCP:LISTEN >/dev/null 2>&1 \
  && echo "$p 점유중" || echo "$p 사용가능"; done
```

---

## 빠른 시작

3개 터미널 (+ `test` 코스 비교를 볼 때만 Python):

```bash
# 1) backend
cd backend
cp .env.example .env       # 처음 한 번만 (그리고 AWS 키 채우기)
npm install
npm run start:dev          # http://localhost:3200

# 2) user frontend
cd frontend/user
cp .env.example .env.local
npm install
PORT=3203 npm run dev      # http://localhost:3203

# 3) admin frontend
cd frontend/admin
cp .env.example .env.local
npm install
PORT=3202 npm run dev      # http://localhost:3202

# 4) (선택) Python 얼굴 분석 서버 — test 코스 비교 화면용
cd ../face_landmark
source venv/bin/activate
python -m uvicorn application:app --port 3201   # http://localhost:3201
```

### 접속

| 서비스 | URL |
|---|---|
| API 서버 | http://localhost:3200 |
| Swagger | http://localhost:3200/api/docs (`admin` / `admin1234`) |
| User 프론트 | http://localhost:3203 |
| Admin 프론트 | http://localhost:3202 |
| (선택) Python 분석 | http://localhost:3201 |

### 기본 계정

| 종류 | 계정 |
|---|---|
| Admin (자동 시드) | `admin@momong.com` / `!Password1234` |
| 디자이너 | `/signup` 가입 → admin `/dashboard` 에서 승인 |

---

## 환경 변수

상세는 각 폴더의 `.env.example`. **운영 환경 변수 매트릭스는 [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-환경-변수-운영)**.

### backend/.env (로컬 dev)

| 키 | 기본 | 설명 |
|---|---|---|
| `PORT` | 3200 | API 포트 |
| `NODE_ENV` | development | `development` 가 아니면 SSL ON (synchronize 는 항상 OFF) |
| `DB_*` | localhost/postgres/password/momong_dev | PostgreSQL (로컬 DB 이름은 `momong_dev`, 2026-10-11 `fit_hair` 에서 변경) |
| `JWT_SECRET` | (default) | 토큰 서명 키 (운영 변경 필수) |
| `ALLOWED_ORIGINS` | `http://localhost:3203,3202` | CORS |
| `FRONTEND_URL` | http://localhost:3203 | 공유 링크 base |
| `ADMIN_SEED_EMAIL` / `_PASSWORD` | `admin@momong.com` / `!Password1234` | 부팅 시 자동 어드민 |
| `AWS_REGION` | ap-northeast-2 | S3 region |
| `AWS_S3_BUCKET` | momong-dev | dev 전용 버킷 (CORS: localhost) |
| `AWS_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY` | (자체 발급) | S3 접근 |
| `AWS_PRESIGNED_EXPIRES_IN` | 300 | (선택) presigned URL 만료 초 |
| `SWAGGER_USER` / `_PASSWORD` | admin / admin1234 | Swagger Basic Auth |

### frontend/{user,admin}/.env.local

| 키 | 예 |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3200/api` |

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
user 얼굴분석 결과 표가 이 설정대로 렌더된다. 처음 보는 측정 항목 키가 저장되면 숨김 상태로 자동 등록되므로 여기서 켜면 된다.
키는 화면 항목 id(`faceline`, `facelen` …)이고, 웹으로 옮기지 않은 예전 모듈 7개만 번호 키(`1`, `4` …)로 남아 있다.

### 새 어드민 추가
- DB `admin_accounts` 에 bcrypt 해시로 직접 INSERT (가입 API `POST /api/admin/auth/register` 는 2026-10-10 삭제)

### DB 스키마 변경
- dev · 운영 모두 `synchronize: false` — 엔티티를 고치면 `backend/migrations/*.sql` 도 같이 작성
- dev: 로컬 `momong_dev` 에 psql 로 실행 / 운영: 서버(`3.36.224.81`)에서 psql 18 로 `momong_prod` 에 실행

### 운영 배포
- `git push origin main` → GitHub Actions (backend → Lightsail) + Amplify user **자동 트리거**
- admin 은 Amplify 가 `admin` 브랜치를 보고 있어 `git push origin origin/main:admin` 도 필요 (2026-10-18 정리 때 `main` 으로 바꿀 예정)
- DB 마이그레이션 필요 시 push 전에 운영 DB 에 수동 실행
- 자세한 흐름: [ARCHITECTURE.md §8](./ARCHITECTURE.md#8-배포-흐름)

---

## 디렉토리 (요약)

```
new_momong/
├─ backend/             NestJS API (3200)
│  │                    auth / admin / customers / consultations / shares
│  │                    pre-surveys / face-analysis / feature-settings / module-configs
│  └─ migrations/       운영 DB 수동 마이그레이션 SQL (001~004)
├─ frontend/
│  ├─ user/             디자이너용 (3203)
│  └─ admin/            운영자용 (3202)
├─ e2e/                 Playwright
├─ docs/                기능별 상세 설계 노트 (얼굴분석 매핑/동적구조 등)
├─ figma/               Figma Make 원본 (참고)
├─ PLANNING.md          제품 정의
├─ ARCHITECTURE.md      기술 구조
├─ TODO.md              남은 작업
└─ README.md            본 문서
```

> 별도 repo: `face_landmark/` (Python 얼굴 분석 서버) — 운영은 인프라 이전 전까지 이 서버를 쓴다. 로컬에서는 `test` 코스 비교용으로만 선택 사용.

---

## 트러블슈팅

| 증상 | 원인/해결 |
|---|---|
| `database "momong_dev" does not exist` | 위 "사전 준비" 의 `CREATE DATABASE` 실행. 예전 이름 `fit_hair` 로 만들었다면 `ALTER DATABASE fit_hair RENAME TO momong_dev;` |
| `relation "users" does not exist` | 빈 DB — `backend/migrations/000_baseline_schema.sql` 실행 |
| CORS 차단 | backend `ALLOWED_ORIGINS` 에 프론트 origin 추가 후 backend 재시작 |
| 어드민 로그인 안됨 | 자동 시드 계정 시도. 안되면 `admin_accounts` 비우고 재부팅 |
| 디자이너 "관리자 승인 대기" | admin `/dashboard` 에서 해당 유저 승인 |
| Swagger 401 | `admin` / `admin1234` (env 로 변경 가능) |
| 기능 토글 변경 안 보임 | user 프론트 새로고침 |
| 카메라 권한 거부됨 | HTTPS 또는 localhost 에서만 동작. 권한 거부 후엔 브라우저 주소창 자물쇠 → 카메라 재허용 |
| "얼굴 측정 모델을 불러오지 못했습니다" | MediaPipe wasm · 모델을 CDN 에서 받는다 — 인터넷 연결 확인 |
| `test` 코스 비교 화면 "Python 비교 실패" | 로컬 Python(3201) 이 켜져 있는지 확인 (위 uvicorn 명령) |
| S3 PUT 403 | `momong-dev` 버킷의 CORS 에 `http://localhost:3203` 포함되어 있는지 확인 |
| `EADDRINUSE: :::3203` | `lsof -ti:3203 \| xargs kill -9` |
| backend 가 3200 에서 안 뜸 | 다른 프로세스가 점유 중인지 확인 (`lsof -ti:3200`). 포트를 옮기면 프론트 `NEXT_PUBLIC_API_URL` 도 같이 변경할 것 |
| 프론트가 엉뚱한 응답을 받음 | 해당 포트에 다른 프로젝트가 떠 있는지 확인 — `lsof -nP -iTCP -sTCP:LISTEN \| grep 320` |

---

## 라이선스 / 소유권

내부 프로젝트.
