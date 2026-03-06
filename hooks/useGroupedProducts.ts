'use client';

import { useMemo } from 'react';
import { UnifiedProduct, GroupedProduct } from '@/lib/api/types';
import { groupProducts } from '@/lib/product/productMatching';

/**
 * UnifiedProduct[] → GroupedProduct[]
 * 유사한 상품명을 묶어 쇼핑몰별 가격 비교를 위한 그룹 생성
 */
export function useGroupedProducts(products: UnifiedProduct[]): GroupedProduct[] {
    return useMemo(() => groupProducts(products), [products]);
}
