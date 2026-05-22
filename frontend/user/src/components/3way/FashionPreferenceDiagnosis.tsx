import { useState } from 'react';
import { motion } from 'motion/react';
import { BrandHeader } from './BrandHeader';
import { ProgressSteps } from './ProgressSteps';
import { NavigationButtons } from './NavigationButtons';
import { FashionStyleCard } from './FashionStyleCard';

interface FashionPreferenceDiagnosisProps {
  onBack: () => void;
  onNext: (data: FashionPreferenceData) => void;
}

export interface FashionPreferenceData {
  preferredStyles: string[];
  dislikedStyles: string[];
}

interface FashionStyle {
  id: string;
  label: string;
  imageUrl: string;
}

export function FashionPreferenceDiagnosis({ onBack, onNext }: FashionPreferenceDiagnosisProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [preferredStyles, setPreferredStyles] = useState<string[]>(
    isDev ? ['classic', 'minimal'] : [],
  );
  const [dislikedStyles, setDislikedStyles] = useState<string[]>(
    isDev ? ['street'] : [],
  );

  const fashionStyles: FashionStyle[] = [
    {
      id: 'classic',
      label: '클래식',
      imageUrl: 'https://images.unsplash.com/flagged/photo-1575924821233-4ea468efb76e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwZWxlZ2FudCUyMGZhc2hpb24lMjBzdHlsZXxlbnwxfHx8fDE3NzE5ODQ0OTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'feminine',
      label: '페미닌',
      imageUrl: 'https://images.unsplash.com/photo-1768877833101-c13efba0a9cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1pbmluZSUyMHJvbWFudGljJTIwZmFzaGlvbiUyMHN0eWxlfGVufDF8fHx8MTc3MTk4NDQ5MXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'casual',
      label: '캐주얼',
      imageUrl: 'https://images.unsplash.com/photo-1595059854048-5762c544c0f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBjb21mb3J0YWJsZSUyMGZhc2hpb24lMjBzdHlsZXxlbnwxfHx8fDE3NzE5ODQ0OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'demure',
      label: '드뮤어',
      imageUrl: 'https://images.unsplash.com/photo-1716538249194-8c8ede48db1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW11cmUlMjBtb2Rlc3QlMjBmYXNoaW9uJTIwc3R5bGV8ZW58MXx8fHwxNzcxOTg0NDkyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'minimal',
      label: '미니멀',
      imageUrl: 'https://images.unsplash.com/photo-1627130697816-4d71dbfe6a5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwc2ltcGxlJTIwZmFzaGlvbiUyMHN0eWxlfGVufDF8fHx8MTc3MTk4NDQ5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'hip-chic',
      label: '힙시크',
      imageUrl: 'https://images.unsplash.com/photo-1681895648531-db7b5ced747b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXAlMjBjaGljJTIwdHJlbmR5JTIwZmFzaGlvbnxlbnwxfHx8fDE3NzE5ODQ0OTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'street',
      label: '스트릿',
      imageUrl: 'https://images.unsplash.com/photo-1647218947427-d783309440d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjB1cmJhbiUyMGZhc2hpb24lMjBzdHlsZXxlbnwxfHx8fDE3NzE5ODQ0OTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const togglePreferred = (styleId: string) => {
    if (preferredStyles.includes(styleId)) {
      setPreferredStyles(preferredStyles.filter((id) => id !== styleId));
    } else {
      setPreferredStyles([...preferredStyles, styleId]);
      // 비선호 목록에서 제거 (충돌 방지)
      if (dislikedStyles.includes(styleId)) {
        setDislikedStyles(dislikedStyles.filter((id) => id !== styleId));
      }
    }
  };

  const toggleDisliked = (styleId: string) => {
    if (dislikedStyles.includes(styleId)) {
      setDislikedStyles(dislikedStyles.filter((id) => id !== styleId));
    } else {
      setDislikedStyles([...dislikedStyles, styleId]);
      // 선호 목록에서 제거 (충돌 방지)
      if (preferredStyles.includes(styleId)) {
        setPreferredStyles(preferredStyles.filter((id) => id !== styleId));
      }
    }
  };

  const handleNext = () => {
    const data: FashionPreferenceData = {
      preferredStyles,
      dislikedStyles,
    };
    onNext(data);
  };

  const isValid = preferredStyles.length > 0 || dislikedStyles.length > 0;

  const steps = [
    '코스 선택',
    '고객 정보',
    '고민 체크',
    '이미지 선호',
    '패션 선호',
    '진단 6',
    '진단 7',
    '진단 8',
    '진단 9',
    '진단 10',
    '진단 11',
    '결과',
  ];

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-3xl mx-auto">
        {/* 프로그레스 스텝 */}
        <ProgressSteps currentStep={5} totalSteps={12} steps={steps} />

        {/* 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em]">
            패션 선호도
          </h2>
          <p className="text-sm text-[#999999]">선호하는 스타일과 선호하지 않는 스타일을 선택해주세요</p>
        </motion.div>

        {/* Section 1: 선호 스타일 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">Q. 선호하는 패션 스타일</h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-3 gap-5">
            {fashionStyles.map((style, index) => (
              <motion.div
                key={`preferred-${style.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.04, duration: 0.5 }}
              >
                <FashionStyleCard
                  label={style.label}
                  imageUrl={style.imageUrl}
                  selected={preferredStyles.includes(style.id)}
                  isDisliked={false}
                  onToggle={() => togglePreferred(style.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Section 2: 비선호 스타일 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <h3 className="text-sm font-medium text-[#111111] mb-2">Q. 선호하지 않는 패션 스타일</h3>
          <p className="text-xs text-[#999999] mb-4">복수 선택 가능</p>

          <div className="grid grid-cols-3 gap-5">
            {fashionStyles.map((style, index) => (
              <motion.div
                key={`disliked-${style.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.04, duration: 0.5 }}
              >
                <FashionStyleCard
                  label={style.label}
                  imageUrl={style.imageUrl}
                  selected={dislikedStyles.includes(style.id)}
                  isDisliked={true}
                  onToggle={() => toggleDisliked(style.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 하단 버튼 */}
        <NavigationButtons 
          onBack={onBack} 
          onNext={handleNext} 
          nextDisabled={!isValid}
          backLabel="이전"
          nextLabel="다음"
        />
      </div>
    </div>
  );
}
