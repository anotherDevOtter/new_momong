'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'form' | 'done';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ email: '', name: '', newPassword: '', newPasswordConfirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.newPasswordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(form.email, form.name, form.newPassword);
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.2em] text-gray-400 uppercase mb-1">Merci Momong</p>
          <h1 className="text-2xl font-semibold text-[#111]">비밀번호 재설정</h1>
          <p className="text-sm text-gray-400 mt-2">이메일과 이름으로 본인 확인 후 재설정됩니다</p>
        </div>

        {step === 'done' ? (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-5">
              <p className="text-sm text-gray-600">비밀번호가 성공적으로 변경되었습니다.</p>
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
              <label className="block text-sm text-gray-600 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                placeholder="가입한 이메일"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">이름</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                placeholder="가입 시 등록한 이름"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={set('newPassword')}
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                placeholder="8자 이상"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                value={form.newPasswordConfirm}
                onChange={set('newPasswordConfirm')}
                required
                autoComplete="new-password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#111] transition-colors"
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#111] text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 transition-opacity"
            >
              {loading ? '처리 중...' : '비밀번호 변경'}
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
