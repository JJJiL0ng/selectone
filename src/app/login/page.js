// app/login/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { FcGoogle } from 'react-icons/fc';

export default function Login() {
  const { user, signInWithGoogle, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 개발 환경인지 확인
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 이미 로그인된 경우 리디렉션 (개발 환경에서는 건너뛸 수 있음)
    if (user && !isLoading) {
      if (user.nickname) {
        router.push('/map');
      } else {
        router.push('/onboarding');
      }
    } else if (isDevelopment && !user && !isLoading) {
      // 개발 환경에서 로그인 없이 맵으로 이동 가능
      console.log('개발 환경: 로그인 없이 접근 가능합니다.');
      // 개발 환경에서 로그인 없이 이동하려면 아래 주석을 해제하세요
      //router.push('/map');
    }
  }, [user, isLoading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // 리디렉션은 useEffect에서 처리됨
    } catch (error) {
      console.error('로그인 에러:', error);
      
      // 개발 환경에서는 로그인 실패해도 맵으로 이동 가능
      if (process.env.NODE_ENV === 'development') {
        console.log('개발 환경: 로그인 실패해도 접근 가능합니다.');
        router.push('/map');
      }
    }
  };
  
  // 개발 환경에서 로그인 건너뛰기 버튼 추가
  const handleDevSkip = () => {
    if (process.env.NODE_ENV === 'development') {
      router.push('/map');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">원픽 맛집지도 로그인</h1>
        
        <p className="text-center text-gray-600 mb-8">
          구글 계정으로 간편하게 로그인하고 당신의 원픽 맛집을 공유해보세요.
        </p>
        
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          <FcGoogle className="text-xl" />
          Google로 계속하기
        </button>
        
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleDevSkip}
            className="w-full mt-4 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            개발 환경: 로그인 건너뛰기
          </button>
        )}
        
        <div className="mt-6 text-center text-sm text-gray-500">
          로그인은 개인정보 보호정책 및 서비스 약관에 동의하는 것을 의미합니다.
        </div>
      </div>
    </div>
  );
}