import { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { SearchSort } from '@/types/searchSort';
import { SearchExperienceMeta } from '@/lib/search/fashionQueryAssistant';
import { pushAppNotification } from '@/lib/core/notifications';
import {
    buildRealtimeSearchFallbackNotification,
    buildRealtimeSearchFeedbackNotificationKey,
    mergeRealtimeSearchFeedbackMeta,
    parseRealtimeSearchFeedbackMeta,
    type RealtimeSearchFeedbackMeta,
} from '@/lib/search/realtimeSearchFeedback';
import { Logger } from '@/lib/core/observability';

interface UseMultiSourceSearchResult {
    products: UnifiedProduct[];
    isLoading: boolean;
    error: string | null;
    loadMore: () => void;
    hasMore: boolean;
    sources: string[];
    isScanning: boolean;
    totalCount: number;
    searchMeta: SearchExperienceMeta | null;
    suggestedQueries: string[];
    blockedReason: string | null;
    realtimeFeedback: RealtimeSearchFeedbackMeta | null;
}

let lastRealtimeSearchFallbackNotificationKey: string | null = null;

export function useMultiSourceSearch(query: string, sort: SearchSort = 'sim'): UseMultiSourceSearchResult {
    const [products, setProducts] = useState<UnifiedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blockedReason, setBlockedReason] = useState<string | null>(null);
    const [sources, setSources] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchMeta, setSearchMeta] = useState<SearchExperienceMeta | null>(null);
    const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);
    const [realtimeFeedback, setRealtimeFeedback] = useState<RealtimeSearchFeedbackMeta | null>(null);
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
            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                setBlockedReason(data.blocked ? data.error || '검색 제한' : null);
                setSearchMeta(data.searchMeta ?? null);
                setSuggestedQueries(Array.isArray(data.suggestedQueries) ? data.suggestedQueries : []);
                throw new Error(data.error || 'Server Error');
            }

            setBlockedReason(null);
            setError(null);
            setSearchMeta(data.searchMeta ?? null);
            setSuggestedQueries(Array.isArray(data.searchMeta?.suggestedQueries) ? data.searchMeta.suggestedQueries : []);

            const newProducts: UnifiedProduct[] = data.products || [];
            const feedbackMeta = parseRealtimeSearchFeedbackMeta(res.headers);
            const fallbackNotification = buildRealtimeSearchFallbackNotification(feedbackMeta, newProducts.length);
            const notificationKey = buildRealtimeSearchFeedbackNotificationKey(searchQuery, feedbackMeta, newProducts.length);

            setRealtimeFeedback((previous) => mergeRealtimeSearchFeedbackMeta(isInitial ? null : previous, feedbackMeta));

            if (isInitial && fallbackNotification) {
                if (notificationKey && lastRealtimeSearchFallbackNotificationKey !== notificationKey) {
                    pushAppNotification(fallbackNotification);
                    lastRealtimeSearchFallbackNotificationKey = notificationKey;
                }
            }

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
            Logger.error('[useMultiSourceSearch] search failed', err);
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
        setBlockedReason(null);
        setSources([]);
        setSearchMeta(null);
        setSuggestedQueries([]);
        setRealtimeFeedback(null);

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
        if (isLoading || isScanning || !hasMore || !query || products.length === 0) return;

        // Phase 42 Hardening: Memory Leak Protection
        // Prevent infinite scroll from crashing the browser if > 500 items
        if (products.length >= 500) {
            Logger.warn('[useMultiSourceSearch] product safety cap reached', { limit: 500 });
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
        totalCount: products.length,
        searchMeta,
        suggestedQueries,
        blockedReason,
        realtimeFeedback,
    };
}
