import { Customer, ConsultationData, ConsultationRecord } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ──────────────────────────────────────────────
// Customers
// ──────────────────────────────────────────────

export const getAllCustomers = async (token: string, query?: string): Promise<Customer[]> => {
  const url = query
    ? `${API_BASE}/customers?q=${encodeURIComponent(query)}`
    : `${API_BASE}/customers`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('고객 목록 조회 실패');
  const json = await res.json();
  return json.data.customers;
};

export const getCustomerById = async (token: string, id: string): Promise<Customer> => {
  const res = await fetch(`${API_BASE}/customers/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('고객 조회 실패');
  const json = await res.json();
  return json.data;
};

export const createCustomer = async (token: string, data: Partial<Customer>): Promise<Customer> => {
  const res = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('고객 등록 실패');
  const json = await res.json();
  return json.data;
};

export const updateCustomer = async (token: string, id: string, data: Partial<Customer>): Promise<Customer> => {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('고객 수정 실패');
  const json = await res.json();
  return json.data;
};

export const deleteCustomer = async (token: string, id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('고객 삭제 실패');
};

// ──────────────────────────────────────────────
// Consultations
// ──────────────────────────────────────────────

export const saveConsultation = async (token: string, data: ConsultationData): Promise<ConsultationRecord> => {
  const res = await fetch(`${API_BASE}/consultations`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('컨설팅 저장 실패');
  const json = await res.json();
  return json.data.consultation;
};

export const getAllConsultations = async (token: string): Promise<ConsultationRecord[]> => {
  const res = await fetch(`${API_BASE}/consultations`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('컨설팅 목록 조회 실패');
  const json = await res.json();
  return json.data.consultations;
};

export const getConsultationById = async (token: string, id: string): Promise<ConsultationRecord> => {
  const res = await fetch(`${API_BASE}/consultations/${id}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('컨설팅 조회 실패');
  const json = await res.json();
  return json.data.consultation;
};

export const getConsultationsByCustomerPhone = async (token: string, phone: string): Promise<ConsultationRecord[]> => {
  const res = await fetch(`${API_BASE}/consultations/by-customer/${encodeURIComponent(phone)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('컨설팅 이력 조회 실패');
  const json = await res.json();
  return json.data.consultations;
};

export const deleteConsultation = async (token: string, id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/consultations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('컨설팅 삭제 실패');
};

// ──────────────────────────────────────────────
// Shares
// ──────────────────────────────────────────────

export const createShare = async (token: string, consultationId: string, password: string): Promise<{ token: string }> => {
  const res = await fetch(`${API_BASE}/shares/${consultationId}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('링크 생성 실패');
  const json = await res.json();
  return json.data;
};

export const verifyShare = async (shareToken: string, password: string): Promise<ConsultationData> => {
  const res = await fetch(`${API_BASE}/shares/${shareToken}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) throw new Error('비밀번호가 올바르지 않습니다');
  if (!res.ok) throw new Error('링크를 찾을 수 없습니다');
  const json = await res.json();
  return json.data;
};
