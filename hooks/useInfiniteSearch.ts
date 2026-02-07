import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedProduct, aggregateSearch } from '@/lib/api/aggregator';

interface UseInfiniteSearchResult {
    products: UnifiedProduct[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => void;
    resetSearch: () => void;
    sources: string[];
    totalCount: number;
    isScanning: boolean; // For initial scanning effect
}

export function useInfiniteSearch(query: string): UseInfiniteSearchResult {
    const [products, setProducts] = useState<UnifiedProduct[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [sources, setSources] = useState<string[]>([]);
    const [totalCount, setTotalCount] = useState(0);

    // 검색어가 변경되면 상태 초기화
    useEffect(() => {
        if (!query) return;

        setProducts([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setSources([]);
        setTotalCount(0);
        setIsScanning(true); // Scanning effect on new search

        // Initial fetch
        fetchData(query, 1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const fetchData = async (searchQuery: string, pageNum: number, isInitial: boolean) => {
        if (!searchQuery) return;

        setIsLoading(true);
        if (isInitial) setIsScanning(true);

        try {
            const result = await aggregateSearch(searchQuery, pageNum);

            // 스캔 효과를 위해 초기 로딩 시 약간의 지연 추가 (UX)
            if (isInitial) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setProducts(prev => {
                // 중복 제거 (UnifiedProduct.id 기준)
                const newProducts = result.products.filter(
                    newP => !prev.some(existingP => existingP.id === newP.id)
                );
                return [...prev, ...newProducts];
            });

            setSources(prev => Array.from(new Set([...prev, ...result.stats.sources])));
            setTotalCount(prev => prev + result.stats.total);

            // 데이터가 없으면 더 이상 불러오지 않음
            if (result.products.length === 0) {
                setHasMore(false);
            }
        } catch (err) {
            console.error('Search Failed:', err);
            setError('상품을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
            if (isInitial) setIsScanning(false);
        }
    };

    const loadMore = useCallback(() => {
        if (isLoading || !hasMore || !query) return;

        const nextPage = page + 1;
        setPage(nextPage);
        fetchData(query, nextPage, false);
    }, [isLoading, hasMore, query, page]);

    const resetSearch = useCallback(() => {
        setProducts([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        setSources([]);
    }, []);

    return {
        products,
        isLoading,
        error,
        hasMore,
        loadMore,
        resetSearch,
        sources,
        totalCount,
        isScanning
    };
}
