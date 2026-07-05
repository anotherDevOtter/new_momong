'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NavigationButtons } from './NavigationButtons';
import { PreSurveyDetailView } from '@/components/pre-survey/PreSurveyDetailView';
import { useAuth } from '@/contexts/AuthContext';
import { listPreSurveysByCustomer, getPreSurvey, type PreSurveyDetail } from '@/utils/pre-survey-api';

interface PreSurveyReviewProps {
  customerId: string | null;
  onBack: () => void;
  onNext: () => void;
}

// 3WAY 단계: 고객이 방문 전 제출한 "마지막" 사전설문 내용을 표시 (있으면).
export function PreSurveyReview({ customerId, onBack, onNext }: PreSurveyReviewProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<PreSurveyDetail | null>(null);
  const [filledAt, setFilledAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !customerId) {
        setLoading(false);
        return;
      }
      try {
        const list = await listPreSurveysByCustomer(token, customerId);
        // 제출된 것 중 가장 최근(filled_at) 1건
        const submitted = list.filter((s) => s.filled_at);
        submitted.sort(
          (a, b) => new Date(b.filled_at as string).getTime() - new Date(a.filled_at as string).getTime(),
        );
        const latest = submitted[0];
        if (!latest) return;
        const d = await getPreSurvey(token, latest.id);
        if (!cancelled) {
          setDetail(d);
          setFilledAt(latest.filled_at);
        }
      } catch (e) {
        console.error('사전설문 조회 실패', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, customerId]);

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-[#111111] tracking-[-0.01em] mb-3">사전 설문 확인</h2>
            <p className="text-sm text-[#111111] font-medium">
              고객이 방문 전 작성한 사전 설문 내용입니다.
            </p>
          </motion.div>

          {loading ? (
            <div className="border border-[#E5E5E5] px-8 py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#111111] mx-auto mb-3" />
              <p className="text-sm text-[#999999]">불러오는 중...</p>
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {filledAt && (
                <p className="text-xs text-[#999999]">제출: {new Date(filledAt).toLocaleString('ko-KR')}</p>
              )}
              <PreSurveyDetailView detail={detail} />
            </div>
          ) : (
            <div className="border border-[#E5E5E5] px-8 py-16 text-center">
              <p className="text-sm text-[#999999]">제출된 사전 설문이 없습니다.</p>
              <p className="text-xs text-[#CCCCCC] mt-1">
                이 고객은 방문 전 사전 설문을 작성하지 않았습니다.
              </p>
            </div>
          )}

          <div className="mt-10">
            <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="다음" />
          </div>
        </div>
      </div>
    </div>
  );
}
