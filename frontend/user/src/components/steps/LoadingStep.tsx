'use client';

import { Button } from '@/components/ui/Button';

interface LoadingStepProps {
  clientName: string;
  onNext: () => void;
  onBack: () => void;
}

export const LoadingStep = ({ clientName, onNext, onBack }: LoadingStepProps) => {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-widest text-[#111111]">FIT</h1>

        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#111111] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <p className="text-lg font-medium text-[#111111] leading-relaxed">
          오늘 {clientName} 님을 위한<br />
          FIT을 준비하고 있습니다.
        </p>

        <div className="space-y-1 pt-2">
          <p className="text-sm text-[#111111]">잠시만 기다려주세요.</p>
          <p className="text-sm text-[#111111]">담당 디자이너가 곧 이어 상담을 도와드립니다.</p>
        </div>
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth>다음</Button>
      </div>
    </div>
  );
};
