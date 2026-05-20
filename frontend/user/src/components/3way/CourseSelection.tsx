import { useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { ProgressSteps } from './ProgressSteps';
import { NavigationButtons } from './NavigationButtons';
import { useFeatures } from '@/contexts/FeaturesContext';

interface CourseSelectionProps {
  onNext: (courseId: string) => void;
  onBack?: () => void;
}

export function CourseSelection({ onNext, onBack }: CourseSelectionProps) {
  const { features } = useFeatures();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selected2WayOption, setSelected2WayOption] = useState<'personal' | 'skeleton' | null>(null);

  const twoWayAvailable =
    features.courses['2way-personal'] || features.courses['2way-skeleton'];

  const courses = [
    {
      id: '3way',
      title: '3WAY 헤어컨설팅',
      recommended: true,
      description: '얼굴 정밀 분석 + 퍼스널컬러 + 골격 이미지 진단',
      services: '헤어컨설팅 + CUT + 스타일 코칭 + 3WAY HAIR REPORT 제공',
      footer: '가장 정밀한 분석 시스템',
    },
    {
      id: '2way',
      title: '2WAY 헤어컨설팅',
      options: [
        {
          label: '옵션 A:',
          items: ['얼굴 정밀 분석', '퍼스널컬러'],
        },
        {
          label: '옵션 B:',
          items: ['얼굴 정밀 분석', '골격 이미지 진단'],
        },
      ],
      services: '헤어컨설팅 + CUT + 스타일 코칭 + 3WAY HAIR REPORT 제공',
    },
    {
      id: '1way',
      title: '1WAY 헤어컨설팅',
      description: '얼굴 정밀 분석 기반 헤어컨설팅',
      services: 'CUT + 스타일 코칭 + 3WAY HAIR REPORT 제공',
    },
  ];

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    if (courseId !== '2way') {
      setSelected2WayOption(null);
    }
  };

  const handleNext = () => {
    if (selectedCourse) {
      if (selectedCourse === '2way' && selected2WayOption) {
        onNext(`2way-${selected2WayOption}`);
      } else if (selectedCourse !== '2way') {
        onNext(selectedCourse);
      }
    }
  };

  const isNextEnabled = () => {
    if (selectedCourse === '2way') {
      return selected2WayOption !== null;
    }
    return selectedCourse !== null;
  };

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-2xl mx-auto">
        {/* 프로그레스 스텝 */}
        <ProgressSteps
          currentStep={1}
          totalSteps={3}
          steps={['코스 선택', '고객 정보', '고민 체크']}
        />

        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em]">
            컨설팅 코스 선택
          </h2>
          <p className="text-sm text-[#999999]">원하는 진단 범위를 선택해주세요</p>
        </motion.div>

        {/* 코스 카드 영역 */}
        <div className="space-y-8 mb-16">
          {courses
            .filter((course) => {
              if (course.id === '3way') return features.courses['3way'];
              if (course.id === '2way') return twoWayAvailable;
              if (course.id === '1way') return features.courses['1way'];
              return true;
            })
            .map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
            >
              <CourseCard
                {...course}
                selected={selectedCourse === course.id}
                onSelect={() => handleCourseSelect(course.id)}
              />
              
              {/* 2WAY 서브 옵션 선택 */}
              {course.id === '2way' && selectedCourse === '2way' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 pl-8 space-y-3"
                >
                  <p className="text-[12px] tracking-[0.02em] text-[#777777] mb-4" style={{ fontWeight: 300 }}>
                    원하는 진단 조합을 선택해주세요
                  </p>
                  
                  {/* 옵션 A: 퍼스널컬러 */}
                  {features.courses['2way-personal'] && (
                  <div
                    onClick={() => setSelected2WayOption('personal')}
                    className={`cursor-pointer py-4 px-6 bg-white text-[#111111] border transition-colors ${
                      selected2WayOption === 'personal'
                        ? 'border-[#111111]'
                        : 'border-[#E5E5E5] hover:border-[#111111]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] mt-0.5 ${
                        selected2WayOption === 'personal'
                          ? 'bg-[#111111] border-[#111111]'
                          : 'bg-white border-[#CCCCCC]'
                      }`}>
                        {selected2WayOption === 'personal' && (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111111] mb-1">옵션 A: 퍼스널컬러</p>
                        <p className="text-xs text-[#777777]">
                          얼굴 정밀 분석 + 퍼스널컬러 진단
                        </p>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* 옵션 B: 골격이미지 */}
                  {features.courses['2way-skeleton'] && (
                  <div
                    onClick={() => setSelected2WayOption('skeleton')}
                    className={`cursor-pointer py-4 px-6 bg-white text-[#111111] border transition-colors ${
                      selected2WayOption === 'skeleton'
                        ? 'border-[#111111]'
                        : 'border-[#E5E5E5] hover:border-[#111111]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-[1.5px] mt-0.5 ${
                        selected2WayOption === 'skeleton'
                          ? 'bg-[#111111] border-[#111111]'
                          : 'bg-white border-[#CCCCCC]'
                      }`}>
                        {selected2WayOption === 'skeleton' && (
                          <Check size={12} color="#FFFFFF" strokeWidth={3} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111111] mb-1">옵션 B: 골격 이미지 진단</p>
                        <p className="text-xs text-[#777777]">
                          얼굴 정밀 분석 + 골격 이미지 진단
                        </p>
                      </div>
                    </div>
                  </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <NavigationButtons
          onNext={handleNext}
          nextDisabled={!isNextEnabled()}
          nextLabel="다음"
          showBack={!!onBack}
          onBack={onBack}
        />
      </div>
    </div>
  );
}