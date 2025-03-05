
// app/api/authApis/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';

// POST /api/authApis/check-nickname - 닉네임 중복 확인 API
export async function POST(request) {
  try {
    const body = await request.json();
    const { nickname } = body;

    if (!nickname || nickname.trim() === '') {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    // Supabase 서버 클라이언트 생성
    const supabase = await createServerClient(cookies());

    // 닉네임 중복 확인
    const { data, error, count } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('nickname', nickname);

    if (error) {
      console.error('닉네임 확인 에러:', error);
      return NextResponse.json(
        { error: '닉네임 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: count === 0,
      message: count === 0 ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
    });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/authApis/nickname - 닉네임 업데이트 API
export async function PUT(request) {
  try {
    const body = await request.json();
    const { nickname } = body;

    if (!nickname || nickname.trim() === '') {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 닉네임 유효성 검사
    if (nickname.length < 2 || nickname.length > 20) {
      return NextResponse.json(
        { error: '닉네임은 2자 이상 20자 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 한글, 영문, 숫자, 언더스코어만 허용
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
      return NextResponse.json(
        { error: '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.' },
        { status: 400 }
      );
    }

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

    // 닉네임 중복 확인
    const { data: checkData, count } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('nickname', nickname);

    if (count > 0) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 400 }
      );
    }

    // 닉네임 업데이트
    const { data, error } = await supabase
      .from('users')
      .update({ nickname, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select('*')
      .single();

    if (error) {
      console.error('닉네임 업데이트 에러:', error);
      return NextResponse.json(
        { error: '닉네임 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: '닉네임이 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/authApis/me - 현재 로그인한 사용자 정보 조회 API
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

    // 사용자 정보 조회
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('사용자 정보 조회 에러:', error);
      return NextResponse.json(
        { error: '사용자 정보 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}