'use client';

import { useEffect, useState } from 'react';
import { getAdminToken } from '@/utils/auth';

// 로컬 개발(next dev)에서만 쓰는 화면 — 랜드마크 검수.
// 배포 빌드(next build → Amplify)는 NODE_ENV=production 이라 메뉴가 빠지고 페이지도 열리지 않는다.
// 빌드 때 값이 박히는 상수라 서버 · 브라우저 렌더 결과가 같다.
export const IS_LOCAL_DEV = process.env.NODE_ENV !== 'production';

export const LOCAL_ONLY_PATHS = ['/landmark-review'];

// 운영에서는 관리자 본인 계정(OWNER_EMAILS, 또는 서버 .env.prod ADMIN_EMAIL 로그인 → 토큰 sub='admin')에만 보이는 화면.
// 여기서는 메뉴 · 화면만 숨긴다. 실제로 막는 것은 서버 (face-landmark-truth.service 의 OWNER_EMAILS — 같게 유지)
export const OWNER_ONLY_PATHS = ['/landmark-truth'];
const OWNER_EMAILS = ['another.dev.otter@gmail.com'];

function isOwnerToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(b64)) as { sub?: string; email?: string };
    return p.sub === 'admin' || OWNER_EMAILS.includes((p.email ?? '').toLowerCase());
  } catch {
    return false;
  }
}

/** 관리자 본인 계정인지. 쿠키는 브라우저에서만 읽혀서 첫 렌더는 null (서버 렌더와 맞추려고) */
export function useIsOwner(): boolean | null {
  const [owner, setOwner] = useState<boolean | null>(IS_LOCAL_DEV ? true : null);
  useEffect(() => {
    if (!IS_LOCAL_DEV) setOwner(isOwnerToken(getAdminToken()));
  }, []);
  return owner;
}
