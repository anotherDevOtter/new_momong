'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface AuthUser {
  id: string;
  email: string;
  storeName: string;
  ownerName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, storeName: string, ownerName: string, password: string, phone?: string) => Promise<void>;
  findId: (phone: string) => Promise<string>;
  resetPassword: (email: string, ownerName: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth_token');
    const cachedUser = localStorage.getItem('auth_user');
    if (saved) {
      setToken(saved);
      // 캐시된 유저 정보가 있으면 먼저 적용 (화면 즉시 표시)
      if (cachedUser) {
        try { setUser(JSON.parse(cachedUser)); } catch (_e) { /* ignore */ }
      }
      fetchMe(saved)
        .then((u) => {
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.message === 'unauthorized') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
          }
          // 네트워크 에러는 캐시된 유저 유지
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string): Promise<AuthUser> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('unauthorized');
      const json = await res.json();
      return json.data;
    } finally {
      clearTimeout(timer);
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '로그인에 실패했습니다');
    }
    const json = await res.json();
    const { token: access_token, user: u } = json.data;
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(u));
    setToken(access_token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }

  async function signup(email: string, storeName: string, ownerName: string, password: string, phone?: string) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, storeName, ownerName, password, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '회원가입에 실패했습니다');
    }
  }

  async function findId(phone: string): Promise<string> {
    const res = await fetch(`${API_BASE}/auth/find-id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '아이디를 찾을 수 없습니다');
    }
    const json = await res.json();
    return json.data.email;
  }

  async function resetPassword(email: string, ownerName: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ownerName, newPassword }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || '비밀번호 재설정에 실패했습니다');
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, signup, findId, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
