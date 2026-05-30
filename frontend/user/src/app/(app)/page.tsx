'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { IntroStep } from '@/components/steps/IntroStep';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { features } = useFeatures();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user) return null;

  return (
    <IntroStep
      onNext={features.fitEnabled ? () => router.push('/consulting/start?type=fit') : undefined}
      onViewClients={() => router.push('/customers')}
      onStart3Way={features.threeWayEnabled ? () => router.push('/3way') : undefined}
    />
  );
}
