/**
 * Data Normalizer
 * 다양한 소스에서 수집된 비정형 데이터를 표준 포맷으로 변환합니다.
 */

/**
 * 가격 문자열을 숫자로 변환
 * 예: "12,900원" -> 12900, "KRW 10000" -> 10000
 */
export function normalizePrice(rawPrice: string | number): number {
    if (typeof rawPrice === 'number') return rawPrice;
    if (!rawPrice) return 0;

    // 숫자만 추출
    const numbers = rawPrice.replace(/[^0-9]/g, '');
    return parseInt(numbers, 10) || 0;
}

/**
 * 브랜드명 정규화
 * 다양한 표기를 통일 (예: "NIKE", "나이키" -> "Nike" 매핑 로직은 추후 DB 연동 필요)
 * 현재는 트림 및 대문자 변환 정도만 수행
 */
export function normalizeBrand(rawBrand: string): string {
    if (!rawBrand) return 'Unknown Brand';
    return rawBrand.trim(); // .toUpperCase()는 취향 차이, 일단 원본 유지하되 공백 제거
}

/**
 * 상품명 정규화
 * HTML 태그 제거, 불필요한 특수문자 제거
 */
export function normalizeTitle(rawTitle: string): string {
    if (!rawTitle) return '';
    return rawTitle
        .replace(/<[^>]*>?/gm, '') // HTML 태그 제거
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
}

/**
 * 이미지 URL 정규화
 * 상대 경로를 절대 경로로 변환하거나 프로토콜(http) 추가
 */
export function normalizeImageUrl(rawUrl: string, baseUrl: string): string {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:')) return rawUrl; // Base64는 그대로
    if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
    if (rawUrl.startsWith('/')) return `${baseUrl}${rawUrl}`;
    return rawUrl;
}
