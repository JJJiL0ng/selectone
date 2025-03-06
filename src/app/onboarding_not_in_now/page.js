// app/onboarding/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { NicknameForm } from '@/app/components/auth/authComponents';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState({ 
    userState: null, 
    loadingState: null,
    renderCount: 0 
  });

  // 디버깅용 상태 업데이트
  useEffect(() => {
    console.log('온보딩 페이지 렌더링됨', { user, isLoading });
    setDebugInfo(prev => ({
      userState: user ? `ID: ${user.id}, 닉네임: ${user.nickname || '없음'}` : '로그인 안됨',
      loadingState: isLoading ? '로딩 중' : '로딩 완료',
      renderCount: prev.renderCount + 1
    }));
  }, [user, isLoading]);

  useEffect(() => {
    console.log('리디렉션 로직 실행', { isLoading, user });
    
    if (!isLoading) {
      if (!user) {
        console.log('사용자 없음, 로그인으로 리디렉션');
        router.push('/login');
      } else if (user.nickname && user.nickname !== '') {
        console.log('닉네임 있음, 지도로 리디렉션', user.nickname);
        router.push('/map');
      } else {
        console.log('닉네임 없음, 온보딩 페이지 유지');
      }
    }
  }, [user, isLoading, router]);

  const handleSuccess = () => {
    console.log('닉네임 설정 성공, 지도로 리디렉션');
    router.push('/map');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  // 디버깅 정보 표시
  const showDebugInfo = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {showDebugInfo && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 p-2 text-xs font-mono overflow-auto max-h-40">
          <pre>디버그 정보: {JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
      
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">환영합니다!</h1>
          <p className="mt-2 text-gray-600">
            맛집 지도를 이용하기 위해 닉네임을 설정해주세요
          </p>
        </div>

        <div className="mt-8">
          {user ? (
            <NicknameForm onSuccess={handleSuccess} />
          ) : (
            <div className="text-center text-red-500">
              <p>사용자 정보를 불러올 수 없습니다.</p>
              <button 
                onClick={() => router.push('/login')}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}