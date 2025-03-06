// app/context/AuthContext.jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@/app/lib/supabase';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 사용을 위한 훅
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다');
  }
  return context;
}

// 인증 프로바이더 컴포넌트
export function AuthProvider({ children }) {
  const [supabase] = useState(() => createBrowserClient());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 정보 로드 함수 (중복 코드 제거)
  const loadUserData = async (session) => {
    if (!session) {
      setUser(null);
      return;
    }
    
    try {
      // 직접 Supabase에서 사용자 정보 가져오기
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) {
        console.error('인증 컨텍스트: 사용자 정보 로드 에러:', error);
        
        // 사용자 정보가 없는 경우, 이메일 앞부분을 닉네임으로 사용하여 새 사용자 생성
        const emailParts = session.user.email.split('@');
        const nickname = emailParts[0];
        
        // 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            nickname: nickname,
            auth_provider: 'google',
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('인증 컨텍스트: 사용자 생성 에러:', insertError);
          // 기본 사용자 객체 생성
          setUser({
            id: session.user.id,
            email: session.user.email,
            nickname: nickname,
          });
        } else {
          setUser(newUser);
        }
      } else {
        console.log('인증 컨텍스트: 사용자 정보 로드 성공', data);
        setUser(data);
      }
    } catch (error) {
      console.error('인증 컨텍스트: 사용자 정보 로드 에러:', error);
      // 오류 발생 시 기본 사용자 객체 생성
      const emailParts = session.user.email.split('@');
      const nickname = emailParts[0];
      setUser({
        id: session.user.id,
        email: session.user.email,
        nickname: nickname,
      });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      console.log('인증 컨텍스트: 사용자 정보 가져오기 시작');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('인증 컨텍스트: 세션 있음', session.user.id);
        await loadUserData(session);
      } else {
        console.log('인증 컨텍스트: 세션 없음');
        setUser(null);
      }
      
      console.log('인증 컨텍스트: 로딩 완료');
      setIsLoading(false);
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('인증 컨텍스트: 인증 상태 변경', event);
        await loadUserData(session);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      if (error) throw error;
      setUser(data);
      return data;
    } catch (error) {
      console.error('사용자 정보 새로고침 에러:', error);
      return null;
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/api/authApis/callback`,
      },
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}