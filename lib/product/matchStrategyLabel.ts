import type { GroupedProduct } from '../api/types';

export function getMatchStrategyLabel(strategy?: GroupedProduct['matchStrategy']): string {
    switch (strategy) {
        case 'single':
            return '단일 상품 기준';
        case 'model':
            return '모델명 기준';
        case 'brand_model':
            return '브랜드+모델명 기준';
        case 'brand_token':
            return '브랜드+핵심 토큰 기준';
        case 'token':
            return '핵심 토큰 기준';
        default:
            return '핵심 토큰 기준';
    }
}
