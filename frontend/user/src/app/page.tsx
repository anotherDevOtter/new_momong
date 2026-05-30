'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { IntroStep } from '@/components/steps/IntroStep';

export default function HomePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { features } = useFeatures();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user) return null;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#111111', color: '#FFFFFF', border: '1px solid #333333', fontSize: '14px' },
        }}
      />

      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-[11px] tracking-[0.25em] text-[#111111] uppercase font-medium">
          MERCI MOMONG
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{user.storeName}</span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <IntroStep
        onNext={features.fitEnabled ? () => router.push('/consulting/start?type=fit') : undefined}
        onViewClients={() => router.push('/customers')}
        onStart3Way={features.threeWayEnabled ? () => router.push('/3way') : undefined}
      />
    </>
  );
}
