'use client';

import { PageLayout } from '../PageLayout';

const NOTICES = [
  {
    category: '예약 및 취소',
    items: [
      '-모든 컨설팅은 사전 예약제로 운영됩니다. 고객님과의 충분한 시간을 위해 하루 제한된 인원만 진행하고 있습니다.',
      '-예약금 3일 전 취소하시는 경우 전액 환불해 드립니다.',
      '-2일 전 취소부터 당일 취소는 환불이 어려운 점 양해 부탁드립니다.',
    ],
  },
  {
    category: '소요 시간',
    items: [
      '-1WAY 컨설팅은 약 1시간 정도 소요됩니다.',
      '-2WAY 컨설팅은 약 1시간 30분 정도 시간이 필요합니다.',
      '-3WAY 컨설팅은 가장 깊이 있는 분석을 위해 약1시간 40분 정도 시간이 소요됩니다.',
      '-시술이 함께 진행될 경우 추가 시간이 필요할 수 있으며, 미리 안내드립니다.',
    ],
  },
  {
    category: '방문 시 유의사항',
    items: [
      '-1:1 컨설팅 환경을 위해 동반 입장은 어려운 점 양해 부탁드립니다.',
      '-보정하지 않은 자연스러운 사진 자료를 준비해 주시면 더욱 정확한 분석이 가능합니다.',
      '-평소 즐겨 입으시는 스타일의 편안한 옷차림으로 방문해 주세요. 일상의 모습이 가장 중요한 기준입니다.',
    ],
  },
  {
    category: '시술 관련',
    items: [
      '-과도하게 손상된 모발의 경우 건강을 위해 일부 시술을 권장하지 않을 수 있습니다.',
      '-염색 및 펌은 현재 모발 상태를 확인한 후 함께 결정됩니다. 무엇보다 모발의 건강이 우선입니다.',
      '-추가 시술이 필요한 경우 비용은 별도로 안내드리며, 충분히 상의 후 진행합니다.',
    ],
  },
];

export function Notice({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  return (
    <PageLayout pageNumber={3} totalPages={8} onPrev={onPrev} onNext={onNext}>
      <div className="bg-white px-7 py-16">
        <div className="mb-20 pb-14 border-b border-[#E5E5E5]">
          <h2 className="text-[26px] text-[#111111] tracking-[0.1em]" style={{ fontWeight: 400 }}>
            NOTICE
          </h2>
        </div>

        <div className="space-y-20 mb-20">
          {NOTICES.map((n) => (
            <div key={n.category} className="space-y-7">
              <h3
                className="text-[15px] text-[#111111] pb-4 border-b border-[#E5E5E5]"
                style={{ fontWeight: 600, letterSpacing: '0.01em' }}
              >
                {n.category}
              </h3>
              <div className="space-y-5">
                {n.items.map((item, i) => (
                  <p key={i} className="text-[12px] text-[#2B2B2B] leading-[1.5]" style={{ fontWeight: 400 }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#F7F7F5] px-7 py-10 mb-20">
          <p className="text-[12px] text-[#7A7A7A] leading-[2]" style={{ fontWeight: 400 }}>
            컨설팅은 단순히 헤어만 바꾸는 시간이 아니라,<br />
            고객님의 현재 상태와 이미지, 그리고 라이프 스타일까지 세심하게 이해하는 과정입니다.
            <br /><br />
            더 정확한 분석과 제안을 위해 사전 인터뷰와 사진 자료 제출에 협조 부탁드립니다.
          </p>
        </div>

        <div className="space-y-6 py-14 border-t border-[#E5E5E5]">
          <p className="text-[12px] text-[#7A7A7A] leading-[2.2]" style={{ fontWeight: 400 }}>
            추가 문의사항이 있으시거나 궁금한 점이 있으시다면 언제든 편안하게 연락 주세요
          </p>
          <p className="text-[13px] text-[#B88A5A]" style={{ fontWeight: 500, letterSpacing: '0.05em' }}>
            MERCI MOMONG
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
