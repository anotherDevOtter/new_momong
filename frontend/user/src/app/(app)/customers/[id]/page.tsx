'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatures } from '@/contexts/FeaturesContext';
import { ClientDetailStep } from '@/components/steps/ClientDetailStep';
import { getCustomerById } from '@/utils/api';
import type { Customer, ConsultationRecord } from '@/types';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { features } = useFeatures();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (!token || !id) return;
    setLoadingCustomer(true);
    getCustomerById(token, id)
      .then(setCustomer)
      .catch(() => router.replace('/customers'))
      .finally(() => setLoadingCustomer(false));
  }, [token, id, router]);

  if (loading || loadingCustomer) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[#999999]">로딩 중...</div>;
  }
  if (!user || !customer) return null;

  const handleBack = () => router.push('/customers');
  // 고객 상세에서 시작 시 /consulting/start (고객 선택 다이얼로그) 우회 → 바로 컨설팅으로
  const handleStartFit = () => router.push(`/fit?customerId=${customer.id}`);
  const handleStart3Way = () => router.push(`/3way?customerId=${customer.id}`);
  const handleEditConsultation = (record: ConsultationRecord) => {
    // TODO: 컨설팅 편집 라우트 별도 처리. 현재는 /fit 으로 라우트하면서 customerId 만 넘김
    // FIT-NEW 기록은 저장 꼴이 달라(스타일 5축·6개월 플랜) 옛 FIT 화면으로 열면 값이 빠진다
    const route = record.hairStyleProposal?.flow === 'fit-new' ? '/fit-new' : '/fit';
    router.push(`${route}?customerId=${customer.id}&editId=${record.id}`);
  };

  return (
    <ClientDetailStep
      client={customer}
      onBack={handleBack}
      onStartNewConsultation={handleStartFit}
      onStart3Way={features.threeWayEnabled ? handleStart3Way : undefined}
      onEditConsultation={handleEditConsultation}
    />
  );
}
