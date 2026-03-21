'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearAdminToken } from '@/utils/auth';

interface AdminHeaderProps {
  currentPath: string;
}

export default function AdminHeader({ currentPath }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/users', label: '유저 관리' },
  ];

  return (
    <header className="border-b border-[#E5E5E5] bg-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-xs font-medium tracking-widest text-[#111111] uppercase">
            MERCI MOMONG
          </span>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  currentPath === link.href
                    ? 'text-[#111111] font-medium'
                    : 'text-[#999999] hover:text-[#111111]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-[#999999] hover:text-[#111111] transition-colors"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
