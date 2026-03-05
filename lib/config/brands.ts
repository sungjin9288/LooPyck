/**
 * 트렌드 추적 대상 브랜드 목록
 * brand-trends API에서 사용
 */
export const BRANDS_TO_TRACK = [
    'NIKE', 'ADIDAS', 'NEW BALANCE', 'STUSSY', 'SUPREME',
    'ARC TERYX', 'SALOMON', 'HUMAN MADE', 'KITH', 'PALACE',
    'MUSINSA STANDARD', 'ADER ERROR',
] as const;

export type TrackedBrand = typeof BRANDS_TO_TRACK[number];
