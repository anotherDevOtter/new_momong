import { apiFetch } from './api-error';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface PreSurveyAnswers {
  age?: string;
  job?: string;
  preferences?: string[];
  dislikes?: string[];
  bodyConcerns?: string[];
  otherBodyConcern?: string;
  faceConcerns?: string[];
  otherFaceConcern?: string;
  hairConcerns?: string[];
  otherHairConcern?: string;
  treatmentPreference?: string;
  selectedProgram?: string;
  hasBodyAnalysis?: boolean;
  facePhotos?: string[];
  preferredHairPhotos?: string[];
  dislikedHairPhotos?: string[];
  bodyPhotos?: string[];
}

export interface PreSurveyRecord {
  id: string;
  customer_id: string;
  token: string;
  answers: PreSurveyAnswers;
  filled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const createPreSurvey = async (token: string, customerId: string): Promise<PreSurveyRecord> => {
  const json = await apiFetch<ApiResponse<PreSurveyRecord>>(`${API_BASE}/pre-surveys`, {
    method: 'POST',
    token,
    body: JSON.stringify({ customerId }),
  });
  return json.data;
};

export const listPreSurveysByCustomer = async (token: string, customerId: string): Promise<PreSurveyRecord[]> => {
  const json = await apiFetch<ApiResponse<PreSurveyRecord[]>>(
    `${API_BASE}/pre-surveys/by-customer/${customerId}`,
    { token },
  );
  return json.data;
};

export interface PreSurveyPublicView {
  token: string;
  answers: PreSurveyAnswers;
  filled_at: string | null;
  customer: { name: string };
}

export const fetchPreSurveyByToken = async (surveyToken: string): Promise<PreSurveyPublicView> => {
  const json = await apiFetch<ApiResponse<PreSurveyPublicView>>(
    `${API_BASE}/pre-surveys/token/${surveyToken}`,
  );
  return json.data;
};

export const savePreSurveyAnswers = async (
  surveyToken: string,
  answers: PreSurveyAnswers,
  submit = false,
): Promise<{ filled_at: string | null }> => {
  const json = await apiFetch<ApiResponse<{ filled_at: string | null }>>(
    `${API_BASE}/pre-surveys/token/${surveyToken}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ answers, submit }),
    },
  );
  return json.data;
};

export const buildPreSurveyUrl = (surveyToken: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/pre-survey/${surveyToken}`;
};

interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export const createPreSurveyUploadUrl = async (
  surveyToken: string,
  contentType: string,
  contentLength: number,
): Promise<UploadUrlResponse> => {
  const json = await apiFetch<ApiResponse<UploadUrlResponse>>(
    `${API_BASE}/pre-surveys/token/${surveyToken}/upload-url`,
    {
      method: 'POST',
      body: JSON.stringify({ contentType, contentLength }),
    },
  );
  return json.data;
};

export const uploadPreSurveyPhoto = async (surveyToken: string, file: File): Promise<string> => {
  const { uploadUrl, publicUrl } = await createPreSurveyUploadUrl(surveyToken, file.type, file.size);
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다');
  return publicUrl;
};
