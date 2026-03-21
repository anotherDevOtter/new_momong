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
    if (saved) {
      setToken(saved);
      fetchMe(saved)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchMe(t: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error('unauthorized');
    const json = await res.json();
    return json.data;
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
    setToken(access_token);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('auth_token');
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
