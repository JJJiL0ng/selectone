// app/api/restaurantsApis/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/app/lib/supabase';
import { getServerSession } from 'next-auth';

// getServerSession에 필요한 authOptions 가져오기
// 경로가 없는 경우 직접 authOptions 객체를 정의하거나 다른 파일에서 가져와야 함
const authOptions = {
  // 여기에 필요한 인증 옵션 설정
  // 예: providers, callbacks 등
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
    
    // 기본 쿼리 생성
    let query = supabase
      .from('restaurants')
      .select(`
        id,
        name,
        latitude,
        longitude,
        description,
        address,
        user_id,
        users (
          id,
          nickname
        )
      `);
    
    // 특정 사용자의 맛집만 필터링
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    // 지도 영역 내 맛집만 필터링 (성능 최적화)
    if (bounds) {
      const [lat1, lng1, lat2, lng2] = bounds.split(',').map(Number);
      query = query
        .gte('latitude', Math.min(lat1, lat2))
        .lte('latitude', Math.max(lat1, lat2))
        .gte('longitude', Math.min(lng1, lng2))
        .lte('longitude', Math.max(lng1, lng2));
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('맛집 조회 에러:', error);
      return NextResponse.json(
        { error: '맛집 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ restaurants: data });
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/restaurantsApis - 맛집 등록 API
export async function POST(request) {
  try {
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
    
    // 사용자가 이미 등록한 맛집이 있는지 확인
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    let result;
    
    if (existingRestaurant) {
      // 기존 맛집 업데이트
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          name,
          latitude,
          longitude,
          description: description || null,
          address
        })
        .eq('id', existingRestaurant.id)
        .select()
        .single();
      
      if (error) {
        console.error('맛집 업데이트 에러:', error);
        return NextResponse.json(
          { error: '맛집 업데이트 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      result = {
        restaurant: data,
        message: '맛집 정보가 업데이트되었습니다.',
        isNew: false
      };
    } else {
      // 새 맛집 생성
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          name,
          latitude,
          longitude,
          description: description || null,
          address,
          user_id: session.user.id
        })
        .select()
        .single();
      
      if (error) {
        console.error('맛집 등록 에러:', error);
        return NextResponse.json(
          { error: '맛집 등록 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      result = {
        restaurant: data,
        message: '맛집이 등록되었습니다.',
        isNew: true
      };
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/restaurantsApis/:id - 맛집 수정 API
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;
    const data = await request.json();

    // 필수 필드 검증
    if (!data.name || !data.latitude || !data.longitude || !data.address) {
      return NextResponse.json(
        { error: '이름, 위치, 주소는 필수 입력사항입니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성 - 이 부분이 누락됨
    const supabase = await createServerClient(cookies());

    // 맛집 소유자 확인
    const { data: restaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '맛집을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    if (restaurant.user_id !== userId) {
      return NextResponse.json(
        { error: '본인이 등록한 맛집만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 맛집 정보 업데이트
    const { data: updatedRestaurant, error } = await supabase
      .from('restaurants')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ restaurant: updatedRestaurant });
  } catch (error) {
    console.error('맛집 수정 에러:', error);
    return NextResponse.json(
      { error: '맛집 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/restaurantsApis/:id - 맛집 삭제 API
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const userId = session.user.id;

    // 맛집 소유자 확인
    const { data: restaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: '맛집을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      throw checkError;
    }

    if (restaurant.user_id !== userId) {
      return NextResponse.json(
        { error: '본인이 등록한 맛집만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 맛집 삭제
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('맛집 삭제 에러:', error);
    return NextResponse.json(
      { error: '맛집 정보 삭제 중 오류가 발생했습니다.' },
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