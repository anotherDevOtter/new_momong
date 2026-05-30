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
    const q = new URLSearchParams({ type: '3way', course: courseId });
    if (customerId) q.set('customerId', customerId);
    router.push(`/consulting/start?${q.toString()}`);
  };

  const handleCourseBack = () => router.push('/');

  return <CourseSelection onNext={handleCourseNext} onBack={handleCourseBack} />;
}
