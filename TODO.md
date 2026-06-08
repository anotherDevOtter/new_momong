# TODO

> 남은 작업 + 비즈니스 결정 + 운영 메모. 액션 위주.
> 제품 정의: [PLANNING.md](./PLANNING.md), 기술 구조: [ARCHITECTURE.md](./ARCHITECTURE.md).
> 최종 갱신: 2026-06-01.

---

## 🚨 배포 안 된 변경분 (origin/main 미반영)

**현재 main 이 origin/main 보다 30 커밋 앞서 있음.** 운영에는 아직 아무 변경도 안 반영됨.

```
git log origin/main..HEAD --oneline   # 30개
```

### 운영 배포 시 반드시 같이 처리해야 할 것
- [ ] **DB 마이그레이션 1건 추가** — `backend/migrations/003_create_pre_surveys.sql` 운영 DB 수동 실행
- [ ] **S3 버킷** — pre-survey 사진은 `pre-surveys/<customer_id>/<uuid>.<ext>` 키 사용 (기존 face-analysis 와 같은 버킷 재사용, 별도 작업 불필요)
- [ ] **운영 도메인 CORS** — 사전설문 공개 링크 `/pre-survey/[token]` 노출 (이미 동작 중일 것)
- [ ] **카카오톡/문자 전송 안내** — 디자이너용 매뉴얼에 "사전설문지 링크 생성 후 카톡으로 전송" 흐름 공유

### 주요 배포 그룹 (30 커밋 의미)
1. **사전설문지 기능** (1) — `feat(pre-survey)`
2. **3WAY 상단 디자인 정리** (3) — BrandHeader 제거, ProgressBar 통합, step5 버튼 통일
3. **고객 상세/선택 UX 대개편** (10+) — URL 기반 라우팅, AppHeader 공통, 고객 선택 다이얼로그, 페이지네이션, 직업 표시, 사전설문 탭
4. **얼굴 분석 admin/UX** (8) — admin 테스트 페이지, presigned GET, source 컬럼, 자동 크롭, MediaPipe 가이드, 이미지 리사이즈
5. **문서 재정리** (1) — PLANNING/ARCHITECTURE/README/TODO 분리

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

## 🟠 3WAY 컨설팅 로직 결함 (이번 세션 발견 — 미수정)

### B1. **저장 누락 — 디자이너 입력의 절반 이상이 버려짐**
[/(app)/3way/consulting/page.tsx:186-210](frontend/user/src/app/(app)/3way/consulting/page.tsx#L186-L210) 의 `saveConsult` 호출이 다음 단계 데이터를 포함하지 않음:

| 단계 | 입력값 | 저장됨? |
|------|--------|--------|
| `PersonalColorAnalysis` (2way-personal) | 웜/쿨 결과 | ❌ |
| `SkeletonImageAnalysis` (2way-skeleton) | 골격 타입 | ❌ |
| `ImageDirectionSetting` | 내추럴/모던/페미닌 | ❌ |
| `HairDesignProposal` | 길이/앞머리/컬/컬러 | ❌ |
| `HairTextureAnalysis` | 손상도/모질/숱 | ❌ |
| `NextDirection` | `cycleData` 만 ✅, 그 외 선택값 | 부분 |

**원인**: 위 컴포넌트들이 `onNext()` 만 받고 데이터 콜백 prop 이 없음.
**조치**: 각 컴포넌트에 `onChange`/`onComplete` 콜백 추가 → page state 로 끌어올린 뒤 `consultData` 에 포함.

### B2. **저장 타이밍 — 마지막 한 번만**
- `saveConsult` 가 `handleReportClose`(PremiumReport 닫기) 에서만 호출
- 중간 이탈/새로고침/네트워크 끊김 → **전부 손실**
- **조치**: backend 에 draft consultation API 추가 → 단계별 PATCH 로 누적 저장

### B3. **전화번호 없는 고객은 저장 스킵**
[page.tsx:179](frontend/user/src/app/(app)/3way/consulting/page.tsx#L179) `if (customerData.phone)` 가드 때문에 전화 없는 고객은 컨설팅 끝까지 진행해도 DB 행 0건.
- **조치**: `customerId` 가 있으면 phone 없어도 저장하도록 가드 수정 + `saveConsult` API 가 customerId 받게 확장

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

### F1. 얼굴 분석 결과 비율 데이터 연동
- [FaceAnalysisResult.tsx](frontend/user/src/components/3way/FaceAnalysisResult.tsx) 의 `ratios` 가 하드코딩 (`1:1:1`, `1:1.4`, `1:2`)
- Python 응답에서 `measurement.value` 또는 별도 필드로 분리 후 프론트 사용
- 영향 모듈: SNH_02 (얼굴비율), SNH_11 (중안부), 상중하 계산

### F2. ImageDirectionSetting `currentType` 분석 결과 연결
- [ImageDirectionSetting.tsx](frontend/user/src/components/3way/ImageDirectionSetting.tsx) 의 `{ warmCool: 'N', softHard: 'N' }` 하드코딩
- 부모에서 `faceAnalysisResult.wnc.final` / `snh.final` prop 전달

### F3. admin 화면에서 컨설팅의 얼굴 분석 결과 표시
- jsonb `client_info.threeWay.faceAnalysis.imageType` 미사용
- admin 컨설팅 목록/상세에 imageType 컬럼/뱃지 추가
- 상세에서 `wncId`/`snhId` 로 `face_analysis_results` 의 모듈별 상세 조회 + 표시

### F4. PremiumReport PDF 출력
- 현재 alert 만 표시
- html2canvas + jsPDF (FIT 의 AfterNote 패턴 참고)

### F5. 1WAY 헤더 코스 라벨
- 컨설팅 진행 중 디자이너가 현재 코스 인지할 수 있는 표시 없음
- ProgressBar 또는 AppHeader 옆에 코스 칩 표시

### F6. 1WAY 저장 시 코스명 default fallback
- [/(app)/3way/consulting/page.tsx:184](frontend/user/src/app/(app)/3way/consulting/page.tsx#L184) default 가 '1WAY'
- 알 수 없는 코스는 빈 문자열 또는 에러 처리

### F7. 사전설문지 — 사진 표시 디자이너 화면
- 고객이 업로드한 `facePhotos`/`preferredHairPhotos`/`dislikedHairPhotos`/`bodyPhotos` 가 jsonb 에는 저장되지만
- 고객 상세 "사전 설문" 탭에서 thumbnail/lightbox 로 노출 안됨
- presigned GET URL 발급 endpoint 도 추가 필요 (S3 객체가 private 인 경우)

### F8. 사전설문지 — 자동 저장 실패 시 사용자 알림
- 현재 autosave 실패는 silent (`catch {}`) → 사용자가 모르는 채 데이터 손실 가능
- 상단 토스트나 인디케이터로 "저장 실패, 재시도 중..." 표시

### F9. 사전설문지 — 토큰 만료/재발급 정책
- 토큰 만료 없음 (영구). 재발급도 무제한.
- 한 고객이 여러 토큰 발급 가능 → 디자이너 화면에서 어느 게 최신인지 헷갈림
- 정책 결정 후: 발급 시 기존 미제출 토큰 무효화 OR 최신 1건만 표시

---

## 🟢 점진적 확장

### E1. 미매핑 분석 모듈 (FaceAnalysisResult UI)
- 현재 UI 표에 매핑된 모듈: WNC 7개, SNH 7개 = 14개
- Python 응답에는 WNC 10 + SNH 12 = 22개
- 미매핑: WNC #3, #7, #10 / SNH #4, #6, #7, #10, #12 → UI 확장 또는 의도적 숨김 결정

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

## ✅ 최근 완료 (이번 세션)

- **사전설문지 기능 전체 구현** — backend `pre_surveys` 테이블 + 공개 토큰 발급/조회/저장/제출 + 공개 업로드 (S3 presigned) + 프론트 8페이지 figma 디자인 + PhotoUploader + 제출 확인 다이얼로그 + 제출 완료/이미 완료 분기
- **고객 상세에 사전설문지 링크 생성** — 새 컨설팅 카드 + 사전 설문 탭 양쪽에 버튼, 발급 링크 목록 + 답변 요약
- **3WAY 상단 디자인 통일** — 9개 step 컴포넌트의 자체 BrandHeader 제거, step5 이전 버튼 NavigationButtons 패턴으로 교체
- **/3way/consulting 통합 ProgressBar** — 코스별 visibleSteps 빌더로 정확한 단계 표시

---

## 🚀 운영 배포 체크리스트

backend / frontend / Python 서버 변경분 운영 배포 시 매번 확인.

### 사전 (코드 push 전)
- [ ] DB 마이그레이션 필요한가? → [backend/migrations/](backend/migrations/) 확인
  - **이번 push 시 003_create_pre_surveys.sql 운영 DB 수동 실행 필요**
- [ ] 필요하면 운영 DB 에 SQL 수동 실행
- [ ] 새 환경변수 추가? → EB Configuration 에 추가 (이번 push 는 추가 없음)
- [ ] face_landmark Python 서버 변경? → 별도 배포 필요 (이번 push 는 변경 없음)

### Push (자동 배포 트리거)
- [ ] `git push origin main`
- [ ] GitHub Actions backend deploy 성공 확인 ([Actions](https://github.com/anotherDevOtter/new_momong/actions))
- [ ] Amplify user/admin 빌드 성공 확인 (Amplify 콘솔)

### 검증 (배포 직후)
- [ ] backend `/api/docs` 접근 (새 endpoint `pre-surveys/*` 보이는지)
- [ ] user 메인 페이지 로드 OK
- [ ] admin 로그인 + 페이지 로드 OK
- [ ] 3WAY 끝까지 한 번 진행 (얼굴 분석 포함)
- [ ] 사전설문 링크 발급 → 사진 1장 업로드 → 제출 끝까지 한 번
- [ ] DB 행 정상 INSERT 확인:
  ```sql
  SELECT count(*) FROM face_analysis_results;        -- 새 2건
  SELECT count(*) FROM pre_surveys;                  -- 새 1건
  SELECT client_info->'threeWay'->'faceAnalysis' FROM consultations ORDER BY created_at DESC LIMIT 1;
  ```

### 롤백 (문제 발생 시)
- 코드: `git revert <commit>` + `git push` → 다시 자동 배포
- DB: 신규 테이블/컬럼은 DROP/ALTER 로 복구 (데이터 0건이면 즉시)
- EB: 콘솔에서 이전 application version 으로 즉시 rollback 가능
