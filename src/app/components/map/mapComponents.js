// app/components/map/mapComponents.jsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '@/app/context/authContext';
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  containerStyle,
  mapOptions,
  getCurrentLocation,
  markerIcons,
  getAddressFromCoordinates
} from '@/app/lib/mapUtils';

// 구글 맵 컴포넌트
export function GoogleMapComponent({ 
  restaurants = [], 
  onMapLoad, 
  onClick,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  enableClick = false,
  showInfoWindow = true,
  height = 'calc(100vh - 120px)'
}) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  const { user } = useAuth();

  // 현재 위치 가져오기
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('위치 정보 가져오기 에러:', error);
      }
    };

    fetchLocation();
  }, []);

  // 맵 로드 핸들러
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);
    if (onMapLoad) onMapLoad(map);
  }, [onMapLoad]);

  // 맵 언로드 핸들러
  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
    setMap(null);
  }, []);

  // 맵 클릭 핸들러
  const handleMapClick = useCallback((event) => {
    if (!enableClick) return;
    
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    if (onClick) onClick(clickedLocation);
  }, [enableClick, onClick]);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((restaurant) => {
    if (!showInfoWindow) return;
    setSelectedPlace(restaurant);
  }, [showInfoWindow]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ ...containerStyle, height: '100%' }}
        center={center}
        zoom={zoom}
        options={{
          ...mapOptions,
          mapTypeControl: false  // 지도 유형 컨트롤 비활성화
        }}
        onLoad={handleMapLoad}
        onUnmount={handleMapUnmount}
        onClick={handleMapClick}
      >
        {/* 레스토랑 마커 */}
        {restaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
            onClick={() => handleMarkerClick(restaurant)}
            icon={{
              url: restaurant.user_id === user?.id 
                ? '/images/marker-mine.png' 
                : '/images/marker.png',
              scaledSize: window.google?.maps?.Size ? new window.google.maps.Size(40, 40) : null,
            }}
          />
        ))}

        {/* 현재 위치 마커 */}
        {userLocation && (
          <Marker
            key="user-location"
            position={userLocation}
            icon={{
              path: window.google?.maps?.SymbolPath?.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 8
            }}
            zIndex={1000}
          />
        )}

        {/* 선택된 장소 정보 창 */}
        {showInfoWindow && selectedPlace && (
          <InfoWindow
            position={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
            onCloseClick={() => setSelectedPlace(null)}
          >
            <div className="p-1 max-w-xs">
              <h3 className="font-bold text-lg">{selectedPlace.name}</h3>
              <p className="text-sm text-gray-600">{selectedPlace.address}</p>
              {selectedPlace.users && (
                <p className="text-sm mt-1">추천: {selectedPlace.users.nickname}</p>
              )}
              {selectedPlace.description && (
                <p className="text-sm mt-2">{selectedPlace.description}</p>
              )}
              <div className="mt-2">
                <a
                  href={`https://maps.google.com/?q=${selectedPlace.latitude},${selectedPlace.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  길찾기
                </a>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

// 위치 검색 컴포넌트
export function LocationSearch({ onLocationSelect }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState('place'); // 기본값을 'place'로 변경
  const [userLocation, setUserLocation] = useState(null);
  
  // 현재 위치 가져오기
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('위치 정보 가져오기 에러:', error);
      }
    };

    fetchLocation();
  }, []);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowResults(false);
    
    try {
      let url;
      if (searchType === 'address') {
        // 주소 검색
        url = `/api/geocode?address=${encodeURIComponent(query)}`;
      } else {
        // 음식점 검색
        url = `/api/places?query=${encodeURIComponent(query)}`;
        if (userLocation) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('응답 에러 내용:', errorText);
        throw new Error('검색 중 오류가 발생했습니다');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setShowResults(true);
      } else {
        alert('검색 결과를 찾을 수 없습니다.');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('검색 에러:', error);
      alert('검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSelectLocation = (result) => {
    let location;
    
    if (searchType === 'address') {
      // 주소 검색 결과 처리
      location = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address
      };
    } else {
      // 음식점 검색 결과 처리
      location = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address || result.vicinity,
        name: result.name
      };
    }
    
    onLocationSelect(location);
    setQuery(location.name || location.address);
    setShowResults(false);
  };
  
  return (
    <div className="relative w-full">
      <div className="flex mb-2">
        <button
          type="button"
          onClick={() => setSearchType('address')}
          className={`px-3 py-1 text-sm rounded-l-lg ${
            searchType === 'address' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          주소 검색
        </button>
        <button
          type="button"
          onClick={() => setSearchType('place')}
          className={`px-3 py-1 text-sm rounded-r-lg ${
            searchType === 'place' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          음식점 검색
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="w-full flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchType === 'address' ? "주소 검색" : "음식점 이름 검색 (예: 맥도날드, 스타벅스)"}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className={`px-4 py-2 rounded-lg text-white ${
            isSearching || !query.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          {isSearching ? '검색 중...' : '검색'}
        </button>
      </form>
      
      {/* 검색 결과 드롭다운 */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectLocation(result)}
            >
              {searchType === 'address' ? (
                result.formatted_address
              ) : (
                <div>
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-600">{result.formatted_address || result.vicinity}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 현재 위치 버튼 컴포넌트
export function CurrentLocationButton({ onLocationFound, className = '', mapRef = null }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = async () => {
    setIsLoading(true);
    
    try {
      const location = await getCurrentLocation();
      
      // 맵 객체가 있으면 현재 위치로 중앙 이동
      if (mapRef && mapRef.current) {
        mapRef.current.panTo({ lat: location.lat, lng: location.lng });
        mapRef.current.setZoom(15); // 적절한 줌 레벨로 설정
      }
      
      // 역지오코딩으로 주소 가져오기
      const address = await getAddressFromCoordinates(
        location.lat,
        location.lng,
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      );
      
      onLocationFound({
        lat: location.lat,
        lng: location.lng,
        address: address || '알 수 없는 주소'
      });
    } catch (error) {
      console.error('위치 정보 가져오기 에러:', error);
      alert('위치 정보를 가져올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center justify-center gap-1 text-sm ${
        isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:text-blue-600'
      } ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {isLoading ? '위치 찾는 중...' : '현재 위치 사용'}
    </button>
  );
}

// 맛집 지도 페이지 컴포넌트
export function RestaurantMap() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();
  const mapRef = useRef(null);
  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch('/api/restaurantsApis');
        const data = await response.json();
        
        setRestaurants(data.restaurants || []);
      } catch (error) {
        console.error('맛집 데이터 불러오기 에러:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // 사용자의 맛집 찾기
  const userRestaurant = restaurants.find(r => r.user_id === user?.id);
  
  const handleLocationFound = (location) => {
    // 맵 객체가 있으면 현재 위치로 중앙 이동
    if (mapRef && mapRef.current) {
      mapRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(15); // 적절한 줌 레벨로 설정
    }
  };
  
  return (
    <div className="relative">
      <GoogleMapComponent
        restaurants={restaurants}
        showInfoWindow={true}
        onMapLoad={(map) => { mapRef.current = map; }}
      />
      
      {/* 현재 위치 버튼 */}
      <div className="absolute top-4 right-4">
        <CurrentLocationButton 
          onLocationFound={handleLocationFound} 
          mapRef={mapRef}
          className="bg-white px-3 py-2 rounded-lg shadow-md"
        />
      </div>
      
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