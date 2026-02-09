import React, { useEffect, useRef } from 'react';
import { useMultiSourceSearch } from '@/hooks/useMultiSourceSearch';
import { ScanningEffect } from '@/components/agent/ScanningEffect';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { analyzeMood, applyTheme } from '@/lib/ux/themeAdapter';
import { designTokens } from '@/styles/designTokens';
import { SourceBadge } from '@/components/search/SourceBadges';
import FutureValueInsight from '@/components/product/FutureValueInsight'; // Phase 20 AI Component

interface InfiniteProductGridProps {
    query: string;
}

export default function InfiniteProductGrid({ query }: InfiniteProductGridProps) {
    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        isScanning,
        sources
    } = useMultiSourceSearch(query);

    const observerTarget = useRef<HTMLDivElement>(null);

    // 1. Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, loadMore]);

    // 2. Adaptive Theme Application
    useEffect(() => {
        if (query) {
            const mood = analyzeMood(query);
            applyTheme(mood);
        }
    }, [query]);

    if (!query) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <ScanningEffect isActive={isScanning} sources={sources.length > 0 ? sources : undefined} />

            {/* Header / Stats */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-black mb-2 tracking-tighter">
                        New Arrivals
                    </h2>
                    <p className="text-gray-500 text-sm">
                        실시간 수집된 <span className="text-black font-semibold">{products.length.toLocaleString()}</span>개의 아이템
                    </p>
                </div>
                <div className="flex gap-2">
                    {sources.map(s => <SourceBadge key={s} source={s} />)}
                </div>
            </div>

            {/* Masonry Grid Layout (CSS Columns) */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                {products.map((product) => (
                    <div key={product.id} className="break-inside-avoid mb-4">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>

            {/* Loading Indicator */}
            <div ref={observerTarget} className="h-20 flex justify-center items-center mt-8">
                {isLoading && !isScanning && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400">Loading more...</span>
                    </div>
                )}
            </div>

            {!hasMore && products.length > 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                    End of Stream
                </div>
            )}
        </div>
    );
}

function ProductCard({ product }: { product: UnifiedProduct }) {
    return (
        <div
            onClick={() => window.open(product.link, '_blank')}
            className="group relative cursor-pointer"
        >
            {/* Image (Masonry relies on natural height) */}
            <div className="relative w-full overflow-hidden rounded-lg bg-gray-100 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Overlay Badge */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                        {product.mallName}
                    </span>
                </div>
            </div>

            {/* Minimal Info */}
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-black leading-tight">
                        {product.brand || product.mallName}
                    </h3>
                    <span className="text-sm font-semibold text-black">
                        {product.price.toLocaleString()}
                    </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 group-hover:text-black transition-colors">
                    {product.title}
                </p>
            </div>
        </div>
    );
}

// Inline styles removed in favor of Tailwind classes for cleaner "Radical" design code.
