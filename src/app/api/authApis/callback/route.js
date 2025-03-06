// app/api/authApis/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';

// GET /api/authApis/callback - OAuth 인증 콜백 처리
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = await createServerClient(cookies());
    
    try {
      // 세션 설정
      await supabase.auth.exchangeCodeForSession(code);
      
      // 현재 사용자 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // 사용자가 DB에 존재하는지 확인
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        // 사용자가 DB에 없으면 새로 생성 (이메일을 닉네임으로 사용)
        if (userError && userError.code === 'PGRST116') {
          // 이메일에서 @ 앞부분만 추출하여 닉네임으로 사용
          const emailParts = session.user.email.split('@');
          const nickname = emailParts[0];
          
          // 사용자 프로필 생성
          await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email,
              nickname: nickname, // 이메일 앞부분을 닉네임으로 설정
              auth_provider: 'google',
            });
        }
        
        // 지도 페이지로 리디렉션 (온보딩 페이지 건너뛰기)
        return NextResponse.redirect(new URL('/map', requestUrl.origin));
      }
    } catch (error) {
      console.error('인증 처리 중 오류 발생:', error);
    }
  }
  
  // 오류 발생 시 홈페이지로 리디렉션
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}