'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerSelector, type CustomerSummary, type NewCustomerData } from '@/components/CustomerSelector';
import { CustomerConfirm, type ConfirmableCustomer } from '@/components/CustomerConfirm';
import { getAllCustomers, getCustomerById, createCustomer } from '@/utils/api';

type Stage = 'select' | 'confirm';

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

  const [stage, setStage] = useState<Stage>('select');
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [pending, setPending] = useState<ConfirmableCustomer | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  // type=3way 인데 course 없으면 3WAY 홈으로 돌려보냄
  useEffect(() => {
    if (type === '3way' && !course) router.replace('/3way');
  }, [type, course, router]);

  // preselect 모드: customerId 가 있으면 select 스킵하고 바로 confirm
  useEffect(() => {
    if (!token) return;
    if (preCustomerId) {
      getCustomerById(token, preCustomerId)
        .then((c) => {
          setPending({
            source: 'existing',
            id: c.id,
            name: c.name,
            phone: c.phone,
            ageGroup: c.age_group || '',
            gender: c.gender === 'male' ? 'male' : 'female',
          });
          setStage('confirm');
        })
        .catch(() => {
          // 못 찾으면 일반 선택 화면으로
          setStage('select');
        });
    } else {
      setStage('select');
    }
  }, [token, preCustomerId]);

  // 일반 선택 모드: 고객 목록 로드
  useEffect(() => {
    if (!token || stage !== 'select' || preCustomerId) return;
    setCustomersLoading(true);
    getAllCustomers(token)
      .then((list) => setCustomers(list.map((c) => ({ id: c.id, name: c.name, phone: c.phone }))))
      .catch(() => undefined)
      .finally(() => setCustomersLoading(false));
  }, [token, stage, preCustomerId]);

  if (loading) return null;
  if (!user) return null;

  const title = type === 'fit' ? 'FIT 컨설팅 시작' : '3WAY 컨설팅 시작';

  const handleSelectExisting = async (c: CustomerSummary) => {
    if (!token) return;
    try {
      const full = await getCustomerById(token, c.id);
      setPending({
        source: 'existing',
        id: c.id,
        name: c.name,
        phone: c.phone,
        ageGroup: full.age_group || '',
        gender: full.gender === 'male' ? 'male' : 'female',
      });
      setStage('confirm');
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
      setPending({
        source: 'new',
        id: created.id,
        name: data.name,
        phone: data.phone,
        ageGroup: data.ageGroup,
        gender: data.gender,
        occupation: data.occupation,
      });
      setStage('confirm');
    } catch (e) {
      alert(e instanceof Error ? e.message : '고객 등록 실패');
    }
  };

  const handleConfirm = () => {
    if (!pending || !pending.id) return;
    const customerId = pending.id;
    if (type === 'fit') {
      router.push(`/fit?customerId=${customerId}`);
    } else {
      const q = new URLSearchParams();
      q.set('course', course);
      q.set('customerId', customerId);
      if (pending.occupation) q.set('occupation', pending.occupation);
      router.push(`/3way/consulting?${q.toString()}`);
    }
  };

  const handleConfirmBack = () => {
    if (preCustomerId) {
      // preselect 모드면 select 로 가지 말고 한 단계 뒤로 (이전 페이지)
      router.back();
      return;
    }
    setStage('select');
  };

  const handleCancel = () => {
    if (type === 'fit') router.push('/');
    else router.push('/3way');
  };

  if (stage === 'confirm' && pending) {
    return (
      <CustomerConfirm
        customer={pending}
        onBack={handleConfirmBack}
        onConfirm={handleConfirm}
      />
    );
  }

  return (
    <CustomerSelector
      customers={customers}
      onSelectExisting={handleSelectExisting}
      onCreateNew={handleCreateNew}
      onCancel={handleCancel}
      title={title}
      subtitle={customersLoading ? '고객 목록 불러오는 중...' : '기존 고객을 검색하거나 신규 고객을 등록해주세요'}
    />
  );
}
