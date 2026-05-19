import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextDisabled = false,
  nextLabel = '다음',
  backLabel = '이전',
  showBack = true,
  showNext = true,
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="flex gap-4 mt-20"
    >
      {/* 이전 버튼 */}
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white border border-[#111111] text-[#111111] text-[13px] tracking-[0.02em] transition-all duration-200 hover:bg-[#FAFAFA]"
          style={{ fontWeight: 400 }}
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>{backLabel}</span>
        </button>
      )}

      {/* 다음 버튼 */}
      {showNext && onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={`
            group flex-1 inline-flex items-center justify-center gap-2 px-10 py-5
            text-[13px] tracking-[0.02em]
            transition-all duration-200
            ${
              nextDisabled
                ? 'bg-[#E5E5E5] text-[#999999] cursor-not-allowed'
                : 'bg-[#111111] text-white hover:bg-[#222222] cursor-pointer'
            }
          `}
          style={{ fontWeight: 400 }}
        >
          <span>{nextLabel}</span>
          {!nextDisabled && (
            <motion.span
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </motion.span>
          )}
        </button>
      )}
    </motion.div>
  );
}
