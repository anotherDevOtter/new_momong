'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxGroupProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  variant?: 'default' | 'button-grid';
}

export const CheckboxGroup = ({ label, options, selected, onChange, variant = 'default' }: CheckboxGroupProps) => {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  if (variant === 'button-grid') {
    return (
      <div className="space-y-3">
        {label && <label className="block text-sm font-medium text-[#111111]">{label}</label>}
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className={cn(
                  'h-14 px-4 flex items-center gap-3 text-sm font-medium transition-all border',
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] transition-all',
                    isSelected
                      ? 'bg-white border-white'
                      : 'bg-white border-[#CCCCCC]'
                  )}
                >
                  {isSelected && <Check size={12} color="#111111" strokeWidth={3} />}
                </div>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm text-[#555555]">{label}</label>}
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className="flex items-center gap-2 group"
            >
              <div
                className={cn(
                  'w-5 h-5 flex items-center justify-center border-[1.5px] transition-all',
                  isSelected
                    ? 'bg-[#111111] border-[#111111]'
                    : 'bg-white border-[#CCCCCC] group-hover:border-[#111111]'
                )}
              >
                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </div>
              <span className="text-sm text-[#111111]">{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
