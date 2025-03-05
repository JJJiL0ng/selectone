// app/api/restaurantsApis/my/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';

// GET /api/restaurantsApis/my - 내 맛집 조회 API
export async function GET() {
  try {
    // Supabase 서버 클라이언트 생성
    const supabase = await createServerClient(cookies());
    
    // 현재 로그인한 사용자 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 사용자의 맛집 조회
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = 결과 없음
      console.error('맛집 조회 에러:', error);
      return NextResponse.json(
        { error: '맛집 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      restaurant: data || null,
      hasRestaurant: !!data
    });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}