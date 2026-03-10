import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
import { useMultiSourceSearch } from '@/hooks/useMultiSourceSearch';
import { ScanningEffect } from '@/components/agent/ScanningEffect';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { analyzeMood, applyTheme } from '@/lib/ux/themeAdapter';
import { SourceBadge } from '@/components/search/SourceBadges';
import ProductDetailModal from '@/components/product/ProductDetailModal';
import ComparisonHighlights from '@/components/product/ComparisonHighlights';
import FilterPanel, { FilterState, applyFilters } from '@/components/search/FilterPanel';
import { hasPdpDetailData, isPdpDetailEnrichmentSupported } from '@/lib/product/pdpDetailEnrichment';
import { SearchSort } from '@/types/searchSort';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useGroupedProducts } from '@/hooks/useGroupedProducts';
import { estimatePurchasePrice, getGroupPurchaseMetrics } from '@/lib/product/purchasePricing';
import { rerankProductsByPreference, type PreferenceProfile } from '@/lib/search/preferenceRerank';
import { logSearchInteraction } from '@/lib/search/searchInteractionClient';

interface InfiniteProductGridProps {
    query: string;
    sort?: SearchSort;
    onSearch?: (query: string, sort: SearchSort) => void;
}

export default function InfiniteProductGrid({ query, sort = 'sim', onSearch }: InfiniteProductGridProps) {
    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        isScanning,
        error,
        sources,
        searchMeta,
        suggestedQueries,
        blockedReason,
    } = useMultiSourceSearch(query, sort);

    const [sortedProducts, setSortedProducts] = useState<UnifiedProduct[]>([]);
    const [sortOption, setSortOption] = useState<'rel' | 'asc' | 'desc'>('rel');
    const [selectedProduct, setSelectedProduct] = useState<UnifiedProduct | null>(null);
    const [selectedVariants, setSelectedVariants] = useState<UnifiedProduct[]>([]);
    const [selectedMatchConfidence, setSelectedMatchConfidence] = useState<number | null>(null);
    const [filters, setFilters] = useState<FilterState>({ priceRange: 'all', brand: '', source: '' });
    const [enrichedProductsByKey, setEnrichedProductsByKey] = useState<Record<string, UnifiedProduct>>({});
    const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile>({
        totalSignals: 0,
        topBrands: [],
        topCategories: [],
    });
    const observerTarget = useRef<HTMLDivElement>(null);

    const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed();

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
        if (sortOption === 'asc') {
            sorted.sort((a, b) => a.price - b.price);
            setPreferenceProfile({
                totalSignals: recentlyViewed.length,
                topBrands: [],
                topCategories: [],
            });
        } else if (sortOption === 'desc') {
            sorted.sort((a, b) => b.price - a.price);
            setPreferenceProfile({
                totalSignals: recentlyViewed.length,
                topBrands: [],
                topCategories: [],
            });
        } else {
            const reranked = rerankProductsByPreference(sorted, recentlyViewed);
            sorted = reranked.products;
            setPreferenceProfile(reranked.profile);
        }
        setSortedProducts(sorted);
    }, [products, sortOption, recentlyViewed]);

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
    const filteredProducts = useMemo(() => applyFilters(sortedProducts, filters), [sortedProducts, filters]);
    const filteredGroupedProducts = useGroupedProducts(filteredProducts);
    const comparisonReadyGroups = useMemo(
        () => filteredGroupedProducts.filter((group) => group.mallCount > 1 && group.matchConfidence >= 0.72),
        [filteredGroupedProducts]
    );
    const highlightGroups = useMemo(
        () => [...comparisonReadyGroups]
            .sort((a, b) => {
                const confidenceDiff = b.matchConfidence - a.matchConfidence;
                if (confidenceDiff !== 0) return confidenceDiff;
                const mallDiff = b.mallCount - a.mallCount;
                if (mallDiff !== 0) return mallDiff;
                return (b.highestPrice - b.lowestPrice) - (a.highestPrice - a.lowestPrice);
            })
            .slice(0, 3),
        [comparisonReadyGroups]
    );

    const buildProductKey = (product: UnifiedProduct) => `${product.source}:${product.id}`;

    const applyEnrichedProducts = (variants: UnifiedProduct[]) => variants.map((variant) => enrichedProductsByKey[buildProductKey(variant)] || variant);

    const enrichGroup = (group: typeof highlightGroups[number]) => {
        const enrichedVariants = applyEnrichedProducts(group.variants);
        const representative = enrichedVariants.find((variant) => buildProductKey(variant) === buildProductKey(group.representative)) || enrichedVariants[0] || group.representative;

        return {
            ...group,
            representative,
            variants: enrichedVariants,
            lowestPrice: Math.min(...enrichedVariants.map((variant) => variant.price)),
            highestPrice: Math.max(...enrichedVariants.map((variant) => variant.price)),
        };
    };

    const enrichedHighlightGroups = useMemo(
        () => highlightGroups.map((group) => enrichGroup(group)),
        [highlightGroups, enrichedProductsByKey]
    );
    const gridGroups = useMemo(() => {
        if (enrichedHighlightGroups.length === 0) return filteredGroupedProducts;
        const highlightKeys = new Set(enrichedHighlightGroups.map((group) => group.groupKey));
        const rest = filteredGroupedProducts.filter((group) => !highlightKeys.has(group.groupKey));
        return rest.length > 0 ? rest : filteredGroupedProducts;
    }, [filteredGroupedProducts, enrichedHighlightGroups]);
    const lowestVisiblePrice = useMemo(
        () => filteredProducts.reduce((min, product) => Math.min(min, estimatePurchasePrice(product).checkoutPrice), Number.POSITIVE_INFINITY),
        [filteredProducts]
    );
    const highestVisiblePrice = useMemo(
        () => filteredProducts.reduce((max, product) => Math.max(max, estimatePurchasePrice(product).checkoutPrice), 0),
        [filteredProducts]
    );
    const biggestSpread = useMemo(
        () => comparisonReadyGroups.reduce((max, group) => {
            const metrics = getGroupPurchaseMetrics(group);
            return Math.max(max, metrics.highestCheckoutPrice - metrics.lowestCheckoutPrice);
        }, 0),
        [comparisonReadyGroups]
    );
    const refinementSuggestions = useMemo(
        () => suggestedQueries.filter((suggestion) => suggestion !== query).slice(0, 4),
        [query, suggestedQueries]
    );

    useEffect(() => {
        let cancelled = false;

        const productsToRefresh = highlightGroups
            .flatMap((group) => group.variants)
            .filter((product, index, all) =>
                all.findIndex((candidate) => buildProductKey(candidate) === buildProductKey(product)) === index
            )
            .filter((product) =>
                isPdpDetailEnrichmentSupported(product)
                && !hasPdpDetailData(product)
                && !enrichedProductsByKey[buildProductKey(product)]
            );

        if (productsToRefresh.length === 0) {
            return () => {
                cancelled = true;
            };
        }

        async function enrichHighlights() {
            try {
                const response = await fetch('/api/product-detail-enrichment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        products: productsToRefresh.slice(0, 8),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`status_${response.status}`);
                }

                const payload = await response.json();
                if (cancelled || !Array.isArray(payload.products)) {
                    return;
                }

                setEnrichedProductsByKey((previous) => {
                    const next = { ...previous };
                    (payload.products as UnifiedProduct[]).forEach((product) => {
                        next[buildProductKey(product)] = product;
                    });
                    return next;
                });
            } catch (error) {
                if (!cancelled) {
                    console.error('[InfiniteProductGrid] highlight enrichment failed:', error);
                }
            }
        }

        enrichHighlights();

        return () => {
            cancelled = true;
        };
    }, [highlightGroups, enrichedProductsByKey]);

    const handleGroupClick = (group: typeof filteredGroupedProducts[number]) => {
        const enrichedGroup = enrichGroup(group);
        addToRecentlyViewed(enrichedGroup.representative);
        void logSearchInteraction({
            type: 'product_open',
            query,
            source: enrichedGroup.representative.source,
            productId: enrichedGroup.representative.id,
            productTitle: enrichedGroup.representative.title,
            brand: enrichedGroup.representative.brand,
            context: 'search_results',
        });
        setSelectedProduct(enrichedGroup.representative);
        setSelectedVariants(enrichedGroup.variants);
        setSelectedMatchConfidence(enrichedGroup.matchConfidence ?? null);
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

            {(blockedReason || searchMeta || refinementSuggestions.length > 0) && (
                <section className="mb-6 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Search Fit</p>
                            {blockedReason ? (
                                <p className="text-sm font-medium text-amber-800">{blockedReason}</p>
                            ) : searchMeta ? (
                                <>
                                    <p className="text-sm text-slate-700">
                                        강하게 일치한 결과 <span className="font-semibold text-slate-900">{searchMeta.strongMatchCount}</span>개,
                                        정확한 문구 일치 <span className="font-semibold text-slate-900">{searchMeta.exactMatchCount}</span>개
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {searchMeta.resultQuality === 'strong'
                                            ? '검색어와 잘 맞는 결과가 우선 노출되고 있습니다.'
                                            : searchMeta.resultQuality === 'mixed'
                                                ? '결과는 확보됐지만 검색어를 조금 더 구체화하면 비교 정확도가 올라갑니다.'
                                                : '결과 범위가 넓습니다. 아래 추천 검색어로 더 정확하게 좁혀보세요.'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">검색어를 더 구체화하면 비교 정확도가 올라갑니다.</p>
                            )}
                        </div>

                        {searchMeta && (
                            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${searchMeta.resultQuality === 'strong'
                                ? 'bg-emerald-100 text-emerald-800'
                                : searchMeta.resultQuality === 'mixed'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                {searchMeta.resultQuality === 'strong'
                                    ? '높은 일치도'
                                    : searchMeta.resultQuality === 'mixed'
                                        ? '보통 일치도'
                                        : '검색어 보정 필요'}
                            </span>
                        )}
                    </div>

                    {refinementSuggestions.length > 0 && onSearch && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {refinementSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => {
                                        void logSearchInteraction({
                                            type: 'suggestion_click',
                                            query,
                                            selectedQuery: suggestion,
                                            context: 'results_refinement',
                                        });
                                        onSearch(suggestion, 'sim');
                                    }}
                                    className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                    {searchMeta?.resultQuality !== 'weak' && preferenceProfile.totalSignals > 0 && preferenceProfile.topBrands.length > 0 && (
                        <p className="mt-3 text-xs text-slate-500">
                            최근 본 상품 기반 선호 반영: {preferenceProfile.topBrands.slice(0, 2).join(', ')}
                        </p>
                    )}
                </section>
            )}

            {error && (
                <section className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 shadow-sm">
                    <p className="text-sm font-semibold text-rose-900">검색 요청이 정상적으로 끝나지 않았습니다.</p>
                    <p className="mt-1 text-sm text-rose-800">{error}</p>
                    <p className="mt-2 text-xs text-rose-700">
                        일시적인 외부 쇼핑몰 응답 지연일 수 있습니다. 같은 검색어로 다시 시도하거나 더 짧은 패션 키워드로 검색해보세요.
                    </p>
                </section>
            )}

            {filteredProducts.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">최저 결제가</p>
                        <p className="text-3xl font-black tracking-tight text-slate-900">
                            {Number.isFinite(lowestVisiblePrice) ? lowestVisiblePrice.toLocaleString() : 0}원
                        </p>
                        <p className="text-sm text-slate-500 mt-2">배송비를 반영한 예상 결제가 기준입니다.</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">비교 가능 상품</p>
                        <p className="text-3xl font-black tracking-tight text-slate-900">
                            {comparisonReadyGroups.length.toLocaleString()}개
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            같은 상품이 2개 이상 쇼핑몰에서 잡힌 경우만 카운트합니다.
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">최대 결제가 차이</p>
                        <p className="text-3xl font-black tracking-tight text-slate-900">
                            {biggestSpread.toLocaleString()}원
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            현재 결과 내 최고 결제가 {highestVisiblePrice.toLocaleString()}원까지 비교됩니다.
                        </p>
                    </div>
                </section>
            )}

            <ComparisonHighlights
                groups={enrichedHighlightGroups}
                onProductClick={(group) => handleGroupClick(group)}
            />

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
                    {gridGroups.map((group, index) => {
                        const product = group.representative;
                        return (
                            <motion.div
                                key={group.groupKey}
                                className={`relative group overflow-hidden rounded-xl bg-slate-100 ${getGridClass(index)}`}
                                variants={InteractionNarrative.parallaxReveal}
                                custom={index % 5}
                                onClick={() => handleGroupClick(group)}
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
                                        <div className="flex flex-col gap-1">
                                            <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {group.mallCount}개 쇼핑몰 비교
                                            </span>
                                            {applyEnrichedProducts(group.variants).some((variant) => hasPdpDetailData(variant)) && (
                                                <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    PDP 확인
                                                </span>
                                            )}
                                        </div>
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
                onClose={() => {
                    setSelectedProduct(null);
                    setSelectedVariants([]);
                    setSelectedMatchConfidence(null);
                }}
                variants={selectedVariants}
                matchConfidence={selectedMatchConfidence || undefined}
            />
        </div>
    );
}
