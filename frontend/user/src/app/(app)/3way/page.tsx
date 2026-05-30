'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { CourseSelection } from '@/components/3way/CourseSelection';

export default function ThreeWayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ThreeWayPageInner />
    </Suspense>
  );
}

function ThreeWayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { features, loading: featuresLoading } = useFeatures();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!featuresLoading && !features.threeWayEnabled) router.replace('/');
  }, [featuresLoading, features.threeWayEnabled, router]);

  if (loading || featuresLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user || !features.threeWayEnabled) return null;

  const handleCourseNext = (courseId: string) => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      // 고객 상세에서 진입한 경우 — 고객 선택 단계 우회, 바로 컨설팅으로
      router.push(`/3way/consulting?course=${courseId}&customerId=${customerId}`);
    } else {
      // 홈에서 진입 — 고객 선택 화면으로
      router.push(`/consulting/start?type=3way&course=${courseId}`);
    }
  };

  const handleCourseBack = () => router.push('/');

  return <CourseSelection onNext={handleCourseNext} onBack={handleCourseBack} />;
}
