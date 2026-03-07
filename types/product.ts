// 상품 정보 타입 정의
export interface Product {
  favoriteId?: string;    // favorites 문서 키
  title: string;           // 상품명
  link: string;            // 상품 링크
  image: string;           // 상품 이미지 URL
  lprice: string;          // 최저가
  hprice: string;          // 최고가
  mallName: string;        // 쇼핑몰 이름
  productId: string;       // 상품 ID
  productType: string;     // 상품 타입
  brand: string;           // 브랜드
  maker: string;           // 제조사
  category1: string;       // 카테고리1
  category2: string;       // 카테고리2
  category3: string;       // 카테고리3
  category4: string;       // 카테고리4
  source?: string;         // 플랫폼 소스
  variantKey?: string;     // 선택 variant key
  variantLabel?: string;   // 선택 variant label
  variantId?: string;      // 실제 variant id
  variantSku?: string;     // 실제 sku
  optionKey?: string;      // 옵션 이력 key
  deepLink?: string;       // 내부 compare link
  targetPrice?: number;    // 사용자 설정 목표 가격 (확장)
  alertSnoozedUntil?: number; // 알림 스누즈 만료 시각
}

// 네이버 쇼핑 API 응답 타입
export interface NaverShoppingResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: Product[];
}

// 검색 파라미터 타입
export interface SearchParams {
  query: string;           // 검색어
  display?: number;        // 한 번에 표시할 검색 결과 개수 (기본값: 20, 최대: 100)
  start?: number;          // 검색 시작 위치 (기본값: 1, 최대: 1000)
  sort?: 'sim' | 'asc' | 'dsc';  // 정렬 옵션 (sim: 정확도, asc: 가격오름차순, dsc: 가격내림차순)
}
