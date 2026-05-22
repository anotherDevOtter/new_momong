# 1WAY 컨설팅 — 작업 TODO

> 3WAY 시스템 안의 **1WAY 코스** 가 빠진 게 없는지/정상 동작하는지 점검 결과.

---

## 현재 1WAY 흐름

코스 선택에서 1WAY 선택 시 거치는 화면(13개):

```
1. 코스 선택  →  2. 고객 정보  →  3. 사전 인터뷰
→ 4. 이미지 선호도  →  5. 패션 선호도  →  6. 컨설팅 요약
→ 7. 얼굴 분석 촬영  →  8. 진행  →  9. 결과
→ 10. 이미지 방향 설정  →  11. 헤어디자인 제안
→ 12. 모질 분석  →  13. Next Direction
→ Premium Report (모달)  →  완료
```

> 코스 카드 설명은 **"얼굴 정밀 분석 기반 헤어컨설팅"** 인데 실제로는 사전 인터뷰/이미지/패션 선호도/모질 등 다른 코스와 거의 동일한 흐름을 거침. 의도된 동작인지 확인 필요.

---

## ☑️ 해야 할 일

### 1. PremiumReport 가 1WAY 일 때 퍼스널컬러 페이지를 빼야 함
- [PremiumReport.tsx](frontend/user/src/components/3way/PremiumReport.tsx) 가 `selectedCourse` prop 을 **받기만 하고 사용 안 함** (line 13, 23)
- 1WAY 선택해도 9페이지 모두 노출 — page 3 의 **PersonalColorPage** 가 들어감
- **할 일**: `selectedCourse === '1way'` 일 때 PersonalColorPage 제외하고 페이지 인덱스 재계산

### 2. 1WAY 일 때도 모질 분석/이미지 방향 설정이 필요한가 결정
- 1WAY = "얼굴 정밀 분석 기반" 인데 모질 분석(HairTextureAnalysis), 이미지 방향 설정(ImageDirectionSetting) 등이 같이 들어가 있음
- 두 가지 옵션:
  - (A) 1WAY 는 진짜 얼굴 분석만 → ImageDirection/HairDesign/HairTexture/NextDirection 모두 스킵하고 바로 Report 로
  - (B) 모든 코스에서 헤어 디자인 제안까지가 핵심 → 1WAY 코스 카드 설명 수정 ("얼굴 분석 중심")
- **할 일**: 어느 쪽이 비즈니스 의도인지 결정 → 흐름 또는 마케팅 문구 정정

### 3. 1WAY 저장 시 코스명 라벨 정리
- [/3way/page.tsx:138](frontend/user/src/app/3way/page.tsx#L138) 에서:
  ```js
  const courseName = selectedCourse === '3way' ? '3WAY'
    : selectedCourse === '2way-personal' ? '2WAY (Personal Color)'
    : selectedCourse === '2way-skeleton' ? '2WAY (Skeleton Image)'
    : '1WAY';  // default fallback 이 1WAY 라 안전망 X
  ```
- **할 일**: default 가 1WAY 가 아니라 알 수 없으면 빈 문자열 또는 에러 처리. 1WAY 는 명시적으로 처리

### 4. ConsultingSummary 가 1WAY 에 맞는 데이터를 보여주는지 확인
- ConsultingSummary 는 customerData / imagePreferenceData / fashionPreferenceData 를 받음
- 1WAY 흐름에서도 이미지 선호도 / 패션 선호도 단계를 거치므로 데이터는 있음
- 그러나 1WAY 컨셉상 의미 있는지 검토 — "얼굴 분석 위주" 라면 요약 화면도 단순화 가능

### 5. 얼굴 분석 결과 데이터가 저장되지 않음
- [/3way/page.tsx:142](frontend/user/src/app/3way/page.tsx#L142) saveConsult 호출:
  ```js
  imageType: 'Soft Natural',     // ← 더미
  colorType: 'Warm Light',       // ← 더미
  design: 'Long Layered C Curl', // ← 더미
  ```
- 1WAY 의 핵심이 얼굴 분석인데 그 결과가 DB 에 저장 안 됨 (고정 더미값)
- **할 일**: FaceAnalysisResult 컴포넌트의 사용자가 선택한 값을 state 로 끌어올려 saveConsult 에 전달

### 6. 1WAY 전용 "코스 표시" 가 필요한가 검토
- 컨설팅 진행 중 사용자/디자이너가 "지금 1WAY 진행 중" 임을 알 수 있는 표시 없음
- ProgressSteps 의 단계명 외엔 코스 라벨이 헤더에 없음
- **할 일**: 상단 헤더에 "1WAY 헤어컨설팅" 라벨 추가 검토

### 7. 1WAY 의 PremiumReport 안 페이지 수 / 라벨 정리
- 현재 모든 코스 동일 9페이지 구조 (PersonalColor 페이지 포함)
- 1WAY 면 페이지 수가 줄어듦 → 페이지 번호 라벨, 진행 점 등 모두 동적으로 재계산해야 함
- **할 일**: PremiumReport 안의 페이지 개수/번호/네비 점도 selectedCourse 기반으로 동적 계산

### 8. 1WAY 흐름의 E2E 테스트 추가
- 현재 e2e 폴더에는 1WAY 전용 시나리오 없을 가능성 큼
- 1WAY 코스 선택 → 끝까지 진행 → 저장 확인 시나리오 작성

### 9. 얼굴 정밀 분석 결과 - 비율 데이터 (상중하 / 얼굴비율 / 중안부) Python 서버 연동
- [FaceAnalysisResult.tsx:105-109](frontend/user/src/components/3way/FaceAnalysisResult.tsx#L105-L109) 의 `ratios` state 가 하드코딩 (`1:1:1`, `1:1.4`, `1:2`)
- Python 서버 (`face_landmark/analyze_face.py`) 는 현재 WNC/SNH 모듈의 `grade` 만 반환하고 비율 raw 값은 응답에 없음
- 관련 모듈은 이미 존재:
  - `SNH_TYPE_02_face_length.py` — `ratio = face_height / face_width` 계산함 (얼굴비율)
  - `SNH_TYPE_11_midface_ratio.py` — `left_cheek_ratio` 반환 (중안부)
  - 상중하는 새로 계산 필요 (MediaPipe 랜드마크 10→9→2→152)
- **할 일**:
  1. `face_landmark/analyze_face.py` 에 `compute_face_ratios()` 메서드 추가 → `data.ratios` 필드 생성
     ```json
     "ratios": { "vertical": "1:0.95:1.05", "face": "1:1.4", "midSection": "1:2.0" }
     ```
  2. `backend/src/face-analysis/python-analysis.service.ts` `PythonAnalysisResponse` 타입에 `ratios` 추가
  3. `backend/src/face-analysis/face-analysis.service.ts` 반환값에 `ratios` 통과
  4. `frontend/user/src/utils/face-analysis-api.ts` `AnalyzeResponse` 타입에 `ratios` 추가
  5. `frontend/user/src/components/3way/FaceAnalysisResult.tsx` useState 초기값을 `analysisResult.ratios` 로 세팅 (없으면 현재 하드코딩 fallback 유지)
- **결정 필요**: 상중하 계산 기준점 (이마 top 10 → 눈썹 9 → 코 아래 2 → 턱 152 로 진행할지)

---

## 🔎 결정해야 할 비즈니스 질문

1. **1WAY 가 정말 "얼굴 분석만" 인가, 아니면 "퍼스널컬러/골격이 빠진 풀 컨설팅" 인가?**
   - 전자라면: 코스 선택 후 4단계 안에 끝나야 함 (고객정보 → 얼굴분석 → 결과 → 완료)
   - 후자라면: 현재처럼 13단계 모두 거치되 PremiumReport 에서 퍼스널컬러/골격 페이지만 빠짐

2. **1WAY 의 가격/가치 제안은?**
   - 다른 코스보다 저렴/짧은 코스 → UX 도 그에 맞게 짧게
   - 같은 컨설팅에 분석 하나만 차이 → 현재 흐름이 적절

3. **1WAY 사용자에게 "더 정밀한 분석 원하면 3WAY 로 업그레이드" 같은 안내가 필요한가?**
   - 컨설팅 끝에 다른 코스 안내 표시 여부

---

## 📌 추천 처리 순서

가장 작은 것부터:

1. **#1 PremiumReport 에서 1WAY 일 때 퍼스널컬러 페이지 제외** (단순 조건문)
2. **#5 얼굴 분석 결과 데이터 저장** (1WAY 핵심)
3. **#3 코스명 default fallback 정리** (안전망)
4. **비즈니스 결정** (#1번 질문) → 결과에 따라 #2, #4, #6, #7 처리
5. **#8 E2E 테스트**

---

## 🚀 운영 배포 전 체크리스트 (Elastic Beanstalk)

### EB 콘솔 → Configuration → Software → Environment properties 에 추가/확인

face_landmark 연동을 운영에서 동작시키려면 아래 환경변수가 EB 환경에 설정되어 있어야 함:

| Key | 값 (예시) | 비고 |
|---|---|---|
| `PYTHON_SERVER_URL` | `https://face-landmark-xxx.elasticbeanstalk.com` | face_landmark EB 환경의 URL |
| `AWS_REGION` | `ap-northeast-2` | 이미 설정되어 있을 가능성 큼 |
| `AWS_S3_BUCKET` | `momong-staging` | 운영은 staging 버킷 사용 (로컬은 momong-dev) |
| `AWS_PRESIGNED_EXPIRES_IN` | `300` | (선택) presigned URL 만료 초 |

### 인증 방식 (둘 중 하나)

(A) **IAM Instance Profile 사용 (권장)**
- EB 환경 → Configuration → Security → IAM instance profile 에 S3 권한 가진 role 부여
- `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` 환경변수 **불필요**
- SDK 가 자동으로 인스턴스 메타데이터에서 credentials 가져옴

(B) **환경변수로 키 직접 주입**
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` 추가 (momong_backend 환경의 키 그대로 가능)
- 보안상 (A) 권장

### momong-staging 버킷 CORS 확인

운영 user 프론트(`https://*.merci-momong.com`) 가 직접 S3 PUT 하려면 기존 CORS 에 해당 origin 이 있어야 함. 현재 CORS:
```
AllowedOrigins: ['http://localhost:3002', 'https://*.merci-momong.com']
AllowedMethods: ['PUT', 'POST', 'GET', 'HEAD']
```
→ `*.merci-momong.com` 이미 포함되어 있어 운영에서는 추가 작업 불필요.

### 기타

- `image_detection_results` 테이블이 운영 DB 에도 생성되어야 함 — TypeORM `synchronize:true` 가 dev 만이라 운영은 **수동 마이그레이션 필요** (`CREATE TABLE image_detection_results …`)
- 운영용 `JWT_SECRET`, `ADMIN_SEED_*` 등도 EB 환경에 적절히 설정됐는지 확인
