'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/types';

interface RecentlyViewedSectionProps {
    products: UnifiedProduct[];
    onProductClick: (product: UnifiedProduct) => void;
    onClear: () => void;
}

export default function RecentlyViewedSection({ products, onProductClick, onClear }: RecentlyViewedSectionProps) {
    if (products.length === 0) return null;

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span>최근 본 상품</span>
                    <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {products.length}
                    </span>
                </h2>
                <button
                    onClick={onClear}
                    className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
                >
                    전체 삭제
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-thin scrollbar-thumb-slate-200">
                {products.map((product, i) => (
                    <motion.button
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onProductClick(product)}
                        className="flex-shrink-0 w-28 group text-left"
                    >
                        {/* 이미지 */}
                        <div className="w-28 h-36 rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            <div className="absolute bottom-1 left-1">
                                <span className="text-[9px] bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-full font-semibold text-slate-700">
                                    {product.mallName}
                                </span>
                            </div>
                        </div>
                        {/* 텍스트 */}
                        <p className="text-xs text-slate-700 font-medium line-clamp-2 leading-snug mb-1 group-hover:text-accent-dark transition-colors">
                            {product.title}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                            {product.price.toLocaleString()}원
                        </p>
                    </motion.button>
                ))}
            </div>
        </section>
    );
}
