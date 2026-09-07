'use client';

import { ArrowLeft, ArrowRight, Check, PenLine, X } from 'lucide-react';
import { PageLayout } from './PageLayout';
import { IMAGE_CARDS } from '@/data/image-keywords';
import { fashionStylesFor } from '@/data/fashion-styles';

/**
 * 사전 인터뷰 — 시안(figma/1way (Copy)) 이식본. 'new' 코스 전용.
 *
 * 기존 사전설문은 이 내용을 intro · concerns · fashion 세 스텝에 나눠 담는다.
 * 시안은 Section 01~06 을 한 장에 세로로 이어 붙이므로 여기서는 한 화면이다.
 * 기존 화면들은 그대로 두고(1way 는 건드리지 않는다), 이 파일만 새로 쓴다.
 *
 * 시안에 없는 문항(나이·직업 / 체형 고민 / 시술 희망)은 넣지 않는다 — 시안 그대로 6섹션이다.
 * 그 값들은 'new' 흐름에서 비어 있게 되고, 고객 상세·요약 화면에 '-' 로 표시된다.
 *
 * 저장 모양(PreSurveyAnswers)은 기존과 같다. 담기는 값만 같으면
 * 요약(INFO)·고객 상세·리포트가 그대로 읽는다.
 */

const MAX_IMAGE = 2;
const MAX_STYLE = 2;

const FACE_OPTIONS = [
  '이마', '광대', '볼 옆 라인', '턱선',
  '얼굴 전체 비율', '얼굴이 길어 보이는 느낌', '얼굴이 커 보이는 느낌', '기타',
];
const HAIR_OPTIONS = [
  '앞머리', '정수리 볼륨', '옆 볼륨', '스타일 변화',
  '모발 손상', '모질', '두피', '기타',
];

interface Props {
  /** 고객 등록 때 받은 성별. 없으면 패션 섹션에서 직접 고르게 한다 */
  gender: 'female' | 'male' | null;
  genderFallback?: 'female' | 'male';
  faceConcerns: string[];
  otherFaceConcern: string;
  hairConcerns: string[];
  otherHairConcern: string;
  preferences: string[];
  dislikes: string[];
  preferredStyles: string[];
  dislikedStyles: string[];
  /** Section 03~06 자유 메모 */
  preferredImageMemo: string;
  dislikedImageMemo: string;
  preferredStylesMemo: string;
  dislikedStylesMemo: string;
  onChangeGenderFallback: (g: 'female' | 'male') => void;
  onToggleFace: (k: string) => void;
  onToggleHair: (k: string) => void;
  onChangeOtherFace: (v: string) => void;
  onChangeOtherHair: (v: string) => void;
  onTogglePreference: (k: string) => void;
  onToggleDislike: (k: string) => void;
  onTogglePreferredStyle: (k: string) => void;
  onToggleDislikedStyle: (k: string) => void;
  onChangePreferredImageMemo: (v: string) => void;
  onChangeDislikedImageMemo: (v: string) => void;
  onChangePreferredStylesMemo: (v: string) => void;
  onChangeDislikedStylesMemo: (v: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

function SectionLabel({ step, title, sub }: { step: string; title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] tracking-[0.28em] text-[#CCCCCC] uppercase mb-2" style={{ fontWeight: 300 }}>{step}</p>
      <h2 className="text-[16px] tracking-[0.01em] text-[#111111] mb-1" style={{ fontWeight: 400 }}>{title}</h2>
      {sub && <p className="text-[12px] text-[#BBBBBB]" style={{ fontWeight: 300 }}>{sub}</p>}
    </div>
  );
}

const Divider = () => <div className="w-full h-px bg-[#EBEBEB] my-16" />;

function CheckGrid({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`flex items-center gap-3 px-5 py-4 border transition-all duration-200 ${
              active ? 'border-[#111111] bg-[#FAFAFA]' : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
            }`}
          >
            <div
              className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-all ${
                active ? 'border-[#111111] bg-[#111111]' : 'border-[#CCCCCC] bg-white'
              }`}
            >
              {active && <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
            </div>
            <span
              className={`text-[13px] tracking-[0.02em] text-left ${active ? 'text-[#111111]' : 'text-[#AAAAAA]'}`}
              style={{ fontWeight: 300 }}
            >
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 자유 메모 칸. visible=false 면 접힌다 ('기타' 를 안 골랐을 때) */
function MemoField({
  visible = true,
  value,
  onChange,
  placeholder = '전달하고 싶은 내용이 있다면 기재해 주세요',
}: {
  visible?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  if (!visible) return null;
  return (
    <div className="mt-3">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full border border-[#DDDDDD] bg-[#FAFAFA] px-4 py-3.5 text-[12px] text-[#555555] placeholder-[#CCCCCC] resize-none outline-none focus:border-[#BBBBBB] transition-colors duration-200"
          style={{ fontWeight: 300, lineHeight: 1.7 }}
        />
        <PenLine className="absolute right-3.5 top-3.5 w-3.5 h-3.5 text-[#CCCCCC] pointer-events-none" strokeWidth={1.5} />
      </div>
    </div>
  );
}

/** 이미지 키워드 3×3 — 배치가 곧 헤어 이미지맵 좌표다 */
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
    <div className="grid grid-cols-3 gap-5">
      {IMAGE_CARDS.map((card) => {
        const on = selected.includes(card.ko);
        const maxed = selected.length >= MAX_IMAGE && !on;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => !maxed && onToggle(card.ko)}
            disabled={maxed}
            style={{ scale: on ? 1.02 : 1 }}
            className={`relative flex flex-col items-center py-6 px-4 text-center transition-all duration-200 ${
              on
                ? mode === 'prefer'
                  ? 'border-2 border-[#111111] bg-[#FAFAFA] shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
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
            <p
              className="text-[10px] text-[#CCCCCC] uppercase mb-2 tracking-[0.12em]"
              style={{ fontWeight: 300 }}
            >
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

/** 패션 스타일 — 성별에 맞는 사진 세트에서 고른다 */
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
    <div className="grid grid-cols-3 gap-4">
      {Object.keys(styles).map((label) => {
        const on = selected.includes(label);
        const maxed = selected.length >= MAX_STYLE && !on;
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

export function PreInterviewOnePage(p: Props) {
  // 고객 정보에 성별이 있으면 그걸 쓰고, 없을 때만 이 화면에서 고른 값을 쓴다.
  const effectiveGender = p.gender ?? p.genderFallback ?? null;
  const styles = fashionStylesFor(effectiveGender);

  return (
    <PageLayout showPageNumber={false}>
      <div className="bg-white px-8 py-24">
        <div className="max-w-3xl mx-auto">

          {/* 타이틀 — 시안 그대로 */}
          <div className="mb-20">
            <p className="text-[10px] tracking-[0.3em] text-[#CCCCCC] uppercase mb-4" style={{ fontWeight: 300 }}>Pre-Interview</p>
            <h1 className="text-[26px] tracking-[0.03em] text-[#111111] mb-4" style={{ fontWeight: 400 }}>
              사전인터뷰
            </h1>
            <p className="text-[13px] text-[#AAAAAA]" style={{ fontWeight: 300, lineHeight: 1.9 }}>
              고민 사항과 취향을 알려주세요. 맞춤 헤어 컨설팅의 기반이 됩니다.
            </p>
          </div>

          <Divider />

          {/* Section 01 */}
          <SectionLabel step="Section 01" title="얼굴 중 보완을 원하는 부위" sub="복수 선택 가능" />
          <CheckGrid options={FACE_OPTIONS} selected={p.faceConcerns} onToggle={p.onToggleFace} />
          <MemoField
            visible={p.faceConcerns.includes('기타')}
            value={p.otherFaceConcern}
            onChange={p.onChangeOtherFace}
          />

          <Divider />

          {/* Section 02 */}
          <SectionLabel step="Section 02" title="요즘 헤어 고민" sub="복수 선택 가능" />
          <CheckGrid options={HAIR_OPTIONS} selected={p.hairConcerns} onToggle={p.onToggleHair} />
          <MemoField
            visible={p.hairConcerns.includes('기타')}
            value={p.otherHairConcern}
            onChange={p.onChangeOtherHair}
          />

          <Divider />

          {/* Section 03 */}
          <SectionLabel
            step="Section 03"
            title="선호하는 이미지"
            sub={`가장 마음에 드는 이미지를 최대 ${MAX_IMAGE}개 선택해주세요.`}
          />
          <ImageCardGrid selected={p.preferences} onToggle={p.onTogglePreference} mode="prefer" />
          <MemoField value={p.preferredImageMemo} onChange={p.onChangePreferredImageMemo} />

          <Divider />

          {/* Section 04 */}
          <SectionLabel
            step="Section 04"
            title="선호하지 않는 이미지"
            sub={`피하고 싶은 이미지를 최대 ${MAX_IMAGE}개 선택해주세요.`}
          />
          <ImageCardGrid selected={p.dislikes} onToggle={p.onToggleDislike} mode="dislike" />
          <MemoField value={p.dislikedImageMemo} onChange={p.onChangeDislikedImageMemo} />

          <Divider />

          {/* 성별을 모를 때만 물어본다 — 패션 사진 세트가 갈린다 */}
          {!p.gender && (
            <div className="mb-10 p-5 border border-[#E5E5E5] bg-[#FAFAF8]">
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
                    onClick={() => p.onChangeGenderFallback(value)}
                    className={`px-6 py-2.5 text-[13px] border transition-colors ${
                      p.genderFallback === value
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

          {/* Section 05 */}
          <SectionLabel
            step="Section 05"
            title="선호하는 패션 스타일"
            sub={`마음에 드는 스타일을 최대 ${MAX_STYLE}개 선택해주세요.`}
          />
          {effectiveGender ? (
            <StyleCardGrid
              styles={styles}
              selected={p.preferredStyles}
              onToggle={p.onTogglePreferredStyle}
              mode="prefer"
            />
          ) : (
            <p className="text-[13px] text-[#999999]">위에서 먼저 선택해 주세요.</p>
          )}
          <MemoField value={p.preferredStylesMemo} onChange={p.onChangePreferredStylesMemo} />

          <Divider />

          {/* Section 06 */}
          <SectionLabel
            step="Section 06"
            title="선호하지 않는 패션 스타일"
            sub={`피하고 싶은 스타일을 최대 ${MAX_STYLE}개 선택해주세요.`}
          />
          {effectiveGender ? (
            <StyleCardGrid
              styles={styles}
              selected={p.dislikedStyles}
              onToggle={p.onToggleDislikedStyle}
              mode="dislike"
            />
          ) : (
            <p className="text-[13px] text-[#999999]">위에서 먼저 선택해 주세요.</p>
          )}
          <MemoField value={p.dislikedStylesMemo} onChange={p.onChangeDislikedStylesMemo} />

          {/* 시안 NavigationButtons — 흰 '이전' + 검정 '다음' */}
          <div className="flex gap-4 mt-20">
            <button
              type="button"
              onClick={p.onPrev}
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-white border border-[#111111] text-[#111111] text-[13px] tracking-[0.02em] transition-all duration-200 hover:bg-[#FAFAFA]"
              style={{ fontWeight: 400 }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              <span>이전</span>
            </button>
            <button
              type="button"
              onClick={p.onNext}
              className="flex-1 inline-flex items-center justify-center gap-2 px-10 py-5 bg-[#111111] text-white text-[13px] tracking-[0.02em] transition-all duration-200 hover:bg-[#222222]"
              style={{ fontWeight: 400 }}
            >
              <span>다음</span>
              <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
