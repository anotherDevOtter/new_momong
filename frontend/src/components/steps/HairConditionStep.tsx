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

export const HairConditionStep = ({ data, gender, onChange, onNext, onBack }: HairConditionStepProps) => {
  const isValid = data.damageLevel && data.thickness && data.density && data.curl;

  const getInterpretation = () => {
    if (!isValid) return null;

    const isHighDamage = ['강손상', '극손상', '초극손상'].includes(data.damageLevel);
    const needsClinic = ['약손상', '중손상', '강손상', '극손상', '초극손상'].includes(data.damageLevel);

    if (gender === 'female') {
      return (
        <div className="space-y-3 text-white text-sm" style={{ lineHeight: '160%', fontWeight: 400 }}>
          <p>• <strong>컬 표현 가능 범위:</strong> {isHighDamage ? '제한적 (회복 우선)' : '다양한 컬 표현 가능'}</p>
          <p>• <strong>볼륨 위치:</strong> {data.density === '많다' ? '조절 가능한 볼륨' : '볼륨 강화 필요'}</p>
          <p>• <strong>클리닉 유무:</strong> {needsClinic ? '클리닉 추천' : '클리닉 불필요'}</p>
        </div>
      );
    } else {
      return (
        <div className="space-y-3 text-white text-sm" style={{ lineHeight: '160%', fontWeight: 400 }}>
          <p>• <strong>손질 난이도:</strong> {data.hairType.includes('곱슬') ? '중~높음 (스타일링 필요)' : '보통'}</p>
          <p>• <strong>스타일 유지력:</strong> {isHighDamage ? '낮음 (케어 필요)' : '좋음'}</p>
          <p>• <strong>클리닉 유무:</strong> {needsClinic ? '클리닉 추천' : '클리닉 불필요'}</p>
        </div>
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">모질 분석 및 스타일 해석</h2>
        <p className="text-sm text-[#999999]">현재 모발 상태를 체크해주세요</p>
      </div>

      <div className="space-y-10">
        <RadioGroup
          label="손상도 단계"
          options={['건강모', '약손상', '중손상', '강손상', '극손상', '초극손상']}
          selected={data.damageLevel}
          onChange={(value) => onChange({ ...data, damageLevel: value })}
        />

        <CheckboxGroup
          label="현재 모질 상태"
          options={['직모', '반곱슬', '곱슬']}
          selected={data.hairType}
          onChange={(selected) => onChange({ ...data, hairType: selected })}
        />

        <RadioGroup
          label="모발 굵기"
          options={['가늘다', '보통', '굵다']}
          selected={data.thickness}
          onChange={(value) => onChange({ ...data, thickness: value })}
          columns={3}
        />

        <RadioGroup
          label="모발 숱"
          options={['적다', '보통', '많다']}
          selected={data.density}
          onChange={(value) => onChange({ ...data, density: value })}
          columns={3}
        />

        <RadioGroup
          label="곱슬 정도"
          options={['곱슬 없음', '부분', '전체']}
          selected={data.curl}
          onChange={(value) => onChange({ ...data, curl: value })}
          columns={3}
        />

        {isValid && (
          <div className="bg-[#111111] px-8 py-6">
            <div className="text-xs text-white mb-3" style={{ letterSpacing: '0.03em', opacity: 0.8, fontWeight: 600 }}>
              {gender === 'female' ? '여성 스타일 해석' : '남성 스타일 해석'}
            </div>
            {getInterpretation()}
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!isValid}>다음</Button>
      </div>
    </div>
  );
};
