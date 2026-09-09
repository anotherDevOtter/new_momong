'use client';

import { PageLayout } from '../PageLayout';

interface ConsultingProgramsProps {
  selectedProgram: string;
  onSelect: (program: string, hasBodyAnalysis: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}

const PROGRAMS = [
  {
    number: '01',
    title: '3WAY HAIR CONSULTING',
    description: '퍼스널컬러 + 골격이미지진단 + 이미지분석',
    description2: ' 헤어컨설팅 + 커트 및 스타일링코칭 + 포트폴리오',
    subtitle:
      '고객님의 타고난 컬러와 체형, 이미지를 가장 세밀하게 분석하여 진정으로 어울리는 스타일을 찾아드립니다. 메르시모몽의 모든 노하우가 담긴 시그니처 컨설팅 프로그램입니다.',
    hasBodyAnalysis: true,
  },
  {
    number: '02',
    title: '2WAY HAIR CONSULTING',
    description: '퍼스널컬러 + 이미지분석',
    description2: ' 헤어컨설팅 + 커트 및 스타일링코칭 + 포트폴리오',
    subtitle:
      '고객님의 피부톤과 분위기를 중심으로 자연스럽게 어울리는 헤어 스타일과 컬러를 제안합니다. 톤을 이해하면 스타일의 방향이 명확해집니다.',
    hasBodyAnalysis: false,
  },
  {
    number: '03',
    title: '2WAY HAIR CONSULTING',
    description: '골격이미지진단 + 이미지분석',
    description2: ' 헤어컨설팅 + 커트 및 스타일링코칭 + 포트폴리오',
    subtitle:
      '고객님의 이미지와 체형의 밸런스를 기반으로 시각적으로 가장 조화로운 헤어 스타일을 제안합니다. 분석을 통해 정교한 디자인을 완성합니다.',
    hasBodyAnalysis: true,
  },
  {
    number: '04',
    title: '1WAY HAIR CONSULTING',
    description: '이미지분석',
    description2: ' 헤어컨설팅 + 커트 및 스타일링코칭',
    subtitle:
      '현재 고객님께서 느끼시는 고민과 원하시는 분위기를 중심으로 가장 자연스러운 변화를 제안합니다. 일상에서 실천 가능한 스타일을 함께 만들어갑니다.',
    hasBodyAnalysis: false,
  },
];

export function ConsultingPrograms({ selectedProgram, onSelect, onPrev, onNext }: ConsultingProgramsProps) {
  return (
    <PageLayout pageNumber={2} totalPages={8} onPrev={onPrev} onNext={onNext}>
      <div className="bg-[#F7F7F5] px-7 py-16">
        <div className="mb-24 text-center">
          <h2 className="text-[26px] text-[#111111] mb-3" style={{ fontWeight: 400, letterSpacing: '0.05em' }}>
            Consulting<br />Program
          </h2>
          <p className="text-[11px] text-[#7A7A7A] mt-5 tracking-[0.05em]" style={{ fontWeight: 400 }}>
            메르시모몽 컨설팅 프로그램<br />
            [예약하신 컨설팅 프로그램을 클릭해 주세요]
          </p>
          <div className="w-12 h-[1px] bg-[#E5E5E5] mx-auto mt-8"></div>
        </div>

        <div className="space-y-8 mb-16">
          {PROGRAMS.map((p) => {
            const selected = selectedProgram === p.number;
            return (
              <button
                key={p.number}
                type="button"
                onClick={() => onSelect(p.number, p.hasBodyAnalysis)}
                className={`w-full bg-white px-7 py-10 border-2 transition-all duration-200 text-left relative ${
                  selected ? 'border-[#B88A5A] bg-[#FFFBF7] shadow-lg' : 'border-[#E5E5E5] hover:border-[#B88A5A]'
                }`}
              >
                {selected && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-[#B88A5A] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="mb-7 text-center">
                  <span
                    className="text-[15px] block mb-3 text-[#B88A5A]"
                    style={{ fontWeight: selected ? 600 : 400 }}
                  >
                    {p.number}
                  </span>
                  <h3
                    className="text-[14px] tracking-[0.05em] text-[#111111]"
                    style={{ fontWeight: selected ? 700 : 600 }}
                  >
                    {p.title}
                  </h3>
                </div>

                <p
                  className="text-[12px] leading-[2] mb-6 text-center text-[#2B2B2B]"
                  style={{ fontWeight: selected ? 500 : 400 }}
                >
                  {p.description}<br />
                  {p.description2}
                </p>

                <p
                  className="text-[12px] text-[#7A7A7A] leading-[1.5] text-center max-w-[300px] mx-auto"
                  style={{ fontWeight: 400 }}
                >
                  {p.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        <div className="bg-white px-7 py-10 border-t border-[#E5E5E5]">
          <p
            className="text-[12px] text-[#7A7A7A] leading-[2.2] text-center max-w-[320px] mx-auto"
            style={{ fontWeight: 400 }}
          >
            모든 컨설팅은 예약제로 진행되며,<br />
            고객님만을 위한 1:1 맞춤 시간으로 준비됩니다.<br />
            충분한 시간과 깊이 있는 상담과 분석이 이루어집니다.
            <br /><br />
            구체적인 소요 시간과 비용은 상담을 통해 안내드립니다.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
