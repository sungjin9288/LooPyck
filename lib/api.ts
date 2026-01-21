import { NaverShoppingResponse, SearchParams } from '@/types/product';

/**
 * 네이버 쇼핑 API를 호출하여 상품 검색
 * @param params 검색 파라미터
 * @returns 검색 결과
 */
export async function searchProducts(
  params: SearchParams
): Promise<NaverShoppingResponse> {
  const { query, display = 20, start = 1, sort = 'sim' } = params;

  // 쿼리 파라미터 생성
  const queryParams = new URLSearchParams({
    query,
    display: display.toString(),
    start: start.toString(),
    sort,
  });

  // API 호출 (Next.js API Route를 통해 호출)
  const response = await fetch(`/api/search?${queryParams}`);

  if (!response.ok) {
    throw new Error('상품 검색에 실패했습니다');
  }

  return response.json();
}

/**
 * 가격 문자열을 숫자로 변환
 * @param price 가격 문자열 (예: "29000")
 * @returns 숫자로 변환된 가격
 */
export function parsePrice(price: string): number {
  return parseInt(price, 10);
}

/**
 * 가격을 한국 원화 형식으로 포맷팅
 * @param price 가격 (숫자)
 * @returns 포맷팅된 가격 문자열 (예: "29,000원")
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parsePrice(price) : price;
  return `${numPrice.toLocaleString('ko-KR')}원`;
}

/**
 * HTML 태그 제거
 * @param text HTML 태그가 포함된 텍스트
 * @returns HTML 태그가 제거된 텍스트
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}
