'use client';

import { cn } from '@/lib/utils';

interface RadioGroupProps {
  label?: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  columns?: number;
}

export const RadioGroup = ({ label, options, selected, onChange, columns }: RadioGroupProps) => {
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
