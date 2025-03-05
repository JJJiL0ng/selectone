// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// 미들웨어: 인증이 필요한 경로 보호 및 리디렉션 처리
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 현재 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 현재 경로
  const { pathname } = req.nextUrl;

  // 인증이 필요한 경로 목록
  const protectedRoutes = ['/map', '/onboarding', '/add-restaurant', '/edit-restaurant'];
  // 인증된 사용자가 접근하면 리디렉션될 경로
  const authRoutes = ['/login'];
  
  // 인증이 필요한 경로에 인증 없이 접근하는 경우
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // 이미 인증된 사용자가 로그인 페이지에 접근하는 경우
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  if (isAuthRoute && session) {
    // 현재 사용자 정보 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', session.user.id)
      .single();
      
    // 닉네임이 없는 경우 온보딩으로, 있는 경우 지도 페이지로
    const redirectPath = userData?.nickname ? '/map' : '/onboarding';
    const redirectUrl = new URL(redirectPath, req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// 미들웨어가 적용될 경로 패턴 설정
export const config = {
  matcher: [
    '/map/:path*',
    '/onboarding',
    '/login',
    '/add-restaurant/:path*',
    '/edit-restaurant/:path*',
  ],
};