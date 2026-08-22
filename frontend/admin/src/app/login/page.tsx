'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '@/utils/api';
import { setAdminToken } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await adminLogin(email, password);
      setAdminToken(token);
      router.push('/dashboard');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로컬 전용: 기본 admin 계정 자동 로그인.
  // 계정은 .env.local 로 덮어쓴다 (소스 수정 불필요 — 로컬 diff 가 남지 않게).
  const isDev = process.env.NODE_ENV === 'development';
  const TEST_EMAIL = process.env.NEXT_PUBLIC_TEST_EMAIL || 'admin@momong.com';
  const TEST_PASSWORD = process.env.NEXT_PUBLIC_TEST_PASSWORD || '!Password1234';
  const handleTestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const { token } = await adminLogin(TEST_EMAIL, TEST_PASSWORD);
      setAdminToken(token);
      router.push('/dashboard');
    } catch {
      setError('테스트 로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-sm font-medium tracking-widest text-[#111111] uppercase mb-1">
            MERCI MOMONG
          </h1>
          <p className="text-xs text-[#999999] tracking-wider">어드민</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#E5E5E5] px-4 py-3 text-sm text-[#111111] placeholder-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#E5E5E5] px-4 py-3 text-sm text-[#111111] placeholder-[#BBBBBB] outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111111] text-white py-3 text-sm font-medium tracking-wider hover:bg-[#333333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>

          {isDev && (
            <button
              type="button"
              onClick={handleTestLogin}
              disabled={loading}
              className="w-full border border-dashed border-gray-400 text-gray-600 py-2 text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              🧪 테스트 계정 로그인 ({TEST_EMAIL})
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
