import { useState } from 'react';
import { motion } from 'motion/react';
import { BrandHeader } from './BrandHeader';
import { ProgressSteps } from './ProgressSteps';
import { NavigationButtons } from './NavigationButtons';
import { KeywordCard } from './KeywordCard';

interface ImagePreferenceDiagnosisProps {
  onBack: () => void;
  onNext: (data: ImagePreferenceData) => void;
}

export interface ImagePreferenceData {
  preferredKeywords: string[];
  dislikedKeywords: string[];
}

export function ImagePreferenceDiagnosis({ onBack, onNext }: ImagePreferenceDiagnosisProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [preferredKeywords, setPreferredKeywords] = useState<string[]>(
    isDev ? ['청초한', '단아한', '자연스러운'] : [],
  );
  const [dislikedKeywords, setDislikedKeywords] = useState<string[]>(
    isDev ? ['귀여운 / 사랑스러운'] : [],
  );

  const keywords = [
    '귀여운 / 사랑스러운',
    '어려보이는',
    '프레시한',
    '청초한',
    '부드러운 / 여성스러운',
    '단아한',
    '시크 / 세련된',
    '우아한 / 클래식한',
    '자연스러운',
    '지적인 / 현대적인',
  ];

  const togglePreferred = (keyword: string) => {
    if (preferredKeywords.includes(keyword)) {
      setPreferredKeywords(preferredKeywords.filter((k) => k !== keyword));
    } else {
      setPreferredKeywords([...preferredKeywords, keyword]);
      // 비선호 키워드에서 제거 (충돌 방지)
      if (dislikedKeywords.includes(keyword)) {
        setDislikedKeywords(dislikedKeywords.filter((k) => k !== keyword));
      }
    }
  };

  const toggleDisliked = (keyword: string) => {
    if (dislikedKeywords.includes(keyword)) {
      setDislikedKeywords(dislikedKeywords.filter((k) => k !== keyword));
    } else {
      setDislikedKeywords([...dislikedKeywords, keyword]);
      // 선호 키워드에서 제거 (충돌 방지)
      if (preferredKeywords.includes(keyword)) {
        setPreferredKeywords(preferredKeywords.filter((k) => k !== keyword));
      }
    }
  };

  const handleNext = () => {
    const data: ImagePreferenceData = {
      preferredKeywords,
      dislikedKeywords,
    };
    onNext(data);
  };

  const isValid = preferredKeywords.length > 0 || dislikedKeywords.length > 0;

  const steps = [
    '코스 선택',
    '고객 정보',
    '고민 체크',
    '이미지 선호',
    '진단 5',
    '진단 6',
    '진단 7',
    '진단 8',
    '진단 9',
    '진단 10',
    '진단 11',
    '결과',
  ];

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-2xl mx-auto">
        {/* 프로그레스 스텝 */}
        <ProgressSteps currentStep={4} totalSteps={12} steps={steps} />

        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em]">
            이미지 선호도
          </h2>
          <p className="text-sm text-[#999999]">좋아하는 이미지와 선호하지 않는 이미지를 선택해주세요</p>
        </motion.div>

        {/* Section 1: 선호 이미지 키워드 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">Q. 선호 이미지 키워드</h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-2 gap-4">
            {keywords.map((keyword, index) => (
              <motion.div
                key={`preferred-${keyword}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.04, duration: 0.5 }}
              >
                <KeywordCard
                  label={keyword}
                  selected={preferredKeywords.includes(keyword)}
                  onToggle={() => togglePreferred(keyword)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section 2: 비선호 이미지 키워드 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">Q. 선호하지 않는 이미지 키워드</h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-2 gap-4">
            {keywords.map((keyword, index) => (
              <motion.div
                key={`disliked-${keyword}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.04, duration: 0.5 }}
              >
                <KeywordCard
                  label={keyword}
                  selected={dislikedKeywords.includes(keyword)}
                  onToggle={() => toggleDisliked(keyword)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 하단 버튼 */}
        <NavigationButtons 
          onBack={onBack} 
          onNext={handleNext} 
          nextDisabled={!isValid}
          backLabel="이전"
          nextLabel="다음"
        />
      </div>
    </div>
  );
}