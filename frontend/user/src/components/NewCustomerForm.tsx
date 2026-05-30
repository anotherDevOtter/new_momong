'use client';

import { useState } from 'react';
import { X, User, Phone } from 'lucide-react';

export interface NewCustomerFormData {
  name: string;
  phone: string;
  ageGroup: string;
  gender: 'female' | 'male';
  occupation: string;
}

interface NewCustomerFormProps {
  onSubmit: (data: NewCustomerFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
  title?: string;
}

const AGE_GROUPS = ['20–30대', '40대', '50대', '60대 이상'];

export function NewCustomerForm({
  onSubmit,
  onCancel,
  submitLabel = '등록하고 진행',
  title = '신규 고객 등록',
}: NewCustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | ''>('');
  const [occupation, setOccupation] = useState('');

  const isValid = name.trim() && phone.trim();

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-medium text-[#111111]">{title}</h2>
        <button
          onClick={onCancel}
          className="text-[#999999] hover:text-[#111111]"
          aria-label="신규 등록 취소"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-[#555555] mb-2">
            고객명 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#111111]"
              placeholder="홍길동"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#555555] mb-2">
            연락처 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#999999] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#111111]"
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#555555] mb-2">연령대</label>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((age) => (
              <button
                key={age}
                onClick={() => setAgeGroup(age)}
                className={`h-11 border rounded text-sm transition-colors ${
                  ageGroup === age
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'border-[#E5E5E5] text-[#555555] hover:border-[#111111]'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#555555] mb-2">성별</label>
          <div className="grid grid-cols-2 gap-2">
            {(['female', 'male'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`h-11 border rounded text-sm transition-colors ${
                  gender === g
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'border-[#E5E5E5] text-[#555555] hover:border-[#111111]'
                }`}
              >
                {g === 'female' ? '여자' : '남자'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#555555] mb-2">직업</label>
          <input
            type="text"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#111111]"
            placeholder="예: 디자이너, 회사원, 학생"
          />
        </div>

        <button
          onClick={() =>
            isValid &&
            onSubmit({
              name: name.trim(),
              phone: phone.trim(),
              ageGroup,
              gender: gender || 'female',
              occupation: occupation.trim(),
            })
          }
          disabled={!isValid}
          className="w-full h-12 bg-[#111111] text-white rounded text-sm font-medium hover:bg-[#222222] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
