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
  phone: string;
  name: string;
  course: string;
  designerName?: string;
  consultData?: Record<string, unknown>;
}

export async function saveConsult(payload: SaveConsultPayload): Promise<{ success: true; id: string }> {
  const token = getToken();

  const data: ConsultationData = {
    clientInfo: {
      name: payload.name,
      phone: payload.phone,
      ageGroup: '',
      gender: '',
      // course를 clientInfo jsonb 안에 함께 저장 (entity 변경 없이 보존)
      ...(payload.course ? { course: payload.course } : {}),
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
    // 3way 전체 페이로드를 별도 키에 보존
    ...(payload.consultData ? ({ threeWay: payload.consultData } as unknown as Partial<ConsultationData>) : {}),
  };

  const saved = await saveConsultation(token, data);
  return { success: true, id: saved.id };
}
