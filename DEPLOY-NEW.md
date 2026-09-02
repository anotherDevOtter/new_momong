# `new` 코스 배포 준비 — 런북

> 지금은 **로컬 전용**이다. 이 문서는 배포 시점에 무엇을 해야 하는지 적어둔 것이고,
> 아직 아무것도 배포하지 않았다.
> 2026-09-02

---

## 1. 지금 상태

| | |
|---|---|
| 코드 | `new` 임시 코스에 시안 이식 완료. `tsc` · `eslint`(에러 0) · `next build` 통과 |
| 흐름 | 요약 → 얼굴촬영 → 분석중 → 이목구비 → 최종타입 → 헤어컨설팅 → 헤어디자인 → 헤어질감 → 다음방향 → 리포트(10장) → 완료 |
| 커밋 | **아직 안 함.** `new_momong` 35개 변경 + `face_landmark` 5개 변경이 워킹트리에 있다 |
| 기존 코스 | `1way`·`2way`·`3way` 는 손대지 않았다 (공용 컴포넌트는 `startEmpty` 등 옵션으로 분기) |

## 2. 배포 전에 반드시 정해야 할 것

**`new` 코스는 개발 전용이라 그대로 배포하면 안 된다.**

- 코스 카드가 `NODE_ENV === 'development'` 에서만 보인다 → 운영 빌드에서는 안 보이지만, **주소(`?course=new`)로는 열린다**
- 리포트 표지·완료 화면에 `1WAY · 신규` 라고 나온다

→ 배포하려면 **`1way` 를 `new` 로 교체**하는 작업(사용자가 정한 3단계)이 먼저다.

```
① 작업        ✅ 끝
② 최적화·저장 배선  ✅ 끝
③ 1way ← new 교체, new 삭제   ← 여기부터
④ 정리하고 커밋
```

### 교체 시 할 일

1. `COURSE_STEPS['1way']` 를 현재 `'new'` 목록으로 교체
2. `COURSE_STEPS['new']` 삭제, `CourseSelection` 의 DEV 카드 삭제
3. `page.tsx` 의 `renderNewCourse()` 를 `1way` 에서도 타도록 분기 변경
4. 공용 컴포넌트에 넘기는 `startEmpty` 등 플래그를 `1way` 기준으로 정리
5. `COURSE_NAMES['1way']` · 리포트 표지 라벨 확인 (`1WAY HAIR REPORT`)
6. 저장 필드 이름(`newPreInterview` 등)을 그대로 둘지 정리할지 결정

## 3. 배포 절차 (실행하지 않음)

> `git push origin main` 이 곧 자동 배포다 — 백엔드 EB, 프론트 Amplify.
> **운영 담당이 판단해서 실행할 것.**

### 3-1. 커밋 전 점검

```bash
cd new_momong/frontend/user
npx tsc --noEmit          # 에러 0 이어야 함
npx eslint src            # 에러 0 (경고는 무방)
npx next build            # Compiled successfully

cd ../../backend
npx tsc --noEmit
```

### 3-2. 환경 변수 확인

로컬 `.env` 는 전부 로컬을 가리키고 있다. **운영은 EB / Amplify 환경변수로 주입**되므로
로컬 값이 커밋되지 않는지 확인한다 (`.env` 는 `.gitignore` 에 있음).

| | 로컬 | 운영 |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3200/api` | `https://manager-api.merci-momong.com/api` |
| `PORT` / `PYTHON_SERVER_URL` | `3200` / `localhost:3201` | EB 환경변수 |
| `ALLOWED_ORIGINS` · `FRONTEND_URL` | `localhost:3202,3203` | 운영 도메인 |
| `S3_BUCKET` (face_landmark) | `momong-dev` | `momong-staging` 등 |

### 3-3. 새로 추가된 것

| | 내용 |
|---|---|
| **npm 패키지 2개** | `jspdf` · `html2canvas-pro` — 리포트 PDF 저장에 쓴다. `package.json` 에 들어가 있어 배포 빌드에서 자동 설치된다 |
| **정적 파일** | `frontend/user/public/new/` (모델 사진·컬러 사진 등 79개, 약 31MB). Amplify 빌드에 포함된다 |
| **DB 마이그레이션** | **없다.** 저장은 `client_info` jsonb 안이라 스키마 변경이 없다 |
| **백엔드 변경** | `face-analysis.controller.ts` · `pre-surveys.controller.ts` 소폭 수정 |

### 3-4. 배포 후 확인

1. 코스 선택에 **개발용 카드(`· DEV`)가 안 보이는지**
2. `?course=new` 로 직접 열었을 때의 동작 (교체 후에는 `1way` 로 떨어져야 한다)
3. 얼굴 분석 호출 (`PYTHON_SERVER_URL`) 정상 여부
4. 리포트 PDF 저장 — 운영 빌드에서 폰트·이미지가 제대로 들어가는지
5. 공유 링크(`/share/<토큰>`) 접근

## 4. 배포 전 남은 결정

`QUESTIONS.md` / `QUESTIONS.pdf` 의 18건 중 **P0 5건**은 배포 전에 정리하는 게 좋다.

| | 내용 |
|---|---|
| A1 | 판정 항목이 문서(8) 와 화면(10) 이 다르다 |
| A2 | 문서가 요구하는 `눈썹 방향`·`눈 앞머리` 를 못 잰다 |
| B1 | 헤어 처방 9칸 중 5칸 미검증 → 그 칸은 추천이 안 뜬다 |
| C1 | 리포트 9페이지가 고정 문장이다 (고객에게 나가는 문서다) |

## 5. 알려진 제한

- **PDF 는 이미지 기반**이라 글자 검색·복사가 안 된다
- **레이더 5부위 점수**는 문서에 근거가 없는 우리 계산이다 (중립에서 벗어난 정도)
- **`좌우 대칭`·`상중하 비율`(수치)** 는 분석 모듈이 없어 리포트에 `미측정` 으로 나간다
- 기존 코스(`1way`·`2way`·`3way`)는 이번 개편 대상이 아니다
