import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  recommended?: boolean;
  description?: string;
  options?: { label: string; items: string[] }[];
  services: string;
  footer?: string;
  selected: boolean;
  onSelect: () => void;
}

export function CourseCard({
  id,
  title,
  recommended,
  description,
  options,
  services,
  footer,
  selected,
  onSelect,
}: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      onClick={onSelect}
      className={`
        relative w-full p-8 cursor-pointer bg-white text-[#111111] border transition-colors
        ${selected ? 'border-[#111111]' : 'border-[#E5E5E5] hover:border-[#111111]'}
      `}
    >
      {/* 상단: 타이틀과 선택 표시 */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-lg font-semibold text-[#111111] tracking-[-0.01em]">
              {title}
            </h3>
            {recommended && (
              <span className="px-3 py-1 bg-[#111111] text-white text-[10px] tracking-[0.15em] uppercase font-medium">
                추천
              </span>
            )}
          </div>
        </div>

        {/* 선택 체크박스 */}
        <div
          className={`
            w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] transition-all
            ${selected ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC]'}
          `}
        >
          {selected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
        </div>
      </div>

      {/* 구성 설명 */}
      <div className="mb-8">
        <p className="text-[10px] text-[#AAAAAA] mb-3 tracking-[0.15em] uppercase font-medium">
          COMPOSITION
        </p>
        {options ? (
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={idx}>
                <p className="text-sm text-[#777777] mb-1">{option.label}</p>
                <p className="text-sm font-medium text-[#111111] leading-[1.6]">
                  {option.items.join(' + ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-[#111111] leading-[1.6]">{description}</p>
        )}
      </div>

      {/* 제공 서비스 */}
      <div className="mb-6 pb-6 border-b border-[#E5E5E5]">
        <p className="text-[10px] text-[#AAAAAA] mb-3 tracking-[0.15em] uppercase font-medium">
          SERVICES
        </p>
        <p className="text-sm text-[#777777] leading-[1.6]">{services}</p>
      </div>

      {/* 하단 문구 */}
      {footer && (
        <p className="text-xs text-[#AAAAAA] text-center">{footer}</p>
      )}
    </motion.div>
  );
}
