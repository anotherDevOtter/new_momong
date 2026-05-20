'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { CourseSelection } from '@/components/3way/CourseSelection';
import { CustomerInfo, CustomerData } from '@/components/3way/CustomerInfo';
import { PreInterview, PreInterviewData } from '@/components/3way/PreInterview';
import { ImagePreferenceDiagnosis, ImagePreferenceData } from '@/components/3way/ImagePreferenceDiagnosis';
import { FashionPreferenceDiagnosis, FashionPreferenceData } from '@/components/3way/FashionPreferenceDiagnosis';
import { ConsultingSummary } from '@/components/3way/ConsultingSummary';
import { FaceAnalysisCapture } from '@/components/3way/FaceAnalysisCapture';
import { FaceAnalysisProcessing } from '@/components/3way/FaceAnalysisProcessing';
import { FaceAnalysisResult } from '@/components/3way/FaceAnalysisResult';
import { PersonalColorAnalysis } from '@/components/3way/PersonalColorAnalysis';
import { SkeletonImageAnalysis } from '@/components/3way/SkeletonImageAnalysis';
import { ImageDirectionSetting } from '@/components/3way/ImageDirectionSetting';
import { HairDesignProposal } from '@/components/3way/HairDesignProposal';
import { HairTextureAnalysis } from '@/components/3way/HairTextureAnalysis';
import { NextDirection, CycleData } from '@/components/3way/NextDirection';
import { PremiumReport } from '@/components/3way/PremiumReport';
import { CompletionPage } from '@/components/3way/CompletionPage';
import { CustomerHistory, CustomerRecord } from '@/components/3way/CustomerHistory';
import { CustomerHistoryDetail, ConsultRecord } from '@/components/3way/CustomerHistoryDetail';
import { saveConsult } from '@/utils/3way-api';

type PageKey =
  | 'landing' | 'course' | 'customerInfo' | 'preInterview'
  | 'imagePreference' | 'fashionPreference' | 'summary'
  | 'faceAnalysis' | 'faceProcessing' | 'faceResult'
  | 'personalColor' | 'skeletonImage'
  | 'imageDirection' | 'hairDesign' | 'hairTexture'
  | 'nextDirection' | 'report' | 'diagnosis' | 'completion'
  | 'history' | 'historyDetail';

export default function ThreeWayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { features, loading: featuresLoading } = useFeatures();

  const [currentPage, setCurrentPage] = useState<PageKey>(
    searchParams.get('start') === '1' ? 'course' : 'landing',
  );
  const [showReport, setShowReport] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [preInterviewData, setPreInterviewData] = useState<PreInterviewData | null>(null);
  const [imagePreferenceData, setImagePreferenceData] = useState<ImagePreferenceData | null>(null);
  const [fashionPreferenceData, setFashionPreferenceData] = useState<FashionPreferenceData | null>(null);
  const [cycleData, setCycleData] = useState<CycleData | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedConsultRecord, setSelectedConsultRecord] = useState<ConsultRecord | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
      if (!hasToken) router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!featuresLoading && !features.threeWayEnabled) {
      router.replace('/');
    }
  }, [featuresLoading, features.threeWayEnabled, router]);

  // 페이지 전환 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  if (!user) return null;
  if (!features.threeWayEnabled) return null;

  const handleStart = () => setCurrentPage('course');

  const handleCourseNext = (courseId: string) => {
    setSelectedCourse(courseId);
    setCurrentPage('customerInfo');
  };
  const handleCourseBack = () => setCurrentPage('landing');

  const handleCustomerInfoBack = () => setCurrentPage('course');
  const handleCustomerInfoNext = (data: CustomerData) => {
    setCustomerData(data);
    setCurrentPage('preInterview');
  };

  const handlePreInterviewBack = () => setCurrentPage('customerInfo');
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
  const handleFaceAnalysisNext = () => setCurrentPage('faceProcessing');
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

    if (customerData && customerData.phone) {
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
          imageType: 'Soft Natural',
          colorType: 'Warm Light',
          design: 'Long Layered C Curl',
          cycleData,
          imagePreferenceData,
          fashionPreferenceData,
          preInterviewData,
        },
      }).catch(() => {
        // 저장 실패는 사용자 흐름을 막지 않음
      });
    }

    setCurrentPage('completion');
  };

  const handleDownloadPDF = () => {
    alert('PDF 다운로드 기능은 추후 연동 예정입니다.');
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('링크가 클립보드에 복사되었습니다!'),
      () => alert('링크 복사에 실패했습니다.'),
    );
  };

  const handleGoHome = () => {
    setCurrentPage('landing');
    setShowReport(false);
  };

  const handleHistory = () => setCurrentPage('history');

  const handleHistoryDetail = (customer: CustomerRecord, consult: ConsultRecord) => {
    setSelectedCustomer(customer);
    setSelectedConsultRecord(consult);
    setCurrentPage('historyDetail');
  };

  const handleHistoryBack = () => setCurrentPage('history');

  if (currentPage === 'course') {
    return <CourseSelection onNext={handleCourseNext} onBack={handleCourseBack} />;
  }

  if (currentPage === 'customerInfo') {
    return <CustomerInfo onBack={handleCustomerInfoBack} onNext={handleCustomerInfoNext} />;
  }

  if (currentPage === 'preInterview') {
    return <PreInterview onBack={handlePreInterviewBack} onNext={handlePreInterviewNext} />;
  }

  if (currentPage === 'imagePreference') {
    return <ImagePreferenceDiagnosis onBack={handleImagePreferenceBack} onNext={handleImagePreferenceNext} />;
  }

  if (currentPage === 'fashionPreference') {
    return <FashionPreferenceDiagnosis onBack={handleFashionPreferenceBack} onNext={handleFashionPreferenceNext} />;
  }

  if (currentPage === 'summary') {
    if (!customerData || !imagePreferenceData || !fashionPreferenceData) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-600">데이터 로딩 중...</p>
        </div>
      );
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

  if (currentPage === 'faceAnalysis') {
    return <FaceAnalysisCapture onBack={handleFaceAnalysisBack} onNext={handleFaceAnalysisNext} />;
  }

  if (currentPage === 'faceProcessing') {
    return <FaceAnalysisProcessing onComplete={handleFaceProcessingComplete} />;
  }

  if (currentPage === 'faceResult') {
    return <FaceAnalysisResult onBack={handleFaceResultBack} onNext={handleFaceResultNext} />;
  }

  if (currentPage === 'personalColor') {
    return <PersonalColorAnalysis onBack={handlePersonalColorBack} onNext={handlePersonalColorNext} />;
  }

  if (currentPage === 'skeletonImage') {
    return <SkeletonImageAnalysis onBack={handleSkeletonImageBack} onNext={handleSkeletonImageNext} />;
  }

  if (currentPage === 'imageDirection') {
    return <ImageDirectionSetting onBack={handleImageDirectionBack} onNext={handleImageDirectionNext} />;
  }

  if (currentPage === 'hairDesign') {
    return <HairDesignProposal onBack={handleHairDesignBack} onNext={handleHairDesignNext} />;
  }

  if (currentPage === 'hairTexture') {
    return <HairTextureAnalysis onBack={handleHairTextureBack} onNext={handleHairTextureNext} />;
  }

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
            customerName={customerData?.name || '고객'}
            consultDate={new Date().toLocaleDateString('ko-KR')}
            designerName={customerData?.designerName || '디자이너'}
            cycleData={cycleData}
            selectedCourse={selectedCourse}
          />
        )}
      </>
    );
  }

  if (currentPage === 'completion') {
    return (
      <CompletionPage
        onDownloadPDF={handleDownloadPDF}
        onShareLink={handleShareLink}
        onGoHome={handleGoHome}
      />
    );
  }

  if (currentPage === 'history') {
    return <CustomerHistory onHistoryDetail={handleHistoryDetail} onBack={handleGoHome} />;
  }

  if (currentPage === 'historyDetail') {
    return (
      <CustomerHistoryDetail
        customer={selectedCustomer}
        consult={selectedConsultRecord}
        onBack={handleHistoryBack}
      />
    );
  }

  // 랜딩 페이지
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 py-20 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="absolute top-10 left-10"
      >
        <span
          className="text-[11px] tracking-[0.25em] text-[#111111] uppercase font-medium"
        >
          MERCI MOMONG
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="absolute top-10 right-10"
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
