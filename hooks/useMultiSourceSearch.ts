import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { SearchSort } from '@/types/searchSort';

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

export function useMultiSourceSearch(query: string, sort: SearchSort = 'sim'): UseMultiSourceSearchResult {
    const [products, setProducts] = useState<UnifiedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const controllerRef = useRef<AbortController | null>(null);

    const fetchData = useCallback(async (searchQuery: string, pageNum: number, isInitial: boolean) => {
        if (!searchQuery) return;

        if (controllerRef.current) {
            controllerRef.current.abort();
        }
        controllerRef.current = new AbortController();

        setIsLoading(true);
        if (isInitial) setIsScanning(true);

        try {
            const res = await fetch(
                `/api/realtime-search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&sort=${sort}`,
                { signal: controllerRef.current.signal }
            );
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Server Error');

            const newProducts: UnifiedProduct[] = data.products || [];

            if (isInitial) {
                setProducts(newProducts);
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

        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return;
            }
            console.error('Real-time Search Failed:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
            if (isInitial) setIsScanning(false);
        }
    }, [sort]);

    useEffect(() => {
        if (!query) return;

        setProducts([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setSources([]);

        fetchData(query, 1, true);
    }, [query, sort, fetchData]);

    useEffect(() => {
        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
            }
        };
    }, []);

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
