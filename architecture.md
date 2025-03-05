## 원픽 맛집지도 MVP 아키텍처

### 핵심 기술 스택
- **프론트엔드**: Next.js + React + TailwindCSS
- **백엔드**: Supabase (PostgreSQL + PostGIS + Auth)
- **인증**: Supabase Auth (구글 OAuth)
- **지도 서비스**: Google Maps API

### 시스템 구조
```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Next.js     │──────│  Google Maps  │      │   Supabase   │
│  프론트엔드  │      │     API       │      │ (DB + Auth)  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                                           │
        └───────────────────────────────────────────┘
                               │
                        ┌──────────────┐
                        │ Google OAuth  │
                        └──────────────┘
```

### 디렉토리 구조
```
/app
  /api
    /authApis                  # 인증 관련 API
    /restaurantsApis           # 맛집 CRUD
  /components
    /auth                      # 로그인 컴포넌트
    /map                       # 지도 관련 컴포넌트
    /restaurant                # 맛집 등록/표시 컴포넌트
    /ui                        # 기본 UI 컴포넌트
  /lib
    /supabase.js               # Supabase 연결
    /mapUtils.js               # 지도 기본 유틸리티
    /auth.js                   # 인증 유틸리티
  /context
    /AuthContext.jsx           # 인증 상태 관리 (간소화)
  /page.jsx                    # 메인 페이지 (로그인/지도)
  /login/page.jsx              # 로그인 페이지
  /map/page.jsx                # 지도 전용 페이지
  /onboarding/page.jsx         # 첫 로그인 후 닉네임 설정
  middleware.js                # 인증 체크 미들웨어 (간소화)
  layout.jsx                   # 기본 레이아웃
```

### 데이터베이스 스키마
```sql
-- 사용자 테이블 (Supabase Auth와 연결)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL UNIQUE,           -- 고유 닉네임
  email TEXT UNIQUE,                       -- 이메일 (구글 계정)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 맛집 테이블
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                      -- 맛집 이름
  latitude NUMERIC NOT NULL,               -- 위도
  longitude NUMERIC NOT NULL,              -- 경도
  description TEXT,                        -- 간단 설명 (선택)
  address TEXT NOT NULL,                   -- 주소
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX restaurants_location_idx ON restaurants USING gist(
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);

-- 닉네임 고유성 보장을 위한 인덱스
CREATE UNIQUE INDEX users_nickname_idx ON users(nickname);
```

### MVP 핵심 기능
1. 구글 계정으로 로그인
2. 고유 닉네임 설정 (중복 불가)
3. 원픽 맛집 등록 (한 사용자 당 하나)
4. 지도에서 등록된 모든 맛집 보기
5. 맛집 클릭 시 정보 표시
6. URL 공유 기능

### 구현 순서 및 접근법
1. **Supabase Auth 설정**:
   - 구글 OAuth 클라이언트 ID/Secret 설정
   - 로그인 리디렉트 설정

2. **사용자 온보딩 플로우**:
   - 로그인 → 닉네임 입력(고유성 체크) → 메인 지도 화면

3. **맛집 등록 로직**:
   - 사용자당 하나의 맛집만 등록 가능 (추가 등록 시 기존 맛집 업데이트)
   - 지도에서 위치 선택 또는 주소 검색으로 등록

4. **미들웨어 경량화**:
   - 로그인 상태만 체크하는 간단한 미들웨어 구현

이 방식으로 소셜 로그인과 고유 닉네임 요구사항을 충족하면서도 개발 복잡성을 최소화할 수 있습니다. Supabase Auth는 구글 로그인을 쉽게 통합할 수 있어 개발 시간을 단축할 수 있습니다.