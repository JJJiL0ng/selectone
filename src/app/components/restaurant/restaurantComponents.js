// app/components/restaurant/RestaurantComponents.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';
import { GoogleMapComponent, LocationSearch, CurrentLocationButton } from '@/app/components/map/mapComponents';
import { getAddressFromCoordinates } from '@/app/lib/mapUtils';
import { NextResponse } from 'next/server';

// 맛집 폼 컴포넌트
export function RestaurantForm({ initialData = null, isEditMode = false, hideMap = false }) {
  const [formData, setFormData] = useState({
    name: '',
    latitude: null,
    longitude: null,
    address: '',
    description: '',
    ...initialData
  });
  const [selectedLocation, setSelectedLocation] = useState(
    initialData ? { lat: initialData.latitude, lng: initialData.longitude } : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  // 맵 클릭 핸들러
  const handleMapClick = async (location) => {
    try {
      const address = await getAddressFromCoordinates(
        location.lat,
        location.lng,
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      );
      
      setSelectedLocation(location);
      setFormData({
        ...formData,
        latitude: location.lat,
        longitude: location.lng,
        address: address || '알 수 없는 주소'
      });
    } catch (error) {
      console.error('주소 가져오기 에러:', error);
    }
  };

  // 위치 검색 결과 핸들러
  const handleLocationSelect = (location) => {
    const newLocation = { lat: location.lat, lng: location.lng };
    console.log('선택된 위치:', newLocation); // 디버깅용 로그
    
    // 명시적으로 selectedLocation 먼저 설정
    setSelectedLocation(newLocation);
    
    // 그 다음 formData 업데이트
    setFormData({
      ...formData,
      name: location.name || formData.name,
      latitude: location.lat,
      longitude: location.lng,
      address: location.address
    });
  };

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 필드 검증
    if (!formData.name || !formData.latitude || !formData.longitude || !formData.address) {
      setError('이름, 위치, 주소는 필수 입력사항입니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const endpoint = isEditMode 
        ? `/api/restaurantsApis/${initialData.id}` 
        : '/api/restaurantsApis';
        
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '맛집 저장 중 오류가 발생했습니다.');
      }

      router.push('/map');
    } catch (error) {
      console.error('맛집 저장 에러:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? '내 원픽 맛집 수정하기' : '내 원픽 맛집 등록하기'}
      </h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-2">
          {hideMap 
            ? "맛집을 검색하여 등록해보세요."
            : "지도에서 직접 위치를 클릭하거나 주소를 검색하여 맛집을 등록할 수 있습니다."}
        </p>
        <LocationSearch onLocationSelect={handleLocationSelect} />
        {!hideMap && (
          <div className="mt-2 text-right">
            <CurrentLocationButton onLocationFound={handleLocationSelect} />
          </div>
        )}
      </div>
      
      {!hideMap && (
        <div className="mb-8 border rounded-lg overflow-hidden h-96">
          <GoogleMapComponent
            center={selectedLocation || undefined}
            zoom={selectedLocation ? 17 : undefined}
            onClick={handleMapClick}
            enableClick={true}
            showInfoWindow={true}
            height="100%"
            restaurants={selectedLocation ? [{ 
              id: 'temp-marker',
              latitude: selectedLocation.lat, 
              longitude: selectedLocation.lng,
              name: formData.name || '선택한 위치',
              address: formData.address || '주소 정보 없음'
            }] : []}
          />
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
              맛집 이름 *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="맛집 이름을 입력하세요"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block mb-2 text-sm font-medium text-gray-700">
              주소 *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder={hideMap ? "주소를 입력하세요" : "지도에서 위치를 선택하면 자동으로 채워집니다"}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700">
              맛집 설명 (선택)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              placeholder="이 맛집에 대한 간단한 설명을 입력하세요"
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
          
          <div className="flex justify-between gap-4 mt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              취소
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || (!selectedLocation && !hideMap)}
              className={`px-6 py-3 rounded-lg text-white ${
                isSubmitting || (!selectedLocation && !hideMap)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {isSubmitting ? '저장 중...' : isEditMode ? '맛집 정보 수정하기' : '원픽 맛집 등록하기'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// 맛집 상세 정보 컴포넌트
export function RestaurantDetail({ restaurant }) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = user && restaurant && user.id === restaurant.user_id;

  if (!restaurant) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p>맛집 정보를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/map')}
          className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          지도로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-gray-600 mb-4">{restaurant.address}</p>
          
          {restaurant.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">추천 이유</h2>
              <p className="text-gray-700">{restaurant.description}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">추천인</h2>
            <p className="text-gray-700">{restaurant.users?.nickname || '알 수 없음'}</p>
          </div>
          
          <div className="h-64 mb-6 rounded-lg overflow-hidden border">
            <GoogleMapComponent
              restaurants={[restaurant]}
              center={{ lat: restaurant.latitude, lng: restaurant.longitude }}
              zoom={17}
              height="100%"
              enableClick={false}
            />
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/map')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              지도로 돌아가기
            </button>
            
            {isOwner && (
              <button
                onClick={() => router.push(`/edit-restaurant/${restaurant.id}`)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                수정하기
              </button>
            )}
            
            <a
              href={`https://maps.google.com/?q=${restaurant.latitude},${restaurant.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            >
              길찾기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// 지오코딩 API 핸들러
export async function geocode(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  
  if (!address) {
    return NextResponse.json({ error: '주소가 필요합니다' }, { status: 400 });
  }
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(data.error_message || '지오코딩 API 오류');
    }
    
    return NextResponse.json({ results: data.results });
  } catch (error) {
    console.error('지오코딩 API 오류:', error);
    return NextResponse.json({ error: '위치 검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}

// 음식점 검색 API 핸들러 
export async function searchPlaces(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
  }
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    // 위치 정보가 있으면 위치 기반 검색 추가
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=5000`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(data.error_message || 'Places API 오류');
    }
    
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error('Places API 오류:', error);
    return NextResponse.json({ error: '음식점 검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}