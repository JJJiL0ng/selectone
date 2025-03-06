// app/components/auth/AuthComponents.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { FcGoogle } from 'react-icons/fc';

// 로그인 버튼 컴포넌트
export function GoogleLoginButton({ className = '' }) {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('로그인 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
    >
      <FcGoogle className="text-xl" />
      {isLoading ? '로그인 중...' : 'Google로 계속하기'}
    </button>
  );
}

// 로그아웃 버튼 컴포넌트
export function LogoutButton({ className = '' }) {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('로그아웃 에러:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`text-gray-600 hover:text-gray-800 transition-colors ${className}`}
    >
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}

// 닉네임 설정 폼 컴포넌트
export function NicknameForm({ onSuccess }) {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const { user, refreshUser } = useAuth();
  const [debugInfo, setDebugInfo] = useState({ apiCalls: [] });

  // 디버깅 정보 추가
  const addDebugInfo = (info) => {
    console.log('NicknameForm 디버그:', info);
    setDebugInfo(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, { time: new Date().toISOString(), ...info }]
    }));
  };

  // 닉네임 중복 체크
  const checkNicknameAvailability = async (value) => {
    if (!value || value.trim().length < 2) {
      setIsAvailable(null);
      return;
    }

    addDebugInfo({ action: '닉네임 중복 체크 시작', nickname: value });

    try {
      const response = await fetch('/api/authApis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: value.trim() }),
        credentials: 'include'
      });

      addDebugInfo({ 
        action: '닉네임 중복 체크 응답 받음', 
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '닉네임 체크 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      addDebugInfo({ action: '닉네임 중복 체크 결과', available: data.available });
      setIsAvailable(data.available);
    } catch (error) {
      console.error('닉네임 체크 에러:', error);
      addDebugInfo({ action: '닉네임 중복 체크 에러', error: error.message });
      setIsAvailable(null);
      setError('닉네임 확인 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 닉네임 변경 핸들러
  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setNickname(value);

    // 유효성 검사
    if (value.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      setIsAvailable(null);
      return;
    }
    
    if (value.trim().length > 20) {
      setError('닉네임은 20자 이하여야 합니다.');
      setIsAvailable(null);
      return;
    }
    
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
      setError('닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.');
      setIsAvailable(null);
      return;
    }

    setError('');
    checkNicknameAvailability(value);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname || error || !isAvailable) return;

    setIsSubmitting(true);
    addDebugInfo({ action: '닉네임 저장 시작', nickname });

    try {
      // 세션 및 토큰 가져오는 방식 수정
      const response = await fetch('/api/authApis', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
        credentials: 'include'  // 쿠키 포함하여 요청
      });

      addDebugInfo({ 
        action: '닉네임 저장 응답 받음', 
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '닉네임 설정 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      addDebugInfo({ action: '닉네임 저장 성공', data });

      try {
        addDebugInfo({ action: '사용자 정보 새로고침 시작' });
        const refreshedUser = await refreshUser();
        addDebugInfo({ 
          action: '사용자 정보 새로고침 완료', 
          success: !!refreshedUser,
          user: refreshedUser ? `ID: ${refreshedUser.id}, 닉네임: ${refreshedUser.nickname}` : null
        });
      } catch (refreshError) {
        console.error('사용자 정보 새로고침 에러:', refreshError);
        addDebugInfo({ action: '사용자 정보 새로고침 에러', error: refreshError.message });
      }

      if (onSuccess) {
        addDebugInfo({ action: 'onSuccess 콜백 호출' });
        onSuccess();
      }
    } catch (error) {
      console.error('닉네임 저장 에러:', error);
      addDebugInfo({ action: '닉네임 저장 에러', error: error.message });
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 디버깅 정보 표시
  const showDebugInfo = process.env.NODE_ENV === 'development';

  return (
    <div className="w-full max-w-md">
      {showDebugInfo && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
          <details>
            <summary className="cursor-pointer">디버그 정보</summary>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="w-full">
        <div className="mb-4">
          <label htmlFor="nickname" className="block mb-2 text-sm font-medium text-gray-700">
            닉네임
          </label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="맛집탐험가"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              error ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-orange-200'
            }`}
            required
          />
          
          {error ? (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          ) : isAvailable === true ? (
            <p className="mt-2 text-sm text-green-600">사용 가능한 닉네임입니다.</p>
          ) : isAvailable === false ? (
            <p className="mt-2 text-sm text-red-600">이미 사용 중인 닉네임입니다.</p>
          ) : null}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !!error || !isAvailable}
          className={`w-full py-3 px-4 font-medium rounded-lg transition-colors text-white ${
            isSubmitting || !!error || !isAvailable
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isSubmitting ? '저장 중...' : '닉네임 저장하기'}
        </button>
      </form>
    </div>
  );
}

// 인증 상태에 따른 조건부 렌더링 컴포넌트
export function AuthGuard({ children, fallback }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return fallback || null;
  }

  return children;
}