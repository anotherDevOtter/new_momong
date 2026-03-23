'use client';

import { useState } from 'react';
import { ConsultationData } from '@/types';
import { saveConsultation, updateConsultation } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShareLinkModal } from '@/components/ShareLinkModal';
import { Pencil, Link } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewStepProps {
  data: ConsultationData;
  onGoToStep: (step: number) => void;
  onRestart: () => void;
}

const Section = ({
  title,
  onEdit,
  editable,
  children,
}: {
  title: string;
  onEdit: () => void;
  editable: boolean;
  children: React.ReactNode;
}) => (
  <div className="border border-[#E5E5E5] p-5">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-semibold text-[#999999] tracking-widest uppercase">{title}</h3>
      {editable && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-[#999999] hover:text-[#111111] transition-colors"
        >
          <Pencil size={11} />
          수정
        </button>
      )}
    </div>
    <div className="text-sm text-[#333333] space-y-1.5">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value?: string | string[] }) => {
  const val = Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
  if (!val) return null;
  return (
    <div className="flex gap-2">
      <span className="text-[#999999] shrink-0 w-24">{label}</span>
      <span className="text-[#111111]">{val}</span>
    </div>
  );
};

export const ReviewStep = ({ data, onGoToStep, onRestart }: ReviewStepProps) => {
  const { token } = useAuth();
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
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

  return (
    <>
      <div className="max-w-2xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-semibold text-[#111111] tracking-[-0.01em]">컨설팅 내용 확인</h2>
          <p className="text-sm text-[#999999]">
            {completed ? '저장이 완료되었습니다' : '내용을 확인하고 완료 버튼을 눌러주세요'}
          </p>
        </div>

        <div className="space-y-4">
          <Section title="고객 기본 정보" onEdit={() => onGoToStep(1)} editable={!completed}>
            <Row label="이름" value={clientInfo.name} />
            <Row label="연락처" value={clientInfo.phone} />
            <Row label="연령대" value={clientInfo.ageGroup} />
            <Row label="성별" value={clientInfo.gender === 'female' ? '여자' : clientInfo.gender === 'male' ? '남자' : ''} />
          </Section>

          <Section title="오늘의 키워드" onEdit={() => onGoToStep(2)} editable={!completed}>
            <Row label="얼굴 고민" value={[...todayKeyword.faceConcerns, todayKeyword.faceConcernsMemo].filter(Boolean)} />
            <Row label="모발 고민" value={[...todayKeyword.hairConcerns, todayKeyword.hairConcernsMemo].filter(Boolean)} />
            <Row label="이미지 키워드" value={todayKeyword.imageKeywords} />
          </Section>

          <Section title="패션 스타일" onEdit={() => onGoToStep(3)} editable={!completed}>
            <Row label="선택 스타일" value={fashionStyle.selected} />
          </Section>

          <Section title="페이스 이미지 타입" onEdit={() => onGoToStep(6)} editable={!completed}>
            <Row label="색조 타입" value={faceImageType.type === 'warm' ? '웜톤' : faceImageType.type === 'neutral' ? '중간톤' : faceImageType.type === 'cool' ? '쿨톤' : ''} />
            <Row label="얼굴형" value={faceImageType.features.face} />
            <Row label="눈썹" value={faceImageType.features.eyebrows} />
            <Row label="눈" value={faceImageType.features.eyes} />
            <Row label="코" value={faceImageType.features.nose} />
            <Row label="입술" value={faceImageType.features.lips} />
          </Section>

          <Section title="헤어 컨디션" onEdit={() => onGoToStep(7)} editable={!completed}>
            <Row label="손상도" value={hairCondition.damageLevel} />
            <Row label="모질" value={hairCondition.hairType} />
            <Row label="굵기" value={hairCondition.thickness} />
            <Row label="밀도" value={hairCondition.density} />
            <Row label="컬" value={hairCondition.curl} />
          </Section>

          <Section title="원하는 스타일" onEdit={() => onGoToStep(8)} editable={!completed}>
            <Row label="원하는 길이" value={hairStyleProposal.length} />
          </Section>

          <Section title="오늘의 디자인" onEdit={() => onGoToStep(9)} editable={!completed}>
            <Row label="길이" value={[...todayDesign.length, todayDesign.lengthMemo].filter(Boolean)} />
            <Row label="뱅" value={[...todayDesign.bangs, todayDesign.bangsMemo].filter(Boolean)} />
            <Row label="컬/텍스처" value={[...todayDesign.curlTexture, todayDesign.curlTextureMemo].filter(Boolean)} />
            <Row label="컬러" value={[...todayDesign.color, todayDesign.colorMemo].filter(Boolean)} />
          </Section>

          <Section title="다음 방향" onEdit={() => onGoToStep(9)} editable={!completed}>
            <Row label="길이 변화" value={nextDirection.lengthChange} />
            <Row label="컬러 변화" value={nextDirection.colorChange} />
            <Row label="기타" value={nextDirection.others} />
          </Section>

          <Section title="애프터 노트" onEdit={() => onGoToStep(10)} editable={!completed}>
            <Row label="디자이너" value={designerName} />
            <Row label="방문일" value={visitDate} />
            {afterNote && (
              <div className="mt-2 text-[#333333] whitespace-pre-wrap leading-relaxed">{afterNote}</div>
            )}
          </Section>
        </div>

        <div className="space-y-3 pt-4">
          {!completed ? (
            <button
              onClick={handleComplete}
              disabled={saveStatus === 'saving'}
              className="w-full h-14 bg-[#111111] text-white text-sm font-medium flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-[#333333]"
            >
              {saveStatus === 'saving' ? '저장 중...' : '완료'}
            </button>
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
          <button
            onClick={onRestart}
            className="w-full h-12 text-sm text-[#777777] hover:text-[#111111] transition-colors border border-[#E5E5E5] hover:border-[#999999]"
          >
            새로운 컨설팅 시작
          </button>
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
