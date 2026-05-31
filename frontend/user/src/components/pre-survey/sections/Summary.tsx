'use client';

import { PageLayout } from '../PageLayout';
import type { PreSurveyAnswers } from '@/utils/pre-survey-api';

const PROGRAM_NAMES: Record<string, string> = {
  '01': '3WAY HAIR CONSULTING',
  '02': '2WAY HAIR CONSULTING (퍼스널컬러)',
  '03': '2WAY HAIR CONSULTING (골격이미지)',
  '04': '1WAY HAIR CONSULTING',
};

interface SummaryProps {
  answers: PreSurveyAnswers;
  currentDate: string;
  onPrev: () => void;
  onNext: () => void;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pb-5 border-b border-[#E5E5E5]">
      <h3 className="text-[10px] text-[#B88A5A] mb-3 tracking-[0.15em]" style={{ fontWeight: 600 }}>
        {label}
      </h3>
      {children}
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((c, i) => (
        <span key={i} className="px-2.5 py-1 bg-[#F7F7F5] text-[11px] text-[#2B2B2B]" style={{ fontWeight: 400 }}>
          {c}
        </span>
      ))}
    </div>
  );
}

function OtherNote({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <p className="text-[11px] text-[#2B2B2B] leading-[1.6] bg-[#FFFBF7] p-2 mt-2" style={{ fontWeight: 400 }}>
      <span className="text-[#B88A5A]">{label}:</span> {value}
    </p>
  );
}

export function Summary({ answers, currentDate, onPrev, onNext }: SummaryProps) {
  const a = answers;
  return (
    <PageLayout pageNumber={6} totalPages={8} onPrev={onPrev} onNext={onNext} showPageNumber={false}>
      <div className="bg-white">
        <div className="pt-12 pb-16 px-7">
          <div className="max-w-[600px] mx-auto bg-white border-2 border-[#B88A5A] shadow-xl">
            <div className="bg-white border-b-2 border-[#B88A5A] px-6 py-8">
              <div className="text-center mb-6">
                <p className="text-[9px] text-[#B88A5A] tracking-[0.3em] mb-3" style={{ fontWeight: 500 }}>
                  HAIR CONSULTING
                </p>
                <h1 className="text-[24px] text-[#111111] mb-3" style={{ fontWeight: 400, letterSpacing: '0.05em' }}>
                  사전인터뷰 내용 요약
                </h1>
                <p className="text-[11px] text-[#7A7A7A] leading-[1.6] mb-3" style={{ fontWeight: 400 }}>
                  작성하신 내용을 디자이너가 확인합니다.
                </p>
                <p className="text-[10px] text-[#7A7A7A] tracking-[0.1em]" style={{ fontWeight: 400 }}>
                  {currentDate}
                </p>
              </div>
              <div className="w-16 h-[1px] bg-[#B88A5A] mx-auto"></div>
            </div>

            <div className="px-6 py-8 space-y-6">
              {a.selectedProgram && (
                <Section label="PROGRAM">
                  <p className="text-[13px] text-[#2B2B2B] leading-[1.8]" style={{ fontWeight: 500 }}>
                    {PROGRAM_NAMES[a.selectedProgram] || a.selectedProgram}
                  </p>
                </Section>
              )}

              <Section label="BASIC INFO">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-[#7A7A7A] block mb-1" style={{ fontWeight: 400 }}>나이</span>
                    <p className="text-[12px] text-[#2B2B2B]" style={{ fontWeight: 400 }}>{a.age || '-'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7A7A7A] block mb-1" style={{ fontWeight: 400 }}>직업</span>
                    <p className="text-[12px] text-[#2B2B2B]" style={{ fontWeight: 400 }}>{a.job || '-'}</p>
                  </div>
                </div>
              </Section>

              {a.preferences && a.preferences.length > 0 && (
                <Section label="PREFERRED IMAGE">
                  <Chips items={a.preferences} />
                </Section>
              )}

              {a.dislikes && a.dislikes.length > 0 && (
                <Section label="NON-PREFERRED IMAGE">
                  <Chips items={a.dislikes} />
                </Section>
              )}

              {a.bodyConcerns && a.bodyConcerns.length > 0 && (
                <Section label="BODY CONCERNS">
                  <Chips items={a.bodyConcerns} />
                  <OtherNote label="기타" value={a.otherBodyConcern} />
                </Section>
              )}

              {a.faceConcerns && a.faceConcerns.length > 0 && (
                <Section label="FACIAL CONCERNS">
                  <Chips items={a.faceConcerns} />
                  <OtherNote label="기타" value={a.otherFaceConcern} />
                </Section>
              )}

              {a.hairConcerns && a.hairConcerns.length > 0 && (
                <Section label="HAIR CONCERNS">
                  <Chips items={a.hairConcerns} />
                  <OtherNote label="기타" value={a.otherHairConcern} />
                </Section>
              )}

              {a.treatmentPreference && (
                <div className="pb-5">
                  <h3 className="text-[10px] text-[#B88A5A] mb-3 tracking-[0.15em]" style={{ fontWeight: 600 }}>
                    TREATMENT PREFERENCE
                  </h3>
                  <p className="text-[12px] text-[#2B2B2B] leading-[1.8]" style={{ fontWeight: 400 }}>
                    {a.treatmentPreference}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border-t-2 border-[#B88A5A] px-6 py-6 text-center">
              <p className="text-[9px] text-[#7A7A7A] tracking-[0.3em] mb-2" style={{ fontWeight: 400 }}>
                MERCI MOMONG
              </p>
              <p className="text-[10px] text-[#7A7A7A] leading-[1.8]" style={{ fontWeight: 400 }}>
                작성하신 내용은 자동 저장되며 디자이너가 확인합니다.
              </p>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
}
