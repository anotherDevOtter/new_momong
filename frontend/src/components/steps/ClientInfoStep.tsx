'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { ClientInfo } from '@/types';

interface ClientInfoStepProps {
  data: ClientInfo;
  onChange: (data: ClientInfo) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ClientInfoStep = ({ data, onChange, onNext, onBack }: ClientInfoStepProps) => {
  const isValid = data.name && data.phone && data.ageGroup && data.gender;

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">고객 기본 정보</h2>
        <p className="text-sm text-[#999999]">정확한 컨설팅을 위해 기본 정보를 입력해주세요</p>
      </div>

      <div className="space-y-8">
        <Input
          label="고객명"
          value={data.name}
          onChange={(value) => onChange({ ...data, name: value })}
          required
        />
        <Input
          label="연락처"
          value={data.phone}
          onChange={(value) => onChange({ ...data, phone: value })}
          type="tel"
          placeholder="010-0000-0000"
          required
        />
        <RadioGroup
          label="연령대"
          options={['20-30대', '40대', '50대', '60대 이상']}
          selected={data.ageGroup}
          onChange={(value) => onChange({ ...data, ageGroup: value })}
        />
        <RadioGroup
          label="성별"
          options={['여자', '남자']}
          selected={data.gender === 'female' ? '여자' : data.gender === 'male' ? '남자' : ''}
          onChange={(value) => onChange({ ...data, gender: value === '여자' ? 'female' : 'male' })}
        />
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!isValid}>다음</Button>
      </div>
    </div>
  );
};
