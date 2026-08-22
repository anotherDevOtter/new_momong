# MERCI MOMONG — Backend (NestJS)

FIT / 3WAY 컨설팅 API 서버. 얼굴 분석(Python 서버 호출), 사전설문지, 공유 링크, 어드민을 담당한다.

> 전체 구조는 [../ARCHITECTURE.md](../ARCHITECTURE.md), 실행 절차는 [../README.md](../README.md).

## 실행

```bash
cp .env.example .env     # 처음 한 번만 (AWS 키 / Python 서버 URL 채우기)
npm install
npm run start:dev        # http://localhost:3001
```

| 명령 | 설명 |
|---|---|
| `npm run start:dev` | watch 모드 개발 서버 |
| `npm run build` | `dist/` 로 컴파일 |
| `npm run start:prod` | `node dist/main` (EB 가 Procfile 로 실행) |
| `npm test` | Jest 단위 테스트 |
| `npm run test:e2e` | Jest e2e (`test/jest-e2e.json`) |
| `npm run lint` | ESLint (자동 수정) |

## 모듈

| 경로 | 역할 | 라우트 프리픽스 |
|---|---|---|
| `src/auth/` | 디자이너 회원가입/로그인/아이디 찾기/비밀번호 재설정 | `/api/auth` |
| `src/admin/` | 어드민 계정 + 디자이너 승인/거절 + 통계 | `/api/admin` |
| `src/customers/` | 고객 CRUD | `/api/customers` |
| `src/consultations/` | 컨설팅 기록 (FIT/3WAY 공용) | `/api/consultations` |
| `src/shares/` | 컨설팅 결과 공유 링크 (비밀번호 검증) | `/api/shares` |
| `src/pre-surveys/` | 사전설문지 (공개 토큰 기반) | `/api/pre-surveys` |
| `src/face-analysis/` | 얼굴 분석 — Python 호출 + S3 presign + DB 저장 | `/api/face-analysis` |
| `src/feature-settings/` | 기능 플래그 (FIT/3WAY/코스 on-off) | `/api/feature-settings`, `/api/admin/feature-settings` |
| `src/module-configs/` | 얼굴분석 모듈 표시 설정 (라벨/순서/노출/단위) | `/api/module-configs`, `/api/admin/module-configs` |
| `src/common/` | 요청 로깅 미들웨어 + 예외 필터 | — |
| `src/app.controller.ts` | `GET /` — EB 헬스 체크 (전역 프리픽스 제외 대상) | `/` |

## API 문서

`npm run start:dev` 후 http://localhost:3001/api/docs (Basic Auth — `SWAGGER_USER` / `SWAGGER_PASSWORD`, 기본 `admin` / `admin1234`).

## DB

- **dev**: TypeORM `synchronize: true` — 엔티티 수정이 자동 반영된다. 마이그레이션 불필요.
- **운영**: `synchronize` OFF. [`migrations/`](./migrations) 의 SQL 을 운영 DB 에 **수동 실행**한 뒤 배포한다.

## 환경 변수

`.env.example` 참조. 운영(EB) 값 매트릭스는 [../ARCHITECTURE.md §9](../ARCHITECTURE.md#9-환경-변수-운영-eb).
