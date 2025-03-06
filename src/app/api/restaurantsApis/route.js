// app/api/restaurantsApis/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';
import { getServerSession } from 'next-auth/next';

// getServerSession에 필요한 authOptions 가져오기
// 경로가 없는 경우 직접 authOptions 객체를 정의
const authOptions = {
  // 여기에 필요한 인증 옵션 설정
};

// GET /api/restaurantsApis - 모든 맛집 조회 API
export async function GET(request) {
  try {
    // URL 쿼리 파라미터 파싱
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const bounds = url.searchParams.get('bounds'); // "lat1,lng1,lat2,lng2" 형식
    
    // Supabase 서버 클라이언트 생성
    const supabase = await createServerClient(cookies());
    
    let query = supabase
      .from('restaurants')
      .select(`
        *,
        users:user_id (
          id,
          nickname,
          email
        )
      `);
    
    // 특정 사용자의 맛집만 필터링
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // 지도 범위 내 맛집만 필터링
    if (bounds) {
      const [lat1, lng1, lat2, lng2] = bounds.split(',').map(Number);
      query = query
        .gte('latitude', Math.min(lat1, lat2))
        .lte('latitude', Math.max(lat1, lat2))
        .gte('longitude', Math.min(lng1, lng2))
        .lte('longitude', Math.max(lng1, lng2));
    }
    
    const { data: restaurants, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('맛집 정보 조회 에러:', error);
    return NextResponse.json(
      { error: '맛집 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/restaurantsApis - 맛집 등록 API
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await request.json();

    // 필수 필드 검증
    if (!data.name || !data.latitude || !data.longitude || !data.address) {
      return NextResponse.json(
        { error: '이름, 위치, 주소는 필수 입력사항입니다.' },
        { status: 400 }
      );
    }

    // 사용자당 하나의 맛집만 등록 가능하도록 체크
    const { data: existingRestaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existingRestaurant) {
      return NextResponse.json(
        { error: '이미 등록한 맛집이 있습니다. 기존 맛집을 수정해주세요.' },
        { status: 400 }
      );
    }

    // 새 맛집 추가
    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert({
        ...data,
        user_id: userId
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ restaurant: newRestaurant });
  } catch (error) {
    console.error('맛집 추가 에러:', error);
    return NextResponse.json(
      { error: '맛집 정보 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurantsApis/:id - 맛집 수정 API
export async function PUT(request, { params }) {
  try {
    const id = request.url.split('/').pop(); // URL에서 ID 추출
    const body = await request.json();
    const { name, latitude, longitude, description, address } = body;
    
    // 필수 필드 검증
    if (!name || !latitude || !longitude || !address) {
      return NextResponse.json(
        { error: '이름, 위치, 주소는 필수 입력사항입니다.' },
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
    
    // 맛집 소유자 확인
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: '맛집을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    if (restaurant.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '자신의 맛집만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }
    
    // 맛집 정보 업데이트
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        name,
        latitude,
        longitude,
        description: description || null,
        address
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('맛집 업데이트 에러:', error);
      return NextResponse.json(
        { error: '맛집 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      restaurant: data,
      message: '맛집 정보가 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurantsApis/:id - 맛집 삭제 API
export async function DELETE(request) {
  try {
    const id = request.url.split('/').pop(); // URL에서 ID 추출
    
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
    
    // 맛집 소유자 확인
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return NextResponse.json(
        { error: '맛집을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    if (restaurant.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '자신의 맛집만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }
    
    // 맛집 삭제
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('맛집 삭제 에러:', error);
      return NextResponse.json(
        { error: '맛집 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '맛집이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET /api/restaurantsApis/my - 내 맛집 조회 API (별도 엔드포인트로 구현)
export async function GET_my(request) {
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