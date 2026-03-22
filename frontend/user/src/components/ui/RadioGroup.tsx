'use client';

import { cn } from '@/lib/utils';

interface RadioGroupProps {
  label?: string;
  labelClassName?: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  columns?: number;
  variant?: 'default' | 'button-grid';
}

export const RadioGroup = ({ label, labelClassName, options, selected, onChange, columns, variant = 'default' }: RadioGroupProps) => {
  if (variant === 'button-grid') {
    const cols = columns ?? 2;
    return (
      <div className="space-y-3">
        {label && <label className={cn('block text-sm font-medium text-[#111111]', labelClassName)}>{label}</label>}
        <div className={cn('grid gap-2', `grid-cols-${cols}`)}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'h-14 px-4 text-sm font-medium transition-all border',
                selected === option
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm text-[#555555]">{label}</label>}
      <div
        className={cn('flex flex-wrap gap-3', columns && `grid grid-cols-${columns}`)}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex items-center gap-2 group'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all',
                selected === option
                  ? 'border-[#111111] bg-[#111111]'
                  : 'border-[#CCCCCC] bg-white group-hover:border-[#111111]'
              )}
            >
              {selected === option && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            <span className="text-sm text-[#111111]">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
