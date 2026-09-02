'use client';

import { Check, X } from 'lucide-react';
import { PageLayout } from '../PageLayout';
import { fashionStylesFor } from '@/data/fashion-styles';

const MAX = 2;

interface FashionStyleProps {
  /** 고객 등록 때 받은 성별. 없으면 이 화면에서 직접 고르게 한다. */
  gender: 'female' | 'male' | null;
  genderFallback?: 'female' | 'male';
  onChangeGenderFallback: (g: 'female' | 'male') => void;
  preferredStyles: string[];
  dislikedStyles: string[];
  onTogglePreferred: (label: string) => void;
  onToggleDisliked: (label: string) => void;
  onPrev: () => void;
  onNext: () => void;
  pageNumber?: number;
  totalPages?: number;
}

export function FashionStyle({
  gender,
  genderFallback,
  onChangeGenderFallback,
  preferredStyles,
  dislikedStyles,
  onTogglePreferred,
  onToggleDisliked,
  onPrev,
  onNext,
  pageNumber,
  totalPages,
}: FashionStyleProps) {
  // 고객 정보에 성별이 있으면 그걸 쓰고, 없을 때만 이 화면에서 고른 값을 쓴다.
  const effective = gender ?? genderFallback ?? null;
  const styles = fashionStylesFor(effective);
  const labels = Object.keys(styles);

  return (
    <PageLayout onPrev={onPrev} onNext={onNext} pageNumber={pageNumber} totalPages={totalPages}>
      <div className="px-6 md:px-14 pt-14 pb-4 max-w-[860px] mx-auto">
        <p className="text-[11px] tracking-[0.2em] text-[#999999] uppercase mb-2">Fashion</p>
        <h2 className="text-[22px] md:text-[26px] text-[#111111] mb-2" style={{ fontWeight: 600 }}>
          선호하는 패션 스타일
        </h2>
        <p className="text-[13px] text-[#777777] mb-8">
          평소 즐겨 입는 옷차림에 가까운 쪽을 골라주세요. 헤어 디자인 방향을 잡는 데 씁니다.
        </p>

        {/* 고객 정보에 성별이 없을 때만 물어본다 — 있으면 다시 묻지 않는다 */}
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
                  onClick={() => onChangeGenderFallback(value)}
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

        {effective && (
          <>
            <StyleGrid
              title="마음에 드는 스타일"
              hint={`최대 ${MAX}개`}
              labels={labels}
              styles={styles}
              selected={preferredStyles}
              onToggle={onTogglePreferred}
              tone="like"
            />
            <div className="h-10" />
            <StyleGrid
              title="피하고 싶은 스타일"
              hint={`최대 ${MAX}개`}
              labels={labels}
              styles={styles}
              selected={dislikedStyles}
              onToggle={onToggleDisliked}
              tone="dislike"
            />
          </>
        )}
      </div>
    </PageLayout>
  );
}

function StyleGrid({
  title,
  hint,
  labels,
  styles,
  selected,
  onToggle,
  tone,
}: {
  title: string;
  hint: string;
  labels: string[];
  styles: Record<string, string[]>;
  selected: string[];
  onToggle: (label: string) => void;
  tone: 'like' | 'dislike';
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-[15px] text-[#111111]" style={{ fontWeight: 500 }}>{title}</h3>
        <span className="text-[12px] text-[#999999]">{hint}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {labels.map((label) => {
          const on = selected.includes(label);
          const images = styles[label] ?? [];
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggle(label)}
              className="group text-left"
            >
              <div
                className={`relative overflow-hidden transition-all ${
                  on ? 'border-2 border-[#111111]' : 'border border-[#E5E5E5] hover:border-[#999999]'
                }`}
              >
                <div className="grid grid-cols-2 gap-0.5 aspect-[3/4]">
                  {images.slice(0, 2).map((src, i) => (
                    <div key={i} className="overflow-hidden h-full bg-[#F2F2F0]">
                      <img
                        src={src}
                        alt={`${label} ${i + 1}`}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          on && tone === 'dislike' ? 'grayscale brightness-95' : ''
                        } group-hover:scale-105`}
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      />
                    </div>
                  ))}
                </div>

                {on && (
                  <div
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center"
                    style={{ background: '#111111' }}
                  >
                    {tone === 'like'
                      ? <Check size={15} color="white" strokeWidth={3} />
                      : <X size={15} color="white" strokeWidth={3} />}
                  </div>
                )}
              </div>
              <p
                className={`mt-2 text-[13px] text-center transition-colors ${
                  on ? 'text-[#111111]' : 'text-[#666666]'
                }`}
                style={{ fontWeight: on ? 600 : 400 }}
              >
                {label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
