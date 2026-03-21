'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConsultationData } from '@/types';
import { saveConsultation } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { ShareLinkModal } from '@/components/ShareLinkModal';
import { CheckCircle, ArrowLeft, Link } from 'lucide-react';
import { toast } from 'sonner';

interface CompletionStepProps {
  data: ConsultationData;
  onRestart: () => void;
  onBack: () => void;
}

export const CompletionStep = ({ data, onRestart, onBack }: CompletionStepProps) => {
  const { token } = useAuth();
  const savedRef = useRef(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [cloudSaveStatus, setCloudSaveStatus] = useState<'pending' | 'saved' | 'failed'>('pending');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!savedRef.current && data.clientInfo?.name && token) {
      savedRef.current = true;

      saveConsultation(token, data)
        .then((record) => {
          setConsultationId(record.id);
          setCloudSaveStatus('saved');
          toast.success('컨설팅 데이터가 저장되었습니다');
        })
        .catch((error) => {
          console.error('저장 실패:', error);
          setCloudSaveStatus('failed');
          toast.error('저장에 실패했습니다');
        });
    }
  }, [data, token]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-2xl w-full space-y-12">
          {/* 완료 아이콘 */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#F5F5F5] border border-[#EAEAEA]">
              <CheckCircle size={40} className="text-[#111111]" />
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-[#111111] tracking-[-0.01em]">컨설팅이 완료되었습니다</h1>
              <p className="text-sm text-[#777777]">{data.clientInfo.name}님의 AFTER NOTE가 준비되었습니다</p>
            </div>
          </div>

          {/* 정보 카드 */}
          <div className="bg-white border border-[#E5E5E5] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-[#999999] mb-1">고객명</div>
                <div className="text-sm font-medium">{data.clientInfo.name}</div>
              </div>
              <div>
                <div className="text-xs text-[#999999] mb-1">방문일</div>
                <div className="text-sm font-medium">{data.visitDate}</div>
              </div>
              <div>
                <div className="text-xs text-[#999999] mb-1">디자이너</div>
                <div className="text-sm font-medium">{data.designerName}</div>
              </div>
            </div>
          </div>

          {/* 링크 만들기 */}
          <div className="space-y-3">
            <Button
              onClick={() => setShowShareModal(true)}
              variant="primary"
              fullWidth
              className="h-14 flex items-center justify-center"
              disabled={cloudSaveStatus !== 'saved' || !consultationId}
            >
              <Link size={18} className="mr-2" />
              링크 만들기
            </Button>
            {cloudSaveStatus === 'pending' && (
              <p className="text-xs text-center text-[#999999]">저장 완료 후 링크를 만들 수 있습니다</p>
            )}
            {cloudSaveStatus === 'failed' && (
              <p className="text-xs text-center text-[#999999]">저장에 실패하여 링크를 만들 수 없습니다</p>
            )}
          </div>

          {/* 브랜드 메시지 */}
          <div className="pt-8 border-t border-[#E5E5E5] space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs text-[#777777] leading-relaxed">
                BE YOURSELF<br />
                모든 사람이 자신의 아름다움을 발견하고 스스로 사랑할 수 있도록 돕습니다.
              </p>
              <div className="text-sm font-medium text-[#111111] tracking-[0.1em] pt-2">MERCI MOMONG</div>
            </div>

            <div className="pt-8 border-t border-[#E5E5E5]">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={onBack} variant="secondary" className="h-14 flex items-center justify-center">
                  <ArrowLeft size={18} className="mr-2" />
                  이전
                </Button>
                <Button onClick={onRestart} variant="primary" className="h-14">
                  새로운 컨설팅 시작
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showShareModal && consultationId && (
        <ShareLinkModal
          consultationId={consultationId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};
