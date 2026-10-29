export interface ClientInfo {
  name: string;
  phone: string;
  ageGroup: string;
  gender: 'female' | 'male' | '';
}

export interface TodayKeyword {
  faceConcerns: string[];
  faceConcernsMemo: string;
  hairConcerns: string[];
  hairConcernsMemo: string;
  imageKeywords: string[];
}

export interface FashionStyle {
  selected: string[];
}

export interface FaceImageType {
  type: 'warm' | 'neutral' | 'cool' | '';
  features: {
    face: string;
    eyebrows: string;
    eyes: string;
    nose: string;
    lips: string;
  };
}

export interface HairCondition {
  damageLevel: string;
  hairType: string[];
  thickness: string;
  density: string;
  curl: string;
}

export interface HairStyleProposal {
  length: string;
  referenceImage: string;
  /** ↓ FIT-NEW 기록에만 있다 (2026-10-28). 고객 상세에서 다시 열 때 /fit-new 로 보내는 표식 */
  flow?: 'fit-new';
  /** 스타일 제안 5개 축 — 옵션 id 배열 (new 코스 HairConsulting 과 같은 꼴) */
  style?: Record<'bangs' | 'parting' | 'length' | 'curl' | 'color', string[]>;
  /** 모질 4개 축 옵션 id. 한글 값은 hairCondition 에 따로 채운다 (기존 화면 호환) */
  conditionIds?: Record<string, string | null>;
}

export interface TodayDesign {
  length: string[];
  lengthMemo: string;
  bangs: string[];
  bangsMemo: string;
  curlTexture: string[];
  curlTextureMemo: string;
  color: string[];
  colorMemo: string;
}

export interface NextDirection {
  lengthChange: string[];
  colorChange: string[];
  others: string[];
}

export interface CycleMonth {
  month: string;
  services: string[];
  memo: string;
}

/** FIT-NEW 6개월 관리 플랜 — 오늘의 시술에서 자동 계산 (new 코스 NextDirection 과 같은 계산) */
export interface SixMonthCycle {
  todayServices: string[];
  todayDetails: Record<string, string[]>;
  gender: 'female' | 'male';
  nextCare: { minWeeks: number; maxWeeks: number; services: string[] } | null;
  nextDesign: { minWeeks: number; maxWeeks: number; services: string[] } | null;
  cycleEvents: {
    offsetWeeks: number;
    label: string;
    monthHint: string;
    type: 'CARE' | 'DESIGN' | 'REVIEW';
    services: string[];
    purpose: string;
    note: string;
  }[];
}

export interface DesignCycleGuide {
  /** FIT-NEW 에서는 cycle 에서 만들어 채운다 — 공유 링크·고객 상세가 이 값을 읽는다 */
  selectedMonths: CycleMonth[];
  cycle?: SixMonthCycle;
}

export interface ConsultationData {
  id?: string;
  customerId?: string;
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

export interface ConsultationRecord extends ConsultationData {
  id: string;
  createdAt: string;
}
