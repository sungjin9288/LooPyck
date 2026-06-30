'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';

interface RecommendedSectionProps {
    products: UnifiedProduct[];
    onProductClick: (product: UnifiedProduct) => void;
}

export default function RecommendedSection({ products, onProductClick }: RecommendedSectionProps) {
    if (products.length === 0) return null;

    // Ensure we only show up to 3 items
    const topPicks = products.slice(0, 3);

    return (
        <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-1 bg-black"></div>
                <h2 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
                    Editor's Choice
                </h2>
                <span className="text-xs font-sans font-medium px-2 py-1 bg-yellow-400 text-black rounded-full">
                    Best Match
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topPicks.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="group relative cursor-pointer"
                        onClick={() => onProductClick(product)}
                    >
                        {/* Card Container */}
                        <div className="aspect-[4/5] overflow-hidden rounded-md mb-4 bg-gray-100 relative">
                            {/* Editor's Pick Badge for the first item */}
                            {index === 0 && (
                                <div className="absolute top-4 left-4 z-10 bg-black text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                                    Top Pick
                                </div>
                            )}
                            {/* Rank Badge */}
                            <div className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                                {index + 1}
                            </div>

                            <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />

                            {/* Quick View Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center pb-8 bg-gradient-to-t from-black/50 to-transparent">
                                <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="space-y-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                {product.brand || product.mallName}
                            </p>
                            <h3 className="font-serif text-lg leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-4">
                                {product.title}
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                                <p className="font-medium text-lg">
                                    {product.price.toLocaleString()}원
                                </p>
                                <span className="text-xs text-gray-400 font-sans">
                                    {product.mallName}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200 my-12" />
        </section>
    );
}
