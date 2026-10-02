'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

/**
 * 앱 전체 버튼의 기준 모양. 새 버튼은 <Button> 을 쓰고,
 * 아이콘 등으로 직접 그려야 할 때만 buttonClass() 로 같은 모양을 가져다 쓴다.
 *  - 높이 48px, 알약(둥근) 모양, 글씨 14px
 *  - 눌렀을 때: 살짝 작아지고 색이 진해짐 (globals.css 의 button:active 와 함께)
 *  - 누를 수 없을 때: 연한 하늘회색 바탕 + 회색 글씨 (투명도 조절 안 씀)
 */
export function buttonClass(variant: Variant = 'primary', fullWidth = false) {
  return cn(
    'inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-[14px] font-medium tracking-[0.02em]',
    'transition-colors duration-200 disabled:cursor-not-allowed',
    'disabled:bg-[#DCE4E9] disabled:text-[#777777] disabled:border-transparent',
    variant === 'primary' && 'bg-[#4B2928] text-white hover:bg-[#3A3432] active:bg-[#292625]',
    variant === 'secondary' && 'border border-[#4B2928] bg-white text-[#4B2928] hover:bg-[#F5F3EE] active:bg-[#EDE8E3]',
    variant === 'ghost' && 'bg-transparent text-[#555555] hover:bg-[#EFEFED] active:bg-[#E4E4E0]',
    fullWidth && 'w-full'
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
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
    <button className={cn(buttonClass(variant, fullWidth), className)} {...props}>
      {children}
    </button>
  );
};
