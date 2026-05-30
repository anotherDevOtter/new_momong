'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ClientInfoStep } from '@/components/steps/ClientInfoStep';
import { TodayKeywordStep } from '@/components/steps/TodayKeywordStep';
import { FashionStyleStep } from '@/components/steps/FashionStyleStep';
import { LoadingStep } from '@/components/steps/LoadingStep';
import { DesignSummaryStep } from '@/components/steps/DesignSummaryStep';
import { FaceImageTypeStep } from '@/components/steps/FaceImageTypeStep';
import { HairConditionStep } from '@/components/steps/HairConditionStep';
import { HairStyleProposalStep } from '@/components/steps/HairStyleProposalStep';
import { TodayDesignStep } from '@/components/steps/TodayDesignStep';
import { AfterNoteStep } from '@/components/steps/AfterNoteStep';
import { ReviewStep } from '@/components/steps/ReviewStep';
import { getCustomerById, getConsultationById } from '@/utils/api';
import type { ConsultationData } from '@/types';

const INITIAL_DATA: ConsultationData = {
  clientInfo: { name: '', phone: '', ageGroup: '', gender: '' },
  todayKeyword: { faceConcerns: [], faceConcernsMemo: '', hairConcerns: [], hairConcernsMemo: '', imageKeywords: [] },
  fashionStyle: { selected: [] },
  faceImageType: { type: '', features: { face: '', eyebrows: '', eyes: '', nose: '', lips: '' } },
  hairCondition: { damageLevel: '', hairType: [], thickness: '', density: '', curl: '' },
  hairStyleProposal: { length: '', referenceImage: '' },
  todayDesign: { length: [], lengthMemo: '', bangs: [], bangsMemo: '', curlTexture: [], curlTextureMemo: '', color: [], colorMemo: '' },
  nextDirection: { lengthChange: [], colorChange: [], others: [] },
  designCycleGuide: { selectedMonths: [] },
  designerName: '',
  visitDate: '',
  afterNote: '',
};

const TOTAL_STEPS = 12;

export default function FitPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FitPageInner />
    </Suspense>
  );
}

function FitPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading, logout } = useAuth();

  const customerId = searchParams.get('customerId');
  const editId = searchParams.get('editId');

  // editId 가 있으면 step 11 (Review) 부터, customerId 만 있으면 step 2 (Today Keyword) 부터
  const [currentStep, setCurrentStep] = useState(2);
  const [fromReview, setFromReview] = useState(false);
  const [reviewSaveStatus, setReviewSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    ...INITIAL_DATA,
    visitDate: new Date().toLocaleDateString('ko-KR'),
  });
  const [hydrating, setHydrating] = useState(true);

  // 인증
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // customer / consultation 로드
  useEffect(() => {
    if (!token) return;
    setHydrating(true);
    (async () => {
      try {
        if (editId) {
          const record = await getConsultationById(token, editId);
          setConsultationData({
            id: record.id,
            clientInfo: record.clientInfo,
            todayKeyword: record.todayKeyword,
            fashionStyle: record.fashionStyle,
            faceImageType: record.faceImageType,
            hairCondition: record.hairCondition,
            hairStyleProposal: record.hairStyleProposal,
            todayDesign: record.todayDesign,
            nextDirection: record.nextDirection,
            designCycleGuide: record.designCycleGuide,
            designerName: record.designerName,
            visitDate: record.visitDate,
            afterNote: record.afterNote,
          });
          setReviewSaveStatus('saved');
          setCurrentStep(11);
        } else if (customerId) {
          const customer = await getCustomerById(token, customerId);
          setConsultationData((prev) => ({
            ...prev,
            clientInfo: {
              name: customer.name,
              phone: customer.phone || '',
              gender: (customer.gender as 'female' | 'male' | '') || '',
              ageGroup: customer.age_group || '',
            },
            designerName: user?.ownerName || '',
            visitDate: new Date().toLocaleDateString('ko-KR'),
          }));
          setCurrentStep(2);
        } else {
          // customerId 없으면 시작 화면으로
          router.replace('/consulting/start?type=fit');
        }
      } catch (e) {
        console.error('FIT 데이터 로드 실패', e);
        router.replace('/consulting/start?type=fit');
      } finally {
        setHydrating(false);
      }
    })();
  }, [token, customerId, editId, user, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  if (loading || hydrating) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user) return null;

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    if (currentStep <= 2) {
      // step 2 (Today Keyword) 에서 이전 → consulting/start 로 돌아감 (confirm 화면 거치게)
      router.push(`/consulting/start?type=fit&customerId=${customerId || ''}`);
      return;
    }
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleComplete = () => {
    router.push('/');
  };

  const handleGoToStep = (step: number) => {
    setFromReview(true);
    setCurrentStep(step);
  };

  const handleReturnToReview = () => {
    setFromReview(false);
    setCurrentStep(11);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientInfoStep
            data={consultationData.clientInfo}
            onChange={(data) => setConsultationData({ ...consultationData, clientInfo: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <TodayKeywordStep
            data={consultationData.todayKeyword}
            gender={consultationData.clientInfo.gender as 'female' | 'male'}
            onChange={(data) => setConsultationData({ ...consultationData, todayKeyword: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <FashionStyleStep
            data={consultationData.fashionStyle}
            gender={consultationData.clientInfo.gender as 'female' | 'male'}
            onChange={(data) => setConsultationData({ ...consultationData, fashionStyle: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <LoadingStep
            clientName={consultationData.clientInfo.name}
            onNext={() => setCurrentStep(5)}
            onBack={handleBack}
          />
        );
      case 5:
        return <DesignSummaryStep data={consultationData} onNext={handleNext} onBack={handleBack} />;
      case 6:
        return (
          <FaceImageTypeStep
            data={consultationData.faceImageType}
            gender={consultationData.clientInfo.gender as 'female' | 'male'}
            onChange={(data) => setConsultationData({ ...consultationData, faceImageType: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <HairConditionStep
            data={consultationData.hairCondition}
            gender={consultationData.clientInfo.gender as 'female' | 'male'}
            onChange={(data) => setConsultationData({ ...consultationData, hairCondition: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 8:
        return (
          <HairStyleProposalStep
            data={consultationData.hairStyleProposal}
            gender={consultationData.clientInfo.gender as 'female' | 'male'}
            onChange={(data) => setConsultationData({ ...consultationData, hairStyleProposal: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 9:
        return (
          <TodayDesignStep
            todayDesign={consultationData.todayDesign}
            nextDirection={consultationData.nextDirection}
            clientName={consultationData.clientInfo.name}
            imageType={consultationData.faceImageType.type}
            damageLevel={consultationData.hairCondition.damageLevel}
            onTodayDesignChange={(data) => setConsultationData({ ...consultationData, todayDesign: data })}
            onNextDirectionChange={(data) => setConsultationData({ ...consultationData, nextDirection: data })}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 10:
        return (
          <AfterNoteStep
            data={consultationData}
            onChange={setConsultationData}
            onBack={handleBack}
            onComplete={handleNext}
          />
        );
      case 11:
        return (
          <ReviewStep
            data={consultationData}
            saveStatus={reviewSaveStatus}
            onSaveStatusChange={setReviewSaveStatus}
            onGoToStep={handleGoToStep}
            onRestart={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  const showProgressBar = currentStep > 0 && currentStep < 11;

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
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-[0.25em] text-[#111111] uppercase font-medium">MERCI MOMONG</span>
          <button
            onClick={() => {
              if (window.confirm('처음으로 돌아가면 현재 컨설팅 내용이 모두 사라집니다. 계속하시겠습니까?')) {
                router.push('/');
              }
            }}
            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors"
          >
            처음으로
          </button>
        </div>
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

      {showProgressBar && <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />}

      {renderStep()}

      {fromReview && currentStep >= 1 && currentStep < 11 && (
        <div className="max-w-2xl mx-auto px-6 pb-12 -mt-20">
          <button
            onClick={handleReturnToReview}
            className="w-full h-12 bg-[#111111] text-white text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            확인 페이지로
          </button>
        </div>
      )}
    </>
  );
}
