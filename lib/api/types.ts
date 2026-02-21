export interface UnifiedProduct {
    id: string;
    title: string;
    price: number;
    image: string;
    link: string;
    mallName: string;
    brand?: string;
    category1?: string;
    category2?: string;
    source: 'NAVER' | 'MUSINSA' | '29CM' | 'W_CONCEPT' | 'ZIGZAG' | 'FARFETCH' | 'COUPANG' | 'SSENSE';
    normalizedTitle?: string; // 중복 묶음용 정규화 제목
}

/** 동일 상품을 여러 쇼핑몰로 묶은 그룹 */
export interface GroupedProduct {
    groupKey: string;               // 그룹 식별 키
    representative: UnifiedProduct; // 대표 상품 (최저가 기준)
    variants: UnifiedProduct[];     // 같은 상품의 다른 쇼핑몰 목록
    lowestPrice: number;
    highestPrice: number;
    mallCount: number;              // 발견된 쇼핑몰 수
}
