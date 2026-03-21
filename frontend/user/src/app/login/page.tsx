'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered') === 'true';
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-1">Merci Momong</p>
          <h1 className="text-2xl font-semibold text-[#111]">FIT 헤어컨설팅</h1>
        </div>

        {registered && (
          <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
            가입 신청이 완료되었습니다.<br />관리자 승인 후 로그인이 가능합니다.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#111] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link href="/find-id" className="hover:text-gray-600 transition-colors">아이디 찾기</Link>
          <span>·</span>
          <Link href="/reset-password" className="hover:text-gray-600 transition-colors">비밀번호 재설정</Link>
          <span>·</span>
          <Link href="/signup" className="hover:text-gray-600 transition-colors">회원가입</Link>
        </div>
      </div>
    </div>
  );
}
