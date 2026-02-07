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

    // API Route doesn't support pagination yet in this phase plan (Real-time usually 1-shot)
    // So 'loadMore' might be limited or just a placeholder implementation.
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        if (!query) return;

        const fetchData = async () => {
            setIsLoading(true);
            setIsScanning(true);
            setProducts([]);
            setError(null);
            setSources([]);

            try {
                // Call API Route
                const res = await fetch(`/api/realtime-search?q=${encodeURIComponent(query)}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Server Error');

                const newProducts: UnifiedProduct[] = data.products || [];

                setProducts(newProducts);

                // Extract sources
                const uniqueSources = Array.from(new Set(newProducts.map(p => p.source)));
                setSources(uniqueSources);

                // Scanning effect end
                // await new Promise(r => setTimeout(r, 1000)); // Optional delay for effect

            } catch (err: any) {
                console.error('Real-time Search Failed:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
                setIsScanning(false);
            }
        };

        fetchData();
    }, [query]);

    // Phase 19 plan says "Streaming UI". Currently API returns all at once.
    // Future improvement: Server-Sent Events or Streaming Response.
    // This hook simply fetches once.

    const loadMore = useCallback(() => {
        // Not implemented for API-based real-time search in this iteration
    }, []);

    return {
        products,
        isLoading,
        error,
        loadMore,
        hasMore, // Always false for single-page realtime search
        sources,
        isScanning,
        totalCount: products.length
    };
}
