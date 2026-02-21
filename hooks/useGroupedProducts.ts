'use client';

import { useMemo } from 'react';
import { UnifiedProduct, GroupedProduct } from '@/lib/api/types';

/**
 * 상품 제목을 정규화하여 그룹 키 생성
 * 예: "무신사 [무신사스탠다드] 크루넥 맨투맨" → "크루넥맨투맨"
 */
function normalizeKey(title: string): string {
    return title
        .toLowerCase()
        .replace(/\[.*?\]/g, '')           // 대괄호 블록 제거
        .replace(/\(.*?\)/g, '')           // 소괄호 블록 제거
        .replace(/\b(무신사|29cm|지그재그|에이블리|W컨셉|WConcept)\b/gi, '') // 쇼핑몰명 제거
        .replace(/[^가-힣a-z0-9]/g, '')   // 특수문자 제거
        .trim()
        .slice(0, 20);                     // 상위 20자 기준으로 그룹화
}

/**
 * UnifiedProduct[] → GroupedProduct[]
 * 유사한 상품명을 묶어 쇼핑몰별 가격 비교를 위한 그룹 생성
 */
export function useGroupedProducts(products: UnifiedProduct[]): GroupedProduct[] {
    return useMemo(() => {
        const groupMap = new Map<string, UnifiedProduct[]>();

        for (const product of products) {
            const key = normalizeKey(product.title);
            if (!key || key.length < 3) {
                // 너무 짧은 키는 그룹화 불가 → 개별 처리
                const fallbackKey = product.id;
                const existing = groupMap.get(fallbackKey) || [];
                groupMap.set(fallbackKey, [...existing, product]);
            } else {
                const existing = groupMap.get(key) || [];
                groupMap.set(key, [...existing, product]);
            }
        }

        const groups: GroupedProduct[] = [];

        groupMap.forEach((variants, groupKey) => {
            const sorted = [...variants].sort((a, b) => a.price - b.price);
            const representative = sorted[0]; // 최저가를 대표 상품으로

            groups.push({
                groupKey,
                representative,
                variants: sorted,
                lowestPrice: sorted[0].price,
                highestPrice: sorted[sorted.length - 1].price,
                mallCount: new Set(sorted.map(v => v.mallName)).size,
            });
        });

        return groups;
    }, [products]);
}
