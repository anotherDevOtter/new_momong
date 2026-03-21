'use client';

import { cn } from '@/lib/utils';
import { CycleMonth } from '@/types';

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const SERVICES = ['Cut', 'Perm', 'Color', 'Clinic'];

interface DesignCycleGuideProps {
  selectedMonths: CycleMonth[];
  onChange: (selectedMonths: CycleMonth[]) => void;
}

export const DesignCycleGuide = ({ selectedMonths, onChange }: DesignCycleGuideProps) => {
  const getMonthData = (month: string): CycleMonth =>
    selectedMonths.find((m) => m.month === month) || { month, services: [], memo: '' };

  const updateMonthData = (month: string, services: string[], memo: string) => {
    if (services.length === 0 && !memo) {
      onChange(selectedMonths.filter((m) => m.month !== month));
    } else if (selectedMonths.find((m) => m.month === month)) {
      onChange(selectedMonths.map((m) => (m.month === month ? { month, services, memo } : m)));
    } else {
      onChange([...selectedMonths, { month, services, memo }]);
    }
  };

  const toggleService = (month: string, service: string) => {
    const d = getMonthData(month);
    const newServices = d.services.includes(service)
      ? d.services.filter((s) => s !== service)
      : [...d.services, service];
    updateMonthData(month, newServices, d.memo);
  };

  const updateMemo = (month: string, memo: string) => {
    const d = getMonthData(month);
    updateMonthData(month, d.services, memo);
  };

  const summary = selectedMonths.length === 0
    ? '선택된 방문 계획이 없습니다.'
    : selectedMonths.map((m) => {
        const parts = [];
        if (m.services.length > 0) parts.push(m.services.join(', '));
        if (m.memo) parts.push(`(${m.memo})`);
        return `${m.month}: ${parts.join(' ') || '시술 미정'}`;
      }).join(' / ');

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-[#111111] tracking-[-0.01em]">DESIGN CYCLE GUIDE</h3>
      <div className="grid grid-cols-3 gap-4">
        {MONTHS.map((month) => {
          const d = getMonthData(month);
          const hasData = d.services.length > 0 || d.memo;
          return (
            <div key={month} className={cn('border p-4 transition-all', hasData ? 'bg-[#F5F5F5] border-[#E5DFD6]' : 'bg-white border-[#EAEAEA]')}>
              <div className="font-semibold text-[#1C1C1C] mb-3 pb-2 border-b border-[#EAEAEA] text-sm">{month}</div>
              <div className="space-y-2 mb-3">
                {SERVICES.map((service) => {
                  const isChecked = d.services.includes(service);
                  return (
                    <div key={service} onClick={() => toggleService(month, service)} className="flex items-center gap-2 cursor-pointer group">
                      <div className={cn('w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-all', isChecked ? 'border-[#1C1C1C] bg-[#1C1C1C]' : 'border-[#CCCCCC]')}>
                        {isChecked && <div className="w-2 h-2 bg-white" />}
                      </div>
                      <span className={cn('text-xs text-[#1C1C1C]', isChecked ? 'font-medium' : 'opacity-50')}>{service}</span>
                    </div>
                  );
                })}
              </div>
              <input
                type="text"
                value={d.memo}
                onChange={(e) => updateMemo(month, e.target.value)}
                placeholder="메모..."
                className="w-full px-0 py-1 text-xs border-0 border-b border-[#EAEAEA] bg-transparent text-[#1C1C1C] placeholder:text-[#BBBBBB] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>
          );
        })}
      </div>
      <div className="border-t border-[#EAEAEA] pt-4">
        <div className="text-xs text-[#999999] mb-2 font-medium tracking-wide">CYCLE PLAN SUMMARY</div>
        <div className="text-sm text-[#555555] leading-relaxed p-3 bg-[#FAFAFA] border border-[#F0F0F0]">{summary}</div>
      </div>
    </div>
  );
};
