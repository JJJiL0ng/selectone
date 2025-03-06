import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 서버 사이드 Supabase 클라이언트 생성
export async function createServerClient(cookieStore) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    cookies: {
      get: (name) => {
        return cookieStore.get(name)?.value;
      },
      set: (name, value, options) => {
        cookieStore.set({ name, value, ...options });
      },
      remove: (name, options) => {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
}

// 기본 쿠키 스토어를 사용하는 서버 클라이언트 생성 함수
export async function createServerClientWithDefaultCookies() {
  return createServerClient(cookies());
}