'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function FindIdPage() {
  const { findId } = useAuth();
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult('');
    setLoading(true);
    try {
      const masked = await findId(phone);
      setResult(masked);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '아이디를 찾을 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-1">Merci Momong</p>
          <h1 className="text-2xl font-semibold text-[#111]">아이디 찾기</h1>
          <p className="text-sm text-gray-400 mt-2">가입 시 등록한 전화번호를 입력하세요</p>
        </div>

        {result ? (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-5">
              <p className="text-sm text-gray-500 mb-1">등록된 이메일</p>
              <p className="text-lg font-medium text-[#111]">{result}</p>
            </div>
            <Link
              href="/login"
              className="block w-full bg-[#111] text-white rounded-lg py-2.5 text-sm font-medium text-center"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">전화번호</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                placeholder="010-0000-0000"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? '조회 중...' : '아이디 찾기'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          <Link href="/login" className="hover:text-gray-600 transition-colors">로그인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
