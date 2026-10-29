'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ClientInfoStep } from '@/components/steps/ClientInfoStep';
import { TodayKeywordStep } from '@/components/steps/TodayKeywordStep';
import { FashionStyleStep } from '@/components/steps/FashionStyleStep';
import { LoadingStep } from '@/components/steps/LoadingStep';
import { DesignSummaryStep } from '@/components/steps/DesignSummaryStep';
import { FaceImageTypeStep } from '@/components/steps/FaceImageTypeStep';
import { HairConsulting } from '@/components/new/HairConsulting';
import { fromHairConsulting, toHairConsultingInitial } from '@/components/fit-new/fitNewData';
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
  hairStyleProposal: { length: '', referenceImage: '', flow: 'fit-new' },
  todayDesign: { length: [], lengthMemo: '', bangs: [], bangsMemo: '', curlTexture: [], curlTextureMemo: '', color: [], colorMemo: '' },
  nextDirection: { lengthChange: [], colorChange: [], others: [] },
  designCycleGuide: { selectedMonths: [] },
  designerName: '',
  visitDate: '',
  afterNote: '',
};

const TOTAL_STEPS = 12;
// 8단계(헤어스타일 제안)는 7단계에 합쳐졌다 — 번호는 기존 FIT 과 맞춰 두고 건너뛴다
const MERGED_STEP = 8;

// ─────────────────────────────────────────────────────────────────────────
// FIT-NEW — 기존 FIT(/fit) 복사본에 원장님 수정 요청을 쌓는 테스트 코스 (2026-10-28).
//
//   진입: 3WAY 코스 선택 화면의 'FIT 헤어컨설팅 (신규)' 카드
//   기존 /fit 은 원장님이 쓰고 있으므로 건드리지 않는다.
//
// 요청 3가지:
//   1. 모질 상태(7) + 헤어스타일 제안(8) → 한 화면 'FIT 헤어스타일 제안'
//      (모질 분석 및 컨디션 + 스타일 제안 — new 코스 HairConsulting 의 두 섹션)
//   2. 결과 페이지 '색조 타입' → '타입', 값은 WARM타입 / COOL타입
//   3. After Note 에 6개월 관리 플랜 (오늘의 시술 → 자동 주기) — 결과 페이지에 반영
// 검증이 끝나면 /fit 을 이것으로 교체한다.
// ─────────────────────────────────────────────────────────────────────────

export default function FitNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FitPageInner />
    </Suspense>
  );
}

function FitPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading } = useAuth();

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
          router.replace('/consulting/start?type=fit-new');
        }
      } catch (e) {
        console.error('FIT-NEW 데이터 로드 실패', e);
        router.replace('/consulting/start?type=fit-new');
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
    setCurrentStep((s) => Math.min(s + 1 === MERGED_STEP ? s + 2 : s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    if (currentStep <= 2) {
      // step 2 (Today Keyword) 에서 이전 → consulting/start 로 돌아감 (confirm 화면 거치게)
      router.push(`/consulting/start?type=fit-new&customerId=${customerId || ''}`);
      return;
    }
    setCurrentStep((s) => Math.max(s - 1 === MERGED_STEP ? s - 2 : s - 1, 1));
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
        // FIT 헤어스타일 제안 — 모질 분석 및 컨디션 + 스타일 제안 (기존 7·8단계를 합침)
        // 얼굴 분석이 없는 흐름이라 posMap 은 비워 둔다 → 얼굴 기반 추천 뱃지는 뜨지 않는다
        return (
          <HairConsulting
            variant="fit"
            posMap={{}}
            initial={toHairConsultingInitial(consultationData)}
            onChange={(hc) => setConsultationData((prev) => ({ ...prev, ...fromHairConsulting(hc) }))}
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
            variant="fit-new"
            data={consultationData}
            onChange={setConsultationData}
            onBack={handleBack}
            onComplete={handleNext}
          />
        );
      case 11:
        return (
          <ReviewStep
            variant="fit-new"
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
  // step 1 (ClientInfoStep) 는 새 흐름에서 스킵 → 사용자가 보는 단계는 1부터 10까지
  // 내부 currentStep 2 → 표시 1, 내부 11 → 표시 10
  // FIT-NEW 는 8단계가 합쳐져 한 칸 더 줄었다 — 8 뒤의 단계는 하나씩 당겨 보인다
  const displayStep = Math.max(1, currentStep - (currentStep > MERGED_STEP ? 2 : 1));
  const displayTotal = TOTAL_STEPS - 2; // = 10 (totalSteps - 1 이 분모: -1 한 번 더 ProgressBar 가 함)

  const goHomeBtn = (
    <button
      onClick={() => {
        if (window.confirm('처음으로 돌아가면 현재 컨설팅 내용이 모두 사라집니다. 계속하시겠습니까?')) {
          router.push('/');
        }
      }}
      className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors whitespace-nowrap"
    >
      처음으로
    </button>
  );

  return (
    <>
      {showProgressBar && (
        <ProgressBar currentStep={displayStep} totalSteps={displayTotal} leftSlot={goHomeBtn} />
      )}

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
