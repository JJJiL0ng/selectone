// app/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/authContext';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로그인한 사용자가 닉네임이 없으면 온보딩으로 리디렉션
    if (user && !user.nickname && !isLoading) {
      router.push('/map');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // 로그인한 사용자는 지도 페이지로
  if (user && user.nickname) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">안녕하세요, {user.nickname}님!</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/map"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            맛집 지도 보기
          </Link>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자를 위한 랜딩 페이지
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-white">
      <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-center">당신의 인생 맛집은 어디인가요?</h1>
      <p className="text-lg text-center text-gray-600 max-w-2xl mb-10">
        모든 사람이 단 하나의 맛집만 추천하는 원픽 맛집지도.
        <br /> 진짜 맛집만 공유되는 특별한 경험을 시작해보세요.
      </p>
      
      <Link
        href="/login"
        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg"
      >
        시작하기
      </Link>
      
      <div className="mt-16 w-full max-w-3xl bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="w-full h-[400px] bg-gray-100 flex items-center justify-center text-gray-500">
          <p className="text-xl font-medium">원픽 맛집지도</p>
        </div>
      </div>
    </div>
  );
}