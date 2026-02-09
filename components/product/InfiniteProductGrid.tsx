import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
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

    const [sortedProducts, setSortedProducts] = React.useState<UnifiedProduct[]>([]);
    const [sortOption, setSortOption] = React.useState<'rel' | 'asc' | 'desc'>('rel');
    const observerTarget = useRef<HTMLDivElement>(null);

    // Bento Grid Helper
    const getGridClass = (index: number) => {
        const pattern = index % 10;
        if (pattern === 0) return "col-span-2 row-span-2"; // Big Feature
        if (pattern === 3) return "col-span-1 row-span-2"; // Tall
        if (pattern === 6) return "col-span-2"; // Wide
        return "col-span-1";
    };

    // Sort Logic
    useEffect(() => {
        let sorted = [...products];
        if (sortOption === 'asc') {
            sorted.sort((a, b) => a.price - b.price);
        } else if (sortOption === 'desc') {
            sorted.sort((a, b) => b.price - a.price);
        }
        setSortedProducts(sorted);
    }, [products, sortOption]);

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
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-black mb-2 tracking-tighter">
                        New Arrivals
                    </h2>
                    <p className="text-gray-500 text-sm">
                        실시간 수집된 <span className="text-black font-semibold">{products.length.toLocaleString()}</span>개의 아이템
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                        {sources.map(s => <SourceBadge key={s} source={s} />)}
                    </div>
                    {/* Sort Buttons */}
                    <div className="flex gap-2 text-sm">
                        <button
                            onClick={() => setSortOption('rel')}
                            className={`px-3 py-1 rounded-full border transition-all ${sortOption === 'rel' ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                            신상품순
                        </button>
                        <button
                            onClick={() => setSortOption('asc')}
                            className={`px-3 py-1 rounded-full border transition-all ${sortOption === 'asc' ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                            낮은가격순
                        </button>
                        <button
                            onClick={() => setSortOption('desc')}
                            className={`px-3 py-1 rounded-full border transition-all ${sortOption === 'desc' ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}
                        >
                            높은가격순
                        </button>
                    </div>
                </div>
            </div>

            {/* Price Graph & AI Insight */}
            {sortedProducts.length > 0 && (
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <FutureValueInsight product={sortedProducts[0]} />
                </div>
            )}

            {/* Bento Grid Layout (CSS Grid) */}
            <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[280px]"
                variants={InteractionNarrative.staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {sortedProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        className={`relative group overflow-hidden rounded-xl bg-gray-50 ${getGridClass(index)}`}
                        variants={InteractionNarrative.parallaxReveal}
                        custom={index % 5}
                        onClick={() => window.open(product.link, '_blank')}
                    >
                        {/* Image Layer */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Content Layer (Parallax Reveal) */}
                        <div className="absolute bottom-0 left-0 p-4 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                            <span className="text-[10px] font-bold tracking-widest uppercase mb-1 block text-yellow-400">
                                {product.mallName}
                            </span>
                            <h3 className="text-sm md:text-base font-serif leading-tight mb-1 line-clamp-2">
                                {product.title}
                            </h3>
                            <p className="text-xs font-medium opacity-90">
                                {product.price.toLocaleString()}원
                            </p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

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
// Removed ProductCard component as it is now inline for Bento Grid flexibility



// Inline styles removed in favor of Tailwind classes for cleaner "Radical" design code.
