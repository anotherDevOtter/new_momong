'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ClientListStep } from '@/components/steps/ClientListStep';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null;

  const handleBack = () => router.push('/');
  const handleSelectClient = (c: Customer) => router.push(`/customers/${c.id}`);

  return <ClientListStep onBack={handleBack} onSelectClient={handleSelectClient} />;
}
