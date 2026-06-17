import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NavigationButtons } from './NavigationButtons';

// 디자이너가 선택한 골격 타입 결과 — 부모로 끌어올려 저장 (B1)
export interface SkeletonData {
  type: string; // straight | wave | natural
  typeName: string; // Straight | Wave | Natural
}

interface SkeletonImageAnalysisProps {
  onBack: () => void;
  onNext: () => void;
  onChange?: (data: SkeletonData) => void;
}

export function SkeletonImageAnalysis({ onBack, onNext, onChange }: SkeletonImageAnalysisProps) {
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

  // 선택값 변경 시 부모로 전달 (B1: 저장 누락 방지)
  useEffect(() => {
    if (!selectedType) return;
    const name = skeletonTypes.find((s) => s.id === selectedType)?.name ?? '';
    onChange?.({ type: selectedType, typeName: name });
    // skeletonTypes 는 컴포넌트 내 상수라 deps 불필요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-3xl mx-auto">
        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em]">
            골격 이미지 분석
          </h2>
          <p className="text-sm text-[#999999]">얼굴 골격에 어울리는 이미지 타입을 분석합니다</p>
        </motion.div>

        {/* 골격 타입별 차트 */}
        <div className="space-y-12 mb-20">
          {skeletonTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
              onClick={() => setSelectedType(type.id)}
              className={`cursor-pointer bg-white text-[#111111] border transition-colors ${
                selectedType === type.id ? 'border-[#111111]' : 'border-[#E5E5E5] hover:border-[#111111]'
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
                            <polyline key={idx} points={line.points} fill="none" stroke="#111111" strokeWidth="2" />
                          );
                        }
                        return (
                          <line key={idx} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#111111" strokeWidth="2" />
                        );
                      })}
                    </svg>
                  </div>

                  {/* 오른쪽: 설명 */}
                  <div className="flex-1">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#111111] tracking-[-0.01em] mb-1">
                          {type.name}
                        </h3>
                        <p className="text-sm text-[#777777] mb-2">{type.subtitle}</p>
                        <p className="text-xs text-[#999999]">{type.description}</p>
                      </div>

                      {/* 선택 체크박스 */}
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] ${
                        selectedType === type.id ? 'bg-[#111111] border-[#111111]' : 'bg-white border-[#CCCCCC]'
                      }`}>
                        {selectedType === type.id && (
                          <div className="w-2.5 h-2.5 bg-white" />
                        )}
                      </div>
                    </div>

                    {/* 특징 */}
                    <div className="mb-4">
                      <p className="text-xs uppercase font-medium mb-2 text-[#999999]">특징</p>
                      <div className="space-y-1">
                        {type.characteristics.map((char, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-[#111111]" />
                            <p className="text-sm text-[#777777]">{char}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 추천 헤어스타일 */}
                    <div>
                      <p className="text-xs uppercase font-medium mb-2 text-[#999999]">추천 스타일</p>
                      <div className="flex gap-2 flex-wrap">
                        {type.hairRecommendations.map((rec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-xs border bg-white text-[#777777] border-[#E5E5E5]"
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
              <h3 className="text-lg font-semibold text-[#111111] tracking-[-0.01em] mb-3">
                상세 분석
              </h3>
              <p className="text-sm text-[#777777] leading-[1.7] mb-3">
                선택하신 {skeletonTypes.find(s => s.id === selectedType)?.name} 타입의 골격 특성에 맞춰
                얼굴형 보완과 이미지 연출을 위한 헤어 디자인을 제안합니다.
              </p>
              <p className="text-sm text-[#777777] leading-[1.7]">
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
