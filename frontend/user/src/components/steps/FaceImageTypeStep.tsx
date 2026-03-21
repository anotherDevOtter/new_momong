'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { FaceImageType } from '@/types';
import femaleWarmImg from '@/assets/329284aaf7eef2dfe18e02a05fa4e3e1dc8091ef.png';
import femaleCoolImg from '@/assets/ed209c39c246311dabdb6ca823daf3217eb1a486.png';
import maleWarmImg from '@/assets/a70500818236e88ff485c4e2f79f44d028e26565.png';
import maleCoolImg from '@/assets/a687d012677038a8898c766546fda97c71da3b3c.png';

interface FaceImageTypeStepProps {
  data: FaceImageType;
  gender: 'female' | 'male';
  onChange: (data: FaceImageType) => void;
  onNext: () => void;
  onBack: () => void;
}

const interpretationType = (type: string, gender: 'female' | 'male') => {
  const map: Record<string, string> = {
    warm: gender === 'female' ? '귀여운, 사랑스러운, 부드러운' : '귀여운, 부드러운, 친근한',
    neutral: '자연스러운, 균형잡힌',
    cool: gender === 'female' ? '세련된, 시크한, 우아한' : '세련된, 시크한, 지적인',
  };
  return map[type] || '';
};

export const FaceImageTypeStep = ({ data, gender, onChange, onNext, onBack }: FaceImageTypeStepProps) => {
  const isValid =
    data.type &&
    data.features.face &&
    data.features.eyebrows &&
    data.features.eyes &&
    data.features.nose &&
    data.features.lips;

  return (
    <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">얼굴 & 이미지 타입 분석</h2>
        <p className="text-sm text-[#999999]">현재 얼굴이 주는 이미지를 분석합니다</p>
      </div>

      {/* 예시 이미지 */}
      <div className="border border-[#EAEAEA] p-8">
        <h3 className="text-sm font-semibold text-[#111111] mb-6 text-center tracking-[-0.01em]">
          {gender === 'female' ? '여성' : '남성'} 이미지 타입 예시
        </h3>
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'WARM', sub: gender === 'female' ? '귀여운·부드러움' : '부드러운·친근함', img: gender === 'female' ? femaleWarmImg : maleWarmImg },
            { label: 'COOL', sub: gender === 'female' ? '세련·시크함' : '세련·지적임', img: gender === 'female' ? femaleCoolImg : maleCoolImg },
          ].map(({ label, sub, img }) => (
            <div key={label} className="space-y-3">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
                <Image src={img} alt={`${label} 타입 예시`} fill className="object-cover" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm uppercase tracking-wider text-[#111111] font-semibold">{label}</div>
                <div className="text-xs text-[#999999]">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이목구비 분석 */}
      <div className="border border-[#EAEAEA] p-8 space-y-6">
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[#EAEAEA]">
          {['WARM', 'NEUTRAL', 'COOL'].map((t) => (
            <div key={t} className="text-center">
              <div className="text-sm uppercase tracking-wider text-[#111111] font-semibold">{t}</div>
            </div>
          ))}
        </div>

        <RadioGroup
          label="윤곽"
          options={['둥근', '중간', '각진']}
          selected={data.features.face}
          onChange={(value) => onChange({ ...data, features: { ...data.features, face: value } })}
          columns={3}
        />
        <RadioGroup
          label="눈썹"
          options={['둥근 내려간', '중간', '각진 올라간']}
          selected={data.features.eyebrows}
          onChange={(value) => onChange({ ...data, features: { ...data.features, eyebrows: value } })}
          columns={3}
        />
        <RadioGroup
          label="눈"
          options={['둥근 내려간 눈', '중간', '직선 올라간 눈']}
          selected={data.features.eyes}
          onChange={(value) => onChange({ ...data, features: { ...data.features, eyes: value } })}
          columns={3}
        />
        <RadioGroup
          label="코"
          options={['둥근 코', '중간', '뾰족한 코']}
          selected={data.features.nose}
          onChange={(value) => onChange({ ...data, features: { ...data.features, nose: value } })}
          columns={3}
        />
        <RadioGroup
          label="입술"
          options={['도톰', '중간', '얇은']}
          selected={data.features.lips}
          onChange={(value) => onChange({ ...data, features: { ...data.features, lips: value } })}
          columns={3}
        />
      </div>

      <RadioGroup
        label="전체 이미지 타입"
        options={['WARM', 'NEUTRAL', 'COOL']}
        selected={data.type.toUpperCase()}
        onChange={(value) =>
          onChange({ ...data, type: value.toLowerCase() as 'warm' | 'neutral' | 'cool' })
        }
        columns={3}
      />

      {data.type && (
        <div className="bg-[#111111] px-8 py-6">
          <p className="text-sm text-white leading-[160%]">
            {data.type.toUpperCase()} 타입은{' '}
            <strong>{interpretationType(data.type, gender)}</strong> 인상을 주며,
            이를 기준으로 헤어 디자인을 제안합니다.
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!isValid}>다음</Button>
      </div>
    </div>
  );
};
