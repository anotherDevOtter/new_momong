'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DesignCycleGuide } from '@/components/ui/DesignCycleGuide';
import { ConsultationData, CycleMonth } from '@/types';
import { saveConsultation } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AfterNoteStepProps {
  data: ConsultationData;
  onChange: (data: ConsultationData) => void;
  onBack: () => void;
  onComplete: () => void;
}

export const AfterNoteStep = ({ data, onChange, onBack, onComplete }: AfterNoteStepProps) => {
  const { token } = useAuth();
  const [designerName, setDesignerName] = useState(data.designerName || '');
  const [afterNote, setAfterNote] = useState(data.afterNote || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleCycleGuideChange = (selectedMonths: CycleMonth[]) => {
    onChange({ ...data, designCycleGuide: { selectedMonths } });
  };

  const handleComplete = async () => {
    if (!designerName || !afterNote) return;

    setIsSaving(true);
    const finalData = { ...data, designerName, afterNote };
    onChange(finalData);

    try {
      await saveConsultation(token!, finalData);
      toast.success('컨설팅이 저장되었습니다');
      onComplete();
    } catch (error) {
      console.error('저장 실패:', error);
      // 저장 실패해도 완료 처리 (오프라인 대응)
      toast.error('저장 중 오류가 발생했습니다. 로컬에는 기록됩니다.');
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
      <div className="text-center space-y-3">
        <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">AFTER NOTE</h2>
        <p className="text-sm text-[#999999]">최종 정보를 입력하고 완료하세요</p>
      </div>

      <div className="bg-white border border-[#EAEAEA] p-8 space-y-6">
        {/* 고객 기본 정보 */}
        <div className="grid grid-cols-3 gap-4 pb-6 border-b border-[#EAEAEA]">
          <div>
            <div className="text-xs text-[#999999] mb-1">고객명</div>
            <div className="text-sm font-medium">{data.clientInfo.name}</div>
          </div>
          <div>
            <div className="text-xs text-[#999999] mb-1">방문일</div>
            <div className="text-sm">{data.visitDate}</div>
          </div>
          <Input
            label="디자이너"
            value={designerName}
            onChange={setDesignerName}
            placeholder="이름 입력"
          />
        </div>

        {/* 이미지 타입 & 모발 상태 */}
        <div>
          <h3 className="mb-3 font-semibold text-[#111111] text-sm tracking-[-0.01em]">이미지 타입 & 모발 상태</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[#999999]">타입: </span>{data.faceImageType.type.toUpperCase()}</div>
            <div><span className="text-[#999999]">손상도: </span>{data.hairCondition.damageLevel}</div>
          </div>
        </div>

        {/* TODAY DESIGN 요약 */}
        <div>
          <h3 className="mb-3 font-semibold text-[#111111] text-sm tracking-[-0.01em]">TODAY DESIGN</h3>
          <div className="border border-[#EAEAEA]">
            <div className="grid grid-cols-[20%_30%_50%] border-b border-[#EAEAEA] bg-[#FAFAFA]">
              {['항목', '결과', '메모'].map((h) => (
                <div key={h} className="px-4 py-3 text-xs text-[#555555] border-r last:border-r-0 border-[#EAEAEA]">{h}</div>
              ))}
            </div>
            {[
              { label: '길이', values: data.todayDesign.length, memo: data.todayDesign.lengthMemo },
              { label: '앞머리', values: data.todayDesign.bangs, memo: data.todayDesign.bangsMemo },
              { label: '컬 / 질감', values: data.todayDesign.curlTexture, memo: data.todayDesign.curlTextureMemo },
              { label: '컬러', values: data.todayDesign.color, memo: data.todayDesign.colorMemo },
            ]
              .filter((row) => row.values.length > 0)
              .map((row, idx, arr) => (
                <div key={row.label} className={`grid grid-cols-[20%_30%_50%] min-h-[48px] ${idx < arr.length - 1 ? 'border-b border-[#EAEAEA]' : ''}`}>
                  <div className="px-4 py-3 text-sm text-[#555555] border-r border-[#EAEAEA] flex items-center">{row.label}</div>
                  <div className="px-4 py-3 text-sm font-medium text-[#111111] border-r border-[#EAEAEA] flex items-center">{row.values.join(', ')}</div>
                  <div className="px-4 py-3 text-sm text-[#555555] flex items-center">{row.memo || '-'}</div>
                </div>
              ))}
          </div>
        </div>

        {/* NEXT DIRECTION */}
        {(data.nextDirection.lengthChange.length > 0 || data.nextDirection.colorChange.length > 0 || data.nextDirection.others.length > 0) && (
          <div>
            <h3 className="mb-3 font-semibold text-[#111111] text-sm tracking-[-0.01em]">NEXT DIRECTION</h3>
            <ul className="space-y-1 text-sm text-[#555555]">
              {data.nextDirection.lengthChange.length > 0 && <li>• 길이 변화 ({data.nextDirection.lengthChange.join(', ')})</li>}
              {data.nextDirection.colorChange.length > 0 && <li>• 컬러 변화 ({data.nextDirection.colorChange.join(', ')})</li>}
              {data.nextDirection.others.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>
        )}

        {/* DESIGN CYCLE GUIDE */}
        <div className="pt-6 border-t border-[#EAEAEA]">
          <DesignCycleGuide
            selectedMonths={data.designCycleGuide.selectedMonths}
            onChange={handleCycleGuideChange}
          />
        </div>

        {/* AFTER DESIGN MEMO */}
        <div>
          <label className="block text-sm text-[#555555] mb-2">AFTER DESIGN MEMO</label>
          <textarea
            value={afterNote}
            onChange={(e) => setAfterNote(e.target.value)}
            placeholder="• 오늘 디자인의 핵심 포인트&#10;• 고객 반응&#10;• 다음 방문 시 참고 사항"
            rows={6}
            className="w-full px-4 py-3 border border-[#EAEAEA] bg-white focus:border-[#111111] focus:outline-none transition-colors resize-none text-sm"
          />
        </div>

        <div className="pt-6 border-t border-[#EAEAEA]">
          <p className="text-xs text-center text-[#999999] leading-relaxed">
            &apos;BE YOURSELF&apos;<br />
            사람들이 자신의 아름다움을 발견하고 스스로를 사랑할 수 있도록 돕습니다.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={onBack} variant="secondary" fullWidth>이전</Button>
        <Button
          onClick={handleComplete}
          variant="primary"
          fullWidth
          disabled={!designerName || !afterNote || isSaving}
        >
          {isSaving ? '저장 중...' : '완료'}
        </Button>
      </div>
    </div>
  );
};
