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

  // 인증이 필요한 경로 목록 (add-restaurant는 제외)
  const protectedRoutes = ['/edit-restaurant'];
  
  // 인증이 필요한 경로에 인증 없이 접근하는 경우
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    // 로그인 후 돌아올 경로를 쿼리 파라미터로 추가
    redirectUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// 모든 경로에 미들웨어 적용
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};