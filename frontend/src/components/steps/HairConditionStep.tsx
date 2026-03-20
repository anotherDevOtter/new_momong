'use client';

import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { HairCondition } from '@/types';

interface HairConditionStepProps {
  data: HairCondition;
  gender: 'female' | 'male';
  onChange: (data: HairCondition) => void;
  onNext: () => void;
  onBack: () => void;
}

export const HairConditionStep = ({ data, onChange, onNext, onBack }: HairConditionStepProps) => {
  const isValid = data.damageLevel && data.thickness && data.density && data.curl;

  const hairTypeOptions = ['직모', '약웨이브', '웨이브', '곱슬', '흑인형곱슬'];

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">모발 상태 진단</h2>
        <p className="text-sm text-[#999999]">현재 모발 컨디션을 체크해주세요</p>
      </div>

      <div className="space-y-10">
        <RadioGroup
          label="손상도"
          options={['건강', '약손상', '중손상', '강손상', '극손상', '초극손상']}
          selected={data.damageLevel}
          onChange={(value) => onChange({ ...data, damageLevel: value })}
        />

        <CheckboxGroup
          label="모질"
          options={hairTypeOptions}
          selected={data.hairType}
          onChange={(selected) => onChange({ ...data, hairType: selected })}
        />

        <RadioGroup
          label="두께"
          options={['가는편', '보통', '굵은편']}
          selected={data.thickness}
          onChange={(value) => onChange({ ...data, thickness: value })}
          columns={3}
        />

        <RadioGroup
          label="밀도"
          options={['적음', '보통', '많음']}
          selected={data.density}
          onChange={(value) => onChange({ ...data, density: value })}
          columns={3}
        />

        <RadioGroup
          label="웨이브"
          options={['직모', '약웨이브', '강웨이브']}
          selected={data.curl}
          onChange={(value) => onChange({ ...data, curl: value })}
          columns={3}
        />
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!isValid}>다음</Button>
      </div>
    </div>
  );
};
