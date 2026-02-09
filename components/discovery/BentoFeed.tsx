'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types/product';
import { EditorialCard } from '../product/EditorialCard';

interface BentoFeedProps {
    products: Product[];
}

// Helper to determine span size based on index or metadata (Mock "Trend Score")
const getSpanClass = (index: number, price: number) => {
    // Logic: Every 5th item or expensive items (Trendsetters) get 2x2 span
    if (index % 5 === 0 || price > 300000) {
        return 'md:col-span-2 md:row-span-2';
    }
    return 'col-span-1 row-span-1';
};

export const BentoFeed: React.FC<BentoFeedProps> = ({ products }) => {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">
                Trending Now
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[300px] gap-4">
                {products.map((product, index) => {
                    // Safe integer parsing
                    const price = parseInt(product.lprice.replace(/,/g, ''), 10) || 0;
                    const spanClass = getSpanClass(index, price);

                    return (
                        <motion.div
                            key={product.productId || index}
                            className={`relative group ${spanClass}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                            <EditorialCard
                                product={product}
                                className="w-full h-full"
                                // Pass priority to large items for LCP
                                priority={spanClass.includes('col-span-2')}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
