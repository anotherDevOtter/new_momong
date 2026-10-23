import { saveConsultation, updateConsultation } from './api';
import type { ConsultationData } from '@/types';

function getToken(): string {
  if (typeof window === 'undefined') throw new Error('localStorage unavailable');
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('인증이 필요합니다');
  return token;
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

function toConsultationData(payload: SaveConsultPayload): ConsultationData {
  return {
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
}

export async function saveConsult(payload: SaveConsultPayload): Promise<{ success: true; id: string }> {
  const saved = await saveConsultation(getToken(), toConsultationData(payload));
  return { success: true, id: saved.id };
}

/** 이미 저장된 상담(임시저장 포함)을 같은 id 로 덮어쓴다 — 새 기록을 만들지 않는다 */
export async function updateConsult(id: string, payload: SaveConsultPayload): Promise<{ success: true; id: string }> {
  const saved = await updateConsultation(getToken(), id, toConsultationData(payload));
  return { success: true, id: saved.id };
}
