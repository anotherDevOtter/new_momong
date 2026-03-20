'use client';

import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { HairStyleProposal } from '@/types';

interface HairStyleProposalStepProps {
  data: HairStyleProposal;
  gender: 'female' | 'male';
  onChange: (data: HairStyleProposal) => void;
  onNext: () => void;
  onBack: () => void;
}

export const HairStyleProposalStep = ({ data, onChange, onNext, onBack }: HairStyleProposalStepProps) => {
  const lengthOptions = ['숏', '단발', '미디움', '롱'];

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">헤어스타일 제안</h2>
        <p className="text-sm text-[#999999]">오늘의 헤어스타일 방향을 제안합니다</p>
      </div>

      <div className="space-y-8">
        <RadioGroup
          label="제안 길이"
          options={lengthOptions}
          selected={data.length}
          onChange={(value) => onChange({ ...data, length: value })}
          columns={4}
        />
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!data.length}>다음</Button>
      </div>
    </div>
  );
};
