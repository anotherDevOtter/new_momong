'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { CourseSelection } from '@/components/3way/CourseSelection';
import { CustomerHistory, CustomerRecord } from '@/components/3way/CustomerHistory';
import { CustomerHistoryDetail, ConsultRecord } from '@/components/3way/CustomerHistoryDetail';

type ScreenKey = 'landing' | 'course' | 'history' | 'historyDetail';

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

  const [screen, setScreen] = useState<ScreenKey>(
    searchParams.get('start') === '1' ? 'course' : 'landing',
  );
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedConsultRecord, setSelectedConsultRecord] = useState<ConsultRecord | null>(null);

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

  const handleStart = () => setScreen('course');
  const handleHistory = () => setScreen('history');

  // 코스 선택 완료 → /consulting/start 로 이동 (?customerId 가 있으면 그대로 넘김)
  const handleCourseNext = (courseId: string) => {
    const customerId = searchParams.get('customerId');
    const q = new URLSearchParams({ type: '3way', course: courseId });
    if (customerId) q.set('customerId', customerId);
    router.push(`/consulting/start?${q.toString()}`);
  };

  const handleCourseBack = () => setScreen('landing');

  if (screen === 'course') {
    return <CourseSelection onNext={handleCourseNext} onBack={handleCourseBack} />;
  }

  if (screen === 'history') {
    return (
      <CustomerHistory
        onHistoryDetail={(customer: CustomerRecord, consult: ConsultRecord) => {
          setSelectedCustomer(customer);
          setSelectedConsultRecord(consult);
          setScreen('historyDetail');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'historyDetail') {
    return (
      <CustomerHistoryDetail
        customer={selectedCustomer}
        consult={selectedConsultRecord}
        onBack={() => setScreen('history')}
      />
    );
  }

  // 랜딩
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 py-20 relative">
      {/* AppHeader 가 상단 공통 — "고객 이력" 만 우측에 배치 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="absolute top-6 right-10"
      >
        <button
          onClick={handleHistory}
          className="text-[11px] tracking-[0.08em] text-[#6F6F6F] hover:text-[#111111] transition-colors uppercase"
          style={{ fontWeight: 300 }}
        >
          고객 이력
        </button>
      </motion.div>

      <motion.div
        className="max-w-2xl w-full text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-6"
        >
          <p className="text-[10px] tracking-[0.35em] text-[#777777] uppercase" style={{ fontWeight: 300 }}>
            HAIR CONSULTING
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-[5rem] md:text-[6rem] tracking-[0.15em] text-[#111111] mb-16 uppercase"
          style={{ fontWeight: 600 }}
        >
          3WAY
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-20 h-px bg-[#111111] mx-auto mb-10"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.2 }}
          className="text-[12px] md:text-[13px] text-[#777777] mb-16 leading-[1.9] max-w-lg mx-auto"
          style={{ fontWeight: 400 }}
        >
          모든 사람들이 자신의 아름다움을 발견하고 스스로 사랑할 수 있도록 돕습니다
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <button
            onClick={handleStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative inline-flex items-center gap-4 px-12 py-4 bg-[#111111] text-white text-[13px] tracking-[0.08em] uppercase overflow-hidden transition-all duration-200 hover:bg-[#222222]"
            style={{ fontWeight: 400 }}
          >
            <span className="relative z-10">Start</span>
            <motion.span
              animate={{ x: isHovered ? 3 : 0 }}
              transition={{ duration: 0.2 }}
              className="relative z-10"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </motion.span>
            <span className="relative z-10 text-[12px] normal-case" style={{ fontWeight: 300 }}>
              3WAY헤어컨설팅 시작
            </span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
