'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { RestaurantForm } from '../components/restaurant/restaurantComponents';

export default function AddRestaurant() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 로딩 중일 때만 로딩 표시
  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">내 원픽 맛집 등록하기</h1>
      <p className="text-center text-gray-600 mb-8">
        전세계 어디든 당신의 원픽 맛집을 검색하고 등록해보세요!
      </p>
      <RestaurantForm hideMap={true} />
    </div>
  );
}   