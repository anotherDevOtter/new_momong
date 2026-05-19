import { motion } from 'motion/react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressSteps({ currentStep, totalSteps, steps }: ProgressStepsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-16">
      {/* 스텝 번호 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between mb-3"
      >
        <span className="text-[10px] tracking-[0.25em] text-[#777777] uppercase" style={{ fontWeight: 300 }}>
          STEP {currentStep} / {totalSteps}
        </span>
        <span className="text-[11px] tracking-[0.02em] text-[#AAAAAA]" style={{ fontWeight: 300 }}>
          {steps[currentStep - 1]}
        </span>
      </motion.div>

      {/* 프로그레스 바 */}
      <div className="relative w-full h-px bg-[#E5E5E5] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute left-0 top-0 h-full bg-[#111111]"
        />
      </div>
    </div>
  );
}
