'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { buildPreSurveyUrl } from '@/utils/pre-survey-api';

interface PreSurveyLinkDialogProps {
  open: boolean;
  surveyToken: string | null;
  customerName: string;
  onClose: () => void;
}

export function PreSurveyLinkDialog({ open, surveyToken, customerName, onClose }: PreSurveyLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const url = surveyToken ? buildPreSurveyUrl(surveyToken) : '';

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open || !surveyToken) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white border border-[#E5E5E5] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#111111]">사전설문지 링크</h2>
          <button onClick={onClose} className="text-[#999999] hover:text-[#111111] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          <p className="text-sm text-[#555555]">
            <span className="font-medium text-[#111111]">{customerName}</span> 고객님께 아래 링크를 전달해 주세요.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#555555] font-mono truncate">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 w-9 h-9 flex items-center justify-center border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors"
            >
              {copied ? <Check size={14} className="text-[#111111]" /> : <Copy size={14} className="text-[#999999]" />}
            </button>
          </div>

          <p className="text-xs text-[#999999] leading-relaxed">
            카카오톡 / 문자로 전송하시면 됩니다. 고객님이 작성을 완료하면 사전 설문 탭에 자동으로 표시됩니다.
          </p>
        </div>

        <div className="border-t border-[#E5E5E5] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm text-[#111111] border border-[#111111] hover:bg-[#FAFAFA] transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
