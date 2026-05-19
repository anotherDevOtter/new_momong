import { useState } from 'react';
import { motion } from 'motion/react';
import { NavigationButtons } from './NavigationButtons';

interface PersonalColorAnalysisProps {
  onBack: () => void;
  onNext: () => void;
}

export function PersonalColorAnalysis({ onBack, onNext }: PersonalColorAnalysisProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  const seasons = [
    {
      id: 'spring',
      name: 'Spring',
      subtitle: '봄 웜톤',
      description: '따뜻하고 밝은 톤',
      colors: ['#FFD1A9', '#FFBE98', '#FFA07A', '#FF8C69'],
      characteristics: [
        '밝고 따뜻한 컬러가 잘 어울림',
        '골드 톤 액세서리 추천',
        '피치, 코랄, 아이보리 계열',
      ],
    },
    {
      id: 'summer',
      name: 'Summer',
      subtitle: '여름 쿨톤',
      description: '시원하고 부드러운 톤',
      colors: ['#B8C5D6', '#9FB4C7', '#8CA3B8', '#7992A9'],
      characteristics: [
        '부드럽고 시원한 컬러가 잘 어울림',
        '실버 톤 액세서리 추천',
        '라벤더, 로즈, 소프트 블루 계열',
      ],
    },
    {
      id: 'autumn',
      name: 'Autumn',
      subtitle: '가을 웜톤',
      description: '깊고 따뜻한 톤',
      colors: ['#D4A574', '#C68642', '#B86F3E', '#A65E2E'],
      characteristics: [
        '깊고 따뜻한 컬러가 잘 어울림',
        '골드, 브론즈 액세서리 추천',
        '테라코타, 올리브, 브라운 계열',
      ],
    },
    {
      id: 'winter',
      name: 'Winter',
      subtitle: '겨울 쿨톤',
      description: '선명하고 차가운 톤',
      colors: ['#2C3E50', '#34495E', '#5D6D7E', '#85929E'],
      characteristics: [
        '선명하고 강한 컬러가 잘 어울림',
        '실버, 화이트골드 액세서리 추천',
        '로열블루, 와인, 퓨어화이트 계열',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-3xl mx-auto">
        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h1 className="text-[2rem] tracking-[0.12em] text-[#111111] mb-4" style={{ fontWeight: 400 }}>
            PERSONAL COLOR ANALYSIS
          </h1>
          <p className="text-[13px] leading-[1.8] tracking-[0.02em] text-[#777777]" style={{ fontWeight: 300 }}>
            당신에게 어울리는 퍼스널컬러를 분석합니다
          </p>
        </motion.div>

        {/* 구분선 */}
        <div className="w-full h-px bg-[#111111] mb-20" />

        {/* 계절별 컬러 차트 */}
        <div className="space-y-12 mb-20">
          {seasons.map((season, index) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              onClick={() => setSelectedSeason(season.id)}
              className={`cursor-pointer border transition-all duration-300 ${
                selectedSeason === season.id
                  ? 'border-[#111111] bg-[#FAFAFA]'
                  : 'border-[#E5E5E5] hover:border-[#AAAAAA]'
              }`}
            >
              <div className="p-8">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-[20px] tracking-[0.05em] text-[#111111] mb-1 uppercase" style={{ fontWeight: 600 }}>
                      {season.name}
                    </h2>
                    <p className="text-[14px] tracking-[0.01em] text-[#777777]" style={{ fontWeight: 300 }}>
                      {season.subtitle}
                    </p>
                  </div>
                  
                  {/* 선택 체크박스 */}
                  <div className={`w-6 h-6 border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                    selectedSeason === season.id
                      ? 'border-[#111111] bg-[#111111]'
                      : 'border-[#E5E5E5]'
                  }`}>
                    {selectedSeason === season.id && (
                      <div className="w-3 h-3 bg-white" />
                    )}
                  </div>
                </div>

                {/* 컬러 팔레트 */}
                <div className="flex gap-2 mb-6">
                  {season.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-16"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* 특징 */}
                <div className="space-y-2">
                  {season.characteristics.map((char, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1 h-1 bg-[#111111] rounded-full mt-2 flex-shrink-0" />
                      <p className="text-[13px] tracking-[0.01em] text-[#777777]" style={{ fontWeight: 300 }}>
                        {char}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 추천 헤어 컬러 섹션 */}
        {selectedSeason && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4 }}
            className="mb-20"
          >
            <div className="border border-[#111111] p-8">
              <h3 className="text-[16px] tracking-[0.05em] text-[#111111] mb-4 uppercase" style={{ fontWeight: 600 }}>
                Recommended Hair Color
              </h3>
              <p className="text-[13px] leading-[1.8] tracking-[0.01em] text-[#777777]" style={{ fontWeight: 300 }}>
                선택하신 {seasons.find(s => s.id === selectedSeason)?.name} 타입에 어울리는 헤어 컬러를 제안합니다.
                자연스러운 그라데이션부터 포인트 컬러까지 다양한 옵션을 컨설팅 시 제공해드립니다.
              </p>
            </div>
          </motion.div>
        )}

        {/* 하단 버튼 */}
        <NavigationButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!selectedSeason}
          backLabel="이전"
          nextLabel="다음"
          showBack={true}
          showNext={true}
        />
      </div>
    </div>
  );
}
