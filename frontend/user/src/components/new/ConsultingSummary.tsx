import { motion } from 'motion/react';
import { BrandHeader } from './BrandHeader';
import type { PreInterviewData } from './preSurveyToPreInterview';

const IMAGE_CARDS = [
  { id: 'cute',     en: 'CUTE',     ko: '귀여운',  keywords: ['사랑스러운', '귀여운', '순진한'] },
  { id: 'pure',     en: 'PURE',     ko: '청초한',  keywords: ['맑은', '청초한', '청순한'] },
  { id: 'fresh',    en: 'FRESH',    ko: '프레시한', keywords: ['산뜻한', '시원한', '깨끗한'] },
  { id: 'casual',   en: 'CASUAL',   ko: '캐주얼',  keywords: ['발랄한', '활동적인', '생기있는'] },
  { id: 'natural',  en: 'NATURAL',  ko: '내추럴',  keywords: ['수수한', '자연스러운', '단아한'] },
  { id: 'chic',     en: 'CHIC',     ko: '시크한',  keywords: ['샤프한', '시크한', '세련된'] },
  { id: 'feminine', en: 'FEMININE', ko: '페미닌',  keywords: ['화려한', '여성스러운', '부드러운'] },
  { id: 'classic',  en: 'CLASSIC',  ko: '클래식',  keywords: ['고상한', '우아한', '정제된'] },
  { id: 'modern',   en: 'MODERN',   ko: '모던',    keywords: ['지적인', '도회적인', '현대적인'] },
];

const styleLabels: Record<string, string> = {
  classic: '클래식',
  feminine: '페미닌',
  casual: '캐주얼',
  demure: '드뮤어',
  minimal: '미니멀',
  'hip-chic': '힙시크',
  street: '스트릿',
};

interface ConsultingSummaryProps {
  selectedCourse: string;
  preInterviewData: PreInterviewData;
  onBack: () => void;
  onNext: () => void;
}

export function ConsultingSummary({
  preInterviewData,
  onBack,
  onNext,
}: ConsultingSummaryProps) {
  const {
    faceAreas, faceAreasMemo,
    hairConcerns, hairConcernsMemo,
    preferredImageIds, preferredImageMemo,
    dislikedImageIds,
    preferredStyles, preferredStylesMemo,
    dislikedStyles,
  } = preInterviewData;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <BrandHeader />

      <div className="flex-1 pt-20 px-6 pb-8">
        <div className="max-w-3xl mx-auto flex flex-col h-full">

          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-[1.6rem] tracking-[0.08em] text-[#111111] mb-2" style={{ fontWeight: 700 }}>
              INFO
            </h1>
            <p className="text-[13px] text-[#AAAAAA]" style={{ fontWeight: 300 }}>
              컨설팅 전 정보 요약
            </p>
          </motion.div>

          {/* 카드 1: TODAY KEYWORD */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="border border-[#DDDDDD] p-6 mb-4"
          >
            <p className="text-[11px] tracking-[0.15em] text-[#AAAAAA] mb-5 uppercase" style={{ fontWeight: 400 }}>
              Today Keyword
            </p>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[#AAAAAA]" style={{ fontWeight: 300 }}>얼굴 고민: </span>
                <span className="text-[#111111]" style={{ fontWeight: 600 }}>
                  {faceAreas.length > 0 ? faceAreas.join(', ') : '—'}
                </span>
                {faceAreasMemo && (
                  <p className="mt-1 text-[12px] text-[#888888] pl-0" style={{ fontWeight: 300 }}>└ {faceAreasMemo}</p>
                )}
              </div>
              <div>
                <span className="text-[#AAAAAA]" style={{ fontWeight: 300 }}>헤어 고민: </span>
                <span className="text-[#111111]" style={{ fontWeight: 600 }}>
                  {hairConcerns.length > 0 ? hairConcerns.join(', ') : '—'}
                </span>
                {hairConcernsMemo && (
                  <p className="mt-1 text-[12px] text-[#888888]" style={{ fontWeight: 300 }}>└ {hairConcernsMemo}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* 카드 2: IMAGE KEYWORD 매트릭스 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="border border-[#DDDDDD] p-6 mb-4"
          >
            <p className="text-[11px] tracking-[0.15em] text-[#AAAAAA] mb-6 uppercase" style={{ fontWeight: 400 }}>
              Image Keyword
            </p>

            {/* 시안 그대로 — 칸이 붙은 3×3 표.
                (Soft 행 cute·pure·fresh / Neutral 행 casual·natural·chic / Hard 행 feminine·classic·modern) */}
            <div className="border border-[#DDDDDD] rounded-xl overflow-hidden">
              {[
                ['cute', 'pure', 'fresh'],
                ['casual', 'natural', 'chic'],
                ['feminine', 'classic', 'modern'],
              ].map((row, rowIdx) => (
                <div key={rowIdx} className={`flex ${rowIdx < 2 ? 'border-b border-[#EEEEEE]' : ''}`}>
                  {row.map((cardId, colIdx) => {
                    const card = IMAGE_CARDS.find((c) => c.id === cardId);
                    if (!card) return null;
                    const isPreferred = preferredImageIds.includes(card.id);
                    const isDisliked = dislikedImageIds.includes(card.id);

                    return (
                      <div
                        key={cardId}
                        className={`flex-1 flex flex-col items-center justify-center py-3 px-1 text-center relative
                          ${colIdx < 2 ? 'border-r border-[#EEEEEE]' : ''}
                          ${isPreferred ? 'bg-[#F2F2F2]' : isDisliked ? 'bg-white opacity-40' : 'bg-white'}
                        `}
                      >
                        {isPreferred && (
                          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-[#111111] text-white text-[8px] flex items-center justify-center">✓</span>
                        )}
                        {isDisliked && (
                          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border border-[#AAAAAA] text-[#AAAAAA] text-[8px] flex items-center justify-center">✕</span>
                        )}
                        <p
                          className="text-[12px] mb-1.5 tracking-wide"
                          style={{ fontWeight: isPreferred ? 600 : 400, color: isPreferred ? '#111111' : '#555555' }}
                        >
                          {card.en.toLowerCase()}
                        </p>
                        <div className="space-y-0.5">
                          {card.keywords.map((kw) => (
                            <p key={kw} className="text-[9px] leading-tight" style={{ color: '#AAAAAA', fontWeight: 300 }}>
                              {kw}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 bg-[#111111] text-white text-[8px] flex items-center justify-center">✓</span>
                <span className="text-[11px] text-[#888888]">선호</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border border-[#AAAAAA] text-[#AAAAAA] text-[8px] flex items-center justify-center">✕</span>
                <span className="text-[11px] text-[#888888]">비선호</span>
              </div>
            </div>
          </motion.div>

          {/* 카드 3: FASHION STYLE */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="border border-[#DDDDDD] p-6 mb-8"
          >
            <p className="text-[11px] tracking-[0.15em] text-[#AAAAAA] mb-5 uppercase" style={{ fontWeight: 400 }}>
              Fashion Style
            </p>
            <div className="space-y-4 text-[13px]">
              <div>
                <p className="text-[#AAAAAA] mb-2" style={{ fontWeight: 300 }}>선호</p>
                <div className="flex flex-wrap gap-2">
                  {preferredStyles.length > 0 ? (
                    preferredStyles.map((id) => (
                      <span key={id} className="bg-[#111111] text-white text-[12px] px-3 py-1" style={{ fontWeight: 400 }}>
                        {styleLabels[id] || id}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#BBBBBB]">—</span>
                  )}
                </div>
                {preferredStylesMemo && (
                  <p className="mt-2 text-[12px] text-[#888888]" style={{ fontWeight: 300 }}>└ {preferredStylesMemo}</p>
                )}
                {preferredImageMemo && (
                  <p className="mt-1 text-[12px] text-[#888888]" style={{ fontWeight: 300 }}>└ (이미지) {preferredImageMemo}</p>
                )}
              </div>
              <div>
                <p className="text-[#AAAAAA] mb-2" style={{ fontWeight: 300 }}>비선호</p>
                <div className="flex flex-wrap gap-2">
                  {dislikedStyles.length > 0 ? (
                    dislikedStyles.map((id) => (
                      <span key={id} className="border border-[#CCCCCC] text-[#888888] text-[12px] px-3 py-1" style={{ fontWeight: 400 }}>
                        {styleLabels[id] || id}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#BBBBBB]">—</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-[11px] text-[#BBBBBB] mb-10"
            style={{ fontWeight: 300 }}
          >
            *디자이너 내부 확인용입니다
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex gap-3 mt-auto"
          >
            <button
              onClick={onBack}
              className="flex-1 py-5 border border-[#DDDDDD] text-[#111111] text-[14px] tracking-[0.04em] bg-white transition-colors hover:bg-[#F8F8F8]"
              style={{ fontWeight: 400 }}
            >
              이전
            </button>
            <button
              onClick={onNext}
              className="flex-1 py-5 bg-[#111111] text-white text-[14px] tracking-[0.04em] transition-colors hover:bg-[#333333]"
              style={{ fontWeight: 400 }}
            >
              다음
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
