# 1차 개편 계획 — 화면 구성 변경 (2026-08-31)

> 시안 5장(헤어스타일 제안 4장 · 컬러 제안 1장) + FACE PRECISION 컬러 + 8/11 업데이트 2건.
> 기존 문서와의 관계: 범위 결정 [OVERHAUL.md](./OVERHAUL.md) · 제품 정의 [PLANNING.md](./PLANNING.md) · 액션 [TODO.md](./TODO.md)

---

## 0. 확정된 결정

| # | 항목 | 결정 |
|---|---|---|
| R1 | 헤어디자인 제안 | **시안대로 전부 교체.** 옵션 라벨 교체 + 가르마 축 신규 추가 |
| R2 | 사진 자산 | **먼저 자리만 잡는다.** 플레이스홀더 + 매니페스트 한 곳. 나중에 파일만 교체 |
| R3 | 패션 선호(3WAY) | **고객정보 성별로 자동 분기.** FIT 사진자료 재사용 |
| R4 | 프리뷰 배경 컬러 | HEX 추후 전달. **토큰 한 곳으로 빼두고** 값만 나중에 바꾼다 |
| R5 | 작업 환경 | OVERHAUL D5 유지 — **로컬 전용.** push·배포 없음 |

---

## 1. 작업 5건

| # | 대상 화면 | 주 파일 | 크기 |
|---|---|---|---|
| **W1** | 헤어디자인 제안 — 5개 축 사진 카드 | `components/3way/HairDesignProposal.tsx` | 大 |
| **W2** | 컬러 방향 → COLOR RECOMMENDATION | 〃 (섹션 5) | 中 |
| **W3** | FACE PRECISION 프리뷰 배경 컬러 | `components/3way/FaceAnalysisCapture.tsx` | 小 |
| **W4** | 3WAY 패션 선호 남/여 분기 | `components/3way/FashionPreferenceDiagnosis.tsx` | 中 |
| **W5** | INFO 이미지 키워드 맵 3×3 카드 | `components/steps/DesignSummaryStep.tsx` (확인 필요 §4-1) | 中 |

---

## W1. 헤어디자인 제안 — 옵션 교체 + 가르마 신규

### 현재 → 변경

| 섹션 | 현재 | 시안 |
|---|---|---|
| — | (없음) | **가르마** 5:5 / 6:4 / 7:3 ← **신규** |
| 길이 | 턱 위 / 턱~쇄골 / 쇄골 / 쇄골 아래 | **숏 / 단발 / 미디엄 / 롱** |
| 컬감 | 스트레이트 / C컬 / S컬 / CS컬 / 웨이브 | 스트레이트 / 웨이브 / C컬 / S컬 / CS컬 (순서만) |
| 앞머리 | 없음 / 시스루 / 풀뱅 / 사이드뱅 / 스트레이트뱅 / 처피뱅 | **풀뱅 / 처피뱅 / 시스루뱅 / 사이드뱅 / 잔머리 / 스틱뱅** |
| 컬러 | 톤다운 / 톤업 / 뿌리 / 탈색 / 유지 | 동일 (디자인만 변경 → W2) |

시안 순서대로 **가르마 → 길이 → 컬감 → 앞머리 → 컬러** 5개 섹션.

### 카드 구조 (시안)
사진 + 옵션명 + 키워드 2~3줄. 섹션 하단에 `CONSULTING NOTE` 박스.
현재의 `Recommended` 뱃지와 선택 테두리는 유지 — 디자이너가 고르는 입력 화면이므로.

### 옵션별 키워드 (시안에서 읽은 값)

| 섹션 | 옵션 · 키워드 |
|---|---|
| 가르마 | 5:5 내추럴한/깔끔한 · 6:4 여성스러운/깔끔한 · 7:3 화려한/섹시한 |
| 길이 | 숏 귀여운/세련된/보이쉬 · 단발 귀여운/깔끔한/우아한 · 미디엄 내추럴한/지적인/차분한 · 롱 여성스러운/화려한 |
| 컬감 | 스트레이트 깔끔한/세련된/청순한 · 웨이브 여성스러운/화려한/러블리한 · C컬 차분한/깔끔한 · S컬 여성스러운/내추럴한 · CS컬 여성스러운/세련된 |
| 앞머리 | 풀뱅 시크한/귀여운 · 처피뱅 유니크한/내추럴한 · 시스루뱅 여성스러운/귀여운 · 사이드뱅 여성스러운/화려한 · 잔머리 발랄한/세련된 · 스틱뱅 시크한/유니크한 |

### 코드 영향

```
HairDesignData          length·bangs 값 교체 + parting 신규
  ↓
3way/consulting/page.tsx  저장 payload (client_info.threeWay.hairDesign)
  ↓
DB                        jsonb 안이라 스키마 변경 없음 ✅
```

- **PremiumReport 는 이번에 안 건드린다.** 이미 하드코딩이라 `hairDesignData` 를 안 받고 있음
  (OVERHAUL §4A). 옵션을 바꿔도 새로 깨지는 건 없지만 **불일치는 더 벌어진다** → TODO 로 기록.
- `HairStyleProposalStep.tsx`(FIT) 는 별개 파일. 영향 없음.

---

## W2. 컬러 방향 → COLOR RECOMMENDATION

시안 상단(단색 사각형 + 해시태그) → 하단 디자인으로 교체.

구성: `PERSONAL COLOR` 라벨 → `COLOR RECOMMENDATION` 타이틀 →
5개 선택 pill(추천 항목에 ✨Recommended + 체크) → 5개 상세 카드.

카드 = 제목 / 모발 텍스처 사진 / 해시태그 3개 / 설명 / `COLOR CODE ● #HEX`

| 옵션 | HEX | 해시태그 |
|---|---|---|
| 톤다운 | `#6B5B4E` | #차분한 #고급스러운 #안정감 |
| 톤업 | `#A1866C` | #화사한 #생기있는 #밝은인상 |
| 뿌리 | `#5A4A40` | #자연스러운 #연결감 #밸런스 |
| 탈색 | `#D0B896` | #밝고 투명한 #세련된 #탈색 베이스 |
| 현재 상태 유지 | `#2E2420` | #자연스러운 #건강한 #유지 관리 |

> 💡 컬러 카드는 사진이 없어도 **HEX 단색으로 채우면 시안과 거의 같아 보인다.**
> 텍스처 사진 5장은 나중에 얹는다 (R2).

---

## 사진 자산 구조 (W1·W2 공통) — R2 이행

필요 장수: 가르마 3 + 길이 4 + 컬감 5 + 앞머리 6 = **18장** + 컬러 텍스처 5장.

```
public/3way/hair-design/
  parting/5-5.jpg  6-4.jpg  7-3.jpg
  length/short.jpg  bob.jpg  medium.jpg  long.jpg
  curl/…  bangs/…  color/…
```

매니페스트 **한 파일**에 옵션 id · 라벨 · 키워드 · 이미지 경로 · 추천 여부 · 설명 · HEX 를 모은다:
`src/components/3way/hairDesignOptions.ts`

→ 화면 코드는 이 표만 읽는다. 나중에 **사진 파일을 넣고 경로만 채우면 끝**.
→ 파일이 없으면 `onError` 로 회색 플레이스홀더(옵션명 표기)로 폴백. 빈 화면이 안 나온다.

---

## W3. FACE PRECISION 프리뷰 배경 컬러 — R4 이행

`FaceAnalysisCapture.tsx` 안에 회색이 **4곳**에 흩어져 있다.

| 줄 | 현재 |
|---|---|
| 529 | 프리뷰 컨테이너 `bg-gray-100` |
| 566 | 카메라 시작 전 플레이스홀더 `bg-gradient-to-br from-gray-100 to-gray-200` |
| 596 | 카메라 에러 플레이스홀더 (동일 그라데이션) |
| 615 | 카메라 로딩 `bg-gray-200` |

→ `globals.css` 에 `--preview-surface` 토큰 1개를 두고 4곳이 이걸 쓰게 한다.
**HEX 를 받으면 한 줄만 고치면 된다.** 그라데이션은 시안이 단색이므로 단색으로 통일.

---

## W4. 3WAY 패션 선호 남/여 분기 — R3 이행

### 현재
`FashionPreferenceDiagnosis.tsx` 가 **성별 구분 없는 고정 7종**(Unsplash 링크)을 쓴다.
FIT 은 이미 `FEMALE_FASHION_STYLES` / `MALE_FASHION_STYLES` 로 나뉘어 있다.

### 조치
1. FIT 의 두 세트를 공용 데이터로 분리 → `src/data/fashion-styles.ts`
   (FIT `FashionStyleStep.tsx` 도 여기서 import — FIT 화면 자체는 안 바뀜)
2. `FashionPreferenceDiagnosis` 에 `gender` prop 추가
3. `3way/consulting/page.tsx` 에서 `customerData.gender`(`'여자'`/`'남자'`) → `'female'`/`'male'` 매핑해 전달

### 주의점 3가지

| # | 내용 |
|---|---|
| 1 | **여성 7종 / 남성 6종** (남성엔 페미닌 없음). 성별이 바뀌면 이미 고른 값이 무효가 될 수 있다 → 성별 변경 시 선택 초기화 |
| 2 | **id 체계가 다르다.** 3WAY 는 영문(`classic`/`feminine`…), FIT 은 한글 키(`'클래식'`). 통일해야 하고 `ConsultingSummary.tsx` 의 `styleLabels` 도 같이 맞춰야 한다 |
| 3 | FIT 사진이 **pinimg.com 핫링크**다. 그대로 재사용하되, 로컬화는 별건 TODO 로 기록 (외부 의존 · 깨질 위험) |

---

## W5. INFO 이미지 키워드 맵 3×3 카드

시안 오른쪽 디자인: 3×3 카드, 각 칸에 영문 라벨 / 한글 이름 / 하위 키워드 3개.

| | | |
|---|---|---|
| **CUTE** 귀여운<br>사랑스러운·귀여운·순진한 | **PURE** 청초한<br>맑은·청초한·청순한 | **FRESH** 프레시한<br>산뜻한·시원한·깨끗한 |
| **CASUAL** 캐주얼<br>발랄한·활동적인·생기있는 | **NATURAL** 내추럴<br>수수한·자연스러운·단아한 | **CHIC** 시크한<br>세련된·시크한·샤프한 |
| **FEMININE** 페미닌<br>화려한·여성스러운·부드러운 | **CLASSIC** 클래식<br>고상한·우아한·기품있는 | **MODERN** 모던<br>지적인·도회적인·현대적인 |

신규 공용 컴포넌트 `components/ui/ImageKeywordMap.tsx` — 선호(☑)/비선호(☒) 표시 지원.

> ℹ️ 이 9칸은 `ImageDirectionSetting.tsx` 의 `hairImageMap`(W/S·N/S·C/S…) 9칸과 **같은 축**이다.
> 나중에 두 개를 한 소스로 합칠 여지가 있으나 이번 범위 밖.

---

## 2. 순서

| 단계 | 내용 | 이유 |
|---|---|---|
| **A** | 데이터 먼저 — `hairDesignOptions.ts` · `fashion-styles.ts` · 이미지맵 데이터 | 화면 3개가 이걸 공유. 먼저 굳혀야 재작업이 없다 |
| **B** | W3 (프리뷰 컬러) | 가장 작음. 토큰만 심어두면 HEX 오는 즉시 반영 |
| **C** | W4 (패션 남/여) | 독립적이고 영향 범위가 좁음 |
| **D** | W1 + W2 (헤어디자인 제안) | 가장 큼. 한 파일 안에서 같이 끝낸다 |
| **E** | W5 (INFO 이미지맵) | §4-1 확인 후 착수 |

## 3. 검증

- `npx tsc --noEmit` · `npm run build` 통과
- 로컬 3200번대 4개 띄워 3WAY 흐름 육안 확인 (README "빠른 시작")
- 기존 린트 에러 6건(`set-state-in-effect` 5 + `any` 1)은 **늘리지 않는다**
- `git push` · 배포 없음 (R5)

---

## 4. 확인이 필요한 것

### 4-1. 🔴 INFO 이미지맵 대상 화면 — FIT 동결(D3) 과 충돌
시안의 `INFO / 컨설팅 전 정보 요약` 은 문구가 **FIT 의 `DesignSummaryStep.tsx` 와 정확히 일치**한다.
그런데 OVERHAUL **D3 = "FIT 컨설팅은 동결, 손대지 않는다"**.
→ ① D3 를 이 화면 한정으로 푸는가, ② 3WAY 요약(`ConsultingSummary.tsx`)에 넣는가?

### 4-2. 🔴 이미지 키워드 10종 → 9칸 매핑이 안 맞는다
현재 선호 키워드는 **10개**인데 시안 맵은 **9칸**이다.

| 현재 키워드 | 9칸 대응 |
|---|---|
| 귀여운/사랑스러운 | CUTE |
| 어려보이는 | **대응 없음** ❓ |
| 프레시한 | FRESH |
| 청초한 | PURE |
| 부드러운/여성스러운 | FEMININE |
| 단아한 | NATURAL **(중복)** |
| 시크/세련된 | CHIC |
| 우아한/클래식한 | CLASSIC |
| 자연스러운 | NATURAL **(중복)** |
| 지적인/현대적인 | MODERN |
| — | CASUAL **(빈칸)** |

→ `어려보이는` 을 어디로 보낼지, `단아한`·`자연스러운` 중복을 어떻게 할지 결정 필요.

### 4-3. 🟠 앞머리 `없음` 옵션 삭제 여부
시안 6종에 `없음` 이 빠져 있다. 앞머리를 안 하는 고객은 어떻게 기록하나?

### 4-4. 🟠 admin 얼굴분석 화면도 같이 바꾸나
`frontend/admin/src/components/AdminFaceAnalysisCapture.tsx` 가 같은 구조다.
디자이너용(user)만 바꾸면 admin 테스트 화면과 색이 달라진다.

### 4-5. 대기 중 (일정 무관)
- 프리뷰 배경 **HEX** (R4)
- 사진 파일 18장 + 텍스처 5장 (R2)
