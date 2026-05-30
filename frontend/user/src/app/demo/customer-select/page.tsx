'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Calendar, User, Phone, Briefcase } from 'lucide-react';
import { CustomerSelector, type CustomerSummary, type NewCustomerData } from '@/components/CustomerSelector';

const MOCK_CUSTOMERS: CustomerSummary[] = [
  { id: '1', name: '김민지', phone: '010-1234-5678', lastVisitDate: '2026-04-15', lastCourse: 'FIT', lastImageType: 'W / N' },
  { id: '2', name: '박지영', phone: '010-2345-6789', lastVisitDate: '2026-03-20', lastCourse: '3WAY', lastImageType: 'C / S' },
  { id: '3', name: '이서연', phone: '010-3456-7890', lastVisitDate: '2026-02-05', lastCourse: '2WAY (Personal Color)' },
  { id: '4', name: '최유나', phone: '010-4567-8901', lastVisitDate: '2026-01-12', lastCourse: 'FIT', lastImageType: 'N / H' },
  { id: '5', name: '정수빈', phone: '010-5678-9012', lastVisitDate: '2025-12-28', lastCourse: '3WAY', lastImageType: 'W / H' },
];

// 기존 고객 선택 시 보여줄 mock 추가 정보 (실제는 DB 조회)
const MOCK_EXTRA: Record<string, { ageGroup: string; gender: 'female' | 'male'; occupation?: string }> = {
  '1': { ageGroup: '20–30대', gender: 'female', occupation: '회사원' },
  '2': { ageGroup: '40대', gender: 'female', occupation: '주부' },
  '3': { ageGroup: '20–30대', gender: 'female' },
  '4': { ageGroup: '50대', gender: 'female', occupation: '교사' },
  '5': { ageGroup: '20–30대', gender: 'male', occupation: '학생' },
};

type Stage = 'select' | 'confirm';
type Scenario = 'fit' | '3way';

interface ConfirmingCustomer {
  source: 'existing' | 'new';
  name: string;
  phone: string;
  ageGroup: string;
  gender: 'female' | 'male';
  occupation?: string;
}

export default function DemoCustomerSelectPage() {
  const [scenario, setScenario] = useState<Scenario>('fit');
  const [stage, setStage] = useState<Stage>('select');
  const [confirming, setConfirming] = useState<ConfirmingCustomer | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleExisting = (c: CustomerSummary) => {
    const extra = MOCK_EXTRA[c.id];
    setConfirming({
      source: 'existing',
      name: c.name,
      phone: c.phone,
      ageGroup: extra?.ageGroup || '',
      gender: extra?.gender || 'female',
      occupation: extra?.occupation,
    });
    setStage('confirm');
  };

  const handleNew = (data: NewCustomerData) => {
    setConfirming({
      source: 'new',
      name: data.name,
      phone: data.phone,
      ageGroup: data.ageGroup,
      gender: data.gender,
      occupation: data.occupation,
    });
    setStage('confirm');
  };

  const handleConfirm = () => {
    if (!confirming) return;
    setLastAction(
      `[${scenario.toUpperCase()}] ${confirming.source === 'existing' ? '기존' : '신규'} · ${confirming.name} · ${confirming.phone} → 다음 단계 진행`,
    );
    toast.success('확인 완료 — 컨설팅 진행');
    setStage('select');
    setConfirming(null);
  };

  const handleBackToSelect = () => {
    setStage('select');
    setConfirming(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* 데모 컨트롤 바 */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div>
            <strong>데모 페이지</strong> · /demo/customer-select · mock 데이터 · stage = <code>{stage}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#666666]">시나리오:</span>
            <button
              onClick={() => { setScenario('fit'); setStage('select'); setConfirming(null); }}
              className={`px-2 py-0.5 rounded text-[11px] ${scenario === 'fit' ? 'bg-[#111111] text-white' : 'bg-white border border-[#E5E5E5]'}`}
            >
              FIT
            </button>
            <button
              onClick={() => { setScenario('3way'); setStage('select'); setConfirming(null); }}
              className={`px-2 py-0.5 rounded text-[11px] ${scenario === '3way' ? 'bg-[#111111] text-white' : 'bg-white border border-[#E5E5E5]'}`}
            >
              3WAY
            </button>
          </div>
        </div>
      </div>

      {/* 직전 액션 표시 */}
      {lastAction && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-xs text-green-900">
          <div className="max-w-4xl mx-auto">→ {lastAction}</div>
        </div>
      )}

      {stage === 'select' ? (
        <CustomerSelector
          customers={MOCK_CUSTOMERS}
          onSelectExisting={handleExisting}
          onCreateNew={handleNew}
          onCancel={() => toast.info('뒤로 (실제로는 홈으로)')}
          title={scenario === 'fit' ? 'FIT 컨설팅 시작' : '3WAY 컨설팅 시작'}
          subtitle="기존 고객을 검색하거나 신규 고객을 등록해주세요"
        />
      ) : (
        confirming && (
          <ConfirmCustomerScreen
            customer={confirming}
            scenario={scenario}
            onConfirm={handleConfirm}
            onBack={handleBackToSelect}
          />
        )
      )}
    </div>
  );
}

function ConfirmCustomerScreen({
  customer,
  scenario,
  onConfirm,
  onBack,
}: {
  customer: ConfirmingCustomer;
  scenario: Scenario;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="text-sm text-[#999999] hover:text-[#111111] mb-4 inline-flex items-center gap-1"
        >
          ← 다시 선택
        </button>

        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-[#111111] mb-2">
          고객 정보 확인
        </h1>
        <p className="text-sm text-[#999999] mb-8">
          {customer.source === 'existing'
            ? '기존 고객 정보를 확인하고 진행해주세요. 정보 수정은 고객 관리에서 가능합니다.'
            : '신규 고객 정보를 확인하고 진행해주세요.'}
        </p>

        <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg p-6 mb-8">
          <div className="grid grid-cols-[120px_1fr] gap-y-4 gap-x-2 text-sm">
            <div className="text-[#999999] inline-flex items-center gap-2">
              <User size={14} /> 고객명
            </div>
            <div className="text-[#111111] font-medium">{customer.name}</div>

            <div className="text-[#999999] inline-flex items-center gap-2">
              <Phone size={14} /> 연락처
            </div>
            <div className="text-[#111111]">{customer.phone}</div>

            <div className="text-[#999999] inline-flex items-center gap-2">
              <Calendar size={14} /> 연령대
            </div>
            <div className="text-[#111111]">{customer.ageGroup || '-'}</div>

            <div className="text-[#999999]">성별</div>
            <div className="text-[#111111]">{customer.gender === 'female' ? '여자' : '남자'}</div>

            {customer.occupation !== undefined && (
              <>
                <div className="text-[#999999] inline-flex items-center gap-2">
                  <Briefcase size={14} /> 직업
                </div>
                <div className="text-[#111111]">{customer.occupation || '-'}</div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full h-12 bg-[#111111] text-white rounded text-sm font-medium hover:bg-[#222222] transition-colors"
        >
          진행하기
        </button>
      </div>
    </div>
  );
}
