export const ALLOWED_PRODUCT_SOURCES = [
    'NAVER',
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'HANDSOME',
    'FARFETCH',
    'COUPANG',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
] as const;

export type ProductSource = typeof ALLOWED_PRODUCT_SOURCES[number];

export const ALLOWED_PRODUCT_STOCK_STATUSES = [
    'in_stock',
    'low_stock',
    'sold_out',
    'unknown',
] as const;

export type ProductStockStatus = typeof ALLOWED_PRODUCT_STOCK_STATUSES[number];

export function isProductSource(value: string): value is ProductSource {
    return ALLOWED_PRODUCT_SOURCES.includes(value as ProductSource);
}

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
    source: ProductSource;
    normalizedTitle?: string; // 중복 묶음용 정규화 제목
    shippingFee?: number;
    shippingFreeThreshold?: number;
    shippingText?: string;
    benefitPrice?: number;
    benefitText?: string;
    stockStatus?: ProductStockStatus;
    stockText?: string;
    optionSummary?: string;
    optionValues?: string[];
    sizeOptions?: string[];
    colorOptions?: string[];
    detailCollectedAt?: string;
}

/** 동일 상품을 여러 쇼핑몰로 묶은 그룹 */
export interface GroupedProduct {
    groupKey: string;               // 그룹 식별 키
    representative: UnifiedProduct; // 대표 상품 (최저가 기준)
    variants: UnifiedProduct[];     // 같은 상품의 다른 쇼핑몰 목록
    lowestPrice: number;
    highestPrice: number;
    mallCount: number;              // 발견된 쇼핑몰 수
    matchConfidence: number;        // 동일 상품 매칭 신뢰도 (0-1)
    matchStrategy: 'single' | 'model' | 'brand_model' | 'brand_token' | 'token';
}
