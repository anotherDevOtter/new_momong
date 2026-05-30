import { useState } from 'react';
import { motion } from 'motion/react';
import { NavigationButtons } from './NavigationButtons';
import { Input } from '@/components/ui/Input';

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
  const isDev = process.env.NODE_ENV === 'development';
  const [formData, setFormData] = useState<CustomerData>(
    isDev
      ? {
          name: '홍길동',
          phone: '010-1234-5678',
          occupation: '회사원',
          ageGroup: '20–30대',
          gender: '여자',
          designerName: '테스트 디자이너',
        }
      : {
          name: '',
          phone: '',
          occupation: '',
          ageGroup: '',
          gender: '',
          designerName: '',
        },
  );

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
        {/* 상단 타이틀 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 space-y-3"
        >
          <h2 className="text-2xl font-semibold text-[#111111] tracking-[-0.01em]">고객 정보</h2>
          <p className="text-sm text-[#999999]">정확한 컨설팅을 위해 기본 정보를 입력해주세요</p>
        </motion.div>

        {/* 입력 필드 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="space-y-8 mb-16"
        >
          <Input
            label="고객명"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            required
          />

          <Input
            label="연락처"
            type="tel"
            value={formData.phone}
            onChange={(value) => handlePhoneChange(value)}
            placeholder="010-0000-0000"
            maxLength={13}
            required
          />

          <Input
            label="직업"
            value={formData.occupation}
            onChange={(value) => setFormData({ ...formData, occupation: value })}
            placeholder="예: 디자이너, 회사원, 학생 등"
          />

          {/* 연령대 */}
          <div className="space-y-2">
            <label className="block text-sm text-[#555555]">연령대</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ageGroups.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setFormData({ ...formData, ageGroup: age })}
                  className={`h-14 px-4 text-sm font-medium border transition-all ${
                    formData.ageGroup === age
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <label className="block text-sm text-[#555555]">성별</label>
            <div className="grid grid-cols-2 gap-2">
              {genders.map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender })}
                  className={`h-14 px-4 text-sm font-medium border transition-all ${
                    formData.gender === gender
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-white text-[#111111] border-[#E5E5E5] hover:border-[#111111]'
                  }`}
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