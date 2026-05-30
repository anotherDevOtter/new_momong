'use client';

import { User, Phone, Calendar, Briefcase } from 'lucide-react';

export interface ConfirmableCustomer {
  source: 'existing' | 'new';
  id?: string; // 기존이면 customer id
  name: string;
  phone: string;
  ageGroup: string;
  gender: 'female' | 'male';
  occupation?: string;
}

interface CustomerConfirmProps {
  customer: ConfirmableCustomer;
  onConfirm: () => void;
  onBack: () => void;
  /** 진행 버튼 텍스트. 기본 "진행하기" */
  confirmLabel?: string;
}

export function CustomerConfirm({
  customer,
  onConfirm,
  onBack,
  confirmLabel = '진행하기',
}: CustomerConfirmProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="text-sm text-[#999999] hover:text-[#111111] mb-4 inline-flex items-center gap-1"
        >
          ← 다시 선택
        </button>

        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[#111111] mb-2">
          고객 정보 확인
        </h1>
        <p className="text-sm text-[#999999] mb-8">
          {customer.source === 'existing'
            ? '기존 고객 정보를 확인하고 진행해주세요. 정보 수정은 고객 관리에서 가능합니다.'
            : '신규 고객 정보를 확인하고 진행해주세요.'}
        </p>

        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-6 mb-8">
          <div className="grid grid-cols-[120px_1fr] gap-y-4 gap-x-2 text-sm">
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
