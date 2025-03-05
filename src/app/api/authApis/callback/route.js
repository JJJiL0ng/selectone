// app/api/auth/callback/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';

// GET /api/auth/callback - OAuth 인증 콜백 처리
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const supabase = await createServerClient(cookies());
    
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
      
      // 사용자가 DB에 없으면 새로 생성
      if (userError && userError.code === 'PGRST116') {
        // 이메일에서 기본 닉네임 추출 (@ 앞 부분)
        const defaultNickname = session.user.email.split('@')[0];
        
        // 닉네임 중복 확인
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact' })
          .eq('nickname', defaultNickname);
        
        let nickname = defaultNickname;
        let counter = 1;
        
        // 닉네임이 중복되면 숫자 추가
        while (count > 0 && counter < 100) {
          nickname = `${defaultNickname}${counter}`;
          const { count: newCount } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('nickname', nickname);
          
          if (newCount === 0) break;
          counter++;
        }
        
        // 사용자 프로필 생성
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            nickname: null, // 사용자가 직접 설정하도록 null로 설정
            auth_provider: 'google',
          });
        
        // 온보딩 페이지로 리디렉션
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
      
      // 사용자가 이미 존재하고 닉네임이 있으면 지도 페이지로, 없으면 온보딩 페이지로
      if (userData && userData.nickname) {
        return NextResponse.redirect(new URL('/map', request.url));
      } else {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }
  }
  
  // 오류 시 로그인 페이지로
  return NextResponse.redirect(new URL('/login', request.url));
}