'use client';

import { Button } from '@/components/ui/Button';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { TodayKeyword } from '@/types';

interface TodayKeywordStepProps {
  data: TodayKeyword;
  gender: 'female' | 'male';
  onChange: (data: TodayKeyword) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TodayKeywordStep = ({ data, gender, onChange, onNext, onBack }: TodayKeywordStepProps) => {
  const faceConcernOptions = [
    '이마', '광대', '볼 옆 라인', '턱선', '얼굴 전체 비율',
    '얼굴이 길어 보이는 느낌', '얼굴이 커 보이는 느낌', '기타',
  ];

  const hairConcernOptions = [
    '앞머리', '정수리 볼륨', '옆 볼륨', '스타일 변화',
    '모발 손상', '모질', '두피', '기타',
  ];

  const femaleImageKeywords = [
    '귀여운/사랑스러운', '어려보이는', '프레시한', '청초한',
    '부드러운/여성스러운', '단아한', '시크/세련된',
    '우아한/클래식한', '자연스러운', '지적인/현대적인',
  ];

  const maleImageKeywords = [
    '귀여운/어려보이는', '단정한',
    '부드러운/젠틀한', '강한/카리스마있는', '시크/세련된',
    '클래식한', '자연스러운', '지적인/현대적인',
  ];

  const imageKeywords = gender === 'female' ? femaleImageKeywords : maleImageKeywords;

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">TODAY KEYWORD</h2>
        <p className="text-sm text-[#999999]">오늘의 상태를 체크해주세요</p>
      </div>

      <div className="space-y-10">
        <div className="space-y-4">
          <CheckboxGroup
            label="Q. 얼굴 중 보완을 원하는 부위"
            options={faceConcernOptions}
            selected={data.faceConcerns}
            onChange={(selected) => onChange({ ...data, faceConcerns: selected })}
            variant="button-grid"
          />
          {data.faceConcerns.includes('기타') && (
            <div className="ml-6">
              <textarea
                className="w-full px-4 py-3 border border-[#EAEAEA] text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-1 focus:ring-[#111111] resize-none"
                placeholder="기타 보완 희망 부위를 입력해주세요"
                rows={3}
                value={data.faceConcernsMemo}
                onChange={(e) => onChange({ ...data, faceConcernsMemo: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CheckboxGroup
            label="Q. 요즘 헤어 고민"
            options={hairConcernOptions}
            selected={data.hairConcerns}
            onChange={(selected) => onChange({ ...data, hairConcerns: selected })}
            variant="button-grid"
          />
          {data.hairConcerns.includes('기타') && (
            <div className="ml-6">
              <textarea
                className="w-full px-4 py-3 border border-[#EAEAEA] text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:ring-1 focus:ring-[#111111] resize-none"
                placeholder="기타 헤어 고민을 입력해주세요"
                rows={3}
                value={data.hairConcernsMemo}
                onChange={(e) => onChange({ ...data, hairConcernsMemo: e.target.value })}
              />
            </div>
          )}
        </div>

        <CheckboxGroup
          label="Q. 선호 이미지 키워드"
          options={imageKeywords}
          selected={data.imageKeywords}
          onChange={(selected) => onChange({ ...data, imageKeywords: selected })}
          variant="button-grid"
        />
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth>다음</Button>
      </div>
    </div>
  );
};
