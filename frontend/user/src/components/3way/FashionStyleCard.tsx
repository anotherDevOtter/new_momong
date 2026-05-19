import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

interface FashionStyleCardProps {
  label: string;
  imageUrl: string;
  selected: boolean;
  isDisliked?: boolean;
  onToggle: () => void;
}

export function FashionStyleCard({
  label,
  imageUrl,
  selected,
  isDisliked = false,
  onToggle,
}: FashionStyleCardProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className="relative w-full group"
    >
      {/* 이미지 컨테이너 */}
      <div
        className={`
          relative w-full aspect-square overflow-hidden
          transition-all duration-200
          ${selected ? 'ring-2 ring-[#111111] ring-offset-0' : 'ring-1 ring-[#E5E5E5]'}
        `}
      >
        {/* 배경 이미지 */}
        <img
          src={imageUrl}
          alt={label}
          className={`
            w-full h-full object-cover transition-all duration-300
            ${selected && isDisliked ? 'grayscale brightness-90' : ''}
            ${!selected ? 'group-hover:scale-102' : ''}
          `}
        />

        {/* 선호 선택 시 오버레이 */}
        {selected && !isDisliked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/10"
          />
        )}

        {/* 선호 선택 시 체크 아이콘 */}
        {selected && !isDisliked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#111111] flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
          </motion.div>
        )}

        {/* 비선호 선택 시 X 아이콘 */}
        {selected && isDisliked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="absolute top-3 right-3 w-6 h-6 bg-[#111111] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </motion.div>
        )}
      </div>

      {/* 라벨 */}
      <div className="mt-3 text-center">
        <span
          className={`
            text-[13px] tracking-[0.02em] transition-colors duration-200
            ${selected ? 'text-[#111111]' : 'text-[#777777]'}
          `}
          style={{ fontWeight: selected ? 400 : 300 }}
        >
          {label}
        </span>
      </div>
    </motion.button>
  );
}
