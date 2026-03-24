'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TodayDesign, NextDirection } from '@/types';

interface TodayDesignStepProps {
  todayDesign: TodayDesign;
  nextDirection: NextDirection;
  clientName: string;
  imageType: string;
  damageLevel: string;
  onTodayDesignChange: (data: TodayDesign) => void;
  onNextDirectionChange: (data: NextDirection) => void;
  onNext: () => void;
  onBack: () => void;
}

interface DesignFieldProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onOptionsChange: (options: string[]) => void;
  memo: string;
  onMemoChange: (memo: string) => void;
}

const DesignField = ({ label, options, selectedOptions, onOptionsChange, memo, onMemoChange }: DesignFieldProps) => {
  const toggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      onOptionsChange(selectedOptions.filter((o) => o !== option));
    } else {
      onOptionsChange([...selectedOptions, option]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm text-[#555555]">{label} <span className="text-[#999999]">*</span></label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          return (
            <button key={option} type="button" onClick={() => toggle(option)} className="flex items-center gap-2 group">
              <div className={cn('w-5 h-5 flex items-center justify-center border-[1.5px] transition-all', isSelected ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC] group-hover:border-[#111111]')}>
                {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </div>
              <span className="text-sm text-[#111111]">{option}</span>
            </button>
          );
        })}
      </div>
      <div className="pt-2">
        <label className="block text-xs text-[#999999] mb-2">세부사항 메모</label>
        <textarea
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="디자인 디테일 메모 입력"
          rows={2}
          className="w-full px-0 py-2 border-0 border-b border-[#EAEAEA] bg-transparent text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111] resize-none transition-colors"
        />
      </div>
    </div>
  );
};

interface NextDirectionFieldProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onOptionsChange: (options: string[]) => void;
}

const NextDirectionField = ({ label, options, selectedOptions, onOptionsChange }: NextDirectionFieldProps) => {
  const [showOptions, setShowOptions] = useState(selectedOptions.length > 0);

  const isSelected = selectedOptions.length > 0;

  const toggle = (option: string) => {
    if (selectedOptions.includes(option)) {
      onOptionsChange(selectedOptions.filter((o) => o !== option));
    } else {
      onOptionsChange([...selectedOptions, option]);
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 group w-full">
        <div className={cn('w-5 h-5 flex items-center justify-center border-[1.5px] transition-all', isSelected ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC] group-hover:border-[#111111]')}>
          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </div>
        <span className="text-sm text-[#111111]">{label}</span>
      </button>
      {showOptions && (
        <div className="pl-8 flex flex-wrap gap-3">
          {options.map((option) => {
            const isSel = selectedOptions.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggle(option)} className="flex items-center gap-2 group">
                <div className={cn('w-4 h-4 flex items-center justify-center border-[1.5px] transition-all', isSel ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC] group-hover:border-[#111111]')}>
                  {isSel && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <span className="text-sm text-[#111111]">{option}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TodayDesignStep = ({
  todayDesign, nextDirection, clientName, imageType, damageLevel,
  onTodayDesignChange, onNextDirectionChange, onNext, onBack,
}: TodayDesignStepProps) => {
  const isValid = todayDesign.length.length > 0 && todayDesign.bangs.length > 0 &&
    todayDesign.curlTexture.length > 0 && todayDesign.color.length > 0;

  const isHighDamage = ['중손상', '강손상', '극손상', '초극손상'].includes(damageLevel);

  const otherOptions = ['앞머리 디자인 변경', '펌 / 볼륨 추가', '손상도 회복 후 디자인 확장', '이미지 변화 컨설팅'];

  const toggleOther = (option: string) => {
    if (nextDirection.others.includes(option)) {
      onNextDirectionChange({ ...nextDirection, others: nextDirection.others.filter((o) => o !== option) });
    } else {
      onNextDirectionChange({ ...nextDirection, others: [...nextDirection.others, option] });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">TODAY DESIGN 정리</h2>
        <p className="text-sm text-[#999999]">오늘의 디자인 요소를 입력해주세요</p>
      </div>

      <div className="space-y-8">
        <DesignField
          label="길이"
          options={['숏', '단발', '미디움', '롱']}
          selectedOptions={todayDesign.length}
          onOptionsChange={(opts) => onTodayDesignChange({ ...todayDesign, length: opts })}
          memo={todayDesign.lengthMemo}
          onMemoChange={(m) => onTodayDesignChange({ ...todayDesign, lengthMemo: m })}
        />
        <DesignField
          label="앞머리"
          options={['없음', '시스루', '풀뱅', '사이드뱅', '스틱뱅', '처피뱅', '남자']}
          selectedOptions={todayDesign.bangs}
          onOptionsChange={(opts) => onTodayDesignChange({ ...todayDesign, bangs: opts })}
          memo={todayDesign.bangsMemo}
          onMemoChange={(m) => onTodayDesignChange({ ...todayDesign, bangsMemo: m })}
        />
        <DesignField
          label="컬 / 질감"
          options={['스트레이트', 'C컬', 'S컬', 'CS컬', '웨이브']}
          selectedOptions={todayDesign.curlTexture}
          onOptionsChange={(opts) => onTodayDesignChange({ ...todayDesign, curlTexture: opts })}
          memo={todayDesign.curlTextureMemo}
          onMemoChange={(m) => onTodayDesignChange({ ...todayDesign, curlTextureMemo: m })}
        />
        <DesignField
          label="컬러"
          options={['톤다운', '톤업', '뿌리', '탈색', '현재 상태 유지']}
          selectedOptions={todayDesign.color}
          onOptionsChange={(opts) => onTodayDesignChange({ ...todayDesign, color: opts })}
          memo={todayDesign.colorMemo}
          onMemoChange={(m) => onTodayDesignChange({ ...todayDesign, colorMemo: m })}
        />
      </div>

      <div className="border border-[#EAEAEA] p-6 space-y-2">
        <p className="text-sm">
          오늘 디자인은 <strong>{imageType.toUpperCase()}</strong> 인상과 현재 얼굴과 모질 컨디션을 기준으로
          <strong> {clientName}</strong>님께 가장 어울리는 방향으로 제안되었습니다.
        </p>
        {isHighDamage && (
          <p className="text-sm text-[#999999]">
            모발 컨디션을 고려해 과한 디자인 요소는 배제하고 회복을 우선한 방향으로 조율했습니다.
          </p>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-[#111111] tracking-[-0.01em]">NEXT DIRECTION</h3>
        <p className="text-sm text-[#999999]">다음 디자인 제안 방향을 선택해주세요</p>

        <div className="space-y-4">
          <NextDirectionField
            label="길이 변화"
            options={['롱', '미디움', '단발', '숏']}
            selectedOptions={nextDirection.lengthChange}
            onOptionsChange={(opts) => onNextDirectionChange({ ...nextDirection, lengthChange: opts })}
          />
          <NextDirectionField
            label="컬러 변화"
            options={['톤업', '톤다운', '탈색', '특수컬러']}
            selectedOptions={nextDirection.colorChange}
            onOptionsChange={(opts) => onNextDirectionChange({ ...nextDirection, colorChange: opts })}
          />
          {otherOptions.map((option) => {
            const isSel = nextDirection.others.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggleOther(option)} className="flex items-center gap-2 group w-full">
                <div className={cn('w-5 h-5 flex items-center justify-center border-[1.5px] transition-all', isSel ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC] group-hover:border-[#111111]')}>
                  {isSel && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </div>
                <span className="text-sm text-[#111111]">{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4 pt-8">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button onClick={onNext} variant="primary" fullWidth disabled={!isValid}>다음</Button>
      </div>
    </div>
  );
};
