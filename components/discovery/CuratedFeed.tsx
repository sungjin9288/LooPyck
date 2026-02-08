import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types/product';
import { EditorialCard } from '../../components/product/EditorialCard';
import { MOTION_VARIANTS } from '../../lib/ux/motionPath';

interface CuratedFeedProps {
    products: Product[];
    title: string;
    subtitle?: string;
    loading?: boolean;
}

export const CuratedFeed: React.FC<CuratedFeedProps> = ({ products, title, subtitle, loading = false }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-6">
                {Array(8).fill(null).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-800 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-20 text-gray-500">
                <p>No curated items found.</p>
            </div>
        );
    }

    return (
        <section className="bg-background min-h-screen p-4 md:p-8">
            <motion.div
                className="max-w-7xl mx-auto"
                initial="hidden"
                animate="visible"
                variants={MOTION_VARIANTS.staggerContainer}
            >
                {/* Editorial Header */}
                <motion.div
                    className="mb-12 text-center md:text-left"
                    variants={MOTION_VARIANTS.fadeInUp}
                >
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-gray-400 max-w-2xl font-light">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px] md:auto-rows-[400px]">
                    {products.map((product, index) => {
                        // Dynamic Application of Span Classes for Bento Effect
                        // First item is Hero (2x2)
                        // Every 7th item is Wide (2x1)
                        const isHero = index === 0;
                        const isWide = index > 0 && index % 7 === 0;
                        const isTall = index > 0 && index % 5 === 0;

                        let spanClass = '';
                        if (isHero) spanClass = 'md:col-span-2 md:row-span-2';
                        else if (isWide) spanClass = 'md:col-span-2';
                        else if (isTall) spanClass = 'md:row-span-2';

                        return (
                            <motion.div
                                key={product.productId}
                                variants={MOTION_VARIANTS.fadeInUp}
                                className={spanClass}
                            >
                                <EditorialCard
                                    product={product}
                                    priority={index < 4}
                                    className="h-full w-full"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
};
