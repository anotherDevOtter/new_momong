'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn(
        'h-12 px-6 font-medium text-[15px] transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-[#111111] text-white hover:bg-[#222222]',
        variant === 'secondary' && 'border border-[#E5E5E5] text-[#777777] bg-white hover:border-[#111111] hover:text-[#111111]',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
