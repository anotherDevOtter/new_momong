'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageLayoutProps {
  children: React.ReactNode;
  pageNumber?: number;
  totalPages?: number;
  showPageNumber?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export function PageLayout({
  children,
  pageNumber = 1,
  totalPages = 7,
  showPageNumber = true,
  onPrev,
  onNext,
  nextLabel = 'NEXT',
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <div className="w-full bg-white relative">
        {children}

        {showPageNumber && (
          <div
            className="py-8 text-center border-t border-[#E5E5E5]"
            style={{ fontWeight: 400 }}
          >
            <span className="text-[11px] tracking-[0.2em] text-[#7A7A7A]">
              {pageNumber} / {totalPages}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-[#E5E5E5] sticky bottom-0">
        <div className="flex">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[#111111] hover:bg-[#F7F7F5] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] tracking-[0.15em]" style={{ fontWeight: 500 }}>
                PREV
              </span>
            </button>
          )}
          {onPrev && onNext && <div className="w-px bg-[#E5E5E5]"></div>}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-[#111111] hover:bg-[#F7F7F5] transition-colors"
            >
              <span className="text-[11px] tracking-[0.15em]" style={{ fontWeight: 500 }}>
                {nextLabel}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
