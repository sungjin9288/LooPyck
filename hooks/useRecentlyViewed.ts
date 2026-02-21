'use client';

import { useState, useCallback, useEffect } from 'react';
import { UnifiedProduct } from '@/lib/api/types';

const STORAGE_KEY = 'loopyck-recently-viewed';
const MAX_ITEMS = 20;

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<UnifiedProduct[]>([]);

    // 마운트 시 localStorage 로드
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentlyViewed(JSON.parse(stored));
            }
        } catch (e) {
            // localStorage 실패 시 무시
        }
    }, []);

    const addToRecentlyViewed = useCallback((product: UnifiedProduct) => {
        setRecentlyViewed(prev => {
            // 이미 있는 항목이면 앞으로 이동
            const filtered = prev.filter(p => p.id !== product.id);
            const updated = [product, ...filtered].slice(0, MAX_ITEMS);

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch (e) {
                // quota 초과 시 무시
            }

            return updated;
        });
    }, []);

    const clearRecentlyViewed = useCallback(() => {
        setRecentlyViewed([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed };
}
