# 1WAY 시안 이식 계획

> 시안 `figma/1way (Copy)` 를 우리 1WAY 컨설팅으로 옮긴다.
> 화면 구조: [SITEMAP.md](./SITEMAP.md) · 시안 요청사항 원본: [REDESIGN-1.md](./REDESIGN-1.md)
> 최초 2026-08-31

---

## 0. 방식 — 옆에 새로 만들고, 다 되면 갈아끼운다

기존 1WAY 흐름을 직접 고치지 않는다. `new` 라는 **임시 코스를 하나 더** 만들어
거기에 새 화면을 하나씩 쌓고, 다 확인되면 `1way` 를 통째로 교체한다.

```
지금      1way (운영)  +  new (1way 복사본)
작업 중   1way 그대로 ← 언제든 열어서 비교
          new 를 시안대로 한 화면씩 교체
끝나면    1way 를 new 내용으로 교체, new 삭제
```

화면 하나가 잘못되면 **그 커밋만 되돌리면 된다.** 작업 중에도 운영 흐름은 멀쩡하다.

### 접속 주소

| | |
|---|---|
| 기존 1WAY | `http://localhost:3203/3way/consulting?course=1way&customerId=<UUID>` |
| **새 흐름** | `http://localhost:3203/3way/consulting?course=new&customerId=<UUID>` |
| 시안 | `http://localhost:5273` (하단 DevNav 로 화면 점프) |

테스트용 고객 UUID: `c85243f5-798d-4506-a552-a5c760827314` (조승원)
> `customerId` 가 없으면 `/3way` 로 튕겨낸다.

---

## 1. 현재 상태 — 껍데기 완료 ✅

`new` 코스를 추가했다. 아직 화면은 하나도 안 바꿨다 (1way 와 동일).

| 파일 | 변경 |
|---|---|
| `3way/consulting/page.tsx` | `COURSE_STEPS` 에 `'new'` 추가 · `COURSE_NAMES` · `COURSE_CHIP` 라벨 · **기본값/폴백을 `3way`→`1way`** |
| `ConsultingSummary.tsx` | 코스 이름표에 `'new'` |
| `PremiumReport.tsx` | `showPersonalColor` 조건에 `'new'` 추가 |

기존 코스 4개의 동작은 바뀌지 않았다. `new` 는 코스 선택 카드에 노출되지 않고 주소로만 열린다.

---

## 2. 화면 대조 — 13 → 10

| 우리 | 우리 화면 | | 시안 화면 |
|:--:|---|:--:|---|
| 1 | 사전 인터뷰 | | |
| 2 | 이미지 선호도 | **3→1** | **사전 인터뷰** `Section 01~06` |
| 3 | 패션 선호도 | | |
| 4 | 컨설팅 요약 | 1:1 | 컨설팅 요약 |
| 5 | 얼굴 촬영 | 1:1 | 얼굴 촬영 |
| 6 | 얼굴 분석 중 | 1:1 | 얼굴 분석 중 |
| 7 | 얼굴 분석 결과 | **1→2** | 이목구비 분석 **+** 최종 이미지타입 |
| 8 | 이미지 방향 | | |
| 9 | 헤어디자인 제안 | **3→1** | **헤어컨설팅** ① ② ③ |
| 10 | 모발 진단 | | |
| 11 | 다음 방향 | 1:1 | 다음 방향 |
| 12 | 사전설문 확인 | — | **시안에 없음 · 우리만 유지** |
| 13 | 완료 | 1:1 | 완료 |

### 적용 후 `COURSE_STEPS['new']`
```
preInterview → summary → faceAnalysis → faceProcessing →
aiFaceFeature → aiFaceResultDerived → hairConsulting →
nextDirection → preSurveyReview → completion            (10화면)
```

---

## 3. 작업 순서

쉬운 것부터. 각 항목 = **이식 → `?course=new` 로 확인 → 커밋 1개.**

| 순 | 화면 | 하는 일 | 위험도 |
|:--:|---|---|:--:|
| 1 | 얼굴 분석 중 | 시안과 거의 동일. 디자인 차이만 | 낮음 |
| 2 | 완료 | 〃 | 낮음 |
| 3 | 컨설팅 요약 | 〃 | 낮음 |
| 4 | 다음 방향 · 최종 리포트 | 〃 | 낮음 |
| 5 | 얼굴 촬영 | **디자인만** 이식. 카메라·검출·크롭·S3·분석 로직은 손대지 말 것 | **높음** |
| 6 | **사전 인터뷰 통합** | 우리 1·2·3 → 1개. Section 03·04 는 3×3 카드 | **높음** |
| 7 | **얼굴 결과 분리** | 우리 7 → 2개. `COURSE_STEPS` 에 화면 키 1개 추가 | 중간 |
| 8 | **헤어컨설팅 통합** | 우리 8·9·10 → 1개. 가장 큼 (시안 1302줄) | **높음** |
| 9 | `1way` 를 `new` 로 교체, `new` 삭제 | 마무리 | 중간 |

---

## 4. 반드시 살려야 할 저장 배선

**시안에는 API 호출이 한 줄도 없다.** (`fetch` `axios` `/api/` `localStorage` 전부 0)
화면만 가져오고 아래는 우리 것을 그대로 이어붙인다.

| 화면 | 살려야 할 것 |
|---|---|
| 얼굴 촬영 | `useFaceDetector` · `cropFromUploadView` · S3 presigned 업로드 · Python 분석 호출 (우리 801줄 vs 시안 296줄) |
| 전 화면 | `onChange` 로 상위에 보고 → `page.tsx` state → `saveConsult()` 로 DB 저장 |
| 사전 인터뷰 | `PreInterviewData` · `ImagePreferenceData` · `FashionPreferenceData` 3개가 1개로 합쳐지므로 저장 payload 모양 조정 |
| 헤어컨설팅 | `ImageDirectionData` · `HairDesignData` · `HairTextureData` 3개 → 1개. **가르마(parting) 는 신규 필드** |

> DB 는 `client_info.threeWay` jsonb 안이라 **스키마 변경은 필요 없다.**

---

## 5. 시안 요청사항(REDESIGN-1.md)은 어디로 갔나

처음 받은 시안 5건은 전부 이식 작업에 흡수된다. 따로 할 일이 아니다.

| 요청 | 흡수되는 곳 |
|---|---|
| W1 헤어디자인 옵션 교체 + 가르마 | 헤어컨설팅 ③ 스타일 제안 |
| W2 COLOR RECOMMENDATION | 헤어컨설팅 ③ 컬러 탭 |
| W3 FACE PRECISION 프리뷰 컬러 | 얼굴 촬영 이식 시 |
| W4 패션 남/여 분기 | 사전 인터뷰 Section 05·06 **← 시안에도 없음. 추가로 넣어야 함** |
| W5 INFO 이미지맵 | 사전 인터뷰 Section 03·04 · 헤어컨설팅 ① |

---

## 6. 사진 자산 — 따로 구할 필요 없음

시안 `src/imports/` 에 **이미지 79개 / 31MB**. 모델 사진(앞머리·가르마·길이·컬감),
모발 손상도 사진 6장 포함. 우리 `public/` 으로 옮겨 쓴다.

---

## 7. 확인이 필요한 것

| | 내용 |
|---|---|
| 🔴 | **패션 스타일 남/여 분기** — 8/11 요청인데 시안에도 안 들어있다. 사전 인터뷰 이식할 때 같이 넣을지 |
| 🟠 | **랜딩** — 시안에만 있는 About 페이지. 우리 홈은 FIT·고객관리 입구라 성격이 다르다. **가져오지 않기를 권함** |
| 🟠 | **사전설문 확인(우리 12번)** — 시안에 없다. 유지 예정 |
| 🟠 | 시안 코드에도 **3WAY 를 `else` 로 흘려보내는 분기 버그**가 그대로 있다. 이식 중 되돌아가지 않도록 주의 |
