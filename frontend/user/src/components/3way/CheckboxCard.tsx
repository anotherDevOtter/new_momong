import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface CheckboxCardProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  hasTextInput?: boolean;
  textValue?: string;
  onTextChange?: (value: string) => void;
}

export function CheckboxCard({
  label,
  checked,
  onChange,
  hasTextInput,
  textValue,
  onTextChange,
}: CheckboxCardProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={!hasTextInput ? onChange : undefined}
        className={`
          relative rounded-xl p-5 border transition-all duration-300 cursor-pointer
          ${
            checked
              ? 'bg-gray-50 border-black'
              : 'bg-white border-gray-200 hover:border-gray-300'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-light text-gray-800">{label}</span>

          {/* 체크박스 */}
          <div
            onClick={hasTextInput ? onChange : undefined}
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300
              ${
                checked
                  ? 'bg-black border-black'
                  : 'bg-white border-gray-300'
              }
            `}
          >
            {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>
      </motion.div>

      {/* 기타 고민 텍스트 입력 */}
      {hasTextInput && checked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-3"
        >
          <textarea
            value={textValue}
            onChange={(e) => onTextChange?.(e.target.value)}
            placeholder="고민 내용을 입력해주세요"
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-light placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors duration-300 resize-none"
          />
        </motion.div>
      )}
    </div>
  );
}
