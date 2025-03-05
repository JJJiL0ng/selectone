// app/lib/supabase.js
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 사이드 Supabase 클라이언트 생성
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

// 서버 사이드 Supabase 클라이언트 생성
export const createServerClient = async (cookies) => {
  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        cookie: cookies.toString(),
      },
    },
  });

  return supabase;
};

// Supabase DB에서 모든 맛집 정보를 가져오는 함수
export const getAllRestaurants = async (supabase) => {
  const { data, error } = await supabase
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

  if (error) {
    console.error('맛집 데이터 로드 에러:', error);
    throw error;
  }

  return data;
};

// 특정 사용자의 맛집 정보를 가져오는 함수
export const getUserRestaurant = async (supabase, userId) => {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = 결과 없음
    console.error('사용자 맛집 조회 에러:', error);
    throw error;
  }

  return data || null;
};

// 맛집 정보 저장 함수
export const saveRestaurant = async (supabase, restaurantData, userId) => {
  // 기존 맛집 확인
  const existingRestaurant = await getUserRestaurant(supabase, userId);

  if (existingRestaurant) {
    // 기존 맛집 업데이트
    const { data, error } = await supabase
      .from('restaurants')
      .update(restaurantData)
      .eq('id', existingRestaurant.id)
      .select()
      .single();

    if (error) {
      console.error('맛집 업데이트 에러:', error);
      throw error;
    }

    return data;
  } else {
    // 새 맛집 생성
    const { data, error } = await supabase
      .from('restaurants')
      .insert({ ...restaurantData, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('맛집 저장 에러:', error);
      throw error;
    }

    return data;
  }
};