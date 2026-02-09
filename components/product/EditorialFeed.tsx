'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';

interface EditorialFeedProps {
    products: UnifiedProduct[];
}

export default function EditorialFeed({ products }: EditorialFeedProps) {
    if (!products || products.length === 0) return null;

    // Helper to determine grid span based on index/pattern
    // 29CM Style: Mix of full-width, half-width, and tall items
    const getGridClass = (index: number) => {
        const pattern = index % 10;
        if (pattern === 0) return "col-span-2 row-span-2"; // Big Feature
        if (pattern === 3) return "col-span-1 row-span-2"; // Tall
        if (pattern === 6) return "col-span-2"; // Wide
        return "col-span-1";
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12">
            <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 auto-rows-[300px]"
                variants={InteractionNarrative.staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {products.map((product, index) => (
                    <motion.div
                        key={product.id}
                        className={`relative group overflow-hidden rounded-xl bg-gray-50 ${getGridClass(index)}`}
                        variants={InteractionNarrative.parallaxReveal}
                        custom={index % 5} // Stagger delay
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

                        {/* Overlay Gradient (Musinsa/29CM Style) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Content Layer (Parallax Reveal) */}
                        <div className="absolute bottom-0 left-0 p-6 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                            <span className="text-xs font-bold tracking-widest uppercase mb-2 block text-yellow-400">
                                {product.mallName}
                            </span>
                            <h3 className="text-lg font-serif leading-tight mb-1 line-clamp-2">
                                {product.title}
                            </h3>
                            <p className="text-sm font-medium opacity-90">
                                {product.price.toLocaleString()}원
                            </p>
                        </div>

                        {/* Editor's Badge (Randomly applied for demo) */}
                        {index % 7 === 0 && (
                            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                                Editor's Pick
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {/* End of Feed Brand Statement */}
            <div className="text-center py-20">
                <p className="text-sm text-gray-400 tracking-[0.2em] uppercase font-light">
                    Curated by LooPyck AI
                </p>
            </div>
        </div>
    );
}
