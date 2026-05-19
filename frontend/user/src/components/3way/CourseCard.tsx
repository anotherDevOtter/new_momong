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
        relative w-full p-8 cursor-pointer transition-all duration-200
        ${
          selected
            ? 'bg-white border-2 border-[#111111]'
            : 'bg-white border border-[#E5E5E5] hover:border-[#AAAAAA]'
        }
      `}
    >
      {/* 상단: 타이틀과 선택 표시 */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-[18px] tracking-[0.05em] text-[#111111]" style={{ fontWeight: 500 }}>
              {title}
            </h3>
            {recommended && (
              <span className="px-3 py-1 bg-[#111111] text-white text-[10px] tracking-[0.15em] uppercase" style={{ fontWeight: 400 }}>
                추천
              </span>
            )}
          </div>
        </div>

        {/* 선택 표시 */}
        <div
          className={`
            w-5 h-5 border flex items-center justify-center transition-all duration-200
            ${
              selected
                ? 'bg-[#111111] border-[#111111]'
                : 'bg-white border-[#E5E5E5]'
            }
          `}
        >
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={2.5} />}
        </div>
      </div>

      {/* 구성 설명 */}
      <div className="mb-8">
        <p className="text-[10px] text-[#AAAAAA] mb-3 tracking-[0.15em] uppercase" style={{ fontWeight: 300 }}>
          COMPOSITION
        </p>
        {options ? (
          <div className="space-y-3">
            {options.map((option, idx) => (
              <div key={idx}>
                <p className="text-[13px] text-[#777777] mb-1" style={{ fontWeight: 300 }}>
                  {option.label}
                </p>
                <p className="text-[14px] text-[#111111] leading-[1.6]" style={{ fontWeight: 400 }}>
                  {option.items.join(' + ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[14px] text-[#111111] leading-[1.6]" style={{ fontWeight: 400 }}>
            {description}
          </p>
        )}
      </div>

      {/* 제공 서비스 */}
      <div className="mb-6 pb-6 border-b border-[#E5E5E5]">
        <p className="text-[10px] text-[#AAAAAA] mb-3 tracking-[0.15em] uppercase" style={{ fontWeight: 300 }}>
          SERVICES
        </p>
        <p className="text-[13px] text-[#777777] leading-[1.6]" style={{ fontWeight: 300 }}>
          {services}
        </p>
      </div>

      {/* 하단 문구 */}
      {footer && (
        <p className="text-[11px] text-[#AAAAAA] text-center tracking-[0.02em]" style={{ fontWeight: 300 }}>
          {footer}
        </p>
      )}
    </motion.div>
  );
}
