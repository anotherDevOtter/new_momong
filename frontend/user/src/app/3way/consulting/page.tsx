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
import { FaceAnalysisResult } from '@/components/3way/FaceAnalysisResult';
import type { AnalyzeResponse } from '@/utils/face-analysis-api';
import { PersonalColorAnalysis } from '@/components/3way/PersonalColorAnalysis';
import { SkeletonImageAnalysis } from '@/components/3way/SkeletonImageAnalysis';
import { ImageDirectionSetting } from '@/components/3way/ImageDirectionSetting';
import { HairDesignProposal } from '@/components/3way/HairDesignProposal';
import { HairTextureAnalysis } from '@/components/3way/HairTextureAnalysis';
import { NextDirection, CycleData } from '@/components/3way/NextDirection';
import { PremiumReport } from '@/components/3way/PremiumReport';
import { CompletionPage } from '@/components/3way/CompletionPage';
import { saveConsult } from '@/utils/3way-api';
import { getCustomerById } from '@/utils/api';

type PageKey =
  | 'preInterview' | 'imagePreference' | 'fashionPreference' | 'summary'
  | 'faceAnalysis' | 'faceProcessing' | 'faceResult'
  | 'personalColor' | 'skeletonImage'
  | 'imageDirection' | 'hairDesign' | 'hairTexture'
  | 'nextDirection' | 'completion';

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
  const handleFaceResultNext = () => {
    if (selectedCourse === '2way-personal') setCurrentPage('personalColor');
    else if (selectedCourse === '2way-skeleton') setCurrentPage('skeletonImage');
    else setCurrentPage('imageDirection');
  };

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
  const handleNextDirectionNext = () => setShowReport(true);

  const handleReportClose = () => {
    setShowReport(false);
    if (customerData.phone) {
      const courseName =
        selectedCourse === '3way' ? '3WAY'
        : selectedCourse === '2way-personal' ? '2WAY (Personal Color)'
        : selectedCourse === '2way-skeleton' ? '2WAY (Skeleton Image)'
        : '1WAY';

      saveConsult({
        phone: customerData.phone,
        name: customerData.name,
        course: courseName,
        designerName: customerData.designerName,
        consultData: {
          faceAnalysis: faceAnalysisResult
            ? {
                wncId: faceAnalysisResult.wncId,
                snhId: faceAnalysisResult.snhId,
                wncFinal: faceAnalysisResult.wnc.final,
                snhFinal: faceAnalysisResult.snh.final,
                imageType: `${faceAnalysisResult.wnc.final} / ${faceAnalysisResult.snh.final}`,
                faceImageUrl,
              }
            : null,
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
  if (currentPage === 'personalColor') return <PersonalColorAnalysis onBack={handlePersonalColorBack} onNext={handlePersonalColorNext} />;
  if (currentPage === 'skeletonImage') return <SkeletonImageAnalysis onBack={handleSkeletonImageBack} onNext={handleSkeletonImageNext} />;
  if (currentPage === 'imageDirection') return <ImageDirectionSetting onBack={handleImageDirectionBack} onNext={handleImageDirectionNext} />;
  if (currentPage === 'hairDesign') return <HairDesignProposal onBack={handleHairDesignBack} onNext={handleHairDesignNext} />;
  if (currentPage === 'hairTexture') return <HairTextureAnalysis onBack={handleHairTextureBack} onNext={handleHairTextureNext} />;
  if (currentPage === 'nextDirection') {
    return (
      <>
        <NextDirection
          onBack={handleNextDirectionBack}
          onNext={handleNextDirectionNext}
          onCycleDataChange={setCycleData}
        />
        {showReport && (
          <PremiumReport
            onClose={handleReportClose}
            customerName={customerData.name}
            consultDate={new Date().toLocaleDateString('ko-KR')}
            designerName={customerData.designerName || '디자이너'}
            cycleData={cycleData}
            selectedCourse={selectedCourse}
          />
        )}
      </>
    );
  }
  if (currentPage === 'completion') {
    return <CompletionPage onDownloadPDF={handleDownloadPDF} onShareLink={handleShareLink} onGoHome={handleGoHome} />;
  }
  return null;
}
