// app/lib/mapUtils.js

// 한국 중심 초기 지도 설정
export const DEFAULT_CENTER = {
    lat: 37.5665,
    lng: 126.9780
  };
  
  export const DEFAULT_ZOOM = 14;
  
  // 지도 스타일 설정
  export const containerStyle = {
    width: '100%',
    height: '100%'
  };
  
  // 지도 옵션 설정
  export const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: true,
    fullscreenControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }] // POI 라벨 숨기기 (맛집 마커 가시성 향상)
      }
    ]
  };
  
  // 현재 위치 가져오기
  export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('브라우저가 위치 정보를 지원하지 않습니다.'));
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('위치 정보 접근 실패:', error.message);
          resolve(DEFAULT_CENTER); // 에러 시 기본 위치 반환
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };
  
  // 좌표로 주소 가져오기 (역지오코딩)
  export const getAddressFromCoordinates = async (lat, lng, googleMapsApiKey) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}&language=ko`
      );
      const data = await response.json();
  
      if (data.status === 'OK' && data.results.length > 0) {
        // 도로명 주소 또는 지번 주소 반환
        return data.results[0].formatted_address;
      }
      
      throw new Error('주소를 찾을 수 없습니다.');
    } catch (error) {
      console.error('역지오코딩 에러:', error);
      return null;
    }
  };
  
  // 주소로 좌표 가져오기 (지오코딩)
  export const getCoordinatesFromAddress = async (address, googleMapsApiKey) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}&language=ko`
      );
      const data = await response.json();
  
      if (data.status === 'OK' && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng };
      }
      
      throw new Error('좌표를 찾을 수 없습니다.');
    } catch (error) {
      console.error('지오코딩 에러:', error);
      return null;
    }
  };
  
  // 마커 아이콘 정의
  export const markerIcons = {
    default: {
      url: '/images/marker.png',
      scaledSize: { width: 40, height: 40 }
    },
    userRestaurant: {
      url: '/images/marker-mine.png',
      scaledSize: { width: 40, height: 40 }
    },
    newRestaurant: {
      url: '/images/new-marker.png',
      scaledSize: { width: 40, height: 40 }
    }
  };
  
  // 지도 내 보이는 마커만 필터링
  export const getVisibleMarkers = (map, markers) => {
    if (!map) return markers;
    
    const bounds = map.getBounds();
    return markers.filter(marker => {
      return bounds.contains({ 
        lat: marker.latitude, 
        lng: marker.longitude 
      });
    });
  };
  
  // 거리 계산 함수 (km)
  export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반경 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLng = deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 킬로미터 단위 거리
    return distance;
  };
  
  // 도(degree)를 라디안(radian)으로 변환
  function deg2rad(deg) {
    return deg * (Math.PI / 180);
  }