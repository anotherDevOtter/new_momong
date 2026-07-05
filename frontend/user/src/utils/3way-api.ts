import {
  getAllCustomers,
  getConsultationsByCustomerPhone,
  saveConsultation,
} from './api';
import type { ConsultationData, ConsultationRecord, Customer } from '@/types';

// 3way 컴포넌트가 기대하는 데이터 형태
export interface ThreeWayCustomerRecord {
  name: string;
  phone: string;
  lastVisit: string;
  course: string;
  imageType?: string;
  designerName?: string;
}

export interface ThreeWayConsultRecord {
  date: string;
  course: string;
  imageType?: string;
  colorType?: string;
  design?: string;
  notes?: string;
  customerName: string;
  phone: string;
  designerName?: string;
  cycleData?: unknown;
}

function getToken(): string {
  if (typeof window === 'undefined') throw new Error('localStorage unavailable');
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('인증이 필요합니다');
  return token;
}

function pickCourse(record: ConsultationRecord): string {
  const meta = (record.clientInfo as unknown as { course?: string })?.course;
  return meta || '3WAY';
}

function pickImageType(record: ConsultationRecord): string | undefined {
  return record.faceImageType?.type || undefined;
}

function toCustomerRecord(
  customer: Customer,
  latestConsult?: ConsultationRecord,
): ThreeWayCustomerRecord {
  return {
    name: customer.name,
    phone: customer.phone,
    lastVisit: latestConsult?.visitDate || '-',
    course: latestConsult ? pickCourse(latestConsult) : '-',
    imageType: latestConsult ? pickImageType(latestConsult) : undefined,
    designerName: latestConsult?.designerName,
  };
}

function toConsultRecord(record: ConsultationRecord): ThreeWayConsultRecord {
  return {
    date: record.visitDate,
    course: pickCourse(record),
    imageType: pickImageType(record),
    colorType: undefined,
    design: undefined,
    notes: record.afterNote || undefined,
    customerName: record.clientInfo.name,
    phone: record.clientInfo.phone,
    designerName: record.designerName,
    cycleData: record.designCycleGuide,
  };
}

export async function getCustomers(): Promise<{ customers: ThreeWayCustomerRecord[] }> {
  const token = getToken();
  const list = await getAllCustomers(token);
  return { customers: list.map((c) => toCustomerRecord(c)) };
}

export async function searchCustomers(query: string): Promise<{ customers: ThreeWayCustomerRecord[] }> {
  const token = getToken();
  const list = await getAllCustomers(token, query);
  return { customers: list.map((c) => toCustomerRecord(c)) };
}

export async function getConsults(phone: string): Promise<{ consults: ThreeWayConsultRecord[] }> {
  const token = getToken();
  const records = await getConsultationsByCustomerPhone(token, phone);
  const sorted = [...records].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return tb - ta;
  });
  return { consults: sorted.map(toConsultRecord) };
}

export interface SaveConsultPayload {
  customerId?: string;
  phone: string;
  name: string;
  course: string;
  designerName?: string;
  ageGroup?: string;
  gender?: 'female' | 'male' | '여자' | '남자' | '';
  occupation?: string;
  consultData?: Record<string, unknown>;
}

// 3WAY 의 "여자/남자" → DB 호환 "female/male" 로 정규화
function normalizeGender(g?: string): 'female' | 'male' | '' {
  if (g === 'female' || g === 'male') return g;
  if (g === '여자') return 'female';
  if (g === '남자') return 'male';
  return '';
}

export async function saveConsult(payload: SaveConsultPayload): Promise<{ success: true; id: string }> {
  const token = getToken();

  const data: ConsultationData = {
    ...(payload.customerId ? { customerId: payload.customerId } : {}),
    clientInfo: {
      name: payload.name,
      phone: payload.phone,
      ageGroup: payload.ageGroup || '',
      gender: normalizeGender(payload.gender),
      // 추가 메타는 jsonb 라 자유롭게 — course, occupation 함께 보존
      ...(payload.course ? { course: payload.course } : {}),
      ...(payload.occupation ? { occupation: payload.occupation } : {}),
      // 3way 전체 페이로드는 clientInfo(jsonb) 안에 보존.
      // ⚠️ 최상위에 두면 백엔드 ValidationPipe(whitelist:true)가 잘라버림 → client_info.threeWay 로 저장.
      ...(payload.consultData ? { threeWay: payload.consultData } : {}),
    } as ConsultationData['clientInfo'],
    todayKeyword: { faceConcerns: [], faceConcernsMemo: '', hairConcerns: [], hairConcernsMemo: '', imageKeywords: [] },
    fashionStyle: { selected: [] },
    faceImageType: { type: '', features: { face: '', eyebrows: '', eyes: '', nose: '', lips: '' } },
    hairCondition: { damageLevel: '', hairType: [], thickness: '', density: '', curl: '' },
    hairStyleProposal: { length: '', referenceImage: '' },
    todayDesign: { length: [], lengthMemo: '', bangs: [], bangsMemo: '', curlTexture: [], curlTextureMemo: '', color: [], colorMemo: '' },
    nextDirection: { lengthChange: [], colorChange: [], others: [] },
    designCycleGuide: { selectedMonths: [] },
    designerName: payload.designerName || '',
    visitDate: new Date().toLocaleDateString('ko-KR'),
    afterNote: '',
  };

  const saved = await saveConsultation(token, data);
  return { success: true, id: saved.id };
}
