'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { buildProductDetailHref } from '@/lib/api/productSnapshot';
import FutureValueInsight from './FutureValueInsight';
import ProductReviews from './ProductReviews';
import RichShare from '@/components/shared/RichShare';
import PriceHistoryChart from './PriceHistoryChart';
import CouponBadge from './CouponBadge';
import SizeFitGuide from './SizeFitGuide';
import AffordableAlternatives from './AffordableAlternatives';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';

interface ProductDetailModalProps {
    product: UnifiedProduct | null;
    onClose: () => void;
    variants?: UnifiedProduct[]; // 동일 상품의 다른 쇼핑몰 목록
}

export default function ProductDetailModal({ product, onClose, variants = [] }: ProductDetailModalProps) {
    if (!product) return null;
    // variants가 없으면 현재 상품만 비교 대상으로
    const allVariants = variants.length > 0 ? variants : [product];
    const lowestPrice = Math.min(...allVariants.map(v => v.price));
    const safeStoreUrl = sanitizeExternalUrl(product.link);

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
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                {product.mallName}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">
                                {product.title}
                            </h2>
                            <div className="text-3xl font-bold text-black mb-6">
                                {product.price.toLocaleString()}원
                            </div>

                            {safeStoreUrl ? (
                                <a
                                    href={safeStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-4 bg-black text-white text-center font-bold rounded-xl hover:bg-gray-800 transition-all mb-4"
                                >
                                    Buy Now
                                </a>
                            ) : (
                                <div className="block w-full py-4 bg-gray-200 text-gray-600 text-center font-bold rounded-xl cursor-not-allowed mb-4">
                                    Store Link Unavailable
                                </div>
                            )}

                            <a
                                href={buildProductDetailHref(product)}
                                className="block w-full py-3 border border-gray-300 text-gray-800 text-center font-semibold rounded-xl hover:bg-gray-50 transition-all mb-4"
                            >
                                View Detail
                            </a>

                            {/* Phase 39: Rich Share Stock Card */}
                            <div className="flex w-full">
                                <RichShare
                                    productTitle={product.title}
                                    productImage={product.image}
                                    currentPrice={product.price}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 쇼핑몰별 가격 비교 테이블 */}
                    {allVariants.length > 1 && (
                        <div className="border-t border-slate-100 pt-6 mb-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                🏷️ 쇼핑몰별 가격 비교
                            </h3>
                            <div className="space-y-2">
                                {allVariants.map((v) => {
                                    const safeVariantLink = sanitizeExternalUrl(v.link);
                                    return (
                                        <div key={v.id} className={`flex items-center justify-between p-3 rounded-xl border ${v.price === lowestPrice
                                            ? 'border-accent-light bg-accent/5'
                                            : 'border-slate-100 bg-slate-50'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                {v.price === lowestPrice && (
                                                    <span className="text-[10px] font-bold bg-accent text-white px-1.5 py-0.5 rounded-full">최저가</span>
                                                )}
                                                <span className="text-sm font-medium text-slate-700">{v.mallName}</span>
                                                <CouponBadge mallName={v.mallName} source={v.source} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-sm font-bold ${v.price === lowestPrice ? 'text-accent-dark' : 'text-slate-700'}`}>
                                                    {v.price.toLocaleString()}원
                                                </span>
                                                {safeVariantLink ? (
                                                    <a
                                                        href={safeVariantLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={e => e.stopPropagation()}
                                                        className="text-xs px-2 py-1 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
                                                    >
                                                        이동
                                                    </a>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 bg-slate-200 text-slate-500 rounded-lg">
                                                        링크 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Size and Fit Guide (Phase 40) */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <SizeFitGuide productName={product.title} />
                    </div>

                    {/* Affordable Alternatives (Phase 40) */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <AffordableAlternatives baseProduct={product} />
                    </div>

                    {/* Price History Chart */}
                    <div className="border-t border-slate-100 pt-6 mb-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                            📈 가격 변동 추정
                        </h3>
                        <PriceHistoryChart
                            source={product.source}
                            productId={product.id}
                            currentPrice={product.price}
                        />
                        <p className="text-xs text-slate-400 text-center mt-2">
                            💡 현재는 실시간 가격 이력 DB가 아닌 추정 그래프입니다. 목표가 알림을 함께 설정해두세요.
                        </p>
                    </div>

                    {/* AI Insights */}
                    <div className="border-t border-gray-100 pt-6">
                        <FutureValueInsight product={product} />
                    </div>

                    {/* Community Reviews */}
                    <ProductReviews productId={product.id} />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
