'use client';

import Image from 'next/image';
import { PageLayout } from '../PageLayout';

interface CoverProps {
  customerName: string;
  onNext: () => void;
}

export function Cover({ customerName, onNext }: CoverProps) {
  return (
    <PageLayout onNext={onNext} showPageNumber={false}>
      <div className="flex flex-col">
        <div className="relative overflow-hidden bg-[#E8E4DF] h-[65vh] min-h-[480px]">
          <Image
            src="/pre-survey/cover.jpg"
            alt="Editorial beauty portrait"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="bg-white px-7 py-20">
          <div className="mb-20 text-center">
            <p className="text-[9px] text-[#7A7A7A] tracking-[0.25em] uppercase" style={{ fontWeight: 500 }}>
              MERCI MOMONG
            </p>
            {customerName && (
              <p className="mt-6 text-[12px] text-[#B88A5A] tracking-[0.1em]" style={{ fontWeight: 500 }}>
                {customerName} 고객님께 드리는 인터뷰
              </p>
            )}
          </div>

          <div className="space-y-20 max-w-[340px] mx-auto">
            <p className="text-[17px] leading-[2.2] text-[#111111] text-center" style={{ fontWeight: 400 }}>
              사람들은 <span style={{ fontWeight: 700 }}>디자인</span>을 원한다고 말하지만, <br />
              실제로는 <span style={{ fontWeight: 700 }}>자신</span>을 더 <span style={{ fontWeight: 700 }}>사랑</span>할 수 있는 <br />
              방법을 찾고 있습니다.
            </p>

            <div className="py-10">
              <h1
                className="text-[56px] leading-[1.0] tracking-tight text-center"
                style={{ fontFamily: 'Georgia, serif', fontWeight: 500, color: '#8B3A3A' }}
              >
                <span style={{ fontWeight: 700 }}>Be</span><br />
                yourself
              </h1>
            </div>

            <p className="text-[13px] leading-[2.2] text-[#7A7A7A] text-center" style={{ fontWeight: 400 }}>
              우리는 모든 사람들이 자신만의 아름다움을 발견하고, <br />
              스스로를 사랑할 수 있도록 돕습니다. <br />
              <span style={{ fontWeight: 700 }}>메르시모몽이 세상에 전하는 가치입니다</span>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
