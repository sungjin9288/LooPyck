import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
import { useMultiSourceSearch } from '@/hooks/useMultiSourceSearch';
import { ScanningEffect } from '@/components/agent/ScanningEffect';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { analyzeMood, applyTheme } from '@/lib/ux/themeAdapter';
import { SourceBadge } from '@/components/search/SourceBadges';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import FashionBattle from '@/components/social/FashionBattle';
import RecommendedSection from '@/components/product/RecommendedSection';
import FilterPanel, { FilterState, applyFilters } from '@/components/search/FilterPanel';
import { SearchSort } from '@/types/searchSort';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useGroupedProducts } from '@/hooks/useGroupedProducts';

interface InfiniteProductGridProps {
    query: string;
    sort?: SearchSort;
}

export default function InfiniteProductGrid({ query, sort = 'sim' }: InfiniteProductGridProps) {
    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        isScanning,
        sources
    } = useMultiSourceSearch(query, sort);

    const [sortedProducts, setSortedProducts] = useState<UnifiedProduct[]>([]);
    const [sortOption, setSortOption] = useState<'rel' | 'asc' | 'desc'>('rel');
    const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<UnifiedProduct[]>([]);
    const [filters, setFilters] = useState<FilterState>({ priceRange: 'all', brand: '', source: '' });
    const observerTarget = useRef<HTMLDivElement>(null);

    const { addToRecentlyViewed } = useRecentlyViewed();

    // Bento Grid Helper
    const getGridClass = (index: number) => {
        const pattern = index % 10;
        if (pattern === 0) return "col-span-2 row-span-2";
        if (pattern === 3) return "col-span-1 row-span-2";
        if (pattern === 6) return "col-span-2";
        return "col-span-1";
    };

    // Sort Logic
    useEffect(() => {
        let sorted = [...products];
        if (sortOption === 'asc') sorted.sort((a, b) => a.price - b.price);
        else if (sortOption === 'desc') sorted.sort((a, b) => b.price - a.price);
        setSortedProducts(sorted);
    }, [products, sortOption]);

    useEffect(() => {
        if (sort === 'asc') setSortOption('asc');
        else if (sort === 'dsc') setSortOption('desc');
        else setSortOption('rel');
    }, [sort]);

    // 1. Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) loadMore();
            },
            { threshold: 0.1 }
        );
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, loadMore]);

    // 2. Adaptive Theme Application
    useEffect(() => {
        if (query) {
            const mood = analyzeMood(query);
            applyTheme(mood);
        }
    }, [query]);

    // 필터 적용 후 표시할 상품
    const filteredProducts = applyFilters(sortedProducts, filters);
    const filteredGroupedProducts = useGroupedProducts(filteredProducts);

    // 그리드용 (추천 섹션 제외)
    const recommendedProducts = filteredGroupedProducts.slice(0, 3).map(g => g.representative);
    const gridGroups = filteredGroupedProducts.slice(3);

    const handleProductClick = (product: UnifiedProduct, variants: UnifiedProduct[]) => {
        addToRecentlyViewed(product);
        setSelectedProduct(product);
        setSelectedVariants(variants);
    };

    if (!query) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <ScanningEffect isActive={isScanning} sources={sources.length > 0 ? sources : undefined} />

            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-1 tracking-tighter">
                        검색 결과
                    </h2>
                    <p className="text-slate-500 text-sm">
                        총 <span className="text-slate-900 font-semibold">{filteredProducts.length.toLocaleString()}</span>개 아이템
                        {filters.priceRange !== 'all' || filters.brand || filters.source ? ` (필터 적용됨)` : ''}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-2">
                        {sources.map(s => <SourceBadge key={s} source={s} />)}
                    </div>
                    {/* Sort + Filter buttons */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-sm">
                            {(['rel', 'asc', 'desc'] as const).map(opt => (
                                <button
                                    key={opt}
                                    onClick={() => setSortOption(opt)}
                                    className={`px-3 py-1 rounded-full border transition-all text-xs ${sortOption === opt ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-500 border-slate-200 hover:border-slate-400'}`}
                                >
                                    {opt === 'rel' ? '관련도순' : opt === 'asc' ? '낮은가격' : '높은가격'}
                                </button>
                            ))}
                        </div>
                        <FilterPanel products={sortedProducts} filters={filters} onFilterChange={setFilters} />
                    </div>
                </div>
            </div>

            {/* Recommended Section */}
            {recommendedProducts.length > 0 && (
                <RecommendedSection
                    products={recommendedProducts}
                    onProductClick={(p) => handleProductClick(p, [])}
                />
            )}

            {filteredGroupedProducts.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    선택한 필터 조건에 맞는 상품이 없습니다.
                </div>
            ) : (
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px]"
                    variants={InteractionNarrative.staggerContainer}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Feature: Social Battle */}
                    <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2">
                        <FashionBattle />
                    </div>

                    {gridGroups.map((group, index) => {
                        const product = group.representative;
                        return (
                            <motion.div
                                key={group.groupKey}
                                className={`relative group overflow-hidden rounded-xl bg-slate-100 ${getGridClass(index)}`}
                                variants={InteractionNarrative.parallaxReveal}
                                custom={index % 5}
                                onClick={() => handleProductClick(product, group.variants)}
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

                                {/* Multi-mall badge */}
                                {group.mallCount > 1 && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {group.mallCount}개 쇼핑몰 비교
                                        </span>
                                    </div>
                                )}

                                {/* Content Layer */}
                                <div className="absolute bottom-0 left-0 p-4 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                                    <span className="text-[10px] font-bold tracking-widest uppercase mb-1 block text-yellow-400">
                                        {product.mallName}
                                    </span>
                                    <h3 className="text-sm md:text-base font-serif leading-tight mb-1 line-clamp-2">
                                        {product.title}
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-sm font-bold text-white">
                                            {group.lowestPrice.toLocaleString()}원~
                                        </p>
                                        {group.mallCount > 1 && (
                                            <p className="text-xs text-slate-300 line-through">
                                                최고 {group.highestPrice.toLocaleString()}원
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Loading Indicator */}
            <div ref={observerTarget} className="h-20 flex justify-center items-center mt-8">
                {isLoading && !isScanning && (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-400">더 불러오는 중...</span>
                    </div>
                )}
            </div>

            {!hasMore && products.length > 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">
                    모든 상품을 불러왔습니다 ✨
                </div>
            )}

            <ProductDetailModal
                product={selectedProduct}
                onClose={() => { setSelectedProduct(null); setSelectedVariants([]); }}
                variants={selectedVariants}
            />
        </div>
    );
}
