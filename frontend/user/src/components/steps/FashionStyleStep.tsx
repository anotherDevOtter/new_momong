'use client';

import { Button } from '@/components/ui/Button';
import { FitFashionStyleCard } from '@/components/ui/FitFashionStyleCard';
import { FashionStyle } from '@/types';
import { FEMALE_FASHION_STYLES, MALE_FASHION_STYLES } from '@/data/fashion-styles';

interface FashionStyleStepProps {
  data: FashionStyle;
  gender: 'female' | 'male';
  onChange: (data: FashionStyle) => void;
  onNext: () => void;
  onBack: () => void;
}



export const FashionStyleStep = ({ data, gender, onChange, onNext, onBack }: FashionStyleStepProps) => {
  const fashionStyles = gender === 'female' ? FEMALE_FASHION_STYLES : MALE_FASHION_STYLES;
  const styleKeys = Object.keys(fashionStyles);

  const toggle = (style: string) => {
    if (data.selected.includes(style)) {
      onChange({ selected: data.selected.filter((s) => s !== style) });
    } else {
      onChange({ selected: [...data.selected, style] });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">선호하는 패션 키워드</h2>
        <p className="text-sm text-[#999999]">
          마음에 드는 스타일을 자유롭게 선택해주세요 (복수 선택 가능)
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {styleKeys.map((style) => (
          <FitFashionStyleCard
            key={style}
            title={style}
            images={fashionStyles[style]}
            selected={data.selected.includes(style)}
            onClick={() => toggle(style)}
          />
        ))}
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth>다음</Button>
      </div>
    </div>
  );
};
