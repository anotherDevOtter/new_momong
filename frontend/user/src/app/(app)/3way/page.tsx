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

  // 촬영 화면 진단 모드 — /3way?debug=1 로 켜고 /3way?debug=0 으로 끈다 (이 기기 브라우저에 남는다).
  // 휴대폰에서 촬영 화면 주소를 직접 고치기 어려워서 여기서 받는다 (2026-10-23).
  useEffect(() => {
    const v = searchParams.get('debug');
    try {
      if (v === '1') localStorage.setItem('momong_debug', '1');
      if (v === '0') localStorage.removeItem('momong_debug');
    } catch { /* 저장 불가면 진단 모드 없이 진행 */ }
  }, [searchParams]);

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
    // FIT-NEW 는 3WAY 코스가 아니라 FIT 수정본이다 — 카드만 여기 있고 흐름은 /fit-new
    if (courseId === 'fit-new') {
      router.push(customerId ? `/fit-new?customerId=${customerId}` : '/consulting/start?type=fit-new');
      return;
    }
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
