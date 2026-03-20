'use client';

import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FashionStyle } from '@/types';

interface FashionStyleStepProps {
  data: FashionStyle;
  gender: 'female' | 'male';
  onChange: (data: FashionStyle) => void;
  onNext: () => void;
  onBack: () => void;
}

const femaleStyles = [
  '캐주얼', '스트릿', '미니멀', '모던', '클래식',
  '로맨틱', '걸리시', '보헤미안', '스포티', '빈티지',
];

const maleStyles = [
  '캐주얼', '스트릿', '미니멀', '모던', '클래식',
  '아메카지', '스포티', '포멀', '빈티지', '밀리터리',
];

export const FashionStyleStep = ({ data, gender, onChange, onNext, onBack }: FashionStyleStepProps) => {
  const styles = gender === 'female' ? femaleStyles : maleStyles;

  const toggle = (style: string) => {
    if (data.selected.includes(style)) {
      onChange({ selected: data.selected.filter((s) => s !== style) });
    } else {
      onChange({ selected: [...data.selected, style] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">FASHION STYLE</h2>
        <p className="text-sm text-[#999999]">평소 선호하는 패션 스타일을 선택해주세요 (복수 선택 가능)</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => {
          const isSelected = data.selected.includes(style);
          return (
            <button
              key={style}
              type="button"
              onClick={() => toggle(style)}
              className={cn(
                'h-14 flex items-center justify-between px-5 border transition-all duration-200',
                isSelected
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#111111]'
              )}
            >
              <span className="text-sm font-medium">{style}</span>
              {isSelected && <Check size={16} strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth>다음</Button>
      </div>
    </div>
  );
};
