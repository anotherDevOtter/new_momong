'use client';

import { Users } from 'lucide-react';

interface IntroStepProps {
  onNext: () => void;
  onViewClients?: () => void;
}

export const IntroStep = ({ onNext, onViewClients }: IntroStepProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-20">
      <div className="w-full max-w-[1200px] flex flex-col items-center pt-36 pb-20">
        <div className="mb-8">
          <p className="text-xs tracking-[0.2em] text-[#999999] uppercase">
            Today&apos;s Design Direction
          </p>
        </div>

        <h1
          className="font-semibold text-[#111111] tracking-[-0.02em] mb-6"
          style={{ fontSize: '80px', lineHeight: 1 }}
        >
          FIT
        </h1>

        <div className="w-10 h-px bg-[#111111] mb-10" />

        <div className="max-w-[420px] text-center mt-4 mb-14">
          <p className="text-[13px] text-[#555555] leading-[170%]">
            오늘 나에게 가장 어울리는 디자인을 제안합니다.<br />
            얼굴과 이미지 컨디션에 따라 FIT은 달라질 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onNext}
            className="w-60 h-[52px] bg-[#111111] text-white rounded-full font-medium text-[15px] hover:bg-[#222222] transition-colors duration-200"
          >
            Start
          </button>

          {onViewClients && (
            <button
              onClick={onViewClients}
              className="w-60 h-[52px] border border-[#E5E5E5] text-[#777777] rounded-full font-medium text-[15px] hover:border-[#111111] hover:text-[#111111] transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Users size={18} />
              고객 목록
            </button>
          )}
        </div>

        <div className="mt-auto pt-24">
          <p className="text-[11px] tracking-[0.3em] text-[#BBBBBB] uppercase">
            MERCI MOMONG
          </p>
        </div>
      </div>
    </div>
  );
};
