// app/onboarding/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { createClient } from '../lib/supabase';

export default function Onboarding() {
  const { user, isLoading, refreshUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 로그인 안 된 경우 로그인 페이지로
    if (!isLoading && !user) {
      router.push('/login');
    }
    
    // 이미 닉네임이 있는 경우 지도 페이지로
    if (!isLoading && user && user.nickname) {
      router.push('/map');
    }
  }, [isLoading, user, router]);
  
  // 닉네임 유효성 검사
  const validateNickname = (value) => {
    if (value.length < 2) {
      return '닉네임은 2자 이상이어야 합니다.';
    }
    if (value.length > 20) {
      return '닉네임은 20자 이하여야 합니다.';
    }
    // 한글, 영문, 숫자, 언더스코어만 허용
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(value)) {
      return '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.';
    }
    return '';
  };

  // 닉네임 중복 체크
  const checkNicknameAvailability = async (value) => {
    if (!value || validateNickname(value)) {
      setIsAvailable(null);
      return;
    }

    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('nickname', value);

      if (error) throw error;
      setIsAvailable(count === 0);
    } catch (error) {
      console.error('닉네임 체크 에러:', error);
      setIsAvailable(null);
    }
  };

  // 입력 변경 핸들러
  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setNickname(value);
    setError(validateNickname(value));
    // 닉네임 유효성 검사 통과 시에만 중복 체크
    if (!validateNickname(value)) {
      checkNicknameAvailability(value);
    } else {
      setIsAvailable(null);
    }
  };

  // 닉네임 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 유효성 검사
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // 중복 체크
    if (!isAvailable) {
      setError('이미 사용 중인 닉네임입니다.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ nickname })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // 사용자 정보 갱신
      await refreshUser();
      router.push('/map');
    } catch (error) {
      console.error('닉네임 저장 에러:', error);
      setError('닉네임 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-bold mb-6 text-center">닉네임 설정</h1>
        
        <p className="text-center text-gray-600 mb-8">
          원픽 맛집지도에서 사용할 닉네임을 입력해주세요.
          <br />
          닉네임은 맛집 추천 시 표시됩니다.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
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
            {isSubmitting ? '저장 중...' : '닉네임 저장하고 시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}