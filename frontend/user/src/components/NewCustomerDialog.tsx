'use client';

import { useEffect } from 'react';
import { NewCustomerForm, type NewCustomerFormData } from './NewCustomerForm';

interface NewCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewCustomerFormData) => void;
  submitLabel?: string;
  title?: string;
}

export function NewCustomerDialog({
  open,
  onClose,
  onSubmit,
  submitLabel,
  title,
}: NewCustomerDialogProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // 다이얼로그 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

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
        <NewCustomerForm
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          title={title}
        />
      </div>
    </div>
  );
}
