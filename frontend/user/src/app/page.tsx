'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { IntroStep } from '@/components/steps/IntroStep';
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
import { ClientListStep } from '@/components/steps/ClientListStep';
import { ClientDetailStep } from '@/components/steps/ClientDetailStep';
import { ConsultationData, ConsultationRecord, Customer } from '@/types';

type AppView = 'consultation' | 'client-list' | 'client-detail';

interface AppHistoryState {
  step: number;
  view: AppView;
}

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

export default function Home() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('consultation');
  const [currentStep, setCurrentStep] = useState(0);
  const [fromReview, setFromReview] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null);
  const [reviewSaveStatus, setReviewSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    ...INITIAL_DATA,
    visitDate: new Date().toLocaleDateString('ko-KR'),
  });

  useEffect(() => {
    if (!loading && !user) {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
      if (!hasToken) router.replace('/login');
    }
  }, [loading, user, router]);

  // 초기 히스토리 상태 설정
  useEffect(() => {
    if (!user) return;
    window.history.replaceState({ step: 0, view: 'consultation' } satisfies AppHistoryState, '');
  }, [user]);

  // 브라우저 뒤로가기 처리
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state as AppHistoryState | null;
      if (!state) return;
      setCurrentView(state.view);
      setCurrentStep(state.step);
      if (state.view !== 'client-detail') setSelectedClient(null);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (!user) return null;

  // ── 히스토리 푸시 헬퍼 ──────────────────────────
  const pushState = (step: number, view: AppView) => {
    window.history.pushState({ step, view } satisfies AppHistoryState, '');
  };

  // ── 네비게이션 ──────────────────────────────────
  const handleNext = () => {
    const next = Math.min(currentStep + 1, TOTAL_STEPS - 1);
    pushState(next, 'consultation');
    setCurrentStep(next);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleComplete = () => {
    window.history.replaceState({ step: 0, view: 'consultation' } satisfies AppHistoryState, '');
    setCurrentStep(0);
    setConsultationData({ ...INITIAL_DATA, visitDate: new Date().toLocaleDateString('ko-KR') });
    setReviewSaveStatus('idle');
  };

  const handleGoToStep = (step: number) => {
    setFromReview(true);
    pushState(step, 'consultation');
    setCurrentStep(step);
  };

  const handleReturnToReview = () => {
    setFromReview(false);
    pushState(11, 'consultation');
    setCurrentStep(11);
  };

  const handleGoToClientList = () => {
    pushState(0, 'client-list');
    setCurrentView('client-list');
  };

  const handleSelectClient = (client: Customer) => {
    setSelectedClient(client);
    pushState(0, 'client-detail');
    setCurrentView('client-detail');
  };

  const handleEditConsultation = (record: ConsultationRecord) => {
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
    pushState(11, 'consultation');
    setCurrentView('consultation');
    setCurrentStep(11);
  };

  const handleStartNewConsultationFromClient = () => {
    if (selectedClient) {
      setConsultationData((prev) => ({
        ...prev,
        clientInfo: {
          name: selectedClient.name,
          phone: selectedClient.phone,
          gender: (selectedClient.gender as 'female' | 'male' | '') || '',
          ageGroup: selectedClient.age_group || '',
        },
        visitDate: new Date().toLocaleDateString('ko-KR'),
        id: undefined,
        createdAt: undefined,
      }));
    }
    setSelectedClient(null);
    setReviewSaveStatus('idle');
    pushState(1, 'consultation');
    setCurrentView('consultation');
    setCurrentStep(1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <IntroStep onNext={handleNext} onViewClients={handleGoToClientList} />;
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
        return <LoadingStep clientName={consultationData.clientInfo.name} onNext={() => {
          window.history.replaceState({ step: 5, view: 'consultation' } satisfies AppHistoryState, '');
          setCurrentStep(5);
        }} onBack={handleBack} />;
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
        return <IntroStep onNext={handleNext} />;
    }
  };

  const showProgressBar = currentView === 'consultation' && currentStep > 0 && currentStep < 11;

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
        <div className="w-28">
          {currentView === 'consultation' && currentStep >= 1 && (
            <button
              onClick={() => {
                if (window.confirm('처음으로 돌아가면 현재 컨설팅 내용이 모두 사라집니다. 계속하시겠습니까?')) {
                  setFromReview(false);
                  handleComplete();
                }
              }}
              className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors"
            >
              처음으로
            </button>
          )}
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

      {currentView === 'consultation' && (
        <>
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
      )}

      {currentView === 'client-list' && (
        <ClientListStep
          onBack={handleBack}
          onSelectClient={handleSelectClient}
        />
      )}

      {currentView === 'client-detail' && selectedClient && (
        <ClientDetailStep
          client={selectedClient}
          onBack={handleBack}
          onStartNewConsultation={handleStartNewConsultationFromClient}
          onEditConsultation={handleEditConsultation}
        />
      )}
    </>
  );
}
