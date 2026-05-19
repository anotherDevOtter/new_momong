import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface KeywordCardProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function KeywordCard({ label, selected, onToggle }: KeywordCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.99 }}
      className={`
        relative w-full py-5 px-4 border transition-all duration-200
        text-[14px] tracking-[0.02em] text-center
        ${
          selected
            ? 'border-[#111111] bg-white text-[#111111]'
            : 'border-[#E5E5E5] bg-white text-[#777777] hover:border-[#AAAAAA]'
        }
      `}
      style={{ fontWeight: selected ? 400 : 300 }}
    >
      {/* 체크 표시 */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute top-2 right-2 w-4 h-4 border border-[#111111] bg-[#111111] flex items-center justify-center"
        >
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </motion.div>
      )}

      {/* 키워드 텍스트 */}
      <span className="block leading-[1.6]">{label}</span>
    </motion.button>
  );
}
