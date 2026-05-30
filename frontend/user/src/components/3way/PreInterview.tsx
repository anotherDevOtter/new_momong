import { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { NavigationButtons } from './NavigationButtons';

interface PreInterviewProps {
  onBack: () => void;
  onNext: (data: PreInterviewData) => void;
}

export interface PreInterviewData {
  faceAreas: string[];
  hairConcerns: string[];
}

export function PreInterview({ onBack, onNext }: PreInterviewProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [selectedFaceAreas, setSelectedFaceAreas] = useState<string[]>(
    isDev ? ['이마', '광대'] : [],
  );
  const [selectedHairConcerns, setSelectedHairConcerns] = useState<string[]>(
    isDev ? ['앞머리', '정수리 볼륨'] : [],
  );

  const faceAreas = [
    '이마',
    '광대',
    '볼 옆 라인',
    '턱선',
    '얼굴 전체 비율',
    '얼굴이 길어 보이는 느낌',
    '얼굴이 커 보이는 느낌',
    '기타',
  ];

  const hairConcerns = [
    '앞머리',
    '정수리 볼륨',
    '옆 볼륨',
    '스타일 변화',
    '모발 손상',
    '모질',
    '두피',
    '기타',
  ];

  const toggleFaceArea = (area: string) => {
    if (selectedFaceAreas.includes(area)) {
      setSelectedFaceAreas(selectedFaceAreas.filter((item) => item !== area));
    } else {
      setSelectedFaceAreas([...selectedFaceAreas, area]);
    }
  };

  const toggleHairConcern = (concern: string) => {
    if (selectedHairConcerns.includes(concern)) {
      setSelectedHairConcerns(selectedHairConcerns.filter((item) => item !== concern));
    } else {
      setSelectedHairConcerns([...selectedHairConcerns, concern]);
    }
  };

  const handleNext = () => {
    onNext({
      faceAreas: selectedFaceAreas,
      hairConcerns: selectedHairConcerns,
    });
  };

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
            사전 인터뷰
          </h2>
          <p className="text-sm text-[#999999]">고객님의 고민 사항을 선택해주세요</p>
        </motion.div>

        {/* 섹션 1: 얼굴 중 보완을 원하는 부위 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-20"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">
            Q. 얼굴 중 보완을 원하는 부위
          </h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-2 gap-3">
            {faceAreas.map((area, index) => (
              <motion.button
                key={area}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                onClick={() => toggleFaceArea(area)}
                className={`
                  h-14 px-4 flex items-center gap-3 text-sm font-medium border transition-all
                  ${
                    selectedFaceAreas.includes(area)
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                  }
                `}
              >
                <div
                  className={`
                    w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] transition-all
                    ${
                      selectedFaceAreas.includes(area)
                        ? 'bg-white border-white'
                        : 'bg-white border-[#CCCCCC]'
                    }
                  `}
                >
                  {selectedFaceAreas.includes(area) && (
                    <Check size={12} color="#111111" strokeWidth={3} />
                  )}
                </div>
                <span>{area}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 섹션 2: 요즘 헤어 고민 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">
            Q. 요즘 헤어 고민
          </h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-2 gap-3">
            {hairConcerns.map((concern, index) => (
              <motion.button
                key={concern}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                onClick={() => toggleHairConcern(concern)}
                className={`
                  h-14 px-4 flex items-center gap-3 text-sm font-medium border transition-all
                  ${
                    selectedHairConcerns.includes(concern)
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                  }
                `}
              >
                <div
                  className={`
                    w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] transition-all
                    ${
                      selectedHairConcerns.includes(concern)
                        ? 'bg-white border-white'
                        : 'bg-white border-[#CCCCCC]'
                    }
                  `}
                >
                  {selectedHairConcerns.includes(concern) && (
                    <Check size={12} color="#111111" strokeWidth={3} />
                  )}
                </div>
                <span>{concern}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 하단 버튼 */}
        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          backLabel="이전"
          nextLabel="다음"
        />
      </div>
    </div>
  );
}
