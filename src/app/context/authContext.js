// app/context/AuthContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '../lib/supabase';

// 인증 컨텍스트 생성
const AuthContext = createContext();

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // 임시 기본값 반환 (오류 대신)
    console.warn('useAuth는 AuthProvider 내부에서 사용되어야 합니다. 임시 기본값을 반환합니다.');
    return {
      session: null,
      user: null,
      isLoading: false,
      signInWithGoogle: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve(),
      refreshUser: () => Promise.resolve(),
    };
  }
  return context;
};

// 인증 프로바이더 컴포넌트
export function AuthProvider({ children, initialSession }) {
  const [session, setSession] = useState(initialSession);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // 사용자 정보 가져오기
  const fetchUser = async (userId) => {
    if (!userId) {
      setUser(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('사용자 정보 조회 에러:', error);
      setUser(null);
    }
  };

  // 세션 변경 리스너
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setIsLoading(true);
        
        if (newSession) {
          fetchUser(newSession.user.id).finally(() => setIsLoading(false));
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // 초기 사용자 정보 로드
    if (session) {
      fetchUser(session.user.id).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 구글 로그인
  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // 로그아웃
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    if (session) {
      await fetchUser(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
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