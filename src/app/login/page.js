// app/login/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { GoogleLoginButton } from '@/app/components/auth/authComponents';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // 로그인 되어 있으면 바로 지도 페이지로 이동
      router.push('/map');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">로그인</h1>
          <p className="mt-2 text-gray-600">
            계정에 로그인하여 맛집 지도를 이용해보세요
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <GoogleLoginButton className="w-full" />
        </div>
      </div>
    </div>
  );
}