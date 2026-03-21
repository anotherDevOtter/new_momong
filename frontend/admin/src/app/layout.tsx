import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'MERCI MOMONG Admin',
  description: 'MERCI MOMONG 어드민 패널',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
