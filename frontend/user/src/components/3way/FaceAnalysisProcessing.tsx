import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock } from 'lucide-react';

interface FaceAnalysisProcessingProps {
  onComplete: () => void;
}

export function FaceAnalysisProcessing({ onComplete }: FaceAnalysisProcessingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ['랜드마크 추출 중…', '비율 계산 중…', '이미지 타입 도출 중…'];

  useEffect(() => {
    // 각 단계를 1.5초 간격으로 진행
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // 마지막 단계 완료 후 1.5초 대기 후 다음 페이지로
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12"
    >
      {/* 상단 Step 표시 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-3 text-center"
      >
        <p className="text-xs text-gray-500 font-light tracking-wider mb-2">Step 7 of 12</p>
        <p className="text-xs tracking-[0.25em] text-gray-500 font-light uppercase">
          AI Face Analysis
        </p>
      </motion.div>

      {/* 메인 타이틀 */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-xl md:text-2xl font-light tracking-wide text-black mb-8 text-center"
      >
        얼굴, 이목구비 정밀 분석을 진행 중입니다
      </motion.h1>

      {/* 구분선 */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="w-16 h-px bg-gray-300 mb-12"
      />

      {/* 단계별 텍스트 표시 */}
      <div className="min-h-[120px] flex flex-col items-center justify-center space-y-4 mb-12">
        {steps.map((step, index) => (
          <AnimatePresence key={index}>
            {index <= currentStep && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: index === currentStep ? 1 : 0.4,
                  y: 0,
                }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <p
                  className={`text-sm md:text-base font-light tracking-wide flex items-center gap-1 ${
                    index === currentStep ? 'text-black' : 'text-gray-400'
                  }`}
                >
                  {step.replace('…', '')}
                  {index === currentStep && (
                    <span className="inline-flex gap-0.5">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      >
                        .
                      </motion.span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      >
                        .
                      </motion.span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      >
                        .
                      </motion.span>
                    </span>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* 미니멀 로딩 애니메이션 - 얇은 원형 라인 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-16"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" className="text-gray-800">
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="90, 113"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>
      </motion.div>

      {/* 하단 보조 텍스트 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="flex items-center gap-2 text-xs text-gray-400 font-light"
      >
        <Lock className="w-3 h-3" strokeWidth={1.5} />
        <span className="tracking-wide">사진 데이터는 분석 외 용도로 저장되지 않습니다.</span>
      </motion.div>
    </motion.div>
  );
}
