# TODO

> 남은 작업 + 비즈니스 결정 + 운영 메모. 액션 위주.
> 제품 정의: [PLANNING.md](./PLANNING.md), 기술 구조: [ARCHITECTURE.md](./ARCHITECTURE.md).
> 최종 갱신: 2026-08-22.

---

## 🚧 운영 동기화 상태

**로컬 `main` = 정리 완료 상태.** `feat/face-analysis-dynamic` 는 2026-08-22 에 `main` 으로
병합했고 working tree 는 깨끗하다. 다음 작업은 여기서 시작하면 된다.

⚠️ **단, `main` 자체가 origin 에 push 되지 않았다.** 2026-06-08 이후 아무것도 배포되지 않았고
아래가 전부 로컬에만 있다:
- 얼굴분석 동적구조 P1 · P2a · P2b · P2c · P4 (`module_configs` 기반 표시 SSOT)
- 사전설문 리뷰 step 11
- B1 / B3 / threeWay 저장 누락 수정
- 2026-08-22 프로젝트 정리 (죽은 코드·의존성 제거, 문서 동기화)

### 배포 보류 결정 (2026-08-22)

**개편이 끝날 때까지 배포하지 않는다.** 사유 — 지금 고친 것을 개편에서 또 고치게 되므로,
중간 배포는 같은 코드를 두 번 내보내는 셈.

- 작업은 로컬 `main` 에서 진행. 개편 착수 전 지점은 태그 `backup/2026-08-22-pre-overhaul` 에 보존.
- `main` push = 자동 배포(GitHub Actions 백엔드 EB + Amplify 프론트)라 **준비되기 전엔 push 금지.**
  단 `main` 이외 브랜치 push 는 배포를 트리거하지 않는다 (`deploy-backend.yml` 이 `branches: [main]`).

**나중에 배포할 때 반드시**: push 전에 운영 DB 에 `backend/migrations/004_create_module_configs.sql`
선실행. 첫 부팅 때 `ModuleConfigsService.onModuleInit` 이 24개 시드를 자동 삽입한다.

### ⚠️ 운영에 살아있는 데이터 유실 버그

현재 운영(`origin/main`, 2026-06-09 배포)은 3WAY 컨설팅 데이터를 **저장하지 못한다.**

| 구성요소 | 운영 상태 |
|---|---|
| 프론트 `3way-api.ts` | `threeWay` 를 payload **최상위**로 전송 |
| 백엔드 `main.ts` | `ValidationPipe({ whitelist: true, forbidNonWhitelisted: false })` |
| 백엔드 `CreateConsultationDto` | `threeWay` 필드 **없음** |

→ whitelist 가 `threeWay` 를 잘라내고 **에러도 나지 않는다.** 프론트는 저장 성공으로 처리.
얼굴분석·퍼스널컬러·골격·이미지방향·헤어디자인·모질이 전부 버려지고 고객 기본정보만 남는다.

수정은 로컬에 있으나(`8cb8ac1`·`cd1f110`·`70a526a`·`8e62538`) **미배포**.
→ 실사용 중이라면 admin `/features` 에서 3WAY 토글을 끄면 배포 없이 유실을 멈출 수 있다.
   실사용 전이라면 무시해도 된다.

마지막으로 운영에 반영된 것(2026-06-08 배포):
- 사전설문지 기능 (DB 마이그레이션 `003_create_pre_surveys.sql` 운영 DB 실행 완료)
- S3 presigned URL checksum 헤더 비활성화 (브라우저 PUT 호환)
- 사전설문 사진 표시 (signed GET URL 매핑 — `photoDisplayUrls`)
- 고객 상세 컨설팅/사전설문 모달 전환

다음 push 시 매번 확인할 항목은 하단 [운영 배포 체크리스트](#-운영-배포-체크리스트) 참조.

---

## 🔴 비즈니스 결정 필요 (코드 작업 전 합의)

### Q1. 1WAY 코스 정체
- 현재: 카드 문구 "얼굴 정밀 분석" 인데 실제로는 3WAY 와 동일한 컨설팅 화면 거침
- 결정 안:
  - **(A) 진짜 얼굴 분석만** → 코스 선택 → 고객정보 → 얼굴분석 → 결과 → 완료 (5단계)
  - **(B) 풀 흐름 유지** → 카드 문구 수정 ("얼굴 분석 중심 풀 컨설팅" 등)
- 영향: 결정에 따라 아래 F-항목 작업 범위 결정됨

### Q2. PremiumReport 코스별 페이지 분기
- 현재: 모든 코스에서 9페이지 다 노출 (1WAY 도 퍼스널컬러 페이지 노출)
- 결정 안:
  - **(A)** 코스별로 다른 페이지 (1WAY=얼굴만, 2WAY=얼굴+해당, 3WAY=전체)
  - **(B)** 모든 코스 동일 (현재 상태 유지)

### Q3. 모질 분석 / 이미지 방향 설정 / 헤어디자인 제안 범위
- 모든 코스에 필요한가? 1WAY 만이라면 빠질 수 있는가?

### Q4. 사전설문지 — 디자이너 활용 정책
- 발급한 사전설문지 답변/사진을 컨설팅 화면(`/3way/consulting`) 에서 자동 prefill 할지?
- 또는 고객 상세 "사전 설문" 탭에서 별도 참고만?
- 현재 상태: 별도 참고만 (3WAY 컨설팅 시 prefill 없음)

### Q5. 운영 환경 명칭 정리
- 현재 backend EB `Momong-staging-env` + Python `momong-face-analyze-staging-env` 이 실제 운영
- staging 명칭 정리할지 (운영용 환경 새로 만들고 이름 분리)

---

## 🟠 3WAY 컨설팅 로직 결함 (이번 세션 발견)

### B1. ✅ **저장 누락 — 디자이너 입력의 절반 이상이 버려짐** (2026-06-17 완료)
모든 단계 입력값이 `saveConsult` 의 `consultData` 에 포함되도록 수정 완료.

| 단계 | 입력값 | 저장됨? |
|------|--------|--------|
| `PersonalColorAnalysis` (2way-personal) | 웜/쿨(season) 결과 | ✅ `personalColor` |
| `SkeletonImageAnalysis` (2way-skeleton) | 골격 타입 | ✅ `skeleton` |
| `ImageDirectionSetting` | 내추럴/모던/페미닌 | ✅ `imageDirection` |
| `HairDesignProposal` | 길이/앞머리/컬/컬러 | ✅ `hairDesign` |
| `HairTextureAnalysis` | 손상도/모질/숱 | ✅ `hairTexture` |
| `NextDirection` | `cycleData` | ✅ |

각 컴포넌트에 `onChange` 콜백 추가 → page state 로 끌어올려 저장. (3WAY 경로 `cd1f110`, 2WAY 경로 `70a526a`)

### B7. 🔴 **3WAY 가 퍼스널컬러·골격 단계를 건너뛴다** (2026-08-22 발견)
`/3way/consulting/page.tsx` 의 코스 분기가 **2WAY 두 종류만** 해당 단계를 태운다:

```ts
if (selectedCourse === '2way-personal') setCurrentPage('personalColor');
else if (selectedCourse === '2way-skeleton') setCurrentPage('skeletonImage');
else setCurrentPage('imageDirection');        // ← 3way 와 1way 가 여기로
```

| 코스 | 퍼스널컬러 단계 | 골격 단계 |
|---|:--:|:--:|
| 1WAY | ✗ | ✗ |
| 2WAY 퍼스널컬러 | ✅ | ✗ |
| 2WAY 골격 | ✗ | ✅ |
| **3WAY (풀 진단)** | **✗** | **✗** |

→ PLANNING 상 3WAY 는 "얼굴 + 컬러 + 골격" 풀 진단인데 **둘 다 안 거친다.**
   `buildVisibleSteps` 도 같은 조건이라 ProgressBar 단계 수도 동일하게 빠져 있다.

**결과적으로 생기는 모순**: `PremiumReport` 는 `showPersonalColor = selectedCourse === '3way' || '2way-personal'`
이라 **3WAY 리포트에 퍼스널컬러 페이지를 띄운다.** 그런데 그 데이터를 모으는 단계를 안 거쳐서
`personalColorData` 는 항상 `null` → **빈 퍼스널컬러 페이지가 나간다.**
저장도 `personalColor: null` / `skeleton: null` 로 들어간다.

- **조치**: 3WAY 분기를 `personalColor → skeletonImage → imageDirection` 순서로 태우기
  (`buildVisibleSteps` 도 같이 수정). Q1/Q2 결정과 묶여 있음.

---

### B2. **저장 타이밍 — 마지막 한 번만** 🔴 미수정 (백엔드 묶음)
- `saveConsult` 가 `handleReportClose`(PremiumReport 닫기) 에서만 호출
- 중간 이탈/새로고침/네트워크 끊김 → **전부 손실**
- **조치**: backend 에 draft consultation API 추가 → 단계별 PATCH 로 누적 저장

### B3. ✅ **전화번호 없는 고객은 저장 스킵** (2026-06-17 완료, `8e62538`)
컨설팅↔고객 연결을 **전화번호 → customerId** 로 전환.
- 백엔드: DTO `customerId` 추가, `create()` 가 customerId(소유 검증)로 직접 연결 + 전화번호 upsert 폴백 유지
- 프론트 저장: `saveConsult` 에 customerId 전송, 가드 `if(phone)` → `if(customerId)`
- 프론트 조회: 고객 상세 이력을 `by-customer-id` 로 전환 (번호 변경/미입력에도 유지)
- 운영 데이터: 170건 중 168 정상, 1건 백필, 복구불가 미아 2건(`yqrxwd0`/`tsncitp`) NULL 유지
- ⚠️ **배포 주의**: 백엔드+프론트 동시 배포 필요 (조회 경로가 새 API `by-customer-id` 사용). 백엔드 먼저 배포 권장.

### B4. **상태 복원 안 됨**
- 모든 step 컴포넌트가 자체 `useState` → 뒤로 갔다 다시 들어오면 입력 초기화
- page state 에 데이터는 있지만 컴포넌트가 props 로 초기값 안 받음
- **조치**: 각 컴포넌트 prop 에 `initial*` 추가 + page 에서 전달

### B5. **새로고침 시 1단계로 리셋**
- URL 이 `/3way/consulting?course=X&customerId=Y` 만 유지, 현재 step 정보 없음
- **조치**: URL 에 `?step=` 또는 `[...slug]` 로 step 반영 + 마운트 시 draft consultation 로드

### B6. **얼굴 분석 뒤로 → 재촬영 강요**
- `faceResult` 에서 "이전" → `faceAnalysis` 로 가면 이전 분석 결과 무시되고 새로 촬영 필요
- **조치**: `FaceAnalysisCapture` 에 `initialResult` prop 추가 → 이미 결과 있으면 "결과 유지하고 다음" 옵션 제공

---

## 🟡 핵심 기능 미완성

### F1. 🟡 **부분 완료** — 얼굴 분석 결과 비율 데이터 연동 (`7f366e5`)
- ✅ **얼굴비율** = SNH_02 서버 `value`, **중안부** = SNH_11 서버 `value` 로 연결됨 (`X : 1` 표기, 값 없으면 `- : 1`)
- 🔴 **상중하(`vertical`)만 `'1 : 1 : 1'` 하드코딩 유지** — 대응하는 Python 측정 모듈이 아직 없어 수동 입력
- **남은 조치**: 상중하 측정 모듈을 face_landmark 에 추가하거나, 수동 입력으로 확정하고 UI 문구 정리

### F2. ✅ **완료** — ImageDirectionSetting `currentType` 분석 결과 연결
부모(`/3way/consulting/page.tsx`)가 `currentType={currentImageType}` 으로 전달한다.
`currentImageType = { warmCool: faceResultData?.wncFinal ?? 'N', softHard: faceResultData?.snhFinal ?? 'N' }`
→ 얼굴분석 결과 + **디자이너 수정분(faceResultData)** 까지 반영. 분석 전에만 `N/N` 폴백.
(컴포넌트 쪽 `N/N` 은 prop 미전달 시 기본값일 뿐 하드코딩 아님)

### F3. ✅ **완료** — 컨설팅 상세에 얼굴 분석 결과 표시 (2026-07-06, `79116dd`)
`FaceAnalysisSummary` 컴포넌트 추가 + `ClientDetailStep` 에서 컨설팅 상세에 표시.
- ⚠️ **구현 위치 주의**: 원래 문서엔 "admin 화면"이라 적었지만, 실제 구현은 **user 프론트의 고객 상세**
  ([ClientDetailStep.tsx](frontend/user/src/components/steps/ClientDetailStep.tsx))다. admin 프론트에는 아직 없다.
- admin 컨설팅 목록/상세에도 필요하면 별도 항목으로 다시 올릴 것.

### F4. PDF 출력 (PremiumReport + 3WAY 완료 화면)
- 현재 **두 곳 다 `alert()` 만** 표시:
  - [PremiumReport.tsx:108](frontend/user/src/components/3way/PremiumReport.tsx#L108) — "서버 연동이 필요합니다"
  - [/(app)/3way/consulting/page.tsx:252](frontend/user/src/app/(app)/3way/consulting/page.tsx#L252) — "추후 연동 예정입니다"
- ⚠️ **FIT 의 AfterNote 에도 PDF 구현은 없다** (참고할 기존 패턴이 없음 — 문서에 잘못 적혀 있던 것)
- ⚠️ `html2canvas` / `jspdf` 는 **미사용이라 2026-08-22 정리 때 제거됨.** 착수 시 재설치 필요

### F5. ✅ **완료** — 컨설팅 중 코스 라벨 표시
`ProgressBar` 의 `leftSlot` 에 코스 칩(검정 pill) 렌더.
`COURSE_CHIP` 맵 — `3WAY` / `2WAY 퍼스널컬러` / `2WAY 골격` / `1WAY`, 미등록 코스는 값 그대로 표시.

### F6. ✅ **완료** — 저장 시 코스명 fallback
`COURSE_NAMES[selectedCourse] || selectedCourse` — 알 수 없는 코스를 `'1WAY'` 로 단정하지 않고
받은 값을 그대로 보존한다.

### F8. 사전설문지 — 자동 저장 실패 시 사용자 알림
- 현재 autosave 실패는 silent (`catch {}`) → 사용자가 모르는 채 데이터 손실 가능
- 상단 토스트나 인디케이터로 "저장 실패, 재시도 중..." 표시

### F9. 사전설문지 — 토큰 만료/재발급 정책
- 토큰 만료 없음 (영구). 재발급도 무제한.
- 한 고객이 여러 토큰 발급 가능 → 디자이너 화면에서 어느 게 최신인지 헷갈림
- 정책 결정 후: 발급 시 기존 미제출 토큰 무효화 OR 최신 1건만 표시

### F10. ✅ **완료 — module_configs 로 대체** (`36eb5d2` + P2a~c)
라벨은 이제 **코드가 아니라 DB(`module_configs`)가 소유**한다. admin `/face-modules` 에서
개발/배포 없이 라벨·순서·노출·단위를 바꾼다. 아래 표는 당시 논의 기록으로만 남긴다.

<details>
<summary>당시 라벨 변경 논의 (기록용)</summary>

### (구) 얼굴 분석 결과 분석 항목 제목 수정
[FaceAnalysisResult.tsx](frontend/user/src/components/3way/FaceAnalysisResult.tsx) WNC/SNH 표의 행 라벨이 실제 측정 모듈 의미와 안 맞음. 디자이너 요청으로 아래로 변경.

> ⚠️ **단순 라벨 교체 아님**: `WNC_KEY_BY_LABEL`/`SNH_KEY_BY_LABEL` 이 **라벨 문자열을 키로** 서버 모듈번호(`results[key]`)를 조회함. 라벨을 바꾸면 이 두 맵의 키도 **같이** 바꿔야 서버 분석값 바인딩이 유지됨 (안 그러면 해당 행이 중립값 고정).

**WNC (Warm/Neutral/Cool) — 확정**
| 현재 라벨 (모듈) | → 새 라벨 |
|------|------|
| 피부톤 (mod1) | 피부톤 (유지) |
| 페이스라인 (mod2) | 페이스라인 (유지) |
| 윤곽라인 (mod4) | 광대 발달 정도 |
| 눈썹 (mod5) | 눈썹형태 |
| 눈 (mod6) | 눈형태 |
| 코 (mod8) | 코형태 |
| 입술 (mod9) | 입술형태 |

**SNH (Soft/Neutral/Hard) — ❓ 일부 확인 필요**
| 현재 라벨 (모듈) | → 새 라벨 |
|------|------|
| 피부톤 (mod1) | 피부톤 (유지) |
| 얼굴 밸런스 (mod9) | 얼굴 길이 |
| 가로 비율 (mod5) | 눈과 눈사이 거리 (❓ "눈썹과 눈거리"와 혼동 — 확인) |
| 세로 비율 (mod2) | 중안부 |
| 눈썹 밀도 (mod3) | ❓ 이미지에 X 표시 — 삭제? 아니면 "눈썹과 눈거리"로 변경? 확인 필요 |
| 코 폭 (mod8) | (주석 없음 — 유지?) |
| 입술 폭 (mod11) | (주석 없음 — 유지?) |

- 확정 후: base 배열 `label` + 해당 KEY_BY_LABEL 키 동시 수정. 행 삭제 시 KEY_BY_LABEL 엔트리도 제거.

</details>

---

## 🟢 점진적 확장

### E1. ✅ **완료 — module_configs 토글로 해결** (P2a~c)
24개 모듈 전부 `module_configs` 에 시드됨. 쓰는 13개는 `display:true`, 나머지 11개는 `display:false`.
admin `/face-modules` 에서 켜고 끈다. 새 Python 모듈은 숨김 상태로 **자동 등록**되므로
"미매핑 모듈" 개념 자체가 사라졌다.

### E2. 1WAY E2E 테스트
- `e2e/` 에 1WAY 전용 시나리오 없음
- 코스 선택 → 끝까지 → 저장 검증 시나리오 작성

### E3. 기능 플래그 실시간 반영
- 현재 user 프론트는 새로고침 시만 갱신
- WebSocket / SSE / polling 중 결정

### E4. S3 lifecycle 정책
- 얼굴 이미지/사전설문 사진 영구 보존 중
- 개인정보 측면 30/90/365 일 정책 검토

### E5. 자동 마이그레이션 도구
- 현재 `backend/migrations/*.sql` 수동
- typeorm-migrations 또는 별도 CI 단계 추가 검토

### E6. 사전설문지 — Cover 단계 진입 안내
- 카카오톡 링크 클릭 → Cover 페이지 진입 시 "방문 전 사전설문" 컨텍스트가 명확하지 않음
- 첫 화면에 시작 안내/예상 소요 시간 표시 검토

---

## ✅ 최근 완료

### 2026-08-22 (face_landmark — 죽은 모듈 2개 복구)
- **SNH 7 쌍꺼풀 형태 · SNH 8 눈 밑 지방 레지스트리 등록 복구** — 파일은 있었으나 `analyze_face.py` 의
  `snh_modules` dict 에 없어 실행되지 않던 모듈. **WNC 10 + SNH 12 = 22 → WNC 10 + SNH 14 = 24개**
  - 두 모듈이 `{'grade'}` 만 반환하던 것을 나머지 22개와 동일하게 `value` / `description` / `measurement` 까지 반환하도록 보강
  - `SNH_TYPE_08` 파일 헤더 docstring 이 `SNH_TYPE_07` 로 잘못 적혀 있던 것 수정
  - `module_configs` 시드에 `display:false` 로 추가 → 노출하려면 admin `/face-modules` 에서 켤 것
  - 실제 이미지로 분석 실행 검증 완료 (SNH #7 `H`/66.14, #8 `S`/2.0px, measurement 정상)
- **🐛 `circle` 오버레이 크래시 버그 수정** — Python 6곳이 `'center'` 키를 보내는데
  `FaceOverlay` 는 `shape.point.x` 를 읽어 **TypeError 로 렌더가 터지던 문제** (SNH_04 · SNH_13 해당).
  Python 을 `'point'` 로 통일 + `FaceOverlay` 는 과거 저장분 호환 위해 `point ?? center` 둘 다 수용.

### 2026-08-22 (프로젝트 정리 — 운영 반영 없음, 코드/문서만)
- **죽은 코드 제거** — `BrandHeader` · `ProgressSteps` · `ConcernsCheck` · `CustomerHistory(+Detail)` ·
  `CompletionStep` · `PrintableAfterNote` · admin `AdminFaceCapture` · 미사용 asset 1개 · 임시 `demo-presurvey` 페이지
- **미사용 의존성 제거** — user: `@radix-ui/*` 8개 + `class-variance-authority` + `html2canvas` + `jspdf` / admin: `clsx` + `tailwind-merge`
- **`GET /` 헬스 체크 개선** — `'Hello World!'` → `{ status, uptime, timestamp }` (+ 테스트 갱신)
- **이름 충돌 해소** — FIT 전용 `ui/FashionStyleCard` → `ui/FitFashionStyleCard` (3WAY 쪽과 동명이인이었음)
- **레거시 repo 정리** — 루트의 `momong_web` · `momong_backend` · 빈 `momong` 폴더 삭제 (GitHub 에 원본 보존)
- **문서 동기화** — ARCHITECTURE §5 API 전면 재작성, module-configs/004 마이그레이션 반영, PLANNING 의 미구현 PDF 표기 수정

### 2026-06-17 ~ 07-06 (얼굴분석 동적구조 — ⚠️ 아직 미배포, `feat/face-analysis-dynamic`)
- **P1** 얼굴분석 표 동적 렌더링 (`7da995f`) — 라벨→모듈 하드코딩 맵 제거
- **P2a** `module_configs` 테이블 + 조회/수정 API + 22개 시드 + 새 모듈 자동생성 (`5fe95da`)
- **P2b** user 프론트가 화이트리스트 대신 DB 설정 조회로 렌더 (`fcdfecc`)
- **P2c** admin `/face-modules` — 토글/순서/라벨/단위 편집 화면 (`860a787`)
- **P4/F3** 컨설팅 상세에 얼굴분석 결과 표시 + threeWay 저장 누락 근본수정 (`79116dd`)
- **step 11** 사전설문 리뷰 단계 + `PreSurveyDetailView` 공용화 (`c19b0cf`)
- **B1/B3** 단계별 입력 저장 누락 수정 + 컨설팅↔고객 연결을 customerId 로 전환

### 2026-06-08 ~ 06-09 (사전설문지 라운드 2 + 모달화)
- **사전설문 사진 디자이너 화면 표시** (구 F7) — backend `findByToken`/`findOneByIdForOwner` 가 raw S3 URL → signed GET URL 매핑(`photoDisplayUrls`) 도 반환, 프론트 PhotoUploader 가 `displayUrlMap` 으로 렌더 + 새 업로드는 로컬 blob URL 즉시 미리보기
- **S3 presigned URL checksum 헤더 비활성화** — `requestChecksumCalculation: 'WHEN_REQUIRED'` + `responseChecksumValidation: 'WHEN_REQUIRED'`. 브라우저 PUT 호환성. face-analysis 카메라 업로드에도 동일하게 적용됨
- **PhotoUploader next/image → `<img>` 전환** — `<Image fill unoptimized>` 가 fail-silently 하던 이슈, blob URL cleanup 버그(다음 업로드 직전에 이전 blob revoke) 함께 수정
- **컨설팅 히스토리 / 사전설문 인라인 expand → 모달 전환** — 공통 [Modal](frontend/user/src/components/ui/Modal.tsx) 컴포넌트 추가, 펼침 영역이 길어 다음 row 보기 불편하던 UX 개선
- **고객 상세 사전설문 탭 재설계** — 컨설팅 히스토리 패턴으로 통일, 행 클릭 → 모달에 `PreSurveyDetailView`(기본정보 / 이미지선호도 / 상세고민 / 첨부사진 그리드, 사진 클릭 시 새 탭 원본)

### 2026-06-01 ~ 06-08 (사전설문지 라운드 1)
- **사전설문지 기능 전체 구현** — backend `pre_surveys` 테이블 + 공개 토큰 발급/조회/저장/제출 + 공개 업로드 (S3 presigned) + 프론트 8페이지 figma 디자인 + PhotoUploader + 제출 확인 다이얼로그 + 제출 완료/이미 완료 분기
- **고객 상세에 사전설문지 링크 생성** — 새 컨설팅 카드 + 사전 설문 탭 양쪽에 버튼
- **3WAY 상단 디자인 통일** — 9개 step 컴포넌트의 자체 BrandHeader 제거, step5 이전 버튼 NavigationButtons 패턴으로 교체
- **/3way/consulting 통합 ProgressBar** — 코스별 visibleSteps 빌더로 정확한 단계 표시

---

## 🚀 운영 배포 체크리스트

backend / frontend / Python 서버 변경분 운영 배포 시 매번 확인.

### 사전 (코드 push 전)
- [ ] DB 마이그레이션 필요한가? → [backend/migrations/](backend/migrations/) 확인
  - 운영 반영 완료: `001_create_face_analysis_results.sql`, `002_add_source_to_face_analysis_results.sql`, `003_create_pre_surveys.sql`
  - 🔴 **미반영**: `004_create_module_configs.sql` — `feat/face-analysis-dynamic` 배포 시 **push 전에 운영 DB 에 먼저 실행**해야 함
    (첫 부팅 때 `ModuleConfigsService.onModuleInit` 이 24개 시드를 자동 삽입한다)
  - ℹ️ **이미 22행이 들어있는 DB** 는 시드가 다시 돌지 않는다. SNH 7·8 은 다음 분석 때
    `ensureModules` 가 숨김(`display:false`)으로 **자동 추가**하므로 수동 INSERT 불필요.
- [ ] 필요하면 운영 DB 에 SQL 수동 실행
- [ ] 새 환경변수 추가? → EB Configuration 에 추가
- [ ] face_landmark Python 서버 변경? → 별도 배포 필요

### Push (자동 배포 트리거)
- [ ] `git push origin main`
- [ ] GitHub Actions backend deploy 성공 확인 ([Actions](https://github.com/anotherDevOtter/new_momong/actions))
- [ ] Amplify user/admin 빌드 성공 확인 (Amplify 콘솔)

### 검증 (배포 직후)
- [ ] backend `/api/docs` 접근 (새 endpoint `pre-surveys/*`, `module-configs` 보이는지)
- [ ] backend `GET /` 가 `{ status: 'ok', uptime, timestamp }` 반환 (EB 헬스 체크)
- [ ] admin `/face-modules` 진입 → 모듈 24개 목록 보이고 토글/저장 되는지 (SNH 7·8 은 숨김 상태로 존재)
- [ ] user 메인 페이지 로드 OK
- [ ] admin 로그인 + 페이지 로드 OK
- [ ] 3WAY 끝까지 한 번 진행 (얼굴 분석 포함)
- [ ] 사전설문 링크 발급 → 사진 1장 업로드 → 제출 끝까지 한 번
- [ ] DB 행 정상 INSERT 확인:
  ```sql
  SELECT count(*) FROM face_analysis_results;        -- 새 2건
  SELECT count(*) FROM pre_surveys;                  -- 새 1건
  SELECT count(*) FROM module_configs;               -- 22 (첫 부팅 시드)
  SELECT client_info->'threeWay'->'faceAnalysis' FROM consultations ORDER BY created_at DESC LIMIT 1;
  ```

### 롤백 (문제 발생 시)
- 코드: `git revert <commit>` + `git push` → 다시 자동 배포
- DB: 신규 테이블/컬럼은 DROP/ALTER 로 복구 (데이터 0건이면 즉시)
- EB: 콘솔에서 이전 application version 으로 즉시 rollback 가능
