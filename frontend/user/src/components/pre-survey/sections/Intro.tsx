'use client';

import { Check, X } from 'lucide-react';
import { PageLayout } from '../PageLayout';
import { IMAGE_CARDS } from '@/data/image-keywords';
import { fashionStylesFor } from '@/data/fashion-styles';

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
  /**
   * 이미지 키워드를 시안식 3×3 카드로 보여줄지.
   * 기존 사전설문(1WAY)은 글자 목록 10종 그대로 두고, 'new' 코스 링크
   * (?course=new) 에서만 카드 9종을 쓴다. 저장되는 값은 카드의 한글 라벨이고,
   * 옛 10종 라벨은 preSurveyToPreInterview 의 변환표가 계속 읽는다.
   */
  useImageCards?: boolean;
  /** 패션 사진 세트를 가르는 성별. 고객 정보에 없으면 이 화면에서 직접 고르게 한다 */
  gender?: 'female' | 'male' | null;
  genderFallback?: 'female' | 'male';
  onChangeGenderFallback?: (g: 'female' | 'male') => void;
  preferredStyles?: string[];
  onTogglePreferredStyle?: (label: string) => void;
  dislikedStyles?: string[];
  onToggleDislikedStyle?: (label: string) => void;
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

/**
 * 시안 사전인터뷰 Section 03·04 와 같은 3×3 카드.
 * 배치가 곧 헤어 이미지맵의 좌표다 (Soft/Neutral/Hard × Warm/Neutral/Cool).
 * 상태는 색과 테두리로만 나타내고 글자 굵기는 바꾸지 않는다.
 */
function ImageCardGrid({
  selected,
  onToggle,
  mode,
}: {
  selected: string[];
  onToggle: (label: string) => void;
  mode: 'prefer' | 'dislike';
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5">
      {IMAGE_CARDS.map((card) => {
        const on = selected.includes(card.ko);
        const maxed = selected.length >= MAX && !on;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => !maxed && onToggle(card.ko)}
            disabled={maxed}
            className={`relative flex flex-col items-center py-6 px-2 sm:px-4 text-center transition-all duration-200 ${
              on
                ? mode === 'prefer'
                  ? 'border-2 border-[#111111] bg-[#FAFAFA]'
                  : 'border-2 border-[#AAAAAA] bg-[#F0F0F0] opacity-60'
                : maxed
                ? 'border border-[#E5E5E5] bg-white opacity-30 cursor-not-allowed'
                : 'border border-[#EAEAEA] bg-white hover:border-[#CCCCCC]'
            }`}
          >
            {on && (
              <div
                className={`absolute top-3 right-3 w-5 h-5 flex items-center justify-center ${
                  mode === 'prefer' ? 'bg-[#111111]' : 'bg-[#888888]'
                }`}
              >
                {mode === 'prefer'
                  ? <Check size={12} color="white" strokeWidth={2.5} />
                  : <X size={12} color="white" strokeWidth={2.5} />}
              </div>
            )}
            <p className="text-[10px] text-[#CCCCCC] uppercase mb-2 tracking-[0.12em]" style={{ fontWeight: 300 }}>
              {card.en}
            </p>
            <p
              className={`text-[15px] mb-4 ${on && mode === 'dislike' ? 'text-[#AAAAAA]' : 'text-[#111111]'}`}
              style={{ fontWeight: 400 }}
            >
              {card.ko}
            </p>
            <div className="flex flex-col items-center gap-1">
              {card.keywords.map((kw) => (
                <p key={kw} className="text-[10px] text-[#DDDDDD] leading-tight" style={{ fontWeight: 300 }}>
                  {kw}
                </p>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 선호 패션 스타일 — 이미지 키워드 바로 아래에 붙는다.
 * 사진 세트가 성별로 갈리므로, 고객 정보에 성별이 없으면 먼저 물어본다.
 */
function StyleCardGrid({
  styles,
  selected,
  onToggle,
  mode,
}: {
  styles: Record<string, string[]>;
  selected: string[];
  onToggle: (label: string) => void;
  mode: 'prefer' | 'dislike';
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.keys(styles).map((label) => {
        const on = selected.includes(label);
        const maxed = selected.length >= MAX && !on;
        const images = styles[label] ?? [];
        return (
          <button
            key={label}
            type="button"
            onClick={() => !maxed && onToggle(label)}
            disabled={maxed}
            className={`flex flex-col text-center transition-opacity duration-200 ${maxed ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <div
              className={`relative w-full overflow-hidden transition-all duration-200 ${
                on
                  ? mode === 'prefer' ? 'ring-2 ring-[#111111]' : 'ring-2 ring-[#AAAAAA]'
                  : 'ring-1 ring-[#E5E5E5]'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5 aspect-square">
                {images.slice(0, 2).map((src, i) => (
                  <div key={i} className="overflow-hidden h-full bg-[#F2F2F0]">
                    <img
                      src={src}
                      alt={`${label} ${i + 1}`}
                      loading="lazy"
                      className={`w-full h-full object-cover ${on && mode === 'dislike' ? 'grayscale' : ''}`}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                  </div>
                ))}
              </div>
              {on && <div className="absolute inset-0 bg-black/10" />}
              {on && (
                <div
                  className={`absolute top-2 right-2 w-6 h-6 flex items-center justify-center ${
                    mode === 'prefer' ? 'bg-[#111111]' : 'bg-[#888888]'
                  }`}
                >
                  {mode === 'prefer'
                    ? <Check size={14} color="white" strokeWidth={2.5} />
                    : <X size={14} color="white" strokeWidth={2.5} />}
                </div>
              )}
            </div>
            <p
              className={`mt-2.5 text-[12px] tracking-[0.02em] ${on ? 'text-[#111111]' : 'text-[#AAAAAA]'}`}
              style={{ fontWeight: 300 }}
            >
              {label}
            </p>
          </button>
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
  useImageCards = false,
  gender = null,
  genderFallback,
  onChangeGenderFallback,
  preferredStyles = [],
  onTogglePreferredStyle,
  dislikedStyles = [],
  onToggleDislikedStyle,
}: IntroProps) {
  // 고객 정보에 성별이 있으면 그걸 쓰고, 없을 때만 이 화면에서 고른 값을 쓴다.
  const effectiveGender = gender ?? genderFallback ?? null;
  const styles = fashionStylesFor(effectiveGender);
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

          {useImageCards ? (
            <>
              <ImageCardGrid selected={preferences} onToggle={onTogglePreference} mode="prefer" />

              {/* 선호 패션 스타일 — 이미지 키워드 바로 아래 (2026-09-10) */}
              <div className="mt-16">
                <div className="mb-8 text-center">
                  <h3 className="text-[16px] text-[#111111] mb-3" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                    선호하는 패션 스타일
                  </h3>
                  <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
                    마음에 드는 스타일을 최대 {MAX}개 선택해 주세요.
                  </p>
                  <p className="text-[11px] text-[#B88A5A] mt-2" style={{ fontWeight: 400 }}>
                    {preferredStyles.length} / {MAX}
                  </p>
                </div>

                {/* 성별을 모를 때만 물어본다 — 사진 세트가 갈린다 */}
                {!gender && (
                  <div className="mb-8 p-5 border border-[#E5E5E5] bg-[#FAFAF8]">
                    <p className="text-[13px] text-[#111111] mb-3" style={{ fontWeight: 500 }}>
                      어느 쪽 스타일을 보여드릴까요?
                    </p>
                    <div className="flex gap-2">
                      {([
                        ['female', '여성'],
                        ['male', '남성'],
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => onChangeGenderFallback?.(value)}
                          className={`px-6 py-2.5 text-[13px] border transition-colors ${
                            genderFallback === value
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-white text-[#555555] border-[#DDDDDD] hover:border-[#111111]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {effectiveGender ? (
                  <StyleCardGrid
                    styles={styles}
                    selected={preferredStyles}
                    onToggle={(label) => onTogglePreferredStyle?.(label)}
                    mode="prefer"
                  />
                ) : (
                  <p className="text-[13px] text-[#999999] text-center">위에서 먼저 선택해 주세요.</p>
                )}
              </div>
            </>
          ) : (
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
          )}
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

          {useImageCards ? (
            <>
              <ImageCardGrid selected={dislikes} onToggle={onToggleDislike} mode="dislike" />

              {/* 선호하지 않는 패션 스타일 — 비선호 이미지 키워드 바로 아래 (2026-09-10).
                  이 블록이 생기면서 따로 있던 패션 화면은 'new' 흐름에서 뺐다. */}
              <div className="mt-16">
                <div className="mb-8 text-center">
                  <h3 className="text-[16px] text-[#111111] mb-3" style={{ fontWeight: 600, letterSpacing: '0.01em' }}>
                    선호하지 않는 패션 스타일
                  </h3>
                  <p className="text-[12px] text-[#7A7A7A] leading-[1.5] max-w-[300px] mx-auto" style={{ fontWeight: 400 }}>
                    피하고 싶은 스타일이 있다면 최대 {MAX}개 선택해 주세요.
                  </p>
                  <p className="text-[11px] text-[#B88A5A] mt-2" style={{ fontWeight: 400 }}>
                    {dislikedStyles.length} / {MAX}
                  </p>
                </div>

                {effectiveGender ? (
                  <StyleCardGrid
                    styles={styles}
                    selected={dislikedStyles}
                    onToggle={(label) => onToggleDislikedStyle?.(label)}
                    mode="dislike"
                  />
                ) : (
                  <p className="text-[13px] text-[#999999] text-center">위에서 성별을 먼저 선택해 주세요.</p>
                )}
              </div>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </PageLayout>
  );
}
