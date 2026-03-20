'use client';

import { Button } from '@/components/ui/Button';
import { ConsultationData } from '@/types';
import { CheckCircle } from 'lucide-react';

interface CompletionStepProps {
  data: ConsultationData;
  onRestart: () => void;
  onBack: () => void;
}

export const CompletionStep = ({ data, onRestart }: CompletionStepProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-10">
        <div className="flex justify-center">
          <CheckCircle size={56} className="text-[#111111]" strokeWidth={1.5} />
        </div>

        <div className="space-y-3">
          <p className="text-xs tracking-[0.2em] text-[#999999] uppercase">Consultation Complete</p>
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.02em]">
            {data.clientInfo.name}님의<br />컨설팅이 완료되었습니다
          </h2>
        </div>

        <div className="bg-[#FAFAFA] border border-[#EAEAEA] p-6 text-left space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#999999]">방문일: </span>{data.visitDate}</div>
            <div><span className="text-[#999999]">담당: </span>{data.designerName}</div>
            <div><span className="text-[#999999]">이미지 타입: </span>{data.faceImageType.type.toUpperCase()}</div>
            <div><span className="text-[#999999]">손상도: </span>{data.hairCondition.damageLevel}</div>
          </div>
          {data.todayDesign.length.length > 0 && (
            <div className="pt-3 border-t border-[#EAEAEA] text-sm">
              <span className="text-[#999999]">오늘 디자인: </span>
              {[
                data.todayDesign.length.join('/'),
                data.todayDesign.curlTexture.join('/'),
                data.todayDesign.color.join('/'),
              ].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={onRestart} variant="primary" fullWidth>
            새 컨설팅 시작
          </Button>
        </div>

        <p className="text-[11px] tracking-[0.3em] text-[#BBBBBB] uppercase">MERCI MOMONG</p>
      </div>
    </div>
  );
};
