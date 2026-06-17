import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Image as ImageIcon } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';
import { HairImageMapReference } from './HairImageMapReference';

type ImageType = {
  warmCool: 'W' | 'N' | 'C';
  softHard: 'S' | 'N' | 'H';
};

type Strategy = 'enhance' | 'utilize' | 'neutralize';

export interface ImageDirectionData {
  currentType: ImageType;
  strategy: Strategy;
}

interface ImageDirectionSettingProps {
  onBack: () => void;
  onNext: () => void;
  // 얼굴 분석에서 도출된 현재 고객 타입. 없으면 N/N.
  currentType?: ImageType;
  onChange?: (data: ImageDirectionData) => void;
}

const TONE_LABEL: Record<'W' | 'N' | 'C', string> = { W: 'Warm', N: 'Neutral', C: 'Cool' };
const BALANCE_LABEL: Record<'S' | 'N' | 'H', string> = { S: 'Soft', N: 'Neutral', H: 'Hard' };

export function ImageDirectionSetting({
  onBack,
  onNext,
  currentType = { warmCool: 'N', softHard: 'N' },
  onChange,
}: ImageDirectionSettingProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('enhance');
  const [showImageMapReference, setShowImageMapReference] = useState(false);

  // 현재 타입 키 (예: 'N/N') — hairImageMap 조회용
  const currentKey = `${currentType.warmCool}/${currentType.softHard}`;

  // 선택/타입 변경 시 상위로 보고 (저장용)
  useEffect(() => {
    onChange?.({ currentType, strategy: selectedStrategy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStrategy, currentType.warmCool, currentType.softHard]);

  // 3x3 그리드 타입
  const typeGrid: ImageType[][] = [
    [
      { warmCool: 'W', softHard: 'S' },
      { warmCool: 'N', softHard: 'S' },
      { warmCool: 'C', softHard: 'S' },
    ],
    [
      { warmCool: 'W', softHard: 'N' },
      { warmCool: 'N', softHard: 'N' },
      { warmCool: 'C', softHard: 'N' },
    ],
    [
      { warmCool: 'W', softHard: 'H' },
      { warmCool: 'N', softHard: 'H' },
      { warmCool: 'C', softHard: 'H' },
    ],
  ];

  const isCurrentType = (type: ImageType) =>
    type.warmCool === currentType.warmCool && type.softHard === currentType.softHard;

  // 헤어 이미지맵 좌표별 키워드와 설명
  const hairImageMap = {
    'W/S': {
      position: { x: 20, y: 20 },
      keywords: ['귀여운', '순진한', '사랑스러운'],
      details: ['짧아짐', '웨이브', '앞머리', '가벼운 질감'],
      designs: ['레이어드 숏', '웨이브 보브', '시스루뱅'],
    },
    'N/S': {
      position: { x: 50, y: 20 },
      keywords: ['생기있는', '젊은','산뜻한'],
      details: ['짧음', '자연스러운 질감'],
      designs: [],
    },
    'C/S': {
      position: { x: 80, y: 20 },
      keywords: ['청초한', '깨끗한', '신선한'],
      details: ['짧음', '직선', '깔끔한 컷'],
      designs: ['턱선 보브', '일자 단발', '직선 숏컷'],
    },
    'W/N': {
      position: { x: 20, y: 50 },
      keywords: ['쾌활한', '발랄한','명랑한','활동적인','생기있는'],
      details: ['곡선', '부드러움'],
      designs: [],
    },
    'N/N': {
      position: { x: 50, y: 50 },
      keywords: ['내추럴'],
      details: ['자연스러운', '수수한', '담백한', '단아한'],
      designs: [],
    },
    'C/N': {
      position: { x: 80, y: 50 },
      keywords: ['세련된','심플한','스마트한','샤프한','지적인','섹시한'],
      details: ['직선', '선명함'],
      designs: [],
    },
    'W/H': {
      position: { x: 20, y: 80 },
      keywords: ['부드러운', '여성스러운', '화려한','섹시한'],
      details: ['길어짐', '웨이브', '부드러운 곡선', '무게감'],
      designs: ['롱 웨이브', '빌드펌', '레이어드 롱'],
    },
    'N/H': {
      position: { x: 50, y: 80 },
      keywords: ['우아한','고상한','차분한'],
      details: ['길어짐', '무게감'],
      designs: [],
    },
    'C/H': {
      position: { x: 80, y: 80 },
      keywords: ['도회적인', '기품있는', '현대적인'],
      details: ['길어짐', '스트레이트', '직선', '무게감'],
      designs: ['롱 스트레이트', '단단한 미디움', '블런트컷'],
    },
  };

  const coordinateKeywords = Object.entries(hairImageMap).map(([type, data]) => ({
    type,
    ...data,
  }));

  // 전략 옵션
  const strategies = [
    {
      id: 'enhance' as Strategy,
      number: '1',
      title: '이미지 강조',
      description: '현재 타입을 더 선명하게 살리는 방향',
      example: 'N/N → S 방향 이동 (Fresh 강화)',
      shiftDirection: 'S 방향 ↑',
    },
    {
      id: 'utilize' as Strategy,
      number: '2',
      title: '이미지 활용',
      description: '현재 타입을 유지하면서 톤과 분위기만 조절',
      example: 'N/N 유지하며 질감 변화',
      shiftDirection: '현재 위치 유지',
    },
    {
      id: 'neutralize' as Strategy,
      number: '3',
      title: '이미지 중화',
      description: '강한 이미지를 완화하여 균형감 있는 방향 제안',
      example: 'N/N → W 방향 이동',
      shiftDirection: 'W 방향 ←',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 상단 브랜드 헤더 */}

      {/* 메인 콘텐츠 */}
      <div className="pt-20 px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* 타이틀 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-bold text-[#111111] tracking-[-0.01em] mb-3">
              이미지 키워드 설정
            </h2>
            <p className="text-sm text-[#111111] font-medium">
              분석 결과를 기반으로 이미지 방향을 설정합니다.
            </p>
          </motion.div>

          {/* 메인 레이아웃: 좌우 2열 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* 좌측 영역 – 타입 조합 시각화 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <h2 className="text-sm font-normal tracking-wide text-black mb-6">
                  타입 조합 시각화
                </h2>

                {/* 3x3 그리드 */}
                <div className="space-y-2 mb-6">
                  {typeGrid.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-3 gap-2">
                      {row.map((type, colIndex) => {
                        const isCurrent = isCurrentType(type);
                        return (
                          <div
                            key={colIndex}
                            className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${
                              isCurrent
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-700 border-gray-300'
                            }`}
                          >
                            <span className="text-xs font-normal tracking-wider">
                              {type.warmCool}/{type.softHard}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* 가로축 레이블 */}
                <div className="grid grid-cols-3 gap-2 text-center mb-6">
                  <span className="text-xs text-gray-500 font-normal">Warm</span>
                  <span className="text-xs text-gray-500 font-normal">Neutral</span>
                  <span className="text-xs text-gray-500 font-normal">Cool</span>
                </div>

                {/* 세로축 레이블 (우측) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 hidden lg:flex flex-col justify-between h-48 text-xs text-gray-500 font-normal">
                  <span>Soft</span>
                  <span>Neutral</span>
                  <span>Hard</span>
                </div>

                {/* 설명 박스 */}
                <div className="bg-white rounded-xl p-4 border border-gray-300 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-normal mb-1">현재 타입:</p>
                    <p className="text-sm text-black font-normal">
                      {TONE_LABEL[currentType.warmCool]} Tone / {BALANCE_LABEL[currentType.softHard]} Balance ({currentKey})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-normal mb-1">기본 이미지 성향:</p>
                    <p className="text-sm text-black font-normal">
                      {(hairImageMap[currentKey as keyof typeof hairImageMap]?.details
                        ?? hairImageMap[currentKey as keyof typeof hairImageMap]?.keywords
                        ?? []).join(' / ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-normal mb-1">좌표 이동 가능:</p>
                    <p className="text-xs text-gray-600 font-normal leading-relaxed">
                      S 방향: 조금 더 어려 보이게<br />
                      W/H 방향: 여성스러운 분위기<br />
                      C/H 방향: 시크하고 도시적으로
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 우측 영역 – 이미지 좌표 맵 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-normal tracking-wide text-black">
                    이미지 좌표 맵
                  </h2>
                  <button
                    onClick={() => setShowImageMapReference(true)}
                    className="text-xs text-gray-600 font-normal hover:text-black transition-colors flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>실제 예시 보기</span>
                  </button>
                </div>

                {/* 좌표 맵 */}
                <div className="relative w-full aspect-square bg-white rounded-xl border border-gray-300 p-4">
                  {/* 좌표축 라인 */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* 세로 중심선 */}
                    <line
                      x1="50"
                      y1="0"
                      x2="50"
                      y2="100"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                    {/* 가로 중심선 */}
                    <line
                      x1="0"
                      y1="50"
                      x2="100"
                      y2="50"
                      stroke="#e5e7eb"
                      strokeWidth="0.5"
                    />
                  </svg>

                  {/* 축 레이블 */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-700 font-normal">
                    <div className="flex items-center gap-1">
                      <span>S</span>
                      <span className="text-gray-400">(가벼움 / 짧아짐)</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-700 font-normal">
                    <div className="flex items-center gap-1">
                      <span>H</span>
                      <span className="text-gray-400">(무게감 / 길어짐)</span>
                    </div>
                  </div>
                  <div className="absolute -left-20 top-1/2 -translate-y-1/2 text-xs text-gray-700 font-normal">
                    <div className="flex flex-col items-end gap-1">
                      <span>W</span>
                      <span className="text-gray-400 text-right">(곡선 / 웨이브)</span>
                    </div>
                  </div>
                  <div className="absolute -right-20 top-1/2 -translate-y-1/2 text-xs text-gray-700 font-normal">
                    <div className="flex flex-col items-start gap-1">
                      <span>C</span>
                      <span className="text-gray-400">(직선 / 스트레이트)</span>
                    </div>
                  </div>

                  {/* 키워드 배치 */}
                  {coordinateKeywords.map((item, index) => {
                    const isCurrentPosition = item.type === currentKey;
                    return (
                      <div
                        key={index}
                        className="absolute text-center"
                        style={{
                          left: `${item.position.x}%`,
                          top: `${item.position.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className={`${isCurrentPosition ? 'opacity-30' : ''}`}>
                          {item.keywords.map((keyword, kIndex) => (
                            <p
                              key={kIndex}
                              className="text-[10px] text-gray-600 font-normal whitespace-nowrap leading-tight"
                            >
                              {keyword}
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* 고객 위치 표시 — 현재 타입 좌표 */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${hairImageMap[currentKey as keyof typeof hairImageMap]?.position.x ?? 50}%`,
                      top: `${hairImageMap[currentKey as keyof typeof hairImageMap]?.position.y ?? 50}%`,
                    }}
                  >
                    {/* 점선 원 */}
                    <div className="absolute inset-0 w-12 h-12 -translate-x-6 -translate-y-6">
                      <svg className="w-full h-full" viewBox="0 0 48 48">
                        <circle
                          cx="24"
                          cy="24"
                          r="20"
                          fill="none"
                          stroke="#000"
                          strokeWidth="0.5"
                          strokeDasharray="2 2"
                        />
                      </svg>
                    </div>
                    {/* 중심 점 */}
                    <div className="w-3 h-3 bg-black rounded-full" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 전략 선택 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-base font-normal tracking-wide text-black mb-6">
              이미지 방향 전략
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`text-left rounded-xl p-6 border-2 transition-all ${
                    selectedStrategy === strategy.id
                      ? 'border-black bg-white'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-normal w-6 h-6 rounded-full flex items-center justify-center ${
                          selectedStrategy === strategy.id
                            ? 'bg-black text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {strategy.number}
                      </span>
                      <h3 className="text-sm font-normal text-black">{strategy.title}</h3>
                    </div>
                    {selectedStrategy === strategy.id && (
                      <Check className="w-5 h-5 text-black" strokeWidth={2} />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-normal mb-2 leading-relaxed">
                    {strategy.description}
                  </p>
                  <div className="space-y-1">
                    {strategy.example && (
                      <p className="text-xs text-gray-500 font-normal">
                        예: {strategy.example}
                      </p>
                    )}
                    {strategy.shiftDirection && (
                      <p className="text-xs text-black font-normal">
                        좌표 이동: {strategy.shiftDirection}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 하단 요약 문구 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-normal mb-2">추천 방향:</p>
                <p className="text-sm text-black font-normal">Natural 기반 Fresh 요소 강조</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-normal mb-2">디자인 전략:</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-gray-700 font-normal">과한 볼륨 X</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-gray-700 font-normal">부드러운 텍스처</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-black flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-xs text-gray-700 font-normal">균형 중심 커트 라인</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 하단 버튼 */}
          <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="디자인 제안 보기" />
        </div>
      </div>

      {/* 헤어 이미지맵 참고 모달 */}
      <AnimatePresence>
        {showImageMapReference && (
          <HairImageMapReference onClose={() => setShowImageMapReference(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
