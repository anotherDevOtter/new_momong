# FIT 헤어컨설팅 - 데이터 모델

## 개요

데이터는 크게 2가지 엔티티로 구성됩니다.

1. **Customer** - 고객 기본 정보 (반영구 보관)
2. **Consultation** - 컨설팅 기록 (방문마다 새로 생성)

---

## ERD

```
┌─────────────────────┐         ┌──────────────────────────────┐
│      customers      │         │        consultations          │
├─────────────────────┤         ├──────────────────────────────┤
│ id (PK, UUID)       │◄────────│ id (PK)                      │
│ name                │  1 : N  │ customer_id (FK, nullable)   │
│ phone (unique)      │         │ created_at                   │
│ gender              │         │ visit_date                   │
│ age_group           │         │ designer_name                │
│ memo                │         │ after_note                   │
│ created_at          │         │ client_info (JSON)           │
│ updated_at          │         │ today_keyword (JSON)         │
└─────────────────────┘         │ fashion_style (JSON)         │
                                 │ face_image_type (JSON)       │
                                 │ hair_condition (JSON)        │
                                 │ hair_style_proposal (JSON)   │
                                 │ today_design (JSON)          │
                                 │ next_direction (JSON)        │
                                 │ design_cycle_guide (JSON)    │
                                 └──────────────────────────────┘
```

---

## 테이블 정의

### customers

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, DEFAULT gen_random_uuid() | 고객 고유 ID |
| name | VARCHAR(100) | NOT NULL | 고객명 |
| phone | VARCHAR(20) | UNIQUE | 연락처 (중복 방지) |
| gender | VARCHAR(10) | CHECK (female, male) | 성별 |
| age_group | VARCHAR(20) | | 연령대 (20-30대, 40대, 50대, 60대 이상) |
| memo | TEXT | | 디자이너 메모 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 최초 등록일 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | 최종 수정일 |

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  gender VARCHAR(10) CHECK (gender IN ('female', 'male')),
  age_group VARCHAR(20),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
```

---

### consultations

컨설팅의 각 섹션 데이터는 JSONB로 저장하여 스키마 변경 없이 유연하게 확장할 수 있습니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | VARCHAR(50) | PK | 컨설팅 ID (consult_{timestamp}_{random}) |
| customer_id | UUID | FK → customers.id, NULL 허용 | 고객 참조 |
| visit_date | VARCHAR(20) | NOT NULL | 방문일 (ko-KR 형식: 2024. 1. 1.) |
| designer_name | VARCHAR(100) | | 담당 디자이너명 |
| after_note | TEXT | | 디자이너 메모 |
| client_info | JSONB | NOT NULL | 고객 기본 정보 |
| today_keyword | JSONB | | 오늘의 키워드 |
| fashion_style | JSONB | | 패션 스타일 |
| face_image_type | JSONB | | 얼굴 이미지 타입 분석 |
| hair_condition | JSONB | | 모발 상태 |
| hair_style_proposal | JSONB | | 헤어스타일 제안 |
| today_design | JSONB | | 오늘의 디자인 |
| next_direction | JSONB | | 다음 디자인 방향 |
| design_cycle_guide | JSONB | | 디자인 사이클 가이드 |
| created_at | TIMESTAMPTZ | DEFAULT now() | 생성일시 |

```sql
CREATE TABLE consultations (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  visit_date VARCHAR(20) NOT NULL,
  designer_name VARCHAR(100),
  after_note TEXT,
  client_info JSONB NOT NULL,
  today_keyword JSONB DEFAULT '{}',
  fashion_style JSONB DEFAULT '{}',
  face_image_type JSONB DEFAULT '{}',
  hair_condition JSONB DEFAULT '{}',
  hair_style_proposal JSONB DEFAULT '{}',
  today_design JSONB DEFAULT '{}',
  next_direction JSONB DEFAULT '{}',
  design_cycle_guide JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_consultations_customer_id ON consultations(customer_id);
CREATE INDEX idx_consultations_created_at ON consultations(created_at DESC);
```

---

## TypeScript 타입 정의

### Customer

```typescript
export interface Customer {
  id: string;
  name: string;
  phone: string;
  gender: 'female' | 'male';
  age_group: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}
```

### ConsultationData (JSONB 필드 내 구조)

```typescript
// 고객 기본 정보
export interface ClientInfo {
  name: string;
  phone: string;
  ageGroup: string;                   // '20-30대' | '40대' | '50대' | '60대 이상'
  gender: 'female' | 'male' | '';
}

// 오늘의 키워드
export interface TodayKeyword {
  faceConcerns: string[];             // 얼굴 보완 부위 (복수)
  faceConcernsMemo: string;           // 기타 입력
  hairConcerns: string[];             // 헤어 고민 (복수)
  hairConcernsMemo: string;           // 기타 입력
  imageKeywords: string[];            // 선호 이미지 키워드 (복수)
}

// 패션 스타일
export interface FashionStyle {
  selected: string[];                 // 선택된 스타일 키워드 (복수)
}

// 얼굴 이미지 타입
export interface FaceImageType {
  type: 'warm' | 'neutral' | 'cool' | '';
  features: {
    face: string;                     // '둥근' | '중간' | '각진'
    eyebrows: string;                 // '둥근 내려간' | '중간' | '각진 올라간'
    eyes: string;                     // '둥근 내려간 눈' | '중간' | '직선 올라간 눈'
    nose: string;                     // '둥근 코' | '중간' | '뾰족한 코'
    lips: string;                     // '도톰' | '중간' | '얇은'
  };
}

// 모발 상태
export interface HairCondition {
  damageLevel: string;                // '건강' | '약손상' | '중손상' | '강손상' | '극손상' | '초극손상'
  hairType: string[];                 // 모질 타입 (복수)
  thickness: string;                  // '가는편' | '보통' | '굵은편'
  density: string;                    // '적음' | '보통' | '많음'
  curl: string;                       // '직모' | '약웨이브' | '강웨이브'
}

// 헤어스타일 제안
export interface HairStyleProposal {
  length: string;
  referenceImage: string;
}

// 오늘의 디자인
export interface TodayDesign {
  length: string[];                   // '숏' | '단발' | '미디움' | '롱'
  lengthMemo: string;
  bangs: string[];                    // '없음' | '시스루' | '풀뱅' | '사이드뱅' | '스틱뱅' | '처피뱅' | '남자'
  bangsMemo: string;
  curlTexture: string[];              // '스트레이트' | 'C컬' | 'S컬' | 'CS컬' | '웨이브'
  curlTextureMemo: string;
  color: string[];                    // '톤다운' | '톤업' | '뿌리' | '탈색' | '현재 상태 유지'
  colorMemo: string;
}

// 다음 디자인 방향
export interface NextDirection {
  lengthChange: string[];             // '롱' | '미디움' | '단발' | '숏'
  colorChange: string[];              // '톤업' | '톤다운' | '탈색' | '특수컬러'
  others: string[];                   // 앞머리 변경, 펌/볼륨 추가, 손상도 회복, 이미지 변화
}

// 디자인 사이클 가이드
export interface CycleMonth {
  month: string;
  services: string[];
  memo: string;
}

export interface DesignCycleGuide {
  selectedMonths: CycleMonth[];
}

// 전체 컨설팅 데이터
export interface ConsultationData {
  id?: string;
  createdAt?: string;
  clientInfo: ClientInfo;
  todayKeyword: TodayKeyword;
  fashionStyle: FashionStyle;
  faceImageType: FaceImageType;
  hairCondition: HairCondition;
  hairStyleProposal: HairStyleProposal;
  todayDesign: TodayDesign;
  nextDirection: NextDirection;
  designCycleGuide: DesignCycleGuide;
  designerName: string;
  visitDate: string;
  afterNote: string;
}
```

---

## 데이터 저장 전략

### 컨설팅 저장 시

1. `consultations` 테이블에 새 행 삽입
2. `clientInfo.phone`으로 고객 조회
   - 존재하면: `customers` 테이블 UPDATE (이름, 성별, 연령대 갱신)
   - 없으면: `customers` 테이블 INSERT
3. `consultation.customer_id` = 해당 고객의 UUID

### 고객별 컨설팅 조회

- `customer_id` FK로 조인 또는
- `client_info->>'phone'` JSONB 쿼리로 조회 (레거시 호환)

---

## 데이터 관계 예시

```json
// customers 테이블 row
{
  "id": "uuid-1234",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "gender": "male",
  "age_group": "20-30대",
  "memo": "",
  "created_at": "2024-01-15T10:00:00Z"
}

// consultations 테이블 row
{
  "id": "consult_1705312800000_abc123",
  "customer_id": "uuid-1234",
  "visit_date": "2024. 1. 15.",
  "designer_name": "김디자이너",
  "after_note": "오늘 C컬 펌 진행. 고객 만족도 높음.",
  "client_info": { "name": "홍길동", "phone": "010-1234-5678", "gender": "male", "ageGroup": "20-30대" },
  "face_image_type": { "type": "cool", "features": { "face": "각진", "eyebrows": "각진 올라간", ... } },
  "hair_condition": { "damageLevel": "약손상", "hairType": ["직모"], "thickness": "보통", ... },
  "today_design": { "length": ["미디움"], "bangs": ["없음"], "curlTexture": ["C컬"], "color": ["현재 상태 유지"], ... },
  "created_at": "2024-01-15T10:30:00Z"
}
```
