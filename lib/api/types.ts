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
}
