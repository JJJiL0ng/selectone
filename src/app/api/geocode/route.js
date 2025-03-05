// app/api/geocode/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
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