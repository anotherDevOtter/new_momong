import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckboxCard } from './CheckboxCard';
import { ProgressSteps } from './ProgressSteps';
import { NavigationButtons } from './NavigationButtons';

interface ConcernsCheckProps {
  onBack: () => void;
  onNext: (data: ConcernsData) => void;
}

export interface ConcernsData {
  faceAreas: string[];
  faceOtherNote: string;
  hairConcerns: string[];
  hairOtherNote: string;
}

export function ConcernsCheck({ onBack, onNext }: ConcernsCheckProps) {
  const [selectedFaceAreas, setSelectedFaceAreas] = useState<string[]>([]);
  const [faceOtherNote, setFaceOtherNote] = useState('');
  const [selectedHairConcerns, setSelectedHairConcerns] = useState<string[]>([]);
  const [hairOtherNote, setHairOtherNote] = useState('');

  const faceAreaOptions = [
    '이마',
    '광대',
    '볼 라인',
    '턱선',
    '얼굴 전체 비율',
    '얼굴이 길어 보이는 느낌',
    '얼굴이 커 보이는 느낌',
    '기타',
  ];

  const hairConcernOptions = [
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
      if (area === '기타') {
        setFaceOtherNote('');
      }
    } else {
      setSelectedFaceAreas([...selectedFaceAreas, area]);
    }
  };

  const toggleHairConcern = (concern: string) => {
    if (selectedHairConcerns.includes(concern)) {
      setSelectedHairConcerns(selectedHairConcerns.filter((item) => item !== concern));
      if (concern === '기타') {
        setHairOtherNote('');
      }
    } else {
      setSelectedHairConcerns([...selectedHairConcerns, concern]);
    }
  };

  const handleNext = () => {
    const data: ConcernsData = {
      faceAreas: selectedFaceAreas,
      faceOtherNote,
      hairConcerns: selectedHairConcerns,
      hairOtherNote,
    };
    onNext(data);
  };

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-2xl mx-auto">
        {/* 프로그레스 스텝 */}
        <ProgressSteps
          currentStep={3}
          totalSteps={3}
          steps={['코스 선택', '고객 정보', '고민 체크']}
        />

        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <p className="text-[13px] leading-[1.8] tracking-[0.02em] text-[#777777]" style={{ fontWeight: 300 }}>
            이미지 구조 보완과 현재 고민 요소를 정리합니다
          </p>
        </motion.div>

        {/* 구분선 */}
        <div className="w-full h-px bg-[#111111] mb-20" />

        {/* 섹션 1: 얼굴 보완 부위 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-24"
        >
          <h2 className="text-[18px] tracking-[0.05em] text-[#111111] mb-2 uppercase" style={{ fontWeight: 600 }}>
            Adjustment Focus
          </h2>
          <p className="text-[13px] leading-[1.8] tracking-[0.01em] text-[#777777] mb-12" style={{ fontWeight: 300 }}>
            보완을 원하는 구조 영역
          </p>

          <div className="space-y-1">
            {faceAreaOptions.map((area, index) => {
              const isSelected = selectedFaceAreas.includes(area);
              const isOther = area === '기타';
              
              return (
                <motion.div
                  key={area}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.04, duration: 0.5 }}
                >
                  <div
                    onClick={() => toggleFaceArea(area)}
                    className="group cursor-pointer py-3 px-4 flex items-center gap-4 transition-all duration-200 hover:bg-[#FAFAFA]"
                  >
                    <div
                      className={`w-[2px] h-5 flex-shrink-0 transition-all duration-200 ${
                        isSelected ? 'bg-[#111111]' : 'bg-transparent'
                      }`}
                    />
                    <span
                      className={`text-[15px] tracking-[0.01em] transition-all duration-200 ${
                        isSelected ? 'text-[#111111]' : 'text-[#777777]'
                      }`}
                      style={{ fontWeight: isSelected ? 500 : 300 }}
                    >
                      {area}
                    </span>
                  </div>
                  
                  {isOther && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="pl-8 pr-4 pb-3"
                    >
                      <input
                        type="text"
                        value={faceOtherNote}
                        onChange={(e) => setFaceOtherNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="구체적으로 입력해주세요"
                        className="w-full px-0 py-2 bg-transparent border-b border-[#E5E5E5] text-[14px] text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                        style={{ fontWeight: 300 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 섹션 구분선 */}
        <div className="w-full h-px bg-[#E5E5E5] my-20" />

        {/* 섹션 2: 헤어 고민 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-[18px] tracking-[0.05em] text-[#111111] mb-2 uppercase" style={{ fontWeight: 600 }}>
            Current Concerns
          </h2>
          <p className="text-[13px] leading-[1.8] tracking-[0.01em] text-[#777777] mb-12" style={{ fontWeight: 300 }}>
            최근 느끼는 헤어 고민
          </p>

          <div className="space-y-1">
            {hairConcernOptions.map((concern, index) => {
              const isSelected = selectedHairConcerns.includes(concern);
              const isOther = concern === '기타';
              
              return (
                <motion.div
                  key={concern}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.04, duration: 0.5 }}
                >
                  <div
                    onClick={() => toggleHairConcern(concern)}
                    className="group cursor-pointer py-3 px-4 flex items-center gap-4 transition-all duration-200 hover:bg-[#FAFAFA]"
                  >
                    <div
                      className={`w-[2px] h-5 flex-shrink-0 transition-all duration-200 ${
                        isSelected ? 'bg-[#111111]' : 'bg-transparent'
                      }`}
                    />
                    <span
                      className={`text-[15px] tracking-[0.01em] transition-all duration-200 ${
                        isSelected ? 'text-[#111111]' : 'text-[#777777]'
                      }`}
                      style={{ fontWeight: isSelected ? 500 : 300 }}
                    >
                      {concern}
                    </span>
                  </div>
                  
                  {isOther && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="pl-8 pr-4 pb-3"
                    >
                      <input
                        type="text"
                        value={hairOtherNote}
                        onChange={(e) => setHairOtherNote(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="구체적으로 입력해주세요"
                        className="w-full px-0 py-2 bg-transparent border-b border-[#E5E5E5] text-[14px] text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                        style={{ fontWeight: 300 }}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* 하단 내비게이션 버튼 */}
        <NavigationButtons
          onBack={onBack}
          onNext={handleNext}
          backLabel="이전"
          nextLabel="다음"
          showBack={true}
          showNext={true}
        />
      </div>
    </div>
  );
}