'use client';

import { Button } from '@/components/ui/Button';
import { ConsultationData } from '@/types';

interface DesignSummaryStepProps {
  data: ConsultationData;
  onNext: () => void;
  onBack: () => void;
}

export const DesignSummaryStep = ({ data, onNext, onBack }: DesignSummaryStepProps) => {
  const { clientInfo, todayKeyword, fashionStyle } = data;

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">INFO</h2>
        <p className="text-sm text-[#999999]">컨설팅 전 정보 요약</p>
      </div>

      <div className="space-y-6">
        {/* 고객 정보 */}
        <div className="border border-[#EAEAEA] p-6 space-y-3">
          <h3 className="text-xs tracking-[0.15em] text-[#999999] uppercase">고객 정보</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#999999]">이름: </span>{clientInfo.name}</div>
            <div><span className="text-[#999999]">연락처: </span>{clientInfo.phone}</div>
            <div><span className="text-[#999999]">연령대: </span>{clientInfo.ageGroup}</div>
            <div><span className="text-[#999999]">성별: </span>{clientInfo.gender === 'female' ? '여성' : '남성'}</div>
          </div>
        </div>

        {/* 오늘의 키워드 */}
        <div className="border border-[#EAEAEA] p-6 space-y-3">
          <h3 className="text-xs tracking-[0.15em] text-[#999999] uppercase">Today Keyword</h3>
          <div className="space-y-2 text-sm">
            {todayKeyword.faceConcerns.length > 0 && (
              <div>
                <span className="text-[#999999]">얼굴 고민: </span>
                {todayKeyword.faceConcerns.join(', ')}
              </div>
            )}
            {todayKeyword.hairConcerns.length > 0 && (
              <div>
                <span className="text-[#999999]">헤어 고민: </span>
                {todayKeyword.hairConcerns.join(', ')}
              </div>
            )}
            {todayKeyword.imageKeywords.length > 0 && (
              <div>
                <span className="text-[#999999]">이미지 키워드: </span>
                {todayKeyword.imageKeywords.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* 패션 스타일 */}
        {fashionStyle.selected.length > 0 && (
          <div className="border border-[#EAEAEA] p-6 space-y-3">
            <h3 className="text-xs tracking-[0.15em] text-[#999999] uppercase">Fashion Style</h3>
            <div className="flex flex-wrap gap-2">
              {fashionStyle.selected.map((s) => (
                <span key={s} className="px-3 py-1 bg-[#111111] text-white text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[#999999]">*디자이너 내부 확인용입니다</p>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth>다음</Button>
      </div>
    </div>
  );
};
