'use client';

import { PageLayout } from '../PageLayout';

interface DetailedConcernsProps {
  bodyConcerns: string[];
  faceConcerns: string[];
  hairConcerns: string[];
  otherBodyConcern: string;
  otherFaceConcern: string;
  otherHairConcern: string;
  treatmentPreference: string;
  onToggleBody: (k: string) => void;
  onToggleFace: (k: string) => void;
  onToggleHair: (k: string) => void;
  onChangeOtherBody: (v: string) => void;
  onChangeOtherFace: (v: string) => void;
  onChangeOtherHair: (v: string) => void;
  onChangeTreatment: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const FACE_LEFT = ['이마', '볼 옆 라인', '얼굴 전체 비율', '얼굴이 커 보이는 느낌'];
const FACE_RIGHT = ['광대', '턱선', '얼굴이 길어 보이는 느낌', '기타'];
const HAIR_LEFT = ['앞머리', '옆 볼륨', '모발 손상', '두피'];
const HAIR_RIGHT = ['정수리 볼륨', '스타일 변화', '모질', '기타'];
const BODY_LEFT = ['목이 짧아요', '어깨가 좁아요'];
const BODY_RIGHT = ['승모근이 높아요', '기타'];

function ConcernColumn({
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
      {items.map((concern, index) => {
        const active = selected.includes(concern);
        return (
          <div key={concern}>
            <button
              type="button"
              onClick={() => onToggle(concern)}
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
                {concern}
              </span>
            </button>
            {index < items.length - 1 && <div className="h-px bg-[#E5E5E5]"></div>}
          </div>
        );
      })}
    </div>
  );
}

function OtherInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-8 max-w-[320px] mx-auto">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full border-b border-[#E5E5E5] pb-3 text-[14px] text-[#111111] bg-transparent focus:outline-none focus:border-[#B88A5A] transition-colors resize-none"
        style={{ fontWeight: 400, lineHeight: '2' }}
      />
    </div>
  );
}

export function DetailedConcerns(p: DetailedConcernsProps) {
  return (
    <PageLayout pageNumber={5} totalPages={8} onPrev={p.onPrev} onNext={p.onNext}>
      <div className="bg-white px-7 py-16">
        <div className="mb-16 pb-12 border-b border-[#E5E5E5]">
          <h2 className="text-[28px] text-[#111111] mb-8 text-center" style={{ fontWeight: 700, letterSpacing: '0.01em' }}>
            상세 고민 인터뷰
          </h2>
          <p className="text-[13px] text-[#7A7A7A] leading-[1.5] text-center max-w-[320px] mx-auto" style={{ fontWeight: 400 }}>
            고객님께서 평소 느끼셨던 고민이나 바라는 변화에 대해 <br />
            편안하게 이야기해 주세요. <br />
            작은 디테일 하나하나가 더 나은 제안의 시작점이 됩니다.
          </p>
        </div>

        {/* 체형 */}
        <div className="mb-24">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              체형 고민
            </h3>
            <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
              어깨, 목, 전체적인 실루엣에 대해 <br /> 평소 고민하셨던 부분을 선택해 주세요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            <ConcernColumn items={BODY_LEFT} selected={p.bodyConcerns} onToggle={p.onToggleBody} />
            <ConcernColumn items={BODY_RIGHT} selected={p.bodyConcerns} onToggle={p.onToggleBody} />
          </div>
          {p.bodyConcerns.includes('기타') && (
            <OtherInput value={p.otherBodyConcern} onChange={p.onChangeOtherBody} placeholder="체형 고민을 자유롭게 적어주세요" />
          )}
        </div>

        {/* 얼굴 */}
        <div className="mb-24">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              얼굴 중 보완을 원하는 부위
            </h3>
            <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
              헤어 스타일로 보완하거나 강조하고 싶은 부분을 선택해 주세요. 여러 개를 선택하실 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            <ConcernColumn items={FACE_LEFT} selected={p.faceConcerns} onToggle={p.onToggleFace} />
            <ConcernColumn items={FACE_RIGHT} selected={p.faceConcerns} onToggle={p.onToggleFace} />
          </div>
          {p.faceConcerns.includes('기타') && (
            <OtherInput value={p.otherFaceConcern} onChange={p.onChangeOtherFace} placeholder="얼굴 고민을 자유롭게 적어주세요" />
          )}
        </div>

        {/* 헤어 */}
        <div className="mb-24">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              요즘 헤어 고민
            </h3>
            <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
              현재 헤어 스타일이나 모발 상태에 대해 <br />고민하시는 부분을 자유롭게 선택해 주세요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            <ConcernColumn items={HAIR_LEFT} selected={p.hairConcerns} onToggle={p.onToggleHair} />
            <ConcernColumn items={HAIR_RIGHT} selected={p.hairConcerns} onToggle={p.onToggleHair} />
          </div>
          {p.hairConcerns.includes('기타') && (
            <OtherInput value={p.otherHairConcern} onChange={p.onChangeOtherHair} placeholder="헤어 고민을 자유롭게 적어주세요" />
          )}
        </div>

        {/* 시술 */}
        <div className="mb-16">
          <div className="mb-12 text-center">
            <h3 className="text-[16px] text-[#111111] mb-5" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
              시술 희망 여부
            </h3>
            <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
              펌이나 염색 등 추가 시술에 대한 계획이 있으시다면 <br /> 선택해 주세요.
            </p>
          </div>
          <div className="space-y-0 max-w-[200px] mx-auto">
            {['펌', '염색', '상담 후 결정'].map((option, index) => (
              <div key={option}>
                <label className="flex items-center gap-3 py-5 cursor-pointer">
                  <input
                    type="radio"
                    name="treatment"
                    value={option}
                    checked={p.treatmentPreference === option}
                    onChange={(e) => p.onChangeTreatment(e.target.value)}
                    className="w-3.5 h-3.5 accent-[#B88A5A]"
                  />
                  <span className="text-[14px] text-[#2B2B2B]" style={{ fontWeight: 400, letterSpacing: '0.02em' }}>
                    {option}
                  </span>
                </label>
                {index < 2 && <div className="h-px bg-[#E5E5E5]"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
