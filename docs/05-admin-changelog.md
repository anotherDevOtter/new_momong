# 어드민 시스템 변경사항

## 1. 회원가입 승인 시스템

### 백엔드
- `users` 테이블에 `status` 컬럼 추가 (`pending` | `approved` | `rejected`, default: `approved`)
- 기존 유저 영향 없도록 default 값 `approved` 설정
- `signup`: 가입 시 `status: 'pending'`으로 저장, JWT 미발급, 안내 메시지만 반환
- `login`: 상태 체크 추가
  - `pending` → `'관리자 승인 대기 중입니다'` (401)
  - `rejected` → `'가입이 거절되었습니다. 관리자에게 문의하세요'` (401)
- `users` 테이블에 `role` 컬럼 추가 (`user` | `admin`, default: `user`)

### 프론트엔드 (user)
- 가입 완료 후 `/login?registered=true`로 리다이렉트
- 로그인 페이지에서 `?registered=true` 감지 시 승인 대기 안내 배너 표시
- `useSearchParams`를 Suspense boundary로 감싸 Next.js 빌드 오류 수정

---

## 2. 어드민 백엔드 API

### 새로 추가된 파일
| 파일 | 설명 |
|------|------|
| `src/admin/admin.guard.ts` | JWT에 `admin: true` 여부 확인하는 가드 |
| `src/admin/admin.service.ts` | 어드민 비즈니스 로직 |
| `src/admin/admin.controller.ts` | 어드민 API 엔드포인트 |
| `src/admin/admin.module.ts` | 어드민 모듈 |
| `src/admin/admin-account.entity.ts` | 어드민 계정 전용 테이블 (`admin_accounts`) |

### API 엔드포인트
| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/admin/auth/login` | 어드민 로그인 | - |
| POST | `/api/admin/auth/register` | 어드민 계정 생성 | DB에 계정 없으면 불필요, 있으면 Bearer |
| GET | `/api/admin/users` | 전체 유저 목록 + 컨설팅 수 | Bearer |
| PATCH | `/api/admin/users/:id/approve` | 유저 승인 | Bearer |
| PATCH | `/api/admin/users/:id/reject` | 유저 거절 | Bearer |
| GET | `/api/admin/stats` | 통계 (유저 수, 컨설팅 수) | Bearer |

### 어드민 인증 방식
1. **환경변수 어드민**: `ADMIN_EMAIL`, `ADMIN_PASSWORD` → 로그인만 가능
2. **DB 어드민**: `admin_accounts` 테이블에 저장된 계정 → 로그인/관리 가능
3. **최초 등록**: `admin_accounts` 테이블이 비어있으면 인증 없이 `register` 호출 가능

### Swagger
- Bearer auth 추가 (자물쇠 아이콘으로 토큰 입력)
- Swagger UI 자체 Basic auth 보호
  - 기본값: `admin` / `admin1234`
  - 환경변수: `SWAGGER_USER`, `SWAGGER_PASSWORD`

---

## 3. 어드민 프론트엔드 (`frontend/admin`)

### 새로 추가된 파일
| 파일 | 설명 |
|------|------|
| `src/app/login/page.tsx` | 어드민 로그인 페이지 |
| `src/app/dashboard/page.tsx` | 통계 카드 + 승인 대기 유저 목록 |
| `src/app/users/page.tsx` | 전체 유저 테이블, 필터, 승인/거절 |
| `src/components/AdminHeader.tsx` | 공유 헤더 |
| `src/middleware.ts` | `admin_token` 쿠키 기반 라우트 보호 |
| `src/utils/api.ts` | API 호출 유틸 |
| `src/utils/auth.ts` | 토큰 관리 유틸 |

---

## 4. 프로젝트 구조 변경

```
frontend/
├── user/   ← 기존 frontend/ 이동
└── admin/  ← 신규 생성
```

---

## 5. Amplify 배포 설정

### amplify.yml (루트)
```yaml
version: 1
applications:
  - appRoot: frontend/user
    frontend: ...
  - appRoot: frontend/admin
    frontend: ...
```

### Amplify 앱 구성
| 앱 | 브랜치 | 환경변수 | 도메인 |
|----|--------|----------|--------|
| user 앱 | main | `AMPLIFY_MONOREPO_APP_ROOT=frontend/user` | www.merci-momong.com |
| admin 앱 | main | `AMPLIFY_MONOREPO_APP_ROOT=frontend/admin` | admin.merci-momong.com |

---

## 6. 공유 링크 뷰 개선

**고객 상세 → 컨설팅 히스토리 → 공유 링크 섹션**
- 기존: 링크 + 복사 + 비밀번호
- 변경: 링크 + 복사 + **QR 코드** + **QR 이미지 저장** + 비밀번호

---

## 7. 필요한 환경변수

### Elastic Beanstalk (백엔드)
| 변수 | 설명 |
|------|------|
| `ADMIN_EMAIL` | 환경변수 어드민 이메일 (선택) |
| `ADMIN_PASSWORD` | 환경변수 어드민 비밀번호 (선택) |
| `SWAGGER_USER` | Swagger UI 접근 아이디 (기본: `admin`) |
| `SWAGGER_PASSWORD` | Swagger UI 접근 비밀번호 (기본: `admin1234`) |
| `ALLOWED_ORIGINS` | CORS 허용 도메인 (쉼표 구분) |

### Amplify (프론트엔드)
| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL |
