# 사이트맵 — 현재 앱 ↔ 시안 `figma/1way (Copy)`

> 갱신 2026-08-31. **1WAY 기준.** (이전 판은 3WAY 기준으로 잘못 작성 → 폐기)
> 이식 계획은 [MIGRATION.md](./MIGRATION.md)

---

## 0. 먼저 알아야 할 것

**실제로 열려있고 개발된 코스는 1WAY 하나뿐이다.**

| 코스 | DB 토글 | 코스 선택 화면 | 개발 |
|---|:--:|:--:|:--:|
| **1WAY** | `t` | **노출** | **완료** |
| 2WAY 퍼스널 | `f` | 안 뜸 | 미개발 |
| 2WAY 골격 | `f` | 안 뜸 | 미개발 |
| 3WAY | `f` | 안 뜸 | 미개발 |

`COURSE_STEPS` 표에 4개가 다 있지만, 2WAY·3WAY 는 1WAY 에 퍼스널컬러/골격 화면을
끼워 넣기만 한 구성이다. 별도로 만든 화면이 없다.

**시안 폴더 이름이 `1way (Copy)` 인 것도 1WAY 를 다시 그린 것이기 때문이다.**

---

## 1. 현재 우리 사이트맵

### 🔓 비로그인
```
/login              로그인 (디자이너)
/signup             회원가입 → 어드민 승인 대기
/find-id            아이디 찾기
/reset-password     비밀번호 재설정
/share/[token]      AFTER NOTE — 고객에게 보내는 결과 공유 링크
/pre-survey/[token] 사전설문 — 고객이 방문 전 작성 (8섹션)
                    cover → programs → notice → intro → concerns → summary → hair → body
```

### 🔒 로그인 후 (디자이너)
```
/                             홈 — FIT / 3WAY / 고객관리 3갈래
│
├─ /3way                      코스 선택  ← 지금은 1WAY 카드만 노출
│   └─ /consulting/start      고객 선택 / 신규 등록
│       └─ /3way/consulting   ★ 컨설팅 본체 — 코스에 따라 화면 목록이 결정됨
│
├─ /consulting/start?type=fit 고객 선택
│   └─ /fit                   ★ FIT 컨설팅 — 11단계
│
└─ /customers                 고객 목록
    └─ /customers/[id]        고객 상세 — 이력 · 사전설문 · 공유링크
```

### ★ 1WAY 컨설팅 13화면 (`/3way/consulting?course=1way`)
```
 1 사전 인터뷰        PreInterview
 2 이미지 선호도      ImagePreferenceDiagnosis
 3 패션 선호도        FashionPreferenceDiagnosis
 4 컨설팅 요약        ConsultingSummary
 5 얼굴 촬영          FaceAnalysisCapture
 6 얼굴 분석 중       FaceAnalysisProcessing      ← 전환 화면, 진행률에 안 셈
 7 얼굴 분석 결과     FaceAnalysisResult
 8 이미지 방향        ImageDirectionSetting
 9 헤어디자인 제안    HairDesignProposal
10 모발 진단          HairTextureAnalysis
11 다음 방향          NextDirection  └ 최종 리포트(PremiumReport) 모달
12 사전설문 확인      PreSurveyReview
13 완료               CompletionPage
```
> 2WAY = 위에 `퍼스널컬러` 또는 `골격` 1개 추가 · 3WAY = 2개 추가. 그게 전부다.

### ⚙️ 어드민 (별도 앱 :3202)
```
/login  /dashboard(가입승인)  /users  /features(기능토글)
/face-analysis-test  /face-modules(얼굴분석 항목 편집)
```

---

## 2. 시안 `1way (Copy)` 사이트맵

로그인·라우트 없음. **화면 17개를 한 페이지에서 state 로 전환.**
하단 `DevNav` 바로 아무 화면이나 점프 가능 (개발용).

```
랜딩 (About / MERCI MOMONG)
│
├─ 고객 이력 ──→ 고객 이력 상세
│
└─ 코스 선택
   └─ 사전 인터뷰   ← Section 01~06
      │   01 얼굴 중 보완을 원하는 부위
      │   02 요즘 헤어 고민
      │   03 선호하는 이미지      (3×3 카드)
      │   04 선호하지 않는 이미지  (3×3 카드)
      │   05 선호하는 패션 스타일
      │   06 선호하지 않는 패션 스타일
      └─ 컨설팅 요약
         └─ 얼굴 촬영
            └─ 얼굴 분석 중
               └─ 이목구비 분석
                  └─ 최종 이미지타입
                     └─ ★ 헤어컨설팅
                        │   ① 컨설팅 방향  3×3 이미지맵
                        │   ② 모질 분석    손상도·굵기·숱·곱슬정도
                        │   ③ 스타일 제안  앞머리·가르마·길이·컬감·컬러
                        ├─ [2way] 퍼스널컬러 / 골격
                        └─ 헤어 디자인 ⚠구버전 → 헤어 질감 ⚠구버전
                           └─ 다음 방향 → 최종 리포트(모달) → 완료
```

⚪️ **고아 파일 12개** — 코드에 있으나 아무데서도 import 안 됨.
`ImagePreferenceDiagnosis` `FashionPreferenceDiagnosis` `ImageDirectionSetting`
`FaceAnalysisResult` `CustomerInfo` `AIFaceAnalysis` `AIFaceAnalysisSummary`
`AIImageInterpretation` `ConcernsCheck` `BrandIntro` `FashionStyleCard` `KeywordCard`
→ **사전 인터뷰·헤어컨설팅으로 통합되면서 버려진 옛 화면들.**

---

## 3. 범위 비교

| 영역 | 우리 | 시안 | 판단 |
|---|:--:|:--:|---|
| 로그인 · 회원가입 · 계정찾기 | ● 4화면 | — | 건드리지 않음 |
| 홈 (3갈래) | ● | — | 건드리지 않음 |
| 코스 선택 | ● | ● | 디자인 맞춤 |
| **1WAY 컨설팅** | ● **13화면** | ● **10화면** | ← **이번 작업 전부** |
| FIT 컨설팅 | ● 11단계 | — | 건드리지 않음 |
| 고객 목록 · 상세 | ● | ● | 디자인 맞춤 |
| 사전설문 (고객용 8섹션) | ● | — | 건드리지 않음 |
| 결과 공유 링크 | ● | — | 건드리지 않음 |
| 어드민 앱 (7화면) | ● | — | 건드리지 않음 |
| 랜딩 (About) | — | ● | ❓ 판단 필요 |

> **시안이 다시 그린 건 1WAY 컨설팅 흐름 하나뿐이다.**
> FIT · 사전설문 · 공유 · 어드민 · 로그인은 시안에 아예 없다.
