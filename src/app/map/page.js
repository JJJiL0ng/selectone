'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/authContext';
import { GoogleMapComponent, LocationSearch, CurrentLocationButton } from '../components/map/mapComponents';

export default function MapPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  // 맛집 데이터 불러오기
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        
        // API 요청 시 에러 처리 개선
        const response = await fetch('/api/restaurantsApis', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 필요한 경우 인증 헤더 추가
          },
          cache: 'no-store'
        });
        
        // 응답 상태 및 내용 로깅
        console.log('API 응답 상태:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API 응답 에러:', errorData);
          throw new Error(errorData.error || '맛집 데이터를 불러오는데 실패했습니다');
        }
        
        const data = await response.json();
        console.log('불러온 맛집 데이터:', data);
        setRestaurants(data.restaurants || []);
      } catch (error) {
        console.error('맛집 데이터 불러오기 에러:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 사용자가 로그인되어 있을 때만 데이터 불러오기
    if (user) {
      fetchRestaurants();
    } else {
      // 로그인 상태 확인 중이면 로딩 상태 유지
      const checkAuth = setTimeout(() => {
        if (!user) {
          setIsLoading(false);
          setRestaurants([]);
        }
      }, 1000);
      
      return () => clearTimeout(checkAuth);
    }
  }, [user]);

  // 위치 검색 결과 처리
  const handleLocationSelect = (location) => {
    setSelectedLocation({ lat: location.lat, lng: location.lng });
  };

  // 사용자의 맛집 찾기
  const userRestaurant = restaurants.find(r => r.user_id === user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-120px)]">
      {/* 검색 UI */}
      <div className="absolute top-4 left-0 right-0 z-10 px-4 md:px-8 lg:px-16">
        <LocationSearch onLocationSelect={handleLocationSelect} />
        <div className="mt-2 text-right">
          <CurrentLocationButton onLocationFound={handleLocationSelect} />
        </div>
      </div>

      {/* 지도 컴포넌트 */}
      <GoogleMapComponent
        restaurants={restaurants}
        center={selectedLocation || undefined}
        zoom={selectedLocation ? 17 : undefined}
        showInfoWindow={true}
        enableClick={false}
        height="100%"
      />

      {/* 맛집 추가 또는 수정 버튼 */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        {!userRestaurant ? (
          <button
            onClick={() => router.push('/add-restaurant')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors"
          >
            내 원픽 맛집 등록하기
          </button>
        ) : (
          <button
            onClick={() => router.push(`/edit-restaurant/${userRestaurant.id}`)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors"
          >
            내 원픽 맛집 수정하기
          </button>
        )}
      </div>
    </div>
  );
}