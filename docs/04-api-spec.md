# FIT 헤어컨설팅 - API 명세 (NestJS 백엔드)

## 기본 정보

- **Base URL**: `http://localhost:3001/api` (개발) / `https://api.merci-momong.com/api` (프로덕션)
- **Content-Type**: `application/json`
- **인증**: 추후 JWT Bearer Token (현재 MVP에서는 미적용)

---

## 공통 응답 형식

### 성공 응답

```json
{
  "success": true,
  "data": { ... }
}
```

### 에러 응답

```json
{
  "success": false,
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request"
}
```

---

## Customers API

### GET /customers

전체 고객 목록 조회

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| q | string | 검색어 (이름 또는 전화번호, ilike) |
| page | number | 페이지 번호 (기본값: 1) |
| limit | number | 페이지당 항목 수 (기본값: 20) |

**응답 예시**

```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "uuid-1234",
        "name": "홍길동",
        "phone": "010-1234-5678",
        "gender": "male",
        "age_group": "20-30대",
        "memo": "",
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

### GET /customers/:id

특정 고객 조회

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| id | UUID | 고객 ID |

**응답**: 단일 Customer 객체

---

### GET /customers/search

이름 또는 전화번호로 고객 검색

**Query Parameters**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| q | string | ✅ | 검색어 |

**응답**: Customer 배열

---

### POST /customers

고객 등록

**Request Body**

```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "gender": "male",
  "age_group": "20-30대",
  "memo": ""
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | ✅ | 고객명 |
| phone | string | | 연락처 |
| gender | 'female' \| 'male' | | 성별 |
| age_group | string | | 연령대 |
| memo | string | | 메모 |

**응답**: 생성된 Customer 객체 (201)

---

### PATCH /customers/:id

고객 정보 수정

**Request Body**: Customer 필드 중 수정할 항목 (부분 업데이트)

**응답**: 수정된 Customer 객체

---

### DELETE /customers/:id

고객 삭제

**응답**

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## Consultations API

### POST /consultations

컨설팅 저장 (컨설팅 완료 시 호출)

**Request Body**: 전체 ConsultationData

```json
{
  "clientInfo": {
    "name": "홍길동",
    "phone": "010-1234-5678",
    "ageGroup": "20-30대",
    "gender": "male"
  },
  "todayKeyword": {
    "faceConcerns": ["광대", "턱선"],
    "faceConcernsMemo": "",
    "hairConcerns": ["정수리 볼륨"],
    "hairConcernsMemo": "",
    "imageKeywords": ["시크/세련된"]
  },
  "fashionStyle": {
    "selected": ["캐주얼", "모던"]
  },
  "faceImageType": {
    "type": "cool",
    "features": {
      "face": "각진",
      "eyebrows": "각진 올라간",
      "eyes": "직선 올라간 눈",
      "nose": "뾰족한 코",
      "lips": "얇은"
    }
  },
  "hairCondition": {
    "damageLevel": "약손상",
    "hairType": ["직모"],
    "thickness": "보통",
    "density": "보통",
    "curl": "직모"
  },
  "hairStyleProposal": {
    "length": "미디움",
    "referenceImage": ""
  },
  "todayDesign": {
    "length": ["미디움"],
    "lengthMemo": "",
    "bangs": ["없음"],
    "bangsMemo": "",
    "curlTexture": ["C컬"],
    "curlTextureMemo": "자연스러운 C컬",
    "color": ["현재 상태 유지"],
    "colorMemo": ""
  },
  "nextDirection": {
    "lengthChange": [],
    "colorChange": ["톤업"],
    "others": []
  },
  "designCycleGuide": {
    "selectedMonths": []
  },
  "designerName": "김디자이너",
  "visitDate": "2024. 1. 15.",
  "afterNote": "오늘 C컬 펌 진행. 고객 만족도 높음."
}
```

**서버 처리 로직**:
1. consultations 테이블에 INSERT
2. phone으로 customers 테이블 upsert (있으면 UPDATE, 없으면 INSERT)
3. consultation.customer_id 연결

**응답** (201)

```json
{
  "success": true,
  "data": {
    "id": "consult_1705312800000_abc123",
    "createdAt": "2024-01-15T10:30:00Z",
    "consultation": { ...전체 데이터 }
  }
}
```

---

### GET /consultations

전체 컨설팅 목록 조회 (최신순)

**Query Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| page | number | 페이지 (기본값: 1) |
| limit | number | 개수 (기본값: 20) |

**응답**: ConsultationRecord 배열

---

### GET /consultations/:id

단일 컨설팅 조회

**응답**: ConsultationRecord 객체

---

### GET /consultations/by-customer/:phone

특정 고객의 컨설팅 이력 조회 (전화번호 기준)

**Path Parameters**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| phone | string | 전화번호 (URL 인코딩 필요) |

**응답**: ConsultationRecord 배열 (최신순)

---

### GET /consultations/by-customer-id/:customerId

특정 고객의 컨설팅 이력 조회 (UUID 기준)

**응답**: ConsultationRecord 배열 (최신순)

---

### DELETE /consultations/:id

컨설팅 삭제

**응답**

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## NestJS 모듈 구조

```
backend/src/
├── app.module.ts
├── main.ts
├── customers/
│   ├── customers.module.ts
│   ├── customers.controller.ts
│   ├── customers.service.ts
│   ├── customers.entity.ts
│   └── dto/
│       ├── create-customer.dto.ts
│       └── update-customer.dto.ts
├── consultations/
│   ├── consultations.module.ts
│   ├── consultations.controller.ts
│   ├── consultations.service.ts
│   ├── consultations.entity.ts
│   └── dto/
│       └── create-consultation.dto.ts
└── common/
    ├── filters/
    │   └── http-exception.filter.ts
    └── interceptors/
        └── response.interceptor.ts
```

---

## 환경변수 (.env)

```env
# 서버
PORT=3001
NODE_ENV=development

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/fit_hair

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://merci-momong.com
```

---

## API 우선순위 (개발 순서)

| 우선순위 | API | 이유 |
|---------|-----|------|
| 1 | POST /consultations | 컨설팅 저장 (핵심 기능) |
| 2 | GET /customers | 고객 목록 조회 |
| 3 | GET /consultations/by-customer/:phone | 방문 이력 조회 |
| 4 | POST /customers | 고객 직접 등록 |
| 5 | GET /consultations/:id | 단일 컨설팅 조회 |
| 6 | PATCH /customers/:id | 고객 정보 수정 |
| 7 | DELETE /consultations/:id | 컨설팅 삭제 |
| 8 | DELETE /customers/:id | 고객 삭제 |
