import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Product } from '../../types/product';
import { designTokens } from '../../styles/designTokens';
import { MOTION_VARIANTS } from '../../lib/ux/motionPath';

interface EditorialCardProps {
    product: Product;
    priority?: boolean; // For LCP optimization
    className?: string;
}

export const EditorialCard: React.FC<EditorialCardProps> = ({ product, priority = false, className = '' }) => {
    // Price formatting
    const price = parseInt(product.lprice, 10);
    const formattedPrice = isNaN(price) ? product.lprice : price.toLocaleString();

    return (
        <motion.div
            className={`relative group overflow-hidden rounded-xl bg-gray-900 cursor-pointer ${className}`}
            variants={MOTION_VARIANTS.scaleOnHover}
            initial="initial"
            whileHover="hover"
            layoutId={`product-${product.productId}`}
        >
            {/* Immersive Image Background */}
            <div className="aspect-[3/4] w-full relative">
                <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            </div>

            {/* Editorial Content Overlay (Glassmorphism) */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end h-full">
                <motion.div
                    initial={{ y: 20, opacity: 0.9 }}
                    whileHover={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="mb-2">
                        <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                            {product.brand || product.mallName}
                        </span>
                    </div>

                    {/* HTML tags cleanup for title if needed, utilizing a dangerousSetInnerHTML or a utility if title has tags */}
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight line-clamp-2"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                        dangerouslySetInnerHTML={{ __html: product.title }}
                    />

                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-lg font-semibold text-white">
                            {formattedPrice}원
                        </span>
                    </div>

                    {/* AI Insights Reveal on Hover */}
                    <div className="overflow-hidden h-0 group-hover:h-auto transition-all duration-500 ease-in-out">
                        <div className="pt-3 border-t border-white/20 flex gap-2 flex-wrap">
                            {/* Mock AI Tags for Visual Demo */}
                            <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs text-gray-200 border border-white/10">
                                ✨ Trending
                            </span>
                            {product.category1 && (
                                <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-xs text-gray-200 border border-white/10">
                                    {product.category1}
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Floating Action Button (Quick View) */}
            <motion.button
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileTap={{ scale: 0.9 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </motion.button>
        </motion.div>
    );
};
