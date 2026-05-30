# TODO

> 남은 작업 + 비즈니스 결정 + 운영 메모. 액션 위주.
> 제품 정의: [PLANNING.md](./PLANNING.md), 기술 구조: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🔴 비즈니스 결정 필요 (코드 작업 전 합의)

### Q1. 1WAY 코스 정체
- 현재: 카드 문구 "얼굴 정밀 분석" 인데 실제로는 3WAY 와 동일한 21개 화면 거침
- 결정 안:
  - **(A) 진짜 얼굴 분석만** → 코스 선택 → 고객정보 → 얼굴분석 → 결과 → 완료 (5단계)
  - **(B) 풀 흐름 유지** → 카드 문구 수정 ("얼굴 분석 중심 풀 컨설팅" 등)
- 영향: 결정에 따라 #2, #3, #4 의 작업 범위 결정됨

### Q2. PremiumReport 코스별 페이지 분기
- 현재: 모든 코스에서 9페이지 다 노출 (1WAY 도 퍼스널컬러 페이지 노출)
- 결정 안:
  - **(A)** 코스별로 다른 페이지 (1WAY=얼굴만, 2WAY=얼굴+해당, 3WAY=전체)
  - **(B)** 모든 코스 동일 (현재 상태 유지)

### Q3. 모질 분석 / 이미지 방향 설정 / 헤어디자인 제안
- 모든 코스에 필요한가? 1WAY 만이라면 빠질 수 있는가?

### Q4. 운영 환경 명칭 정리
- 현재 backend EB `Momong-staging-env` + Python `momong-face-analyze-staging-env` 이 실제 운영
- staging 명칭 정리할지 (운영용 환경 새로 만들고 이름 분리)

---

## 🟡 핵심 기능 미완성 (코드 작업)

### F1. 얼굴 분석 결과 비율 데이터 연동
- [FaceAnalysisResult.tsx:105-109](frontend/user/src/components/3way/FaceAnalysisResult.tsx#L105-L109) 의 `ratios` 가 하드코딩 (`1:1:1`, `1:1.4`, `1:2`)
- Python 응답에서 `measurement.value` 또는 별도 필드로 분리 후 프론트 사용
- 영향 모듈: SNH_02 (얼굴비율), SNH_11 (중안부), 새 상중하 계산

### F2. ImageDirectionSetting `currentType` 분석 결과 연결
- [ImageDirectionSetting.tsx](frontend/user/src/components/3way/ImageDirectionSetting.tsx) 의 `{ warmCool: 'N', softHard: 'N' }` 하드코딩
- 부모에서 `faceAnalysisResult.wnc.final` / `snh.final` prop 전달

### F3. admin 화면에서 컨설팅의 얼굴 분석 결과 표시
- 현재 jsonb 에 저장된 `client_info.threeWay.faceAnalysis.imageType` 미사용
- admin 컨설팅 목록/상세에 imageType 컬럼/뱃지 추가
- 상세에서 `wncId`/`snhId` 로 `face_analysis_results` 의 모듈별 상세 조회 + 표시

### F4. PremiumReport PDF 출력
- 현재 alert 만 표시, 미구현
- html2canvas + jsPDF 활용 (FIT 의 AfterNote 패턴 참고)

### F5. 3WAY 코스 분기 로직
- Q1, Q2, Q3 결정에 따라 작업 범위 결정
- 코드 위치: [/3way/page.tsx](frontend/user/src/app/3way/page.tsx) 의 페이지 라우팅 + PremiumReport 의 페이지 인덱스

### F6. ConsultingSummary 가 1WAY 에 맞는 데이터인가
- ConsultingSummary 는 customerData / imagePreferenceData / fashionPreferenceData 표시
- 1WAY 결정 후 단순화 또는 그대로 유지

### F7. 1WAY 저장 시 코스명 default fallback
- [/3way/page.tsx:138](frontend/user/src/app/3way/page.tsx#L138) default 가 '1WAY' 라 안전망 X
- 알 수 없는 코스는 빈 문자열 또는 에러 처리

### F8. 1WAY 헤더 코스 라벨
- 컨설팅 진행 중 사용자/디자이너가 현재 코스 인지할 수 있는 표시 없음

---

## 🟢 점진적 확장

### E1. 사용되지 않는 분석 모듈 매핑 (FaceAnalysisResult UI 확장)
- 현재 UI 표에 매핑된 모듈: WNC 7개, SNH 7개 = 14개
- Python 응답에는 WNC 10 + SNH 12 = 22개
- 미매핑: WNC #3, #7, #10 / SNH #4, #6, #7, #10, #12 → UI 확장 또는 의도적 숨김 결정

### E2. 1WAY E2E 테스트
- 현재 `e2e/` 에 1WAY 전용 시나리오 없음
- 코스 선택 → 끝까지 진행 → 저장 검증 시나리오 작성

### E3. 기능 플래그 실시간 반영
- 현재 user 프론트는 새로고침 시만 갱신
- WebSocket / SSE / polling 중 결정

### E4. S3 lifecycle 정책
- 얼굴 이미지 영구 보존 중. 개인정보 측면 30/90/365 일 정책 검토

### E5. 자동 마이그레이션 도구
- 현재 `backend/migrations/*.sql` 수동. typeorm-migrations 또는 별도 CI 단계 추가 검토

---

## 🚀 운영 배포 체크리스트

backend / frontend / Python 서버 변경분 운영 배포 시 매번 확인.

### 사전 (코드 push 전)
- [ ] DB 마이그레이션 필요한가? → [backend/migrations/](backend/migrations/) 확인
- [ ] 필요하면 운영 DB 에 SQL 수동 실행
- [ ] 새 환경변수 추가? → EB Configuration 에 추가
- [ ] face_landmark Python 서버 변경? → 별도 배포 필요

### Push (자동 배포 트리거)
- [ ] `git push origin main`
- [ ] GitHub Actions backend deploy 성공 확인 ([Actions](https://github.com/anotherDevOtter/new_momong/actions))
- [ ] Amplify user/admin 빌드 성공 확인 (Amplify 콘솔)

### 검증 (배포 직후)
- [ ] backend `/api/docs` 접근 (새 endpoint 보이는지)
- [ ] user 메인 페이지 로드 OK
- [ ] admin 로그인 + 페이지 로드 OK
- [ ] 3WAY 끝까지 한 번 진행 (얼굴 분석 포함)
- [ ] DB 행 정상 INSERT 확인:
  ```sql
  SELECT count(*) FROM face_analysis_results;  -- 새 2건
  SELECT client_info->'threeWay'->'faceAnalysis' FROM consultations ORDER BY created_at DESC LIMIT 1;
  ```

### 롤백 (문제 발생 시)
- 코드: `git revert <commit>` + `git push` → 다시 자동 배포
- DB: 신규 테이블/컬럼은 DROP/ALTER 로 복구 (데이터 0건이면 즉시)
- EB: 콘솔에서 이전 application version 으로 즉시 rollback 가능
