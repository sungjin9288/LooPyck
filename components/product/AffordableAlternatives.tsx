'use client';

import React from 'react';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';

interface AffordableAlternativesProps {
    baseProduct: UnifiedProduct;
}

export default function AffordableAlternatives({ baseProduct }: AffordableAlternativesProps) {
    // In a real implementation, this would fetch from an AI recommendation endpoint
    // We mock alternatives based on the base product for demonstration.
    const mockAlternatives = Array.from({ length: 3 }).map((_, i) => ({
        id: `alt-${baseProduct.id}-${i}`,
        title: `[대체재] ${baseProduct.title.substring(0, 15)}... 스타일 가성비 모델`,
        price: Math.floor(baseProduct.price * (0.4 + i * 0.1)),
        image: baseProduct.image, // Placeholder using same image
        mallName: i % 2 === 0 ? '무신사' : '29CM',
        link: '#'
    }));

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        💡 가성비 대체 상품 제안
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                        비슷한 실루엣의 더 저렴한 상품들을 찾아봤어요.
                    </p>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 snap-x hide-scroll">
                {mockAlternatives.map((alt) => (
                    <a
                        key={alt.id}
                        href={alt.link}
                        className="min-w-[140px] max-w-[160px] snap-start shrink-0 group block"
                        onClick={(e) => e.preventDefault()}
                    >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={alt.image}
                                alt={alt.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 grayscale-[0.2]"
                            />
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {((1 - alt.price / baseProduct.price) * 100).toFixed(0)}% 더 저렴
                            </div>
                        </div>
                        <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                            {alt.title}
                        </h4>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                {alt.mallName}
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {alt.price.toLocaleString()}원
                            </span>
                        </div>
                    </a>
                ))}
            </div>

            <style jsx>{`
                .hide-scroll::-webkit-scrollbar {
                    display: none;
                }
                .hide-scroll {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
            `}</style>
        </div>
    );
}
