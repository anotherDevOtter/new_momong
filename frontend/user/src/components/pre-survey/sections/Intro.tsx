'use client';

import { PageLayout } from '../PageLayout';

interface IntroProps {
  age: string;
  job: string;
  preferences: string[];
  dislikes: string[];
  onChangeAge: (v: string) => void;
  onChangeJob: (v: string) => void;
  onTogglePreference: (k: string) => void;
  onToggleDislike: (k: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const MAX = 2;
const LEFT = ['귀여운 / 사랑스러운', '프레시한', '부드러운 / 여성스러운', '시크 / 세련된', '자연스러운'];
const RIGHT = ['어려보이는', '청초한', '단아한', '우아한 / 클래식한', '지적인 / 현대적인'];

function KeywordColumn({
  items,
  selected,
  onToggle,
}: {
  items: string[];
  selected: string[];
  onToggle: (k: string) => void;
}) {
  return (
    <div className="space-y-0">
      {items.map((keyword, index) => {
        const active = selected.includes(keyword);
        return (
          <div key={keyword}>
            <button
              type="button"
              onClick={() => onToggle(keyword)}
              className="w-full text-left py-5 transition-all duration-200"
            >
              <span
                className={`text-[14px] transition-all duration-200 ${
                  active
                    ? 'text-[#111111] underline decoration-1 underline-offset-4'
                    : 'text-[#2B2B2B]'
                }`}
                style={{ fontWeight: active ? 600 : 400, letterSpacing: '0.02em' }}
              >
                {keyword}
              </span>
            </button>
            {index < items.length - 1 && <div className="h-px bg-[#E5E5E5]"></div>}
          </div>
        );
      })}
    </div>
  );
}

export function Intro({
  age,
  job,
  preferences,
  dislikes,
  onChangeAge,
  onChangeJob,
  onTogglePreference,
  onToggleDislike,
  onPrev,
  onNext,
}: IntroProps) {
  const toggleClamped = (
    keyword: string,
    list: string[],
    apply: (k: string) => void,
  ) => {
    if (list.includes(keyword) || list.length < MAX) apply(keyword);
  };

  return (
    <PageLayout pageNumber={4} totalPages={8} onPrev={onPrev} onNext={onNext}>
      <div className="bg-white px-7 py-16">
        <div className="mb-16 pb-12 border-b border-[#E5E5E5]">
          <h2
            className="text-[28px] text-[#111111] mb-8 text-center"
            style={{ fontWeight: 700, letterSpacing: '0.01em' }}
          >
            고객 기본 정보
          </h2>
          <p
            className="text-[13px] text-[#7A7A7A] leading-[1.5] text-center max-w-[320px] mx-auto"
            style={{ fontWeight: 400 }}
          >
            고객님만의 아름다움을 발견하기 위한 첫 번째 단계입니다. <br />
            정확한 컨설팅을 위해 <br />몇 가지 기본 정보와 취향을 공유해 주세요.
          </p>
        </div>

        <div className="mb-20 space-y-8">
          <div>
            <label className="text-[11px] text-[#7A7A7A] mb-3 block tracking-[0.05em]" style={{ fontWeight: 500 }}>
              나이
            </label>
            <input
              type="text"
              value={age}
              onChange={(e) => onChangeAge(e.target.value)}
              className="w-full border-b border-[#E5E5E5] pb-3 text-[15px] text-[#111111] bg-transparent focus:outline-none focus:border-[#B88A5A] transition-colors"
              style={{ fontWeight: 400 }}
            />
          </div>
          <div>
            <label className="text-[11px] text-[#7A7A7A] mb-3 block tracking-[0.05em]" style={{ fontWeight: 500 }}>
              직업
            </label>
            <input
              type="text"
              value={job}
              onChange={(e) => onChangeJob(e.target.value)}
              className="w-full border-b border-[#E5E5E5] pb-3 text-[15px] text-[#111111] bg-transparent focus:outline-none focus:border-[#B88A5A] transition-colors"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>

        {/* 선호 키워드 */}
        <div className="mb-24">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              선호 이미지 키워드
            </h3>
            <p
              className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto"
              style={{ fontWeight: 400 }}
            >
              평소 추구하시는 이미지나 스타일을 선택해 주세요. <br />
              최대 {MAX}개까지 선택하실 수 있습니다.
            </p>
            <p className="text-[11px] text-[#B88A5A] mt-2" style={{ fontWeight: 400 }}>
              {preferences.length} / {MAX}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8">
            <KeywordColumn
              items={LEFT}
              selected={preferences}
              onToggle={(k) => toggleClamped(k, preferences, onTogglePreference)}
            />
            <KeywordColumn
              items={RIGHT}
              selected={preferences}
              onToggle={(k) => toggleClamped(k, preferences, onTogglePreference)}
            />
          </div>
        </div>

        {/* 비선호 키워드 */}
        <div className="mb-16">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              선호하지 않는 이미지 키워드
            </h3>
            <p
              className="text-[12px] text-[#7A7A7A] leading-[2] max-w-[300px] mx-auto"
              style={{ fontWeight: 400 }}
            >
              피하고 싶은 이미지나 스타일이 있다면 선택해 주세요. 최대 {MAX}개까지 선택하실 수 있습니다.
            </p>
            <p className="text-[11px] text-[#B88A5A] mt-2" style={{ fontWeight: 400 }}>
              {dislikes.length} / {MAX}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8">
            <KeywordColumn
              items={LEFT}
              selected={dislikes}
              onToggle={(k) => toggleClamped(k, dislikes, onToggleDislike)}
            />
            <KeywordColumn
              items={RIGHT}
              selected={dislikes}
              onToggle={(k) => toggleClamped(k, dislikes, onToggleDislike)}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
