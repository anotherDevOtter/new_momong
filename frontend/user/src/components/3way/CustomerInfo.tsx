import { useState } from 'react';
import { motion } from 'motion/react';
import { ProgressSteps } from './ProgressSteps';
import { NavigationButtons } from './NavigationButtons';

interface CustomerInfoProps {
  onBack: () => void;
  onNext: (data: CustomerData) => void;
}

export interface CustomerData {
  name: string;
  phone: string;
  occupation: string;
  ageGroup: string;
  gender: string;
  designerName: string;
}

export function CustomerInfo({ onBack, onNext }: CustomerInfoProps) {
  const [formData, setFormData] = useState<CustomerData>({
    name: '',
    phone: '',
    occupation: '',
    ageGroup: '',
    gender: '',
    designerName: '',
  });

  const ageGroups = ['20–30대', '40대', '50대', '60대 이상'];
  const genders = ['여자', '남자'];

  const isValid = formData.name.trim() !== '' && formData.phone.trim() !== '';

  const handlePhoneChange = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 자동으로 하이픈 추가
    let formatted = numbers;
    if (numbers.length > 3 && numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length > 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    
    setFormData({ ...formData, phone: formatted });
  };

  const handleNext = () => {
    if (isValid) {
      onNext(formData);
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 pt-24 pb-40">
      <div className="max-w-2xl mx-auto">
        {/* 프로그레스 스텝 */}
        <ProgressSteps
          currentStep={2}
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
          <h1 className="text-[2rem] tracking-[0.12em] text-[#111111] mb-4" style={{ fontWeight: 400 }}>
            CLIENT INFORMATION
          </h1>
          <p className="text-[15px] leading-[1.8] tracking-[0.02em] text-[#777777]" style={{ fontWeight: 300 }}>
            정확한 컨설팅을 위해 기본 정보를 입력해주세요
          </p>
        </motion.div>

        {/* 입력 필드 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-12 mb-16"
        >
          {/* 고객명 */}
          <div>
            <label className="block text-[11px] text-[#777777] mb-4 tracking-[0.05em]" style={{ fontWeight: 300 }}>
              고객명 <span className="text-[#111111]">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-0 py-3 border-0 border-b border-[#E5E5E5] bg-transparent text-[15px] text-[#111111] focus:outline-none focus:border-[#111111] transition-colors duration-200"
              style={{ fontWeight: 300 }}
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-[11px] text-[#777777] mb-4 tracking-[0.05em]" style={{ fontWeight: 300 }}>
              연락처 <span className="text-[#111111]">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
              className="w-full px-0 py-3 border-0 border-b border-[#E5E5E5] bg-transparent text-[15px] text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#111111] transition-colors duration-200"
              style={{ fontWeight: 300 }}
            />
          </div>

          {/* 직업 */}
          <div>
            <label className="block text-[11px] text-[#777777] mb-4 tracking-[0.05em]" style={{ fontWeight: 300 }}>
              직업
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="예: 디자이너, 회사원, 학생 등"
              className="w-full px-0 py-3 border-0 border-b border-[#E5E5E5] bg-transparent text-[15px] text-[#111111] placeholder:text-[#CCCCCC] focus:outline-none focus:border-[#111111] transition-colors duration-200"
              style={{ fontWeight: 300 }}
            />
          </div>

          {/* 연령대 */}
          <div>
            <label className="block text-[11px] text-[#777777] mb-6 tracking-[0.05em]" style={{ fontWeight: 300 }}>
              연령대
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ageGroups.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setFormData({ ...formData, ageGroup: age })}
                  className={`
                    py-4 px-4 border transition-all duration-200 text-[13px] tracking-[0.02em]
                    ${
                      formData.ageGroup === age
                        ? 'border-[#111111] bg-white text-[#111111]'
                        : 'border-[#E5E5E5] bg-white text-[#777777] hover:border-[#AAAAAA]'
                    }
                  `}
                  style={{ fontWeight: formData.ageGroup === age ? 400 : 300 }}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-[11px] text-[#777777] mb-6 tracking-[0.05em]" style={{ fontWeight: 300 }}>
              성별
            </label>
            <div className="grid grid-cols-2 gap-3">
              {genders.map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender })}
                  className={`
                    py-4 px-4 border transition-all duration-200 text-[13px] tracking-[0.02em]
                    ${
                      formData.gender === gender
                        ? 'border-[#111111] bg-white text-[#111111]'
                        : 'border-[#E5E5E5] bg-white text-[#777777] hover:border-[#AAAAAA]'
                    }
                  `}
                  style={{ fontWeight: formData.gender === gender ? 400 : 300 }}
                >
                  {gender}
                </button>
              ))}
            </div>
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