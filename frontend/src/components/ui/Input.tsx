'use client';

import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export const Input = ({ label, onChange, required, className, ...props }: InputProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm text-[#555555]">
          {label}
          {required && <span className="text-[#999999] ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full px-0 py-2 border-0 border-b border-[#EAEAEA] bg-transparent',
          'text-[#111111] text-sm placeholder:text-[#BBBBBB]',
          'focus:outline-none focus:border-[#111111] transition-colors',
          className
        )}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  );
};
