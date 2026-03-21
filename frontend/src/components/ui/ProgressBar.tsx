'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const progress = (currentStep / (totalSteps - 1)) * 100;

  return (
    <div className="w-full bg-white border-b border-[#F0F0F0]">
      <div className="h-[73px] flex items-center px-6">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#999999] tracking-[0.1em] uppercase">
              Step {currentStep} / {totalSteps - 1}
            </span>
          </div>
          <div className="h-px bg-[#F0F0F0] w-full">
            <div
              className="h-full bg-[#111111] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
