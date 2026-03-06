'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { buildProductDetailHref } from '@/lib/api/productSnapshot';
import FutureValueInsight from './FutureValueInsight';
import ProductReviews from './ProductReviews';
import RichShare from '@/components/shared/RichShare';
import PriceHistoryChart from './PriceHistoryChart';
import SizeFitGuide from './SizeFitGuide';
import AffordableAlternatives from './AffordableAlternatives';
import PurchaseComparisonTable from './PurchaseComparisonTable';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import { comparePurchaseOffers } from '@/lib/product/purchasePricing';
import { hasPdpDetailData, isPdpDetailEnrichmentSupported } from '@/lib/product/pdpDetailEnrichment';
import { analyzeVariantAlignment } from '@/lib/product/variantAlignment';
import { logSearchInteraction } from '@/lib/search/searchInteractionClient';

interface ProductDetailModalProps {
    product: UnifiedProduct | null;
    onClose: () => void;
    variants?: UnifiedProduct[]; // 동일 상품의 다른 쇼핑몰 목록
    matchConfidence?: number;
}

export default function ProductDetailModal({ product, onClose, variants = [], matchConfidence }: ProductDetailModalProps) {
    if (!product) return null;
    const baseVariants = React.useMemo(
        () => (variants.length > 0 ? variants : [product]),
        [product, variants]
    );
    const [enrichedVariants, setEnrichedVariants] = React.useState<UnifiedProduct[]>([]);
    const [isRefreshingDetails, setIsRefreshingDetails] = React.useState(false);
    const [detailRefreshError, setDetailRefreshError] = React.useState<string | null>(null);

    React.useEffect(() => {
        setEnrichedVariants([]);
        setDetailRefreshError(null);
    }, [product.id, product.source, variants]);

    React.useEffect(() => {
        let cancelled = false;

        const needsRefresh = baseVariants.some((entry) => isPdpDetailEnrichmentSupported(entry) && !hasPdpDetailData(entry));
        if (!needsRefresh) {
            setEnrichedVariants(baseVariants);
            setIsRefreshingDetails(false);
            return () => {
                cancelled = true;
            };
        }

        async function refreshDetails() {
            setIsRefreshingDetails(true);
            setDetailRefreshError(null);

            try {
                const response = await fetch('/api/product-detail-enrichment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        products: baseVariants.slice(0, 8),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`status_${response.status}`);
                }

                const payload = await response.json();
                if (!cancelled && Array.isArray(payload.products)) {
                    setEnrichedVariants(payload.products as UnifiedProduct[]);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('[ProductDetailModal] detail enrichment failed:', error);
                    setDetailRefreshError('상세 페이지 확인에 실패했습니다.');
                    setEnrichedVariants(baseVariants);
                }
            } finally {
                if (!cancelled) {
                    setIsRefreshingDetails(false);
                }
            }
        }

        refreshDetails();

        return () => {
            cancelled = true;
        };
    }, [baseVariants]);

    const allVariants = enrichedVariants.length > 0 ? enrichedVariants : baseVariants;
    const activeProduct = allVariants.find((entry) => entry.id === product.id && entry.source === product.source) || product;
    const offers = comparePurchaseOffers(allVariants);
    const optionAlignment = analyzeVariantAlignment(allVariants);
    const selectedOffer = offers.find((offer) => offer.product.id === activeProduct.id && offer.product.source === activeProduct.source) || offers[0];
    const lowestCheckoutOffer = offers[0];
    const savingsAgainstSelection = Math.max(0, selectedOffer.checkoutPrice - lowestCheckoutOffer.checkoutPrice);
    const safeStoreUrl = sanitizeExternalUrl(activeProduct.link);
    const shareUrl = buildProductDetailHref(activeProduct);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6"
                >
                    <button
                        onClick={onClose}
                        aria-label="모달 닫기"
                        className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
                    >
                        ✕
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Image */}
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={activeProduct.image}
                                alt={activeProduct.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                {activeProduct.mallName}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                                {activeProduct.title}
                            </h2>
                            <div className="text-3xl font-bold text-black mb-6">
                                {activeProduct.price.toLocaleString()}원
                            </div>

                            <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-1">
                                    비교 상태
                                </p>
                                {!selectedOffer.isAvailable ? (
                                    <p className="text-sm text-slate-700">
                                        현재 선택한 옵션은 <span className="font-bold text-rose-600">품절 추정</span> 상태입니다. 다른 쇼핑몰 옵션을 우선 확인하세요.
                                    </p>
                                ) : savingsAgainstSelection > 0 ? (
                                    <p className="text-sm text-slate-700">
                                        현재 선택한 쇼핑몰보다 <span className="font-bold text-emerald-700">{savingsAgainstSelection.toLocaleString()}원</span> 더 저렴한 결제가 옵션이 있습니다.
                                    </p>
                                ) : (
                                    <p className="text-sm text-slate-700">
                                        현재 선택한 상품이 확인된 옵션 중 <span className="font-bold text-emerald-700">가장 낮은 결제가</span>입니다.
                                    </p>
                                )}
                                {typeof matchConfidence === 'number' && allVariants.length > 1 && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        브랜드/모델/핵심 토큰 기준 매칭 신뢰도 {Math.round(matchConfidence * 100)}%
                                    </p>
                                )}
                                {optionAlignment.hasMismatchRisk && allVariants.length > 1 && (
                                    <p className="mt-2 text-xs text-amber-700">
                                        옵션 주의: {optionAlignment.summaryLabel}. 색상/사이즈/성별 신호가 섞여 있을 수 있어 상세 옵션 확인이 필요합니다.
                                    </p>
                                )}
                                {activeProduct.optionSummary && (
                                    <p className="mt-2 text-xs text-slate-500">
                                        상세 옵션 확인: {activeProduct.optionSummary}
                                    </p>
                                )}
                                {isRefreshingDetails && (
                                    <p className="mt-2 text-xs text-violet-700">
                                        상세 페이지를 다시 확인해 옵션/재고/배송 정보를 보강하는 중입니다.
                                    </p>
                                )}
                                {detailRefreshError && (
                                    <p className="mt-2 text-xs text-rose-600">
                                        {detailRefreshError}
                                    </p>
                                )}
                                <p className="mt-2 text-xs text-slate-500">
                                    배송비를 먼저 반영한 결제가를 기준으로 비교하고, 쿠폰 혜택은 별도로 가능한 최저가를 표시합니다.
                                </p>
                            </div>

                            {safeStoreUrl ? (
                                <a
                                    href={safeStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => {
                                        void logSearchInteraction({
                                            type: 'store_click',
                                            query: activeProduct.title.slice(0, 60),
                                            source: activeProduct.source,
                                            productId: activeProduct.id,
                                            productTitle: activeProduct.title,
                                            brand: activeProduct.brand,
                                            context: 'product_modal',
                                        });
                                    }}
                                    className="block w-full py-4 bg-black text-white text-center font-bold rounded-xl hover:bg-gray-800 transition-all mb-4"
                                >
                                    쇼핑몰로 이동
                                </a>
                            ) : (
                                <div className="block w-full py-4 bg-gray-200 text-gray-600 text-center font-bold rounded-xl cursor-not-allowed mb-4">
                                    쇼핑몰 링크 없음
                                </div>
                            )}

                            <a
                                href={buildProductDetailHref(activeProduct)}
                                className="block w-full py-3 border border-gray-300 text-gray-800 text-center font-semibold rounded-xl hover:bg-gray-50 transition-all mb-4"
                            >
                                상세 비교 페이지
                            </a>

                            {/* Phase 39: Rich Share Stock Card */}
                            <div className="flex w-full">
                                <RichShare
                                    productTitle={activeProduct.title}
                                    productImage={activeProduct.image}
                                    currentPrice={activeProduct.price}
                                    shareUrl={shareUrl}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 쇼핑몰별 가격 비교 테이블 */}
                    {allVariants.length > 1 && (
                        <div className="border-t border-slate-100 pt-6 mb-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                쇼핑몰별 실구매가 비교
                            </h3>
                            <PurchaseComparisonTable offers={offers} selectedProductId={activeProduct.id} />
                        </div>
                    )}

                    {/* Size and Fit Guide (Phase 40) */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <SizeFitGuide productName={activeProduct.title} />
                    </div>

                    {/* Affordable Alternatives (Phase 40) */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <AffordableAlternatives baseProduct={activeProduct} />
                    </div>

                    {/* Price History Chart */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                            📈 가격 흐름
                        </h3>
                        <PriceHistoryChart
                            source={activeProduct.source}
                            productId={activeProduct.id}
                            currentPrice={activeProduct.price}
                        />
                        <p className="text-xs text-slate-400 text-center mt-2">
                            수집 데이터가 아직 적으면 현재가 중심으로 간단히 표시됩니다. 목표가 알림과 함께 보시면 더 정확합니다.
                        </p>
                    </div>

                    {/* AI Insights */}
                    <div className="border-t border-gray-100 pt-6">
                        <FutureValueInsight product={activeProduct} />
                    </div>

                    {/* Community Reviews */}
                    <ProductReviews productId={activeProduct.id} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
