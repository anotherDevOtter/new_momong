# MERCI MOMONG — 제품 정의

> 헤어 디자이너용 디지털 컨설팅 도구. **무엇을 만들고 있는가** 의 single source of truth.
> 기술 구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 실행 방법은 [README.md](./README.md), 남은 작업은 [TODO.md](./TODO.md).

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

서비스는 **2가지 컨설팅 유형** 을 제공하며 사용자는 진입 시 선택.

### 2-1. FIT 컨설팅 (legacy)
- 12 단계 단선형 흐름. 한 화면에 핵심 질문 1~3개씩.
- 진단 결과를 컨설팅 카드로 정리 → After Note(PDF) 출력.
- 디자인 시스템의 원형이 되는 흐름.

### 2-2. 3WAY 컨설팅 (메인)
- **코스 기반** 흐름 — 사용자가 진단 깊이를 선택.
- 4가지 코스 (운영자가 on/off 가능):

| 코스 | 카드 설명 | 의도 (계획) | 실제 (현재) |
|---|---|---|---|
| **1WAY** | 얼굴 정밀 분석 | 얼굴 분석만, 짧게 | ⚠️ 3WAY 와 동일 흐름 (분기 안 됨) |
| **2WAY (퍼스널컬러)** | 얼굴 + 퍼스널컬러 | 얼굴 + 컬러 진단 | ⚠️ 퍼스널컬러/골격 페이지 스킵 중 |
| **2WAY (골격)** | 얼굴 + 골격 이미지 | 얼굴 + 골격 진단 | ⚠️ 동일 |
| **3WAY** | 풀 진단 | 얼굴 + 컬러 + 골격 | ⚠️ 동일 |

> ⚠️ 코스 분기 로직이 미구현. 모든 코스가 같은 21개 화면을 거침. TODO.md #1, #2 참조.

---

## 3. 화면 흐름

### 3-1. 진입 동선

```
[홈 /]
  ├─ FIT 컨설팅 시작 →  /  내부에서 step 1 시작
  ├─ 3WAY 컨설팅 시작 →  /3way?start=1  (코스 선택부터)
  └─ 고객 목록 →  기존 고객 리스트 + 상세
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
| 7 | Face Image Type | WARM / NEUTRAL / COOL + 이목구비 보정 |
| 8 | Hair Condition | 손상도, 모질, 두께, 밀도, 웨이브 |
| 9 | Hair Style Proposal | 길이 + 레퍼런스 이미지 선택 |
| 10 | Today Design + Next Direction | 결과 + 다음 변화 방향 |
| 11 | After Note | 사이클 가이드 + 디자이너 메모 + PDF 출력 |
| 12 | Review | 저장 및 공유 링크 발급 |

### 3-3. 3WAY 컨설팅 (21 화면 — 모든 코스 동일)

```
랜딩 → 코스 선택 → 고객 정보 → 사전 인터뷰
     → 이미지 선호도 → 패션 선호도 → 컨설팅 요약
     → 얼굴 분석 촬영 → 얼굴 분석 진행 → 얼굴 분석 결과
     → (의도: 코스별 분기. 현재는 모두) 이미지 방향 설정
     → 헤어디자인 제안 → 모질 분석 → Next Direction
     → Premium Report (모달, 9페이지) → 완료
     └─ (보조) 고객 이력 리스트 → 고객 이력 상세
```

### 3-4. 얼굴 분석 (3WAY 핵심)

- **Step 7 촬영** — 카메라 또는 파일 업로드
  - MediaPipe 로 얼굴이 가이드 타원 안에 들어왔는지 실시간 검출
  - 가이드 안에 들어왔을 때만 "촬영" 버튼 활성
  - 업로드 사진은 3MB / 2048px 초과 시 자동 리사이즈
- **Step 8 분석** — S3 PUT → backend → Python (face_landmark) 호출
  - WNC 10 모듈 (피부톤/턱각도/광대/윤곽 등) → final = W/N/C
  - SNH 12 모듈 (피부톤/얼굴길이/눈썹/코 등) → final = S/N/H
  - 각 모듈마다 **measurement** (도형 좌표) 동봉 → 원본 이미지 위에 오버레이 가능
- **Step 9 결과** — WNC/SNH 표 + 최종 imageType ("W / S" 등)
  - 디자이너가 행별로 수정 가능 (수동 보정)

---

## 4. 사용자 권한 & 인증

### 4-1. 매장 (디자이너) 유저
- 이메일/비번 회원가입 → **status: pending** 으로 생성
- 관리자가 승인하면 **status: approved**, 로그인 가능
- 로그인 후 모든 컨설팅 화면 접근 가능
- 화면: `/login`, `/signup`, `/find-id`, `/reset-password`

### 4-2. 관리자
- 별도 admin 계정 (`admin_accounts` 테이블)
- 부팅 시 어드민 0명이면 기본 계정 자동 시드: `admin@momong.com` / `!Password1234`
- 어드민 화면:
  - **대시보드** — 사용자 통계, 승인 대기 유저 처리
  - **유저 관리** — 전체 유저 목록 + 상태 변경
  - **기능 설정** — 컨설팅 종류/코스 활성화 토글
  - **얼굴 분석 테스트** — 운영팀이 face_landmark 분석을 직접 호출/검증

---

## 5. 기능 플래그 (운영자 토글)

| 플래그 | 영향 |
|---|---|
| `fitEnabled` | 홈에서 "FIT 컨설팅 시작" 버튼 노출 |
| `threeWayEnabled` | 홈 "3WAY 컨설팅 시작" 노출 + `/3way` 직접 접근 가드 |
| `courses['1way']` | 코스 선택 화면에서 1WAY 카드 노출 |
| `courses['2way-personal']` | 2WAY 옵션 A 노출 |
| `courses['2way-skeleton']` | 2WAY 옵션 B 노출 |
| `courses['3way']` | 3WAY 카드 노출 |

- 백엔드 싱글톤 테이블 `feature_settings` 에 저장
- 부팅 시 행이 없으면 모두 `true` 로 시드
- user 프론트는 페이지 로드 시 1회 fetch (캐시) → 변경 반영하려면 새로고침

---

## 6. 디자인 시스템

### 6-1. 톤
- 흰 배경 / 검정 텍스트 (`#111111`) / 보조 회색 (`#999999`, `#777777`, `#E5E5E5`)
- 절제된 라인, 컴팩트한 자간, 한글 타이틀

### 6-2. 토큰

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
| 강조 weight | 500 / 600 |

### 6-3. 공통 컴포넌트 (FIT 출처)
- `<Button variant="primary"|"secondary" fullWidth>` — `h-12`, 검정/외곽선
- `<Input label required>` — underline only (`border-b`), 박스 없음
- `<CheckboxGroup variant="button-grid">` — 다중 선택, 선택 시 검정 fill
- `<RadioGroup variant="button-grid">` — 단일 선택
- `<ProgressBar>` (FIT) / `<ProgressSteps>` (3WAY)

### 6-4. 선택 패턴 규칙

| 패턴 | 적용 | 선택 시 |
|---|---|---|
| **button-grid** (작은 옵션) | 다중/단일 선택 텍스트 옵션 | 검정 배경 + 흰 글자 |
| **대형 카드** (제목+설명) | CourseCard, PersonalColor, Skeleton | 보더만 검정, 우측 체크박스만 채움 |
| **이미지 카드** | FashionStyleCard | 검정 보더 + 하단 체크 아이콘 |

---

## 7. 비즈니스 결정 사항

### 7-1. 확정된 결정

- **얼굴 분석은 실제 AI** — face_landmark Python 서버 (WNC/SNH 22 모듈) 사용. 더미 데이터 X
- **얼굴 분석 데이터 보존 정책** — `face_analysis_results` 테이블에 영구 저장. consultation 의 jsonb 에 `faceAnalysis: { wncId, snhId, ... }` 로 연결
- **테스트와 운영 분리** — `face_analysis_results.source` 컬럼으로 `consultation` / `admin_test` 구분
- **이미지 크기 제한** — 업로드 3MB / 2048px. 초과 시 프론트가 자동 리사이즈 (재압축 X, 디테일 보존)
- **운영 환경 분리** — 별도 momong-staging 버킷 + EB 환경 (실제로는 'staging' 이름이지만 운영용)

### 7-2. 미결정 (TODO.md 참조)

- **1WAY 코스 정체** — 진짜 얼굴 분석만 vs 풀 흐름?
- **3WAY 코스 분기** — 코스별로 다른 화면 거치게 할지?
- **PremiumReport 페이지 수** — 코스별로 다르게 할지?
- **모질 분석 / 이미지 방향 설정** — 모든 코스 필수?

---

## 8. 알려진 한계 / 미완성

| # | 항목 | 상태 |
|---|---|---|
| 1 | 3WAY 코스 분기 로직 미구현 | 모든 코스 동일 21 화면 거침 |
| 2 | PremiumReport 9 페이지 코스별 분기 X | 1WAY 도 퍼스널컬러 페이지 노출 |
| 3 | PremiumReport PDF 출력 | alert만, 미구현 |
| 4 | 얼굴 분석 비율 데이터 (상중하/얼굴비율/중안부) | UI 는 있으나 Python 응답에서 분리되지 않음 (수동 입력) |
| 5 | ImageDirectionSetting `currentType` | 하드코딩 `N/N` (분석 결과 미연결) |
| 6 | admin 화면에서 컨설팅의 얼굴 분석 결과 표시 | 미구현. DB 에는 저장됨 |
| 7 | 기능 플래그 실시간 반영 X | user 프론트는 새로고침 시 갱신 |
| 8 | 운영 DB 마이그레이션 자동화 X | `backend/migrations/*.sql` 수동 실행 |

---

## 9. 추가/심화 학습 자료

- 코드 자체가 single source of truth
- 데이터 모델 정확한 정의: `backend/src/**/*.entity.ts`
- API 정확한 시그니처: `http://localhost:3001/api/docs` (Swagger, dev 모드)
- 인프라/배포 흐름: [ARCHITECTURE.md](./ARCHITECTURE.md)
