import { useState, useEffect, useCallback } from 'react';
import { UnifiedProduct } from '@/lib/api/aggregator'; // Type definition reuse

interface UseMultiSourceSearchResult {
    products: UnifiedProduct[];
    isLoading: boolean;
    error: string | null;
    loadMore: () => void;
    hasMore: boolean;
    sources: string[];
    isScanning: boolean;
    totalCount: number;
}

export function useMultiSourceSearch(query: string): UseMultiSourceSearchResult {
    const [products, setProducts] = useState<UnifiedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = useCallback(async (searchQuery: string, pageNum: number, isInitial: boolean) => {
        if (!searchQuery) return;

        setIsLoading(true);
        if (isInitial) setIsScanning(true);

        try {
            const res = await fetch(`/api/realtime-search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Server Error');

            const newProducts: UnifiedProduct[] = data.products || [];

            if (isInitial) {
                setProducts(newProducts);
                // Optional scanning effect delay
                await new Promise(r => setTimeout(r, 1000));
            } else {
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newProducts.filter(p => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
            }

            // Extract unique sources
            const uniqueSources = Array.from(new Set(newProducts.map(p => p.source)));
            setSources(prev => Array.from(new Set([...prev, ...uniqueSources])));

            // If empty return, likely no more data
            if (newProducts.length === 0) {
                setHasMore(false);
            }

        } catch (err: any) {
            console.error('Real-time Search Failed:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
            if (isInitial) setIsScanning(false);
        }
    }, []);

    // Reset on query change
    useEffect(() => {
        if (!query) return;

        setProducts([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setSources([]);

        fetchData(query, 1, true);
    }, [query, fetchData]);

    const loadMore = useCallback(() => {
        if (isLoading || !hasMore || !query) return;

        // Phase 42 Hardening: Memory Leak Protection
        // Prevent infinite scroll from crashing the browser if > 500 items
        if (products.length >= 500) {
            console.warn('[Safety Cap] Product limit 500 reached. Stopping load.');
            setHasMore(false);
            return;
        }

        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(query, nextPage, false);
    }, [isLoading, hasMore, query, page, products.length, fetchData]);

    return {
        products,
        isLoading,
        error,
        loadMore,
        hasMore,
        sources,
        isScanning,
        totalCount: products.length
    };
}
