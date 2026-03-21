const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function authHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export type AdminUser = {
  id: string;
  email: string;
  storeName: string;
  ownerName: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  consultationCount: number;
};

export type AdminStats = {
  totalUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  rejectedUsers: number;
  totalConsultations: number;
};

export const adminLogin = async (email: string, password: string): Promise<{ token: string }> => {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('로그인 실패');
  const json = await res.json();
  return json.data;
};

export const getAdminUsers = async (token: string): Promise<AdminUser[]> => {
  const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('유저 목록 조회 실패');
  const json = await res.json();
  return json.data;
};

export const approveUser = async (token: string, userId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/approve`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('승인 실패');
};

export const rejectUser = async (token: string, userId: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/reject`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('거절 실패');
};

export const getAdminStats = async (token: string): Promise<AdminStats> => {
  const res = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('통계 조회 실패');
  const json = await res.json();
  return json.data;
};
