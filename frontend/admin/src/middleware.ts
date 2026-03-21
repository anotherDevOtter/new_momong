import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  const isLoginPage = req.nextUrl.pathname === '/login';
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
