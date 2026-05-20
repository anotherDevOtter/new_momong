# MERCI MOMONG — 기획 문서

> 헤어 디자이너용 디지털 컨설팅 도구. 현재 빌드된 화면 기준으로 정리.

---

## 1. 제품 개요

| 항목 | 내용 |
|---|---|
| 브랜드 | **MERCI MOMONG** |
| 슬로건 | _오늘 나에게 가장 어울리는 디자인을 제안합니다_ |
| 목적 | 디자이너가 매장에서 고객 컨설팅을 진행/기록/공유하는 디지털 도구 |
| 주 사용자 | 헤어 디자이너 (매장 태블릿/PC) |
| 보조 사용자 | 매장 운영자 (관리자 화면) |

---

## 2. 서비스 구성

서비스는 **2가지 컨설팅 유형** 을 제공하며 사용자는 진입 시 선택합니다.

### 2-1. FIT 컨설팅 (기존)
- 12 단계의 단선형 컨설팅 흐름
- 한 화면에 핵심 질문 1~3개씩, 짧은 사이클
- 진단 결과를 컨설팅 카드로 정리 → After Note(PDF) 출력

### 2-2. 3WAY 컨설팅 (신규)
- 진단 깊이를 사용자가 선택할 수 있는 **코스 기반** 흐름
- 4가지 코스 (운영자가 on/off 가능):
  - **1WAY** — 얼굴 정밀 분석
  - **2WAY (퍼스널컬러)** — 얼굴 + 퍼스널컬러
  - **2WAY (골격)** — 얼굴 + 골격 이미지
  - **3WAY** — 얼굴 + 퍼스널컬러 + 골격
- 코스 무관 공통 흐름: 고객정보 → 사전인터뷰 → 이미지/패션 선호도 → 컨설팅 요약 → 얼굴 분석 → (코스별 분기) → 이미지 방향 설정 → 헤어디자인 제안 → 모질 분석 → Next Direction → Premium Report → 완료

---

## 3. 화면 플로우

### 3-1. 진입 동선

```
[홈 / ]
  ├─ FIT 컨설팅 시작 →  /  내부에서 step 1 시작
  ├─ 3WAY 컨설팅 시작 →  /3way?start=1  (코스 선택부터 진입)
  └─ 고객 목록  →  기존 고객 리스트 + 상세
```

### 3-2. FIT 컨설팅 (12 step)

| # | 화면 | 입력/표시 |
|---|---|---|
| 1 | 인트로 | 시작 / 고객 목록 / 3WAY 시작 |
| 2 | 고객 기본 정보 | 이름, 연락처, 연령대, 성별 |
| 3 | Today Keyword | 얼굴 보완 부위 · 헤어 고민 · 선호 이미지 키워드 |
| 4 | Fashion Style | 선호 패션 스타일 다중 선택 |
| 5 | Loading | 임의 진단 진행 표시 |
| 6 | Design Summary | 선택 내용 요약 카드 |
| 7 | Face Image Type | WARM / NEUTRAL / COOL + 이목구비 보정값 |
| 8 | Hair Condition | 손상도, 모질, 두께, 밀도, 웨이브 |
| 9 | Hair Style Proposal | 길이 + 레퍼런스 이미지 선택 |
| 10 | Today Design + Next Direction | 길이/앞머리/컬·질감/컬러 결과 + 다음 변화 방향 |
| 11 | After Note | 사이클 가이드 + 디자이너 메모 + PDF 출력 |
| 12 | Review | 저장 및 공유 링크 발급 |

### 3-3. 3WAY 컨설팅 (21 화면)

```
랜딩 → 코스 선택 → 고객 정보 → 사전 인터뷰
     → 이미지 선호도 → 패션 선호도 → 컨설팅 요약
     → 얼굴 분석 촬영 → 얼굴 분석 진행 → 얼굴 분석 결과
     ├─ (2way-personal) 퍼스널컬러 분석 ─┐
     ├─ (2way-skeleton) 골격 이미지 분석 ─┤
     └─ (3way/1way)    ──────────────────┴→ 이미지 방향 설정
     → 헤어디자인 제안 → 모질 분석 → Next Direction
     → Premium Report (모달) → 완료
     └─ (보조) 고객 이력 리스트 → 고객 이력 상세
```

> ⚠️ 코드상 현재 **3WAY 코스도 퍼스널컬러/골격 화면을 스킵하고 바로 이미지 방향 설정으로 진행** (Figma 원본 그대로 유지). 향후 분기 로직 보정 필요.

---

## 4. 디자인 시스템

### 4-1. 톤
- 흰 배경 / 검정 텍스트 (#111111) / 보조 회색 (#999999, #777777, #E5E5E5)
- 절제된 라인, 컴팩트한 자간, 한글 타이틀

### 4-2. 토큰

| 토큰 | 값 |
|---|---|
| primary | `#111111` |
| primary hover | `#222222` |
| muted text | `#999999` / `#777777` |
| border default | `#E5E5E5` |
| border focus | `#111111` |
| input underline | `#EAEAEA` |
| input placeholder | `#BBBBBB` |
| 폰트 | Pretendard Variable |
| 본문 weight | 400 |
| 강조 weight | 500 / 600 (semibold) |

### 4-3. 공통 컴포넌트 (FIT 출처)

- `<Button variant="primary" | "secondary" fullWidth>` — `h-12`, 검정/외곽선
- `<Input label required>` — underline only (`border-b`), 박스 없음
- `<CheckboxGroup variant="button-grid">` — 다중 선택, 선택 시 검정 fill
- `<RadioGroup variant="button-grid">` — 단일 선택, 동일 패턴
- `<ProgressBar currentStep totalSteps>` — FIT 전용
- `<ProgressSteps currentStep totalSteps steps>` — 3WAY 전용

### 4-4. 선택 패턴 규칙

| 패턴 | 적용 | 선택 시 |
|---|---|---|
| **button-grid** (작은 옵션) | 다중/단일 선택 텍스트 옵션 | 검정 배경 + 흰 글자 |
| **대형 카드** (제목+설명) | CourseCard, PersonalColor, Skeleton | 보더만 검정, 우측 체크박스만 채워짐 |
| **이미지 카드** | FashionStyleCard | 검정 보더 + 하단 체크 아이콘 |

---

## 5. 사용자 권한 & 인증

### 5-1. 매장(디자이너) 유저
- 이메일/비번 회원가입 → **status: pending** 으로 생성
- 관리자가 승인하면 **status: approved**, 로그인 가능
- 로그인 후 모든 컨설팅 화면 접근 가능
- 로그인 화면: `/login`, 회원가입: `/signup`, 아이디 찾기: `/find-id`, 비번 재설정: `/reset-password`

### 5-2. 관리자
- 별도 admin 계정 (admin_accounts 테이블)
- 부팅 시 어드민 0명이면 기본 계정 자동 시드: `admin@momong.com` / `!Password1234`
- 어드민 화면 기능:
  - **대시보드**: 사용자 통계, 승인 대기 유저 처리 (승인/거절)
  - **유저 관리**: 전체 유저 목록 + 상태 변경
  - **기능 설정**: 컨설팅 종류/코스 활성화 토글

---

## 6. 기능 플래그 (운영자가 끄고/켜기)

| 플래그 | 영향 |
|---|---|
| `fitEnabled` | 홈에서 "FIT 컨설팅 시작" 버튼 노출 여부 |
| `threeWayEnabled` | 홈 "3WAY 컨설팅 시작" 노출 + `/3way` 직접 접근 가드 |
| `courses['1way']` | 코스 선택 화면에서 1WAY 카드 노출 |
| `courses['2way-personal']` | 2WAY 옵션 A 노출 |
| `courses['2way-skeleton']` | 2WAY 옵션 B 노출 |
| `courses['3way']` | 3WAY 카드 노출 |

- 백엔드 싱글톤 테이블 `feature_settings` 에 저장
- 부팅 시 행이 없으면 모두 `true` 로 기본 시드
- user 프론트는 페이지 로드 시 1회 fetch (캐시) → 변경 반영하려면 새로고침

---

## 7. 데이터 모델 (개요)

> 상세 컬럼은 `backend/src/**/*.entity.ts` 참조

| 엔티티 | 키 컬럼 |
|---|---|
| **users** | id, email, store_name, owner_name, password_hash, phone, status, role |
| **customers** | id, user_id, name, phone, gender, age_group, memo |
| **consultations** | id, user_id, customer_id, visit_date, designer_name, after_note, client_info(jsonb), today_keyword, fashion_style, face_image_type, hair_condition, hair_style_proposal, today_design, next_direction, design_cycle_guide |
| **consultation_shares** | id, consultation_id, token, password, expires_at |
| **admin_accounts** | id, email, password_hash |
| **feature_settings** | id(=1), fit_enabled, three_way_enabled, course_*_enabled |

3WAY 페이로드(이미지 선호도, 패션 선호도, 코스, 사이클 등)는 현재 `consultations.client_info` 의 `course` 필드 + 별도 키에 우회 저장됨. 정식 마이그레이션 미수행.

---

## 8. 사용자 화면 인벤토리 (현 빌드 기준)

### 8-1. 비로그인
- `/login` — 이메일/비밀번호 로그인
- `/signup` — 회원가입 (이름·연락처·매장명·점주명·이메일·비번)
- `/find-id` — 전화번호로 이메일 찾기
- `/reset-password` — 이메일 + 점주명 확인 후 비번 재설정
- `/share/[token]` — 공유 링크로 컨설팅 결과 조회

### 8-2. 로그인 (디자이너)
- `/` — 홈 (FIT/3WAY 진입 + 고객 목록)
- `/3way` — 3WAY 랜딩
- `/3way?start=1` — 3WAY 코스 선택부터 시작

### 8-3. 관리자
- `/login` — 어드민 로그인
- `/dashboard` — 통계 + 승인 대기 유저
- `/users` — 전체 유저 목록 (구현됨)
- `/features` — 기능 플래그 토글

---

## 9. 알려진 한계 / 미완성

1. **3WAY 분기 버그** — 3WAY 코스 선택 시 퍼스널컬러/골격 단계가 스킵됨 (Figma 원본 동작 유지, 추후 수정)
2. **얼굴 분석 등은 실제 AI 분석 없음** — 수동 선택 UI
3. **PremiumReport PDF** — alert만 표시, 미구현
4. **3WAY 상담 데이터 매핑** — 현재 jsonb 우회 저장 (전용 컬럼/엔티티 미정)
5. **운영 환경 마이그레이션** — TypeORM `synchronize:true` (dev only). 운영 배포 시 별도 마이그레이션 필요
6. **기능 플래그 실시간 반영 X** — user 프론트는 새로고침 시 갱신
7. **고객 이력의 코스/이미지타입** — 더미값 일부 하드코딩

---

## 10. 디자인 일관성 점검 체크리스트

- [ ] 모든 페이지 제목: `text-2xl font-semibold tracking-[-0.01em]`
- [ ] 모든 페이지 부제: `text-sm text-[#999999]`
- [ ] 텍스트 입력: FIT `<Input>` (underline only, 박스 X)
- [ ] 다중선택 버튼: button-grid (`h-14`, 선택 시 검정 fill)
- [ ] 대형 카드 단일선택: 보더만 검정, 체크박스만 채움
- [ ] 하단 액션: FIT `<Button>` primary/secondary fullWidth 2개

---

## 11. 향후 작업 후보

- 3WAY 코스 분기 로직 정정
- 3WAY 상담 데이터 전용 컬럼/엔티티 분리 + 마이그레이션
- 어드민 유저 상세 페이지 (활동 로그)
- 기능 플래그 캐시 무효화 전략 (현재는 수동 새로고침)
- 얼굴 분석 실제 AI 연동 (선택)
- PDF 출력 (PremiumReport) 구현
