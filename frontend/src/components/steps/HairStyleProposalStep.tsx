'use client';

import { Button } from '@/components/ui/Button';
import { HairStyleProposal } from '@/types';

interface HairStyleProposalStepProps {
  data: HairStyleProposal;
  gender: 'female' | 'male';
  onChange: (data: HairStyleProposal) => void;
  onNext: () => void;
  onBack: () => void;
}

const FEMALE_STYLES: Record<string, string> = {
  '롱': 'https://i.pinimg.com/736x/c8/fd/1a/c8fd1a9f61db26e2fc0638ea232d619a.jpg',
  '미디움': 'https://i.pinimg.com/736x/0a/ba/5e/0aba5eff53752e11f4cd4c4ed4482a87.jpg',
  '단발': 'https://i.pinimg.com/736x/0a/03/99/0a0399399b5b778b425d651419e6e9fb.jpg',
  '숏': 'https://i.pinimg.com/736x/3a/f7/05/3af705f77ef0def02eafe4ebacf2e8c2.jpg',
};

const MALE_STYLES: Record<string, string> = {
  '롱': 'https://i.pinimg.com/736x/07/91/9c/07919c0528c8cc0cb710025bfdc1dc8c.jpg',
  '미디움': 'https://i.pinimg.com/736x/7d/5c/8d/7d5c8d0fd9420a7a03a0e5db7efbd261.jpg',
  '숏': 'https://i.pinimg.com/736x/1d/51/53/1d5153767367848042db002fcba08c31.jpg',
};

export const HairStyleProposalStep = ({ data, gender, onChange, onNext, onBack }: HairStyleProposalStepProps) => {
  const styles = gender === 'female' ? FEMALE_STYLES : MALE_STYLES;
  const lengths = Object.keys(styles);

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">FIT 헤어스타일 제안</h2>
        <p className="text-sm text-[#999999]">원하는 길이를 선택해주세요</p>
      </div>

      <div className={`grid grid-cols-2 gap-4 ${gender === 'female' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {lengths.map((length) => (
          <button
            key={length}
            type="button"
            onClick={() => onChange({ length, referenceImage: styles[length] })}
            className={`
              relative overflow-hidden border-2 transition-all duration-200
              ${data.length === length
                ? 'border-[#111111]'
                : 'border-[#E5E5E5] hover:border-[#555555]'
              }
            `}
          >
            <div className="aspect-[1/1.6] overflow-hidden">
              <img
                src={styles[length]}
                alt={length}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className={`
              absolute bottom-0 left-0 right-0 p-3 text-center text-sm font-medium
              ${data.length === length
                ? 'bg-[#111111] text-white'
                : 'bg-white/90 text-[#111111]'
              }
            `}>
              {length}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!data.length}>다음</Button>
      </div>
    </div>
  );
};
