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

export interface DesignCycleGuide {
  selectedMonths: CycleMonth[];
}

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
