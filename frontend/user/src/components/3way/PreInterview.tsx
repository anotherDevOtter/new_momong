import { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { ProgressSteps } from './ProgressSteps';
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
  const [selectedFaceAreas, setSelectedFaceAreas] = useState<string[]>([]);
  const [selectedHairConcerns, setSelectedHairConcerns] = useState<string[]>([]);

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
        {/* 프로그레스 스텝 */}
        <ProgressSteps
          currentStep={3}
          totalSteps={3}
          steps={['코스 선택', '고객 정보', '사전 인터뷰']}
        />

        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h1
            className="text-[2rem] tracking-[0.12em] text-[#111111] mb-4"
            style={{ fontWeight: 400 }}
          >
            사전인터뷰
          </h1>
          <p
            className="text-[15px] leading-[1.8] tracking-[0.02em] text-[#777777]"
            style={{ fontWeight: 300 }}
          >
            고객님의 고민 사항을 선택해주세요
          </p>
        </motion.div>

        {/* 섹션 1: 얼굴 중 보완을 원하는 부위 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-20"
        >
          <h2
            className="text-[13px] tracking-[0.05em] text-[#111111] mb-8"
            style={{ fontWeight: 400 }}
          >
            Q. 얼굴 중 보완을 원하는 부위
          </h2>
          <p
            className="text-[11px] text-[#999999] mb-6 tracking-[0.02em]"
            style={{ fontWeight: 300 }}
          >
            복수 선택 가능
          </p>

          <div className="grid grid-cols-2 gap-3">
            {faceAreas.map((area, index) => (
              <motion.button
                key={area}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                onClick={() => toggleFaceArea(area)}
                className={`
                  relative px-5 py-5 border transition-all duration-200
                  ${
                    selectedFaceAreas.includes(area)
                      ? 'border-[#111111] bg-[#FAFAFA]'
                      : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* 체크박스 */}
                  <div
                    className={`
                      w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-all
                      ${
                        selectedFaceAreas.includes(area)
                          ? 'border-[#111111] bg-[#111111]'
                          : 'border-[#CCCCCC] bg-white'
                      }
                    `}
                  >
                    {selectedFaceAreas.includes(area) && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    )}
                  </div>

                  {/* 텍스트 */}
                  <span
                    className={`
                      text-[13px] tracking-[0.02em] text-left
                      ${selectedFaceAreas.includes(area) ? 'text-[#111111]' : 'text-[#777777]'}
                    `}
                    style={{
                      fontWeight: selectedFaceAreas.includes(area) ? 400 : 300,
                    }}
                  >
                    {area}
                  </span>
                </div>
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
          <h2
            className="text-[13px] tracking-[0.05em] text-[#111111] mb-8"
            style={{ fontWeight: 400 }}
          >
            Q. 요즘 헤어 고민
          </h2>
          <p
            className="text-[11px] text-[#999999] mb-6 tracking-[0.02em]"
            style={{ fontWeight: 300 }}
          >
            복수 선택 가능
          </p>

          <div className="grid grid-cols-2 gap-3">
            {hairConcerns.map((concern, index) => (
              <motion.button
                key={concern}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                onClick={() => toggleHairConcern(concern)}
                className={`
                  relative px-5 py-5 border transition-all duration-200
                  ${
                    selectedHairConcerns.includes(concern)
                      ? 'border-[#111111] bg-[#FAFAFA]'
                      : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC]'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* 체크박스 */}
                  <div
                    className={`
                      w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-all
                      ${
                        selectedHairConcerns.includes(concern)
                          ? 'border-[#111111] bg-[#111111]'
                          : 'border-[#CCCCCC] bg-white'
                      }
                    `}
                  >
                    {selectedHairConcerns.includes(concern) && (
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    )}
                  </div>

                  {/* 텍스트 */}
                  <span
                    className={`
                      text-[13px] tracking-[0.02em] text-left
                      ${selectedHairConcerns.includes(concern) ? 'text-[#111111]' : 'text-[#777777]'}
                    `}
                    style={{
                      fontWeight: selectedHairConcerns.includes(concern) ? 400 : 300,
                    }}
                  >
                    {concern}
                  </span>
                </div>
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
