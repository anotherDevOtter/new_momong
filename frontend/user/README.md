# FIT 헤어컨설팅 — User Frontend

MERCI MOMONG의 헤어컨설팅 앱 사용자용 프론트엔드입니다.

## 기술 스택

- Next.js 16 (App Router)
- React 19 / TypeScript 5
- Tailwind CSS 4
- Radix UI (checkbox, radio, dialog, progress)
- Sonner (토스트 알림)
- HTML2Canvas + jsPDF (PDF 생성)
- React QR Code

## 실행

```bash
cd frontend/user
npm install
npm run dev   # http://localhost:3000
```

환경변수 (`frontend/user/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 폴더 구조

```
src/
├── app/                        # App Router 페이지
│   ├── page.tsx                # 메인 (컨설팅 플로우 진입점)
│   ├── layout.tsx              # 루트 레이아웃 + AuthProvider
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── find-id/page.tsx
│   ├── reset-password/page.tsx
│   └── share/[token]/page.tsx  # 공유 링크 열람
│
├── components/
│   ├── steps/                  # 컨설팅 12단계 컴포넌트
│   │   ├── IntroStep.tsx           (Step 0: 시작)
│   │   ├── ClientInfoStep.tsx      (Step 1: 고객 정보 입력)
│   │   ├── TodayKeywordStep.tsx    (Step 2: 오늘의 키워드)
│   │   ├── FashionStyleStep.tsx    (Step 3: 패션 스타일)
│   │   ├── LoadingStep.tsx         (Step 4: 분석 로딩)
│   │   ├── DesignSummaryStep.tsx   (Step 5: 디자인 요약)
│   │   ├── FaceImageTypeStep.tsx   (Step 6: 얼굴 톤/특징)
│   │   ├── HairConditionStep.tsx   (Step 7: 모발 상태)
│   │   ├── HairStyleProposalStep.tsx (Step 8: 헤어스타일 제안)
│   │   ├── TodayDesignStep.tsx     (Step 9: 오늘의 디자인)
│   │   ├── AfterNoteStep.tsx       (Step 10: 사후 메모/사이클)
│   │   ├── ReviewStep.tsx          (Step 11: 최종 검토 및 저장)
│   │   ├── CompletionStep.tsx      (Step 12: 완료)
│   │   ├── ClientListStep.tsx      # 고객 목록 조회
│   │   └── ClientDetailStep.tsx    # 고객 상세 & 컨설팅 이력
│   │
│   ├── ui/                     # 재사용 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── CheckboxGroup.tsx
│   │   ├── RadioGroup.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── FashionStyleCard.tsx
│   │   └── DesignCycleGuide.tsx
│   │
│   ├── PrintableAfterNote.tsx  # PDF 출력용 레이아웃
│   └── ShareLinkModal.tsx      # 공유 링크 생성 모달
│
├── contexts/
│   └── AuthContext.tsx         # 인증 전역 상태 (login, logout, signup 등)
│
├── types/
│   └── index.ts                # 전체 타입 정의
│
├── lib/
│   └── utils.ts                # 유틸 함수
│
└── utils/
    └── api.ts                  # API 호출 함수
```

---

## 주요 상태

`app/page.tsx`에서 관리하는 핵심 상태:

| 상태 | 타입 | 설명 |
|------|------|------|
| `currentView` | `'consultation' \| 'client-list' \| 'client-detail'` | 현재 화면 |
| `currentStep` | `0 ~ 11` | 컨설팅 단계 |
| `consultationData` | `ConsultationData` | 전체 컨설팅 입력 데이터 |
| `selectedClient` | `Customer` | 선택된 고객 |

뒤로가기는 `window.history.pushState/replaceState`로 처리합니다.

---

## API 연동

`src/utils/api.ts`에서 모든 API 호출을 담당합니다.

### 인증
```
POST /auth/login
POST /auth/signup
POST /auth/find-id
POST /auth/reset-password
GET  /auth/me
```

### 고객
```
GET    /customers          # 목록 조회 (?q= 검색)
GET    /customers/:id
POST   /customers
PATCH  /customers/:id
DELETE /customers/:id
```

### 컨설팅
```
POST   /consultations
GET    /consultations
GET    /consultations/:id
GET    /consultations/by-customer/:phone
PATCH  /consultations/:id
DELETE /consultations/:id
```

### 공유 링크
```
POST /shares/:consultationId
GET  /shares/by-consultation/:consultationId
POST /shares/:shareToken/verify
```

인증 방식: 로컬스토리지의 `auth_token`을 `Authorization: Bearer {token}` 헤더로 전송.
