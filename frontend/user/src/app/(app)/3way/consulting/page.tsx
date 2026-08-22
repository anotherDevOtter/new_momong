'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerData } from '@/components/3way/CustomerInfo';
import { PreInterview, PreInterviewData } from '@/components/3way/PreInterview';
import { ImagePreferenceDiagnosis, ImagePreferenceData } from '@/components/3way/ImagePreferenceDiagnosis';
import { FashionPreferenceDiagnosis, FashionPreferenceData } from '@/components/3way/FashionPreferenceDiagnosis';
import { ConsultingSummary } from '@/components/3way/ConsultingSummary';
import { FaceAnalysisCapture } from '@/components/3way/FaceAnalysisCapture';
import { FaceAnalysisProcessing } from '@/components/3way/FaceAnalysisProcessing';
import { FaceAnalysisResult, type FaceResultData } from '@/components/3way/FaceAnalysisResult';
import type { AnalyzeResponse } from '@/utils/face-analysis-api';
import { PersonalColorAnalysis, type PersonalColorData } from '@/components/3way/PersonalColorAnalysis';
import { SkeletonImageAnalysis, type SkeletonData } from '@/components/3way/SkeletonImageAnalysis';
import { ImageDirectionSetting, type ImageDirectionData } from '@/components/3way/ImageDirectionSetting';
import { HairDesignProposal, type HairDesignData } from '@/components/3way/HairDesignProposal';
import { HairTextureAnalysis, type HairTextureData } from '@/components/3way/HairTextureAnalysis';
import { NextDirection, CycleData } from '@/components/3way/NextDirection';
import { PreSurveyReview } from '@/components/3way/PreSurveyReview';
import { PremiumReport } from '@/components/3way/PremiumReport';
import { CompletionPage } from '@/components/3way/CompletionPage';
import { saveConsult } from '@/utils/3way-api';
import { getCustomerById } from '@/utils/api';
import { ProgressBar } from '@/components/ui/ProgressBar';

type PageKey =
  | 'preInterview' | 'imagePreference' | 'fashionPreference' | 'summary'
  | 'faceAnalysis' | 'faceProcessing' | 'faceResult'
  | 'personalColor' | 'skeletonImage'
  | 'imageDirection' | 'hairDesign' | 'hairTexture'
  | 'nextDirection' | 'preSurveyReview' | 'completion';

// 진행률 표시에 포함되는 페이지 (transient 페이지 제외).
// faceProcessing 은 짧은 전환, completion 은 끝났을 때라 둘 다 ProgressBar 미표시.
function buildVisibleSteps(course: string): PageKey[] {
  const steps: PageKey[] = [
    'preInterview',
    'imagePreference',
    'fashionPreference',
    'summary',
    'faceAnalysis',
    'faceResult',
  ];
  if (course === '2way-personal') steps.push('personalColor');
  else if (course === '2way-skeleton') steps.push('skeletonImage');
  steps.push('imageDirection', 'hairDesign', 'hairTexture', 'nextDirection', 'preSurveyReview');
  return steps;
}

export default function ThreeWayConsultingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading } = useAuth();

  const selectedCourse = searchParams.get('course') || '3way';
  const customerId = searchParams.get('customerId');
  const occupation = searchParams.get('occupation') || '';

  const [currentPage, setCurrentPage] = useState<PageKey>('preInterview');
  const [showReport, setShowReport] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [preInterviewData, setPreInterviewData] = useState<PreInterviewData | null>(null);
  const [imagePreferenceData, setImagePreferenceData] = useState<ImagePreferenceData | null>(null);
  const [fashionPreferenceData, setFashionPreferenceData] = useState<FashionPreferenceData | null>(null);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  // 디자이너가 확정/수정한 다운스트림 입력값 (저장 + step 간 연동)
  const [faceResultData, setFaceResultData] = useState<FaceResultData | null>(null);
  const [imageDirectionData, setImageDirectionData] = useState<ImageDirectionData | null>(null);
  const [hairDesignData, setHairDesignData] = useState<HairDesignData | null>(null);
  const [hairTextureData, setHairTextureData] = useState<HairTextureData | null>(null);
  const [personalColorData, setPersonalColorData] = useState<PersonalColorData | null>(null);
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // 고객 데이터 로드
  useEffect(() => {
    if (!token) return;
    if (!customerId) {
      router.replace('/3way');
      return;
    }
    setHydrating(true);
    getCustomerById(token, customerId)
      .then((c) => {
        setCustomerData({
          name: c.name,
          phone: c.phone || '',
          occupation,
          ageGroup: c.age_group || '',
          gender: c.gender === 'male' ? '남자' : '여자',
          designerName: user?.ownerName || '',
        });
      })
      .catch(() => router.replace('/3way'))
      .finally(() => setHydrating(false));
  }, [token, customerId, occupation, user, router]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  if (loading || hydrating) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><p className="text-sm text-[#999999]">불러오는 중...</p></div>;
  }
  if (!user || !customerData) return null;

  const handlePreInterviewBack = () => {
    // 사전 인터뷰의 "이전" → 컨설팅 시작 (CustomerConfirm) 으로
    const q = new URLSearchParams({ type: '3way', course: selectedCourse, customerId: customerId! });
    router.push(`/consulting/start?${q.toString()}`);
  };
  const handlePreInterviewNext = (data: PreInterviewData) => {
    setPreInterviewData(data);
    setCurrentPage('imagePreference');
  };

  const handleImagePreferenceBack = () => setCurrentPage('preInterview');
  const handleImagePreferenceNext = (data: ImagePreferenceData) => {
    setImagePreferenceData(data);
    setCurrentPage('fashionPreference');
  };

  const handleFashionPreferenceBack = () => setCurrentPage('imagePreference');
  const handleFashionPreferenceNext = (data: FashionPreferenceData) => {
    setFashionPreferenceData(data);
    setCurrentPage('summary');
  };

  const handleSummaryBack = () => setCurrentPage('fashionPreference');
  const handleSummaryNext = () => setCurrentPage('faceAnalysis');

  const handleFaceAnalysisBack = () => setCurrentPage('summary');
  const handleFaceAnalysisNext = (result: AnalyzeResponse, imageUrl: string) => {
    setFaceAnalysisResult(result);
    setFaceImageUrl(imageUrl);
    setCurrentPage('faceProcessing');
  };
  const handleFaceProcessingComplete = () => setCurrentPage('faceResult');

  const handleFaceResultBack = () => setCurrentPage('faceAnalysis');
  const handleFaceResultNext = (data: FaceResultData) => {
    setFaceResultData(data);
    if (selectedCourse === '2way-personal') setCurrentPage('personalColor');
    else if (selectedCourse === '2way-skeleton') setCurrentPage('skeletonImage');
    else setCurrentPage('imageDirection');
  };

  // 얼굴 분석에서 도출된 현재 이미지 타입 (디자이너 수정 반영). 분석 전이면 N/N.
  const currentImageType = {
    warmCool: faceResultData?.wncFinal ?? 'N',
    softHard: faceResultData?.snhFinal ?? 'N',
  } as const;
  const toneLabel = { W: 'Warm', N: 'Neutral', C: 'Cool' } as const;
  const balanceLabel = { S: 'Soft', N: 'Neutral', H: 'Hard' } as const;
  const imageTypeLabel = `${toneLabel[currentImageType.warmCool]} / ${balanceLabel[currentImageType.softHard]}`;

  const handlePersonalColorBack = () => setCurrentPage('faceResult');
  const handlePersonalColorNext = () => setCurrentPage('imageDirection');

  const handleSkeletonImageBack = () => setCurrentPage('faceResult');
  const handleSkeletonImageNext = () => setCurrentPage('imageDirection');

  const handleImageDirectionBack = () => {
    if (selectedCourse === '2way-personal') setCurrentPage('personalColor');
    else if (selectedCourse === '2way-skeleton') setCurrentPage('skeletonImage');
    else setCurrentPage('faceResult');
  };
  const handleImageDirectionNext = () => setCurrentPage('hairDesign');

  const handleHairDesignBack = () => setCurrentPage('imageDirection');
  const handleHairDesignNext = () => setCurrentPage('hairTexture');

  const handleHairTextureBack = () => setCurrentPage('hairDesign');
  const handleHairTextureNext = () => setCurrentPage('nextDirection');

  const handleNextDirectionBack = () => setCurrentPage('hairTexture');
  const handleNextDirectionNext = () => setCurrentPage('preSurveyReview');

  const handlePreSurveyReviewBack = () => setCurrentPage('nextDirection');
  const handlePreSurveyReviewNext = () => setShowReport(true);

  const handleReportClose = () => {
    setShowReport(false);
    // customerId 는 진입 시 항상 존재(없으면 입장 거부) → 전화번호 유무와 무관하게 저장
    if (customerId) {
      const COURSE_NAMES: Record<string, string> = {
        '3way': '3WAY',
        '2way-personal': '2WAY (Personal Color)',
        '2way-skeleton': '2WAY (Skeleton Image)',
        '1way': '1WAY',
      };
      // F6: 알 수 없는 코스는 '1WAY' 로 단정하지 않고 받은 값 그대로 보존
      const courseName = COURSE_NAMES[selectedCourse] || selectedCourse;

      saveConsult({
        customerId,
        phone: customerData.phone,
        name: customerData.name,
        course: courseName,
        designerName: customerData.designerName,
        ageGroup: customerData.ageGroup,
        gender: customerData.gender as 'female' | 'male' | '여자' | '남자' | '',
        occupation: customerData.occupation,
        consultData: {
          faceAnalysis: faceAnalysisResult
            ? {
                wncId: faceAnalysisResult.wncId,
                snhId: faceAnalysisResult.snhId,
                // 디자이너가 수정한 최종값 우선, 없으면 원본 분석값
                wncFinal: faceResultData?.wncFinal ?? faceAnalysisResult.wnc.final,
                snhFinal: faceResultData?.snhFinal ?? faceAnalysisResult.snh.final,
                imageType: `${faceResultData?.wncFinal ?? faceAnalysisResult.wnc.final} / ${faceResultData?.snhFinal ?? faceAnalysisResult.snh.final}`,
                ratios: faceResultData?.ratios,
                summaryItems: faceResultData?.summaryItems,
                warmCool: faceResultData?.warmCool,
                softHard: faceResultData?.softHard,
                faceImageUrl,
              }
            : null,
          // B1: 이전에 저장 누락되던 디자이너 입력값들
          personalColor: personalColorData,
          skeleton: skeletonData,
          imageDirection: imageDirectionData,
          hairDesign: hairDesignData,
          hairTexture: hairTextureData,
          cycleData,
          imagePreferenceData,
          fashionPreferenceData,
          preInterviewData,
        },
      }).catch(() => undefined);
    }
    setCurrentPage('completion');
  };

  const handleDownloadPDF = () => alert('PDF 다운로드 기능은 추후 연동 예정입니다.');
  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('링크가 클립보드에 복사되었습니다!'),
      () => alert('링크 복사에 실패했습니다.'),
    );
  };
  const handleGoHome = () => router.push('/');

  // 페이지 렌더링
  const renderPage = () => {
    if (currentPage === 'preInterview') return <PreInterview onBack={handlePreInterviewBack} onNext={handlePreInterviewNext} />;
    if (currentPage === 'imagePreference') return <ImagePreferenceDiagnosis onBack={handleImagePreferenceBack} onNext={handleImagePreferenceNext} />;
    if (currentPage === 'fashionPreference') return <FashionPreferenceDiagnosis onBack={handleFashionPreferenceBack} onNext={handleFashionPreferenceNext} />;
    if (currentPage === 'summary') {
      if (!imagePreferenceData || !fashionPreferenceData) {
        return <div className="min-h-screen bg-white flex items-center justify-center"><p className="text-gray-600">데이터 로딩 중...</p></div>;
      }
      return (
        <ConsultingSummary
          selectedCourse={selectedCourse}
          customerData={customerData}
          imagePreferenceData={imagePreferenceData}
          fashionPreferenceData={fashionPreferenceData}
          onBack={handleSummaryBack}
          onNext={handleSummaryNext}
        />
      );
    }
    if (currentPage === 'faceAnalysis') return <FaceAnalysisCapture onBack={handleFaceAnalysisBack} onNext={handleFaceAnalysisNext} />;
    if (currentPage === 'faceProcessing') return <FaceAnalysisProcessing onComplete={handleFaceProcessingComplete} />;
    if (currentPage === 'faceResult') return <FaceAnalysisResult analysisResult={faceAnalysisResult} onBack={handleFaceResultBack} onNext={handleFaceResultNext} />;
    if (currentPage === 'personalColor') return <PersonalColorAnalysis onBack={handlePersonalColorBack} onNext={handlePersonalColorNext} onChange={setPersonalColorData} />;
    if (currentPage === 'skeletonImage') return <SkeletonImageAnalysis onBack={handleSkeletonImageBack} onNext={handleSkeletonImageNext} onChange={setSkeletonData} />;
    if (currentPage === 'imageDirection') return <ImageDirectionSetting onBack={handleImageDirectionBack} onNext={handleImageDirectionNext} currentType={currentImageType} onChange={setImageDirectionData} />;
    if (currentPage === 'hairDesign') return <HairDesignProposal onBack={handleHairDesignBack} onNext={handleHairDesignNext} imageTypeLabel={imageTypeLabel} onChange={setHairDesignData} />;
    if (currentPage === 'hairTexture') return <HairTextureAnalysis onBack={handleHairTextureBack} onNext={handleHairTextureNext} onChange={setHairTextureData} />;
    if (currentPage === 'nextDirection') {
      return (
        <NextDirection
          onBack={handleNextDirectionBack}
          onNext={handleNextDirectionNext}
          onCycleDataChange={setCycleData}
        />
      );
    }
    if (currentPage === 'preSurveyReview') {
      return (
        <>
          <PreSurveyReview
            customerId={customerId}
            onBack={handlePreSurveyReviewBack}
            onNext={handlePreSurveyReviewNext}
          />
          {showReport && (
            <PremiumReport
              onClose={handleReportClose}
              customerName={customerData.name}
              consultDate={new Date().toLocaleDateString('ko-KR')}
              designerName={customerData.designerName || '디자이너'}
              cycleData={cycleData}
              selectedCourse={selectedCourse}
              imageType={currentImageType}
              ratios={faceResultData?.ratios}
            />
          )}
        </>
      );
    }
    if (currentPage === 'completion') {
      return <CompletionPage onDownloadPDF={handleDownloadPDF} onShareLink={handleShareLink} onGoHome={handleGoHome} />;
    }
    return null;
  };

  // 진행률 — visibleSteps 에 포함된 페이지에서만 ProgressBar 표시
  const visibleSteps = buildVisibleSteps(selectedCourse);
  const stepIndex = visibleSteps.indexOf(currentPage);
  const showProgress = stepIndex >= 0;

  // F5: 디자이너가 현재 코스를 인지할 수 있도록 칩 표시
  const COURSE_CHIP: Record<string, string> = {
    '3way': '3WAY',
    '2way-personal': '2WAY 퍼스널컬러',
    '2way-skeleton': '2WAY 골격',
    '1way': '1WAY',
  };
  const courseChipLabel = COURSE_CHIP[selectedCourse] || selectedCourse;

  return (
    <>
      {showProgress && (
        <ProgressBar
          currentStep={stepIndex + 1}
          totalSteps={visibleSteps.length + 1}
          leftSlot={
            <span className="shrink-0 inline-flex items-center rounded-full bg-[#111111] text-white text-xs font-medium px-3 py-1 tracking-wide">
              {courseChipLabel}
            </span>
          }
        />
      )}
      {renderPage()}
    </>
  );
}
