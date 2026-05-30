'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerSelector, type CustomerSummary, type NewCustomerData } from '@/components/CustomerSelector';
import { CustomerConfirmDialog } from '@/components/CustomerConfirmDialog';
import type { ConfirmableCustomer } from '@/components/CustomerConfirm';
import { getAllCustomers, getCustomerById, createCustomer } from '@/utils/api';

export default function ConsultingStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ConsultingStartInner />
    </Suspense>
  );
}

function ConsultingStartInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading } = useAuth();

  const type = (searchParams.get('type') as 'fit' | '3way' | null) || 'fit';
  const course = searchParams.get('course') || '';
  const preCustomerId = searchParams.get('customerId') || '';

  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [confirming, setConfirming] = useState<ConfirmableCustomer | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (type === '3way' && !course) router.replace('/3way');
  }, [type, course, router]);

  useEffect(() => {
    if (!token) return;
    setCustomersLoading(true);
    getAllCustomers(token)
      .then((list) => setCustomers(list.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))))
      .catch(() => undefined)
      .finally(() => setCustomersLoading(false));
  }, [token]);

  // preselect ?customerId=xxx → 다이얼로그 자동 오픈
  useEffect(() => {
    if (!token || !preCustomerId) return;
    getCustomerById(token, preCustomerId)
      .then((c) => {
        setConfirming({
          source: 'existing',
          id: c.id,
          name: c.name,
          phone: c.phone,
          ageGroup: c.age_group || '',
          gender: c.gender === 'male' ? 'male' : 'female',
        });
      })
      .catch(() => undefined);
  }, [token, preCustomerId]);

  if (loading) return null;
  if (!user) return null;

  const title = type === 'fit' ? 'FIT 컨설팅 시작' : '3WAY 컨설팅 시작';

  const handleSelectExisting = async (c: CustomerSummary) => {
    if (!token) return;
    try {
      const full = await getCustomerById(token, c.id);
      setConfirming({
        source: 'existing',
        id: c.id,
        name: c.name,
        phone: c.phone,
        ageGroup: full.age_group || '',
        gender: full.gender === 'male' ? 'male' : 'female',
      });
    } catch (e) {
      console.error('고객 상세 조회 실패', e);
    }
  };

  const handleCreateNew = async (data: NewCustomerData) => {
    if (!token) return;
    try {
      const created = await createCustomer(token, {
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        age_group: data.ageGroup,
      });
      setConfirming({
        source: 'new',
        id: created.id,
        name: data.name,
        phone: data.phone,
        ageGroup: data.ageGroup,
        gender: data.gender,
        occupation: data.occupation,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : '고객 등록 실패');
    }
  };

  const handleConfirm = () => {
    if (!confirming || !confirming.id) return;
    const customerId = confirming.id;
    if (type === 'fit') {
      router.push(`/fit?customerId=${customerId}`);
    } else {
      const q = new URLSearchParams();
      q.set('course', course);
      q.set('customerId', customerId);
      if (confirming.occupation) q.set('occupation', confirming.occupation);
      router.push(`/3way/consulting?${q.toString()}`);
    }
  };

  const handleCancel = () => {
    if (type === 'fit') router.push('/');
    else router.push('/3way');
  };

  return (
    <>
      <CustomerSelector
        customers={customers}
        onSelectExisting={handleSelectExisting}
        onCreateNew={handleCreateNew}
        onCancel={handleCancel}
        title={title}
        subtitle={customersLoading ? '고객 목록 불러오는 중...' : '기존 고객을 검색하거나 신규 고객을 등록해주세요'}
      />
      <CustomerConfirmDialog
        open={!!confirming}
        customer={confirming}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirm}
        confirmLabel="시작하기"
      />
    </>
  );
}
