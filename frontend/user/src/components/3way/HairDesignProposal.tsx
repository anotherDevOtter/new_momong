import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';

interface HairDesignProposalProps {
  onBack: () => void;
  onNext: () => void;
}

type LengthOption = 'above-chin' | 'chin-collarbone' | 'collarbone' | 'below-collarbone';
type BangsOption = 'none' | 'see-through' | 'full' | 'side' | 'straight' | 'choppy';
type CurlOption = 'straight' | 'c-curl' | 's-curl' | 'cs-curl' | 'wave';
type ColorOption = 'tone-down' | 'tone-up' | 'root' | 'bleach' | 'maintain';

export function HairDesignProposal({ onBack, onNext }: HairDesignProposalProps) {
  const [selectedLength, setSelectedLength] = useState<LengthOption>('collarbone');
  const [selectedBangs, setSelectedBangs] = useState<BangsOption>('see-through');
  const [selectedCurl, setSelectedCurl] = useState<CurlOption>('c-curl');
  const [selectedColor, setSelectedColor] = useState<ColorOption>('tone-down');
  const [memo, setMemo] = useState('');

  // 길이 옵션
  const lengthOptions: { id: LengthOption; label: string; recommended: boolean; description: string }[] = [
    { id: 'above-chin', label: '턱 위', recommended: false, description: '활동적이고 경쾌한 이미지를 만듭니다.' },
    { id: 'chin-collarbone', label: '턱~쇄골', recommended: false, description: '관리가 용이하며 자연스러운 분위기를 만듭니다.' },
    { id: 'collarbone', label: '쇄골', recommended: true, description: '쇄골 길이는 균형감을 유지하면서 이미지를 선명하게 만들어줍니다.' },
    { id: 'below-collarbone', label: '쇄골 아래', recommended: false, description: '여성스러운 분위기와 다양한 스타일 연출이 가능합니다.' },
  ];

  // 앞머리 옵션
  const bangsOptions: { id: BangsOption; label: string; recommended: boolean; description: string }[] = [
    { id: 'none', label: '없음', recommended: false, description: '이마를 드러내어 세련되고 성숙한 이미지를 만듭니다.' },
    { id: 'see-through', label: '시스루', recommended: true, description: '시스루뱅은 Soft 요소를 더해 전체 이미지를 부드럽게 만듭니다.' },
    { id: 'full', label: '풀뱅', recommended: false, description: '귀여운 이미지와 얼굴형 보완 효과가 있습니다.' },
    { id: 'side', label: '사이드뱅', recommended: false, description: '자연스러운 얼굴 라인 보정과 캐주얼한 느낌을 줍니다.' },
    { id: 'straight', label: '스트레이트뱅', recommended: false, description: '깔끔하고 정돈된 이미지를 만듭니다.' },
    { id: 'choppy', label: '처피뱅', recommended: false, description: '트렌디하고 개성 있는 스타일을 연출합니다.' },
  ];

  // 컬/질감 옵션
  const curlOptions: { id: CurlOption; label: string; recommended: boolean; keywords: string[] }[] = [
    { id: 'straight', label: '스트레이트', recommended: false, keywords: ['선명', '세련'] },
    { id: 'c-curl', label: 'C컬', recommended: true, keywords: ['단정', '안정'] },
    { id: 's-curl', label: 'S컬', recommended: false, keywords: ['부드러움', '여성스러움'] },
    { id: 'cs-curl', label: 'CS컬', recommended: false, keywords: ['균형형'] },
    { id: 'wave', label: '웨이브', recommended: false, keywords: ['볼륨', '러블리'] },
  ];

  // 컬러 옵션
  const colorOptions: { id: ColorOption; label: string; recommended: boolean; description: string }[] = [
    { id: 'tone-down', label: '톤다운', recommended: true, description: 'Neutral 타입은 과한 채도 변화보다 명도 조절이 더 효과적입니다.' },
    { id: 'tone-up', label: '톤업', recommended: false, description: '밝은 톤으로 생기 있는 이미지를 만듭니다.' },
    { id: 'root', label: '뿌리', recommended: false, description: '자연스러운 볼륨감과 입체감을 더합니다.' },
    { id: 'bleach', label: '탈색', recommended: false, description: '대담한 컬러 변화를 원할 때 선택합니다.' },
    { id: 'maintain', label: '현재 상태 유지', recommended: false, description: '기존 컬러를 유지하며 컨디션만 개선합니다.' },
  ];

  const getSelectedOption = <T extends { id: string }>(options: T[], selectedId: string): T | undefined => {
    return options.find((opt) => opt.id === selectedId);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Step 표시 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em] mb-3">
              헤어디자인 제안
            </h2>
            <p className="text-sm text-[#999999]">
              오늘의 디자인 제안을 확인해주세요.
            </p>
          </motion.div>

          {/* 상단 요약 박스 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-light mb-1">현재 이미지 타입:</p>
                <p className="text-sm text-black font-light">Neutral / Neutral</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-light mb-1">추천 전략:</p>
                <p className="text-sm text-black font-light">이미지 강조</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-light mb-1">디자인 방향 키워드:</p>
                <p className="text-sm text-black font-light">Natural 기반 + Fresh 요소 강화</p>
              </div>
            </div>
          </motion.div>

          {/* 섹션 1 – 길이 제안 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                1
              </span>
              길이 제안
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {lengthOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedLength(option.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    selectedLength === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-light flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                        <span>Recommended</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center mb-2">
                    {selectedLength === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 설명 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {getSelectedOption(lengthOptions, selectedLength)?.description}
              </p>
            </div>
          </motion.div>

          {/* 섹션 2 – 앞머리 제안 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                2
              </span>
              앞머리 제안
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {bangsOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedBangs(option.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    selectedBangs === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-light flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                        <span>Recommended</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center mb-2">
                    {selectedBangs === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 설명 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {getSelectedOption(bangsOptions, selectedBangs)?.description}
              </p>
            </div>
          </motion.div>

          {/* 섹션 3 – 컬 / 질감 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                3
              </span>
              컬 / 질감
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-3">
                {curlOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedCurl(option.id)}
                    className={`relative rounded-xl p-4 border-2 transition-all ${
                      selectedCurl === option.id
                        ? 'border-black bg-white'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {option.recommended && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-light flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                          <span>Recommended</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-center mb-2">
                      {selectedCurl === option.id && (
                        <Check className="w-4 h-4 text-black" strokeWidth={2} />
                      )}
                    </div>
                    <p className="text-sm font-light text-black text-center">{option.label}</p>
                  </button>
                ))}
              </div>

              {/* 우측 설명 박스 */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-xs text-gray-500 font-light mb-3">선택된 스타일 키워드:</p>
                <div className="flex flex-wrap gap-2">
                  {getSelectedOption(curlOptions, selectedCurl)?.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-white text-black text-xs px-3 py-1.5 rounded-full border border-gray-300 font-light"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 섹션 4 – 컬러 방향 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-base font-light tracking-wide text-black mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center font-light">
                4
              </span>
              컬러 방향
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {colorOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedColor(option.id)}
                  className={`relative rounded-xl p-4 border-2 transition-all ${
                    selectedColor === option.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {option.recommended && (
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-light flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" strokeWidth={2} />
                        <span>Recommended</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-center mb-2">
                    {selectedColor === option.id && (
                      <Check className="w-4 h-4 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-sm font-light text-black text-center">{option.label}</p>
                </button>
              ))}
            </div>

            {/* 자동 설명 */}
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-700 font-light leading-relaxed">
                {getSelectedOption(colorOptions, selectedColor)?.description}
              </p>
            </div>
          </motion.div>

          {/* 세부 메모 입력 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="mb-8"
          >
            <label className="block text-sm font-light text-black mb-2">세부 메모 (선택사항)</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="추가로 고려할 사항이나 고객 요청사항을 입력하세요..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-light text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors resize-none"
            />
          </motion.div>

          {/* 하단 요약 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="bg-black text-white rounded-2xl p-6 mb-12"
          >
            <h3 className="text-xs tracking-[0.2em] uppercase font-light mb-4 opacity-70">
              Today Design Summary
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-light opacity-70 mb-1">길이:</p>
                <p className="text-sm font-light">
                  {getSelectedOption(lengthOptions, selectedLength)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs font-light opacity-70 mb-1">앞머리:</p>
                <p className="text-sm font-light">
                  {getSelectedOption(bangsOptions, selectedBangs)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs font-light opacity-70 mb-1">컬:</p>
                <p className="text-sm font-light">
                  {getSelectedOption(curlOptions, selectedCurl)?.label}
                </p>
              </div>
              <div>
                <p className="text-xs font-light opacity-70 mb-1">컬러:</p>
                <p className="text-sm font-light">
                  {getSelectedOption(colorOptions, selectedColor)?.label}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/20">
              <p className="text-xs font-light opacity-70 mb-1">예상 이미지 변화:</p>
              <p className="text-sm font-light">자연스러움 유지 + 생기 강조</p>
            </div>
          </motion.div>

          {/* 하단 버튼 */}
          <NavigationButtons
            onBack={onBack}
            onNext={onNext}
            nextLabel="디자인 확정 및 기록 저장"
          />
        </div>
      </div>
    </div>
  );
}
