import { useState } from 'react';
import { motion } from 'motion/react';
import { NavigationButtons } from './NavigationButtons';

interface SkeletonImageAnalysisProps {
  onBack: () => void;
  onNext: () => void;
}

export function SkeletonImageAnalysis({ onBack, onNext }: SkeletonImageAnalysisProps) {
  const [selectedType, setSelectedType] = useState<string>('');

  const skeletonTypes = [
    {
      id: 'straight',
      name: 'Straight',
      subtitle: '직선형',
      description: '각진 골격과 명확한 라인',
      visualLines: [
        { x1: 20, y1: 20, x2: 80, y2: 20 },
        { x1: 80, y1: 20, x2: 80, y2: 80 },
        { x1: 80, y1: 80, x2: 20, y2: 80 },
        { x1: 20, y1: 80, x2: 20, y2: 20 },
      ],
      characteristics: [
        '각진 턱선과 직선적인 이미지',
        '시크하고 모던한 스타일 추천',
        '클린컷, 앞머리 없는 스타일',
      ],
      hairRecommendations: [
        '단발 보브컷',
        '원렌스 긴 머리',
        '가르마 스타일',
      ],
    },
    {
      id: 'wave',
      name: 'Wave',
      subtitle: '곡선형',
      description: '부드러운 곡선과 여성스러운 라인',
      visualLines: [
        { type: 'curve', points: '20,50 35,20 65,20 80,50' },
        { type: 'curve', points: '80,50 65,80 35,80 20,50' },
      ],
      characteristics: [
        '부드러운 턱선과 곡선 이미지',
        '여성스럽고 우아한 스타일 추천',
        '웨이브, 볼륨감 있는 스타일',
      ],
      hairRecommendations: [
        '레이어드 웨이브',
        'S컬 펌',
        '앞머리 있는 롱헤어',
      ],
    },
    {
      id: 'natural',
      name: 'Natural',
      subtitle: '자연형',
      description: '직선과 곡선의 조화',
      visualLines: [
        { x1: 20, y1: 30, x2: 50, y2: 20 },
        { type: 'curve', points: '50,20 80,30 80,70' },
        { type: 'curve', points: '80,70 50,80 20,70' },
        { x1: 20, y1: 70, x2: 20, y2: 30 },
      ],
      characteristics: [
        '직선과 곡선이 조화로운 이미지',
        '내추럴하고 편안한 스타일 추천',
        '다양한 스타일 소화 가능',
      ],
      hairRecommendations: [
        '허쉬컷',
        '미디엄 레이어드',
        '자연스러운 펌',
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
            SKELETAL IMAGE ANALYSIS
          </h1>
          <p className="text-[13px] leading-[1.8] tracking-[0.02em] text-[#777777]" style={{ fontWeight: 300 }}>
            얼굴 골격에 어울리는 이미지 타입을 분석합니다
          </p>
        </motion.div>

        {/* 구분선 */}
        <div className="w-full h-px bg-[#111111] mb-20" />

        {/* 골격 타입별 차트 */}
        <div className="space-y-12 mb-20">
          {skeletonTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              onClick={() => setSelectedType(type.id)}
              className={`cursor-pointer border transition-all duration-300 ${
                selectedType === type.id
                  ? 'border-[#111111] bg-[#FAFAFA]'
                  : 'border-[#E5E5E5] hover:border-[#AAAAAA]'
              }`}
            >
              <div className="p-8">
                <div className="flex gap-8">
                  {/* 왼쪽: 시각적 표현 */}
                  <div className="flex-shrink-0">
                    <svg width="120" height="120" viewBox="0 0 100 100" className="border border-[#E5E5E5]">
                      {type.visualLines.map((line: any, idx: number) => {
                        if (line.type === 'curve') {
                          return (
                            <polyline
                              key={idx}
                              points={line.points}
                              fill="none"
                              stroke="#111111"
                              strokeWidth="2"
                            />
                          );
                        }
                        return (
                          <line
                            key={idx}
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke="#111111"
                            strokeWidth="2"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* 오른쪽: 설명 */}
                  <div className="flex-1">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-[20px] tracking-[0.05em] text-[#111111] mb-1 uppercase" style={{ fontWeight: 600 }}>
                          {type.name}
                        </h2>
                        <p className="text-[14px] tracking-[0.01em] text-[#777777] mb-2" style={{ fontWeight: 300 }}>
                          {type.subtitle}
                        </p>
                        <p className="text-[12px] tracking-[0.01em] text-[#999999]" style={{ fontWeight: 300 }}>
                          {type.description}
                        </p>
                      </div>
                      
                      {/* 선택 체크박스 */}
                      <div className={`w-6 h-6 border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                        selectedType === type.id
                          ? 'border-[#111111] bg-[#111111]'
                          : 'border-[#E5E5E5]'
                      }`}>
                        {selectedType === type.id && (
                          <div className="w-3 h-3 bg-white" />
                        )}
                      </div>
                    </div>

                    {/* 특징 */}
                    <div className="mb-4">
                      <p className="text-[11px] tracking-[0.05em] text-[#999999] mb-2 uppercase" style={{ fontWeight: 500 }}>
                        Characteristics
                      </p>
                      <div className="space-y-1">
                        {type.characteristics.map((char, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-[#111111] rounded-full mt-1.5 flex-shrink-0" />
                            <p className="text-[12px] tracking-[0.01em] text-[#777777]" style={{ fontWeight: 300 }}>
                              {char}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 추천 헤어스타일 */}
                    <div>
                      <p className="text-[11px] tracking-[0.05em] text-[#999999] mb-2 uppercase" style={{ fontWeight: 500 }}>
                        Recommended Styles
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {type.hairRecommendations.map((rec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white border border-[#E5E5E5] text-[11px] tracking-[0.01em] text-[#777777]"
                            style={{ fontWeight: 300 }}
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 상세 분석 섹션 */}
        {selectedType && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4 }}
            className="mb-20"
          >
            <div className="border border-[#111111] p-8">
              <h3 className="text-[16px] tracking-[0.05em] text-[#111111] mb-4 uppercase" style={{ fontWeight: 600 }}>
                Detailed Analysis
              </h3>
              <p className="text-[13px] leading-[1.8] tracking-[0.01em] text-[#777777] mb-4" style={{ fontWeight: 300 }}>
                선택하신 {skeletonTypes.find(s => s.id === selectedType)?.name} 타입의 골격 특성에 맞춰 
                얼굴형 보완과 이미지 연출을 위한 헤어 디자인을 제안합니다.
              </p>
              <p className="text-[13px] leading-[1.8] tracking-[0.01em] text-[#777777]" style={{ fontWeight: 300 }}>
                볼륨 포지션, 레이어 위치, 길이감 등 세부적인 디테일까지 
                전문가 컨설팅을 통해 안내해드립니다.
              </p>
            </div>
          </motion.div>
        )}

        {/* 하단 버튼 */}
        <NavigationButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!selectedType}
          backLabel="이전"
          nextLabel="다음"
          showBack={true}
          showNext={true}
        />
      </div>
    </div>
  );
}
