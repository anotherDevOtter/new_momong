'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientListStep } from '@/components/steps/ClientListStep';
import { ConsultationHistoryList } from '@/components/steps/ConsultationHistoryList';
import type { Customer } from '@/types';

type Tab = 'customers' | 'history';

export default function CustomersPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('customers');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null;

  const handleBack = () => router.push('/');
  const handleSelectClient = (c: Customer) => router.push(`/customers/${c.id}`);

  // 고객 탭은 기존 화면(ClientListStep)이 헤더까지 통째로 그린다 → 탭 줄만 위에 얹는다.
  const tabs: { id: Tab; label: string }[] = [
    { id: 'customers', label: '고객' },
    { id: 'history', label: '상담 이력' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 탭 */}
      <div className="border-b border-[#E5E5E5]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-20 flex items-center gap-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[#888888] hover:text-[#111111] transition-colors py-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">돌아가기</span>
          </button>
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-4 text-sm transition-colors"
                style={{
                  color: tab === t.id ? '#111111' : '#999999',
                  fontWeight: tab === t.id ? 600 : 400,
                  borderBottom: '2px solid ' + (tab === t.id ? '#111111' : 'transparent'),
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'customers' ? (
        // 기존 고객 목록 화면. 자체 헤더의 '돌아가기' 는 위 탭 줄과 중복이라 이 화면에서만 숨긴다.
        <div className="[&>div>div:first-child]:hidden">
          <ClientListStep onBack={handleBack} onSelectClient={handleSelectClient} />
        </div>
      ) : (
        token && (
          <ConsultationHistoryList
            token={token}
            onSelectCustomer={(id) => router.push(`/customers/${id}`)}
          />
        )
      )}
    </div>
  );
}
