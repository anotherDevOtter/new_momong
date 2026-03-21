'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxGroupProps {
  label?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export const CheckboxGroup = ({ label, options, selected, onChange }: CheckboxGroupProps) => {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

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
