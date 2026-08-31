# MERCI MOMONG — 개편 기록

> **무엇을 고쳤고, 무엇을 일부러 안 고쳤는가.** 구조 분석 + 범위 결정의 기록.
> 제품 정의: [PLANNING.md](./PLANNING.md) · 기술 구조: [ARCHITECTURE.md](./ARCHITECTURE.md) · 액션: [TODO.md](./TODO.md)
> 착수 지점: 태그 `backup/2026-08-22-pre-overhaul` · 최초 2026-08-30

---

## 1. 확정된 범위

| # | 결정 | 내용 |
|---|---|---|
| D1 | **개편 범위** | **뼈대는 그대로 둔다. 구성만 수정.** 스키마·상태관리·아키텍처 변경 없음 |
| D2 | **대상** | 3WAY 컨설팅의 **단계 순서와 구성** |
| D3 | **FIT 컨설팅** | 동결. 손대지 않는다 |
| D4 | **momong_flutter** | 보류/폐기. 2025-12-03 이후 방치 + 다른 백엔드(`manager-api`)를 봄. 범위 밖 |
| D5 | **작업 환경** | **로컬 전용.** 스테이징·운영(EB/RDS/S3/Amplify)에 접근하지 않는다 |
| D6 | **배포** | `main` push 및 실제 배포는 범위 밖 |

> 착수 초기에 데이터 모델까지 다시 세우는 안을 검토했으나(§4), **뼈대 유지로 결정**했다.
> §4 는 폐기가 아니라 **다음에 다시 꺼낼 때를 위한 분석 기록**으로 남긴다.

---

## 2. 이번에 고친 것 — 3WAY 순서와 구성

### 문제
코스 분기 조건이 **5곳에 흩어져** 있었고 서로 어긋나 있었다.

| 위치 | 내용 |
|---|---|
| `buildVisibleSteps` | 진행률용 단계 목록 |
| `handleFaceResultNext` | 얼굴결과 → 다음 |
| `handleImageDirectionBack` | 이미지방향 → 이전 |
| `handlePersonalColorNext` / `handleSkeletonImageNext` | 각각 imageDirection 로 고정 |

세 곳 모두 `2way-personal` / `2way-skeleton` 만 검사하고 **`3way` 는 `else` 로 흘려보냈다.**
그래서 카드에 "얼굴 정밀 분석 + 퍼스널컬러 + 골격 이미지 진단"이라 적힌 3WAY 가
**퍼스널컬러와 골격 단계를 둘 다 건너뛰었다.** (TODO.md B7)

### 조치 — 흩어진 조건문을 구성표 하나로

```ts
const COURSE_STEPS: Record<string, PageKey[]> = {
  '1way':          [...BASE_STEPS, ...TAIL_STEPS],
  '2way-personal': [...BASE_STEPS, 'personalColor', ...TAIL_STEPS],
  '2way-skeleton': [...BASE_STEPS, 'skeletonImage', ...TAIL_STEPS],
  '3way':          [...BASE_STEPS, 'personalColor', 'skeletonImage', ...TAIL_STEPS],
};
```

이전/다음/진행률이 전부 이 표에서 파생된다 — `stepAfter` · `stepBefore` · `buildVisibleSteps`.
**분기 조건이 서로 어긋나는 일이 구조적으로 불가능해졌고**, 흐름을 바꾸려면 이 표만 고친다.

- 전환 화면(`faceProcessing`)은 `TRANSIENT_STEPS` 로 분리 — 진행률에 세지 않고 "이전" 으로 되돌아가지 않는다
- 파일 내 `setCurrentPage` 직접 호출은 종료 시점 `completion` 하나만 남았다
- 검증: `tsc --noEmit` 통과 · `npm run build` 통과. 린트 에러 6건은 전부 기존 문제(`set-state-in-effect` 5 + `any` 1)

### 곁가지로 해소된 것 — Q1 (1WAY 코스 정체)
TODO.md 는 1WAY 카드 문구가 "얼굴 정밀 분석" 이라 실제 풀 흐름과 안 맞는다고 적었으나,
**실제 문구는 "얼굴 정밀 분석 _기반 헤어컨설팅_"** 으로 현재 동작과 일치한다. 전제가 틀렸던 것이라
결정 자체가 불필요. 코스 체계는 이미 일관된다 — **N-WAY = 진단 축의 개수.**

---

## 3. 로컬 격리 상태 (D5 이행)

착수 시점에 로컬 설정이 원격을 향하고 있어 바로잡았다.

| 대상 | 착수 전 | 현재 | 영향 |
|---|---|---|---|
| `frontend/user/.env.local` | `manager-api.merci-momong.com/api` | `localhost:3001/api` | 🔴 로컬 `npm run dev` 가 **원격 API를 때리고 있었다** |
| `frontend/admin/.env.local` | 〃 | 〃 | 🔴 동일 |
| `face_landmark/.env` | `S3_BUCKET=momong-staging` | `momong-dev` | 🟠 로컬 분석이 **staging 버킷에 이미지를 쓰고 있었다** |
| `backend/.env` | `localhost` · `momong-dev` | 변경 없음 | ✅ 이미 격리돼 있었음 |

구값은 각 파일에 주석 + `.bak` 백업으로 보존. `.env*` 는 전부 gitignore 이고 **커밋된 적 없다.**
`.env.example` 은 원래부터 `localhost:3001/api` 를 안내하고 있었다 — 로컬 파일만 어긋나 있던 것.

**개편 기간 중 지킬 것**: `git push origin main` 금지(= 자동 배포) · 운영/스테이징 콘솔 접근 금지 ·
운영 DB 덤프를 내려받지 않는다 · `.env` 를 원격으로 되돌린 채 작업하지 않는다.

> 🔑 **별건** — `face_landmark/.env` 에 AWS 액세스 키가 평문으로 있다. git 에는 없지만
> 키 로테이션과 IAM 최소권한(해당 버킷 `PutObject` 만)을 개편과 별개로 검토할 것. 이번 범위 밖.

---

## 4. 알려진 구조적 문제 — 이번 범위 밖 (분석 기록)

D1 에 따라 **손대지 않는다.** 다음에 뼈대를 다시 볼 때의 출발점으로 남긴다.

### 🔴 A. PremiumReport 가 사실상 정적 목업
고객에게 나가는 최종 리포트 11페이지 중 **5페이지가 하드코딩된 예시값**을 보여준다.

| 페이지 | 표시 | 실제 |
|---|---|---|
| `PersonalColorPage` | "피부톤 Neutral Warm / 명도 중간 / 채도 중저" | 하드코딩 |
| `HairTexturePage` | "손상도 약손상 / 모질 반곱슬 / 숱 많다" | 하드코딩 |
| `TodayDesignPage` · `ImageMovementPage` · `NextDirectionSummaryPage` | 고정 문구 | 하드코딩 |

[호출부](frontend/user/src/app/(app)/3way/consulting/page.tsx)가 넘기는 건 `cycleData` · `imageType` · `ratios` 뿐.
`personalColorData` · `skeletonData` · `hairTextureData` · `hairDesignData` · `imageDirectionData` 는
page state 에 있고 DB 에도 저장되는데 **리포트로 전달되지 않는다.**

> 디자이너가 "심한손상 / 직모 / 숱 적음" 을 입력해도 고객 리포트엔 "약손상 / 반곱슬 / 숱 많다" 가 찍힌다.
> **스키마 변경 없이 배선만으로 고칠 수 있다.** 다음 작업 1순위 후보.

또한 골격 진단 결과를 보여주는 리포트 페이지가 **아예 없다** (2WAY 골격 · 3WAY 인데도).

### 🟠 B. 데이터 모델이 FIT 모양
`consultations` 는 FIT 12스텝 전용 jsonb 컬럼 9개로 돼 있고, 3WAY 데이터는 맞는 자리가 없어
`client_info.threeWay` 안에 통째로 들어간다. [3way-api.ts](frontend/user/src/utils/3way-api.ts) 주석이 그대로 자백한다 —
"최상위에 두면 백엔드 ValidationPipe(whitelist:true)가 잘라버림". 검증도 타입안전성도 쿼리가능성도 없다.

### 🟠 C. 컨설팅 상태가 브라우저 메모리에만 존재
`useState` 13개가 21화면을 들고 있고 저장은 마지막 1회뿐. 새로고침 = 리셋, 중간 이탈 = 전손,
뒤로가기 = 입력 초기화, 얼굴분석 뒤로 = 재촬영 강요. (TODO.md B2 · B4 · B5 · B6)
주 사용 환경이 **매장 태블릿**이라 가장 취약한 지점.

### 🟠 D. 테스트가 사실상 없음
코드 21,206줄에 백엔드 spec 1개(헬스체크) + e2e 2개(로그인만, 137줄).
21화면 컨설팅 플로우 · 얼굴분석 · 저장 경로 전부 무테스트.

### 🟡 E. 운영에 살아있는 데이터 유실 버그
현재 배포본(2026-06-08)은 3WAY 결과를 저장하지 못한다 — `ValidationPipe` 가 `threeWay` 를
**에러 없이** 잘라내고 프론트는 성공으로 처리. 수정은 로컬에 있으나 미배포(32커밋).
유실을 멈추려면 admin `/features` 3WAY 토글 OFF (배포 불필요) — **운영 담당 판단 사항.** D5 에 따라 손대지 않는다.
