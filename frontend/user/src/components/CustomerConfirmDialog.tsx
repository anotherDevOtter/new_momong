'use client';

import { useEffect } from 'react';
import { User, Phone, Calendar, Briefcase, X } from 'lucide-react';
import type { ConfirmableCustomer } from './CustomerConfirm';

interface CustomerConfirmDialogProps {
  open: boolean;
  customer: ConfirmableCustomer | null;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  title?: string;
}

export function CustomerConfirmDialog({
  open,
  customer,
  onClose,
  onConfirm,
  confirmLabel = '시작하기',
  title = '고객 정보 확인',
}: CustomerConfirmDialogProps) {
  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !customer) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#111111]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#999999] hover:text-[#111111]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-[#999999] mb-6">
          {customer.source === 'existing'
            ? '기존 고객 정보입니다. 수정은 고객 관리에서 가능합니다.'
            : '신규 고객 정보입니다.'}
        </p>

        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-5 mb-6">
          <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-2 text-sm">
            <div className="text-[#999999] inline-flex items-center gap-2">
              <User size={14} /> 고객명
            </div>
            <div className="text-[#111111] font-medium">{customer.name}</div>

            <div className="text-[#999999] inline-flex items-center gap-2">
              <Phone size={14} /> 연락처
            </div>
            <div className="text-[#111111]">{customer.phone}</div>

            <div className="text-[#999999] inline-flex items-center gap-2">
              <Calendar size={14} /> 연령대
            </div>
            <div className="text-[#111111]">{customer.ageGroup || '-'}</div>

            <div className="text-[#999999]">성별</div>
            <div className="text-[#111111]">{customer.gender === 'female' ? '여자' : '남자'}</div>

            {customer.occupation !== undefined && customer.occupation !== '' && (
              <>
                <div className="text-[#999999] inline-flex items-center gap-2">
                  <Briefcase size={14} /> 직업
                </div>
                <div className="text-[#111111]">{customer.occupation}</div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full h-12 bg-[#111111] text-white rounded text-sm font-medium hover:bg-[#222222] transition-colors"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
