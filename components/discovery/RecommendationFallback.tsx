'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '../../types/product';
import { Stylist } from '../../lib/ai/stylist';
import { EditorialCard } from '../product/EditorialCard';
import { motion } from 'framer-motion';

interface RecommendationFallbackProps {
    allProducts: Product[]; // Fallback pool
}

export const RecommendationFallback: React.FC<RecommendationFallbackProps> = ({ allProducts }) => {
    const [recommended, setRecommended] = useState<Product[]>([]);

    useEffect(() => {
        // 클라이언트 사이드에서 스타일리스트 로직 실행
        const curated = Stylist.recommend(allProducts).slice(0, 3);
        setRecommended(curated);
    }, [allProducts]);

    if (recommended.length === 0) return null;

    return (
        <div className="w-full max-w-4xl mx-auto mt-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-gray-700 flex-1" />
                <span className="text-gray-400 text-sm font-medium uppercase tracking-widest">
                    Curated for your style
                </span>
                <div className="h-px bg-gray-700 flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {recommended.map((product, index) => (
                    <motion.div
                        key={product.productId || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <EditorialCard product={product} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
