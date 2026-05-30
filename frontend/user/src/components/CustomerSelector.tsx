'use client';

import { useMemo, useState } from 'react';
import { Search, Plus, ArrowRight, Calendar } from 'lucide-react';
import { NewCustomerForm, type NewCustomerFormData } from './NewCustomerForm';

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  lastVisitDate?: string;   // 'YYYY-MM-DD'
  lastCourse?: string;       // 'FIT' | '3WAY' | '2WAY (Personal Color)' 등
  lastImageType?: string;    // 'W / N' 등 (3WAY 만)
}

// 외부에서 import 하던 NewCustomerData 호환을 위한 re-export
export type NewCustomerData = NewCustomerFormData;

interface CustomerSelectorProps {
  /** 표시할 기존 고객 목록 (최신순). 검색은 컴포넌트 내부에서 처리. */
  customers: CustomerSummary[];
  /** 기존 고객 선택 시 */
  onSelectExisting: (customer: CustomerSummary) => void;
  /** 신규 고객 등록 시 */
  onCreateNew: (data: NewCustomerData) => void;
  /** 뒤로/취소 (선택) */
  onCancel?: () => void;
  /** 상단 제목 텍스트. 기본 "고객 선택" */
  title?: string;
  /** 상단 부제 */
  subtitle?: string;
}


export function CustomerSelector({
  customers,
  onSelectExisting,
  onCreateNew,
  onCancel,
  title = '고객 선택',
  subtitle = '기존 고객을 검색하거나 신규 고객을 등록해주세요',
}: CustomerSelectorProps) {
  const [search, setSearch] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/-/g, '').includes(q.replace(/-/g, '')),
    );
  }, [customers, search]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-sm text-[#999999] hover:text-[#111111] mb-4 inline-flex items-center gap-1"
            >
              ← 뒤로
            </button>
          )}
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[#111111] mb-2">{title}</h1>
          <p className="text-sm text-[#999999]">{subtitle}</p>
        </div>

        {showNewForm ? (
          <NewCustomerForm
            onSubmit={(data) => onCreateNew(data)}
            onCancel={() => setShowNewForm(false)}
          />
        ) : (
          <>
            {/* 검색 박스 */}
            <div className="relative mb-6">
              <Search className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 전화번호로 검색"
                className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg text-sm text-[#111111] placeholder-[#BBBBBB] focus:outline-none focus:border-[#111111]"
              />
            </div>

            {/* 고객 리스트 */}
            <div className="mb-6">
              <h2 className="text-xs text-[#999999] uppercase tracking-wider mb-3">
                {search.trim() ? `검색 결과 (${filtered.length})` : `최근 고객 (${customers.length})`}
              </h2>
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-sm text-[#999999] border border-dashed border-[#E5E5E5] rounded-lg">
                  {search.trim() ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((c) => (
                    <CustomerCard key={c.id} customer={c} onClick={() => onSelectExisting(c)} />
                  ))}
                </div>
              )}
            </div>

            {/* 신규 등록 버튼 */}
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full py-4 border-2 border-dashed border-[#111111] rounded-lg text-sm text-[#111111] font-medium flex items-center justify-center gap-2 hover:bg-[#FAFAFA] transition-colors"
            >
              <Plus size={16} /> 신규 고객 등록
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CustomerCard({ customer, onClick }: { customer: CustomerSummary; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 border border-[#E5E5E5] rounded-lg hover:border-[#111111] hover:bg-[#FAFAFA] transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-base font-medium text-[#111111]">{customer.name}</span>
            <span className="text-xs text-[#999999]">{customer.phone}</span>
          </div>
          {(customer.lastVisitDate || customer.lastCourse || customer.lastImageType) && (
            <div className="flex items-center gap-3 text-xs text-[#777777] mt-2">
              {customer.lastVisitDate && (
                <span className="inline-flex items-center gap-1">
                  <Calendar size={11} /> {customer.lastVisitDate}
                </span>
              )}
              {customer.lastCourse && (
                <span className="px-2 py-0.5 bg-[#F5F5F5] rounded text-[#555555]">{customer.lastCourse}</span>
              )}
              {customer.lastImageType && (
                <span className="px-2 py-0.5 bg-[#111111] text-white rounded font-medium">
                  {customer.lastImageType}
                </span>
              )}
            </div>
          )}
        </div>
        <ArrowRight
          size={18}
          className="text-[#CCCCCC] group-hover:text-[#111111] transition-colors flex-shrink-0 mt-1"
        />
      </div>
    </button>
  );
}

