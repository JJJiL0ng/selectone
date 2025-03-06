// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// 미들웨어: 인증이 필요한 경로 보호 및 리디렉션 처리
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 세션 새로고침
  const { data: { session } } = await supabase.auth.getSession();
  
  // 현재 경로
  const { pathname } = req.nextUrl;

  // 인증이 필요한 경로 목록
  const protectedRoutes = ['/map', '/add-restaurant', '/edit-restaurant'];
  // 인증된 사용자가 접근하면 리디렉션될 경로
  const authRoutes = ['/login', '/map'];
  
  // 인증이 필요한 경로에 인증 없이 접근하는 경우
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthRoute && session) {
    // 지도 페이지로 리디렉션
    const redirectUrl = new URL('/map', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// 모든 경로에 미들웨어 적용
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};