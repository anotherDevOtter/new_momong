'use client';

import { useState } from 'react';
import { ConsultationData } from '@/types';
import { saveConsultation, updateConsultation } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShareLinkModal } from '@/components/ShareLinkModal';
import { Pencil, Link } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

interface ReviewStepProps {
  data: ConsultationData;
  onGoToStep: (step: number) => void;
  onRestart: () => void;
}

const SectionTitle = ({ title, onEdit }: { title: string; onEdit?: () => void }) => (
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-[#111111] text-sm tracking-[-0.01em]">{title}</h3>
    {onEdit && (
      <button
        onClick={onEdit}
        className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#111111] transition-colors"
      >
        <Pencil size={11} />
        수정
      </button>
    )}
  </div>
);

const InfoItem = ({ label, value }: { label: string; value?: string | string[] }) => {
  const val = Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
  if (!val) return null;
  return (
    <div>
      <div className="text-xs text-[#999999] mb-1">{label}</div>
      <div className="text-sm font-medium text-[#111111]">{val}</div>
    </div>
  );
};

export const ReviewStep = ({ data, onGoToStep, onRestart }: ReviewStepProps) => {
  const { token } = useAuth();
  const [consultationId, setConsultationId] = useState<string | null>(data.id || null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>(data.id ? 'saved' : 'idle');
  const [showShareModal, setShowShareModal] = useState(false);

  const completed = saveStatus === 'saved';

  const handleComplete = async () => {
    if (!data.clientInfo?.name || !token) return;
    setSaveStatus('saving');
    try {
      const record = data.id
        ? await updateConsultation(token, data.id, data)
        : await saveConsultation(token, data);
      setConsultationId(record.id);
      setSaveStatus('saved');
      toast.success(data.id ? '컨설팅이 수정되었습니다' : '컨설팅 데이터가 저장되었습니다');
    } catch {
      setSaveStatus('failed');
      toast.error('저장에 실패했습니다');
    }
  };

  const { clientInfo, todayKeyword, fashionStyle, faceImageType, hairCondition, hairStyleProposal, todayDesign, nextDirection, designerName, visitDate, afterNote } = data;

  const toneLabel = faceImageType.type === 'warm' ? '웜톤' : faceImageType.type === 'neutral' ? '중간톤' : faceImageType.type === 'cool' ? '쿨톤' : '';

  const designRows = [
    { label: '길이', values: todayDesign.length, memo: todayDesign.lengthMemo },
    { label: '앞머리', values: todayDesign.bangs, memo: todayDesign.bangsMemo },
    { label: '컬 / 질감', values: todayDesign.curlTexture, memo: todayDesign.curlTextureMemo },
    { label: '컬러', values: todayDesign.color, memo: todayDesign.colorMemo },
  ].filter((r) => r.values.length > 0);

  const hasNextDirection =
    nextDirection.lengthChange.length > 0 ||
    nextDirection.colorChange.length > 0 ||
    nextDirection.others.length > 0;

  const cycleMonths = data.designCycleGuide.selectedMonths.filter((m) => m.services.length > 0);

  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">컨설팅 내용 확인</h2>
          <p className="text-sm text-[#999999]">
            {completed ? '저장이 완료되었습니다' : '내용을 확인하고 완료 버튼을 눌러주세요'}
          </p>
        </div>

        <div className="bg-white border border-[#EAEAEA] p-8 space-y-6">
          {/* 고객 기본 정보 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="고객 기본 정보" onEdit={!completed ? () => onGoToStep(1) : undefined} />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="이름" value={clientInfo.name} />
              <InfoItem label="연락처" value={clientInfo.phone} />
              <InfoItem label="연령대" value={clientInfo.ageGroup} />
              <InfoItem label="성별" value={clientInfo.gender === 'female' ? '여자' : clientInfo.gender === 'male' ? '남자' : ''} />
            </div>
          </div>

          {/* 오늘의 키워드 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="오늘의 키워드" onEdit={!completed ? () => onGoToStep(2) : undefined} />
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="얼굴 고민" value={[...todayKeyword.faceConcerns, todayKeyword.faceConcernsMemo].filter(Boolean)} />
              <InfoItem label="모발 고민" value={[...todayKeyword.hairConcerns, todayKeyword.hairConcernsMemo].filter(Boolean)} />
              <InfoItem label="이미지 키워드" value={todayKeyword.imageKeywords} />
            </div>
          </div>

          {/* 패션 스타일 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="패션 스타일" onEdit={!completed ? () => onGoToStep(3) : undefined} />
            <InfoItem label="선택 스타일" value={fashionStyle.selected} />
          </div>

          {/* 페이스 이미지 타입 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="페이스 이미지 타입" onEdit={!completed ? () => onGoToStep(6) : undefined} />
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="색조 타입" value={toneLabel} />
              <InfoItem label="얼굴형" value={faceImageType.features.face} />
              <InfoItem label="눈썹" value={faceImageType.features.eyebrows} />
              <InfoItem label="눈" value={faceImageType.features.eyes} />
              <InfoItem label="코" value={faceImageType.features.nose} />
              <InfoItem label="입술" value={faceImageType.features.lips} />
            </div>
          </div>

          {/* 헤어 컨디션 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="헤어 컨디션" onEdit={!completed ? () => onGoToStep(7) : undefined} />
            <div className="grid grid-cols-3 gap-4">
              <InfoItem label="손상도" value={hairCondition.damageLevel} />
              <InfoItem label="모질" value={hairCondition.hairType} />
              <InfoItem label="굵기" value={hairCondition.thickness} />
              <InfoItem label="밀도" value={hairCondition.density} />
              <InfoItem label="컬" value={hairCondition.curl} />
            </div>
          </div>

          {/* 원하는 스타일 */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="원하는 스타일" onEdit={!completed ? () => onGoToStep(8) : undefined} />
            <InfoItem label="원하는 길이" value={hairStyleProposal.length} />
          </div>

          {/* TODAY DESIGN */}
          <div className="pb-6 border-b border-[#EAEAEA]">
            <SectionTitle title="TODAY DESIGN" onEdit={!completed ? () => onGoToStep(9) : undefined} />
            <div className="border border-[#EAEAEA]">
              <div className="grid grid-cols-[20%_30%_50%] border-b border-[#EAEAEA] bg-[#FAFAFA]">
                {['항목', '결과', '메모'].map((h) => (
                  <div key={h} className="px-4 py-3 text-xs text-[#555555] border-r last:border-r-0 border-[#EAEAEA]">{h}</div>
                ))}
              </div>
              {designRows.map((row, idx) => (
                <div key={row.label} className={`grid grid-cols-[20%_30%_50%] min-h-[48px] ${idx < designRows.length - 1 ? 'border-b border-[#EAEAEA]' : ''}`}>
                  <div className="px-4 py-3 text-sm text-[#555555] border-r border-[#EAEAEA] flex items-center">{row.label}</div>
                  <div className="px-4 py-3 text-sm font-medium text-[#111111] border-r border-[#EAEAEA] flex items-center">{row.values.join(', ')}</div>
                  <div className="px-4 py-3 text-sm text-[#555555] flex items-center">{row.memo || '-'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* NEXT DIRECTION */}
          {hasNextDirection && (
            <div className="pb-6 border-b border-[#EAEAEA]">
              <SectionTitle title="NEXT DIRECTION" onEdit={!completed ? () => onGoToStep(9) : undefined} />
              <ul className="space-y-1 text-sm text-[#555555]">
                {nextDirection.lengthChange.length > 0 && <li>• 길이 변화 ({nextDirection.lengthChange.join(', ')})</li>}
                {nextDirection.colorChange.length > 0 && <li>• 컬러 변화 ({nextDirection.colorChange.join(', ')})</li>}
                {nextDirection.others.map((item, i) => <li key={i}>• {item}</li>)}
              </ul>
            </div>
          )}

          {/* 디자인 사이클 가이드 */}
          {cycleMonths.length > 0 && (
            <div className="pb-6 border-b border-[#EAEAEA]">
              <SectionTitle title="디자인 사이클 가이드" onEdit={!completed ? () => onGoToStep(10) : undefined} />
              <div className="space-y-1 text-sm text-[#555555]">
                {cycleMonths.map((m) => (
                  <div key={m.month}>• {m.month}: {[m.services.join(', '), m.memo].filter(Boolean).join(' / ')}</div>
                ))}
              </div>
            </div>
          )}

          {/* 애프터 노트 */}
          <div>
            <SectionTitle title="애프터 노트" onEdit={!completed ? () => onGoToStep(10) : undefined} />
            <div className="grid grid-cols-3 gap-4 mb-4">
              <InfoItem label="디자이너" value={designerName} />
              <InfoItem label="방문일" value={visitDate} />
            </div>
            {afterNote && (
              <div className="text-sm text-[#333333] whitespace-pre-wrap leading-relaxed">{afterNote}</div>
            )}
          </div>

          <div className="pt-6 border-t border-[#EAEAEA]">
            <p className="text-xs text-center text-[#999999] leading-relaxed">
              &apos;BE YOURSELF&apos;<br />
              사람들이 자신의 아름다움을 발견하고 스스로를 사랑할 수 있도록 돕습니다.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!completed ? (
            <Button
              onClick={handleComplete}
              disabled={saveStatus === 'saving'}
              variant="primary"
              fullWidth
            >
              {saveStatus === 'saving' ? '저장 중...' : '완료'}
            </Button>
          ) : (
            <button
              onClick={() => setShowShareModal(true)}
              className="w-full h-14 bg-[#111111] text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#333333]"
            >
              <Link size={16} />
              링크 만들기
            </button>
          )}
          {saveStatus === 'failed' && (
            <p className="text-xs text-center text-red-400">저장에 실패했습니다. 다시 시도해주세요.</p>
          )}
          {completed && (
            <Button onClick={() => setSaveStatus('idle')} variant="secondary" fullWidth>
              수정하기
            </Button>
          )}
          <Button onClick={onRestart} variant="secondary" fullWidth>
            새로운 컨설팅 시작
          </Button>
        </div>
      </div>

      {showShareModal && consultationId && (
        <ShareLinkModal
          consultationId={consultationId}
          clientName={data.clientInfo.name}
          visitDate={data.visitDate}
          designerName={data.designerName}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};
