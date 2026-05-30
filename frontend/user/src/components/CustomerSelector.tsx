'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, ArrowRight, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { NewCustomerDialog } from './NewCustomerDialog';
import type { NewCustomerFormData } from './NewCustomerForm';

const PAGE_SIZE = 20;

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  lastVisitDate?: string;
  lastCourse?: string;
  lastImageType?: string;
}

// 외부 호환 — 기존 코드의 NewCustomerData import 그대로 동작
export type NewCustomerData = NewCustomerFormData;

interface CustomerSelectorProps {
  customers: CustomerSummary[];
  onSelectExisting: (customer: CustomerSummary) => void;
  onCreateNew: (data: NewCustomerData) => void;
  onCancel?: () => void;
  title?: string;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0); // 0-based

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.replace(/-/g, '').includes(q.replace(/-/g, '')),
    );
  }, [customers, search]);

  // 검색어 변경 시 페이지 초기화
  useEffect(() => {
    setPage(0);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs text-[#999999] uppercase tracking-wider">
              {search.trim() ? `검색 결과 (${filtered.length})` : `최근 고객 (${filtered.length})`}
            </h2>
            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-1 text-sm text-[#111111] px-4 py-2 border border-[#111111] rounded hover:bg-[#FAFAFA] transition-colors"
            >
              <Plus size={14} /> 신규 고객 등록
            </button>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-[#999999] border border-dashed border-[#E5E5E5] rounded-lg">
              {search.trim() ? '검색 결과가 없습니다' : '등록된 고객이 없습니다'}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {pageItems.map((c) => (
                  <CustomerCard key={c.id} customer={c} onClick={() => onSelectExisting(c)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3 text-sm">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#E5E5E5] rounded text-[#555555] hover:border-[#111111] hover:text-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} /> 이전
                  </button>
                  <span className="text-xs text-[#999999]">
                    {safePage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={safePage >= totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#E5E5E5] rounded text-[#555555] hover:border-[#111111] hover:text-[#111111] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    다음 <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NewCustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={(data) => {
          setDialogOpen(false);
          onCreateNew(data);
        }}
      />
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
