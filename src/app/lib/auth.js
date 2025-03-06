// app/lib/auth.js
import { createClient } from './supabase';

// 현재 로그인된 세션 가져오기
export const getSession = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('세션 확인 에러:', error);
    return null;
  }
  
  return data.session;
};

// 현재 로그인된 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  
  if (!sessionData.session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', sessionData.session.user.id)
    .single();
  
  if (error) {
    console.error('사용자 정보 조회 에러:', error);
    return null;
  }
  
  return data;
};

// 닉네임 중복 확인
export const checkNicknameAvailability = async (nickname) => {
  const supabase = createClient();
  
  const { data, error, count } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('nickname', nickname);
  
  if (error) {
    console.error('닉네임 확인 에러:', error);
    throw error;
  }
  
  return count === 0; // true면 사용 가능
};

// 닉네임 업데이트
export const updateNickname = async (userId, nickname) => {
  const supabase = createClient();
  
  // 닉네임 중복 체크
  const isAvailable = await checkNicknameAvailability(nickname);
  if (!isAvailable) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }
  
  // 닉네임 업데이트
  const { data, error } = await supabase
    .from('users')
    .update({ nickname })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('닉네임 업데이트 에러:', error);
    throw error;
  }
  
  return data;
};

// 사용자 정보 업데이트
export const updateUserProfile = async (userId, profileData) => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('users')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('프로필 업데이트 에러:', error);
    throw error;
  }
  
  return data;
};

// 회원가입 후 첫 로그인 시 사용자 생성 (Supabase Auth Webhook에서 호출)
export const createUserAfterSignup = async (user) => {
  const supabase = createClient();
  
  // 이메일에서 기본 닉네임 추출 (@ 앞 부분)
  const defaultNickname = user.email.split('@')[0];
  
  // 닉네임 중복 확인 및 처리
  let nickname = defaultNickname;
  let isAvailable = await checkNicknameAvailability(nickname);
  let counter = 1;
  
  // 닉네임이 중복되면 숫자 추가
  while (!isAvailable && counter < 100) {
    nickname = `${defaultNickname}${counter}`;
    isAvailable = await checkNicknameAvailability(nickname);
    counter++;
  }
  
  // 사용자 프로필 생성
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email,
      nickname: nickname,
      auth_provider: user.app_metadata?.provider || 'email',
    })
    .select()
    .single();
  
  if (error) {
    console.error('사용자 생성 에러:', error);
    throw error;
  }
  
  return data;
};

// 구글 로그인
export const signInWithGoogle = async () => {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/api/authApis/callback`,
    },
  });
  
  if (error) {
    console.error('구글 로그인 에러:', error);
    throw error;
  }
  
  return data;
};

// 로그아웃
export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
  
  return true;
};

// 서버 사이드에서 현재 사용자 정보 가져오기
export const getServerSideUser = async (supabase) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('서버 사이드 사용자 정보 조회 에러:', error);
    return null;
  }
  
  return data;
};