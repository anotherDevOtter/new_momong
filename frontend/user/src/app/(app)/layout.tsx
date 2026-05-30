'use client';

import { Toaster } from 'sonner';
import { AppHeader } from '@/components/AppHeader';

export default function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#111111', color: '#FFFFFF', border: '1px solid #333333', fontSize: '14px' },
        }}
      />
      <AppHeader />
      {children}
    </>
  );
}
