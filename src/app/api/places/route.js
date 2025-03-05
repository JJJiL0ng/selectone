// app/api/places/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  
  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다' }, { status: 400 });
  }
  
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // 검색 쿼리 구성
    let searchQuery = query;
    if (query.toLowerCase().indexOf('restaurant') === -1 && 
        query.toLowerCase().indexOf('food') === -1 && 
        query.toLowerCase().indexOf('cafe') === -1) {
      searchQuery += ' restaurant'; // 음식점으로 검색 범위 제한
    }
    
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    
    // 위치 정보가 있으면 위치 기반 검색 추가
    if (lat && lng) {
      url += `&location=${lat},${lng}&radius=5000`;
    }
    
    // axios를 사용하여 요청 (fetch 대신)
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API 상태 오류:', data.status, data.error_message);
      throw new Error(data.error_message || 'Places API 오류');
    }
    
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error('Places API 오류:', error.message);
    if (error.response) {
      console.error('응답 데이터:', error.response.data);
      console.error('응답 상태:', error.response.status);
    }
    return NextResponse.json({ error: '음식점 검색 중 오류가 발생했습니다' }, { status: 500 });
  }
}