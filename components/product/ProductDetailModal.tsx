'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { buildProductDetailHref } from '@/lib/api/productSnapshot';
import FutureValueInsight from './FutureValueInsight';
import ProductReviews from './ProductReviews'; // Phase 38 Component
import RichShare from '@/components/shared/RichShare'; // Phase 39 Component
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';

interface ProductDetailModalProps {
    product: UnifiedProduct | null;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
    if (!product) return null;
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

                    {/* AI Insights - Graph & Report */}
                    <div className="border-t border-gray-100 pt-6">
                        <FutureValueInsight product={product} />
                    </div>

                    {/* Community Reviews (Phase 38) */}
                    <ProductReviews />
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
