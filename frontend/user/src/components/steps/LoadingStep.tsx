'use client';

import { useEffect } from 'react';

interface LoadingStepProps {
  clientName: string;
  onNext: () => void;
  onBack: () => void;
}

export const LoadingStep = ({ clientName, onNext }: LoadingStepProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onNext();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-2">
          <p className="text-xs tracking-[0.2em] text-[#999999] uppercase">Analyzing</p>
          <p className="text-lg font-medium text-[#111111]">
            {clientName}님의 FIT을 분석 중입니다
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#111111] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
