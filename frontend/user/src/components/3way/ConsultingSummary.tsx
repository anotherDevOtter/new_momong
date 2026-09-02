import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';
import { CustomerData } from './CustomerInfo';
import { ImagePreferenceData } from './ImagePreferenceDiagnosis';
import { FashionPreferenceData } from './FashionPreferenceDiagnosis';

interface ConsultingSummaryProps {
  selectedCourse: string;
  customerData: CustomerData;
  imagePreferenceData: ImagePreferenceData;
  fashionPreferenceData: FashionPreferenceData;
  onBack: () => void;
  onNext: () => void;
}

export function ConsultingSummary({
  selectedCourse,
  customerData,
  imagePreferenceData,
  fashionPreferenceData,
  onBack,
  onNext,
}: ConsultingSummaryProps) {
  const courseNames: Record<string, string> = {
    '3way': '3WAY 헤어컨설팅',
    '2way': '2WAY 헤어컨설팅',
    '1way': '1WAY 헤어컨설팅',
    'new': '1WAY 헤어컨설팅 (신규 이식)',
  };

  // 이미지 선호 자동 해석
  const generateImageAnalysis = () => {
    const preferred = imagePreferenceData.preferredKeywords;
    const disliked = imagePreferenceData.dislikedKeywords;

    if (preferred.length === 0 && disliked.length === 0) {
      return '선택된 선호 키워드가 없습니다.';
    }

    const preferredText = preferred.length > 0 ? `"${preferred.join(', ')}"` : '선택 없음';
    const dislikedText = disliked.length > 0 ? disliked.join(', ') : '없음';

    return `선호 이미지는 ${preferredText} 계열이며, ${dislikedText} 무드는 지양하는 경향이 있습니다. 안정적이고 차분한 방향 제안 권장.`;
  };

  // 패션 선호 자동 해석
  const generateFashionAnalysis = () => {
    const preferred = fashionPreferenceData.preferredStyles;
    const disliked = fashionPreferenceData.dislikedStyles;

    if (preferred.length === 0 && disliked.length === 0) {
      return '선택된 패션 키워드가 없습니다.';
    }

    const styleLabels: Record<string, string> = {
      classic: '클래식',
      feminine: '페미닌',
      casual: '캐주얼',
      demure: '드뮤어',
      minimal: '미니멀',
      'hip-chic': '힙시크',
      street: '스트릿',
    };

    const preferredText =
      preferred.length > 0
        ? `"${preferred.map((id) => styleLabels[id] || id).join(', ')}"`
        : '선택 없음';
    const dislikedText =
      disliked.length > 0 ? disliked.map((id) => styleLabels[id] || id).join(', ') : '없음';

    return `선호 패션은 ${preferredText} 중심이며, ${dislikedText} 무드는 선호하지 않음. 직선적이고 정제된 디자인 방향이 적합.`;
  };

  // 종합 제안 생성
  const generateOverallSuggestion = () => {
    const hasPreferred =
      imagePreferenceData.preferredKeywords.length > 0 ||
      fashionPreferenceData.preferredStyles.length > 0;

    if (!hasPreferred) {
      return {
        summary: '현재 고객의 선호도 정보를 수집 중입니다.',
        suggestions: ['기본 컨설팅 프로세스 진행', '추가 선호도 파악 필요'],
      };
    }

    return {
      summary:
        '현재 고객은 차분하고 정제된 이미지 방향을 선호하며, 과도한 귀여움이나 강한 개성 표현은 지양하는 성향입니다.',
      suggestions: [
        '안정적인 길이 유지',
        '직선 기반 디자인',
        '과한 컬 배제',
        '명도 중심 컬러 제안',
      ],
    };
  };

  const overallSuggestion = generateOverallSuggestion();

  const styleLabels: Record<string, string> = {
    classic: '클래식',
    feminine: '페미닌',
    casual: '캐주얼',
    demure: '드뮤어',
    minimal: '미니멀',
    'hip-chic': '힙시크',
    street: '스트릿',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-2xl md:text-3xl font-normal tracking-wide text-black mb-3">
              컨설팅 요약 대시보드
            </h1>
            <p className="text-sm text-gray-600 font-normal">상담 전 핵심 정보를 확인하세요.</p>
          </motion.div>

          {/* Section 1: 기본 정보 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-10"
          >
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h2 className="text-lg font-normal tracking-wide text-black mb-6">기본 정보</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <span className="text-gray-500 font-normal">진행 코스</span>
                  <p className="text-black font-medium mt-1">{courseNames[selectedCourse]}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">고객명</span>
                  <p className="text-black font-medium mt-1">{customerData.name}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">연락처</span>
                  <p className="text-black font-medium mt-1">{customerData.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">직업</span>
                  <p className="text-black font-medium mt-1">
                    {customerData.occupation || '미입력'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">연령대</span>
                  <p className="text-black font-medium mt-1">
                    {customerData.ageGroup || '미선택'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 font-normal">성별</span>
                  <p className="text-black font-medium mt-1">{customerData.gender || '미선택'}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 2: 이미지 선호 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-lg font-normal tracking-wide text-black mb-4">이미지 성향 요약</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* 선호 이미지 키워드 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} />
                  <h3 className="text-sm font-medium text-black">선호 이미지 키워드</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {imagePreferenceData.preferredKeywords.length > 0 ? (
                    imagePreferenceData.preferredKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1.5 rounded-lg border border-black text-black text-xs font-normal"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-normal">선택 없음</span>
                  )}
                </div>
              </div>

              {/* 비선호 이미지 키워드 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
                  <h3 className="text-sm font-medium text-gray-700">비선호 이미지 키워드</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {imagePreferenceData.dislikedKeywords.length > 0 ? (
                    imagePreferenceData.dislikedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-500 text-xs font-normal flex items-center gap-1"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-normal">선택 없음</span>
                  )}
                </div>
              </div>
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-normal leading-relaxed">
                {generateImageAnalysis()}
              </p>
            </div>
          </motion.div>

          {/* Section 3: 패션 키워드 성향 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-lg font-normal tracking-wide text-black mb-4">패션 무드 방향</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* 선호 패션 키워드 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} />
                  <h3 className="text-sm font-medium text-black">선호 패션 키워드</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fashionPreferenceData.preferredStyles.length > 0 ? (
                    fashionPreferenceData.preferredStyles.map((styleId) => (
                      <span
                        key={styleId}
                        className="px-3 py-1.5 rounded-lg border border-black text-black text-xs font-normal"
                      >
                        {styleLabels[styleId] || styleId}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-normal">선택 없음</span>
                  )}
                </div>
              </div>

              {/* 비선호 패션 키워드 */}
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
                  <h3 className="text-sm font-medium text-gray-700">비선호 패션 키워드</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fashionPreferenceData.dislikedStyles.length > 0 ? (
                    fashionPreferenceData.dislikedStyles.map((styleId) => (
                      <span
                        key={styleId}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-500 text-xs font-normal flex items-center gap-1"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                        {styleLabels[styleId] || styleId}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 font-normal">선택 없음</span>
                  )}
                </div>
              </div>
            </div>

            {/* 자동 해석 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-normal leading-relaxed">
                {generateFashionAnalysis()}
              </p>
            </div>
          </motion.div>

          {/* Section 4: 종합 제안 방향 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-lg font-medium tracking-wide text-black mb-4">
              디자인 제안 핵심 방향
            </h2>

            <div className="bg-black text-white rounded-2xl p-6">
              <p className="text-sm font-medium leading-relaxed mb-6">
                {overallSuggestion.summary}
              </p>

              <div className="space-y-2">
                <p className="text-xs text-gray-300 font-medium mb-3">제안 전략:</p>
                {overallSuggestion.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 하단 버튼 */}
          <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="컨설팅 시작" />
        </div>
      </div>
    </div>
  );
}
