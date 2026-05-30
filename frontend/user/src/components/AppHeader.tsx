'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
      <Link
        href="/"
        className="text-[11px] tracking-[0.25em] text-[#111111] uppercase font-medium hover:opacity-70 transition-opacity"
      >
        MERCI MOMONG
      </Link>

      <div className="flex items-center gap-2">
        {user && <span className="text-xs text-gray-400">{user.storeName}</span>}
        {user && (
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-400 transition-colors"
          >
            로그아웃
          </button>
        )}
      </div>
    </div>
  );
}
