'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { formatPhone } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({ email: '', storeName: '', ownerName: '', password: '', passwordConfirm: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    setLoading(true);
    try {
      await signup(form.email, form.storeName, form.ownerName, form.password, form.phone || undefined);
      router.replace('/login?registered=true');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-1">Merci Momong</p>
          <h1 className="text-2xl font-semibold text-[#111]">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일 *</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">매장명 *</label>
            <input
              type="text"
              value={form.storeName}
              onChange={set('storeName')}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="머시모몽"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">대표명 *</label>
            <input
              type="text"
              value={form.ownerName}
              onChange={set('ownerName')}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호 *</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="8자 이상"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">비밀번호 확인 *</label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={set('passwordConfirm')}
              required
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">매장 대표 전화번호 (아이디 찾기용, 선택)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
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
            {loading ? '처리 중...' : '가입하기'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-gray-700 hover:text-[#111] transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
