'use client';

import { designTokens } from '@/styles/designTokens';
import { Product } from '@/types/product';
import { parsePrice } from '@/lib/api';
import { getPercentile } from '@/utils/priceAnalysis';
import { useMemo, useState, useEffect } from 'react';

interface PriceInsightProps {
    product: Product;
    relatedProducts?: Product[]; // For calculating relative position
}

export default function PriceInsight({ product, relatedProducts = [] }: PriceInsightProps) {
    const currentPrice = parsePrice(product.lprice);

    // Extract all prices for comparison, ensuring current product is included
    const allPrices = useMemo(() => {
        const prices = relatedProducts.map(p => parsePrice(p.lprice));
        if (!prices.includes(currentPrice)) {
            prices.push(currentPrice);
        }
        return prices;
    }, [relatedProducts, currentPrice]);

    const percentile = getPercentile(currentPrice, allPrices);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const avgPrice = Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const position = allPrices.length > 1
        ? ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100
        : 50;

    const avgPosition = allPrices.length <= 1 ? 50 : ((avgPrice - minPrice) / (maxPrice - minPrice)) * 100;

    return (
        <div className="w-full mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>최저 {minPrice.toLocaleString()}</span>
                <span>최고 {maxPrice.toLocaleString()}</span>
            </div>

            <div className="relative h-2 bg-gray-200 rounded-full overflow-visible">
                {/* Background Gradient Line */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 opacity-50" />

                {/* Average Marker (Line) */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-0 transition-all duration-700 ease-out"
                    style={{ left: mounted ? `${avgPosition}%` : '0%' }}
                    aria-label={`평균 가격: ${avgPrice.toLocaleString()}원`}
                />

                {/* Current Price Marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[color:var(--color-accent)] rounded-full shadow-md transition-all duration-1000 ease-out z-10"
                    style={{
                        left: mounted ? `calc(${position}% - 8px)` : '0%',
                        borderColor: designTokens.colors.primary
                    }}
                    aria-label={`현재 가격 위치: 상위 ${Math.round(100 - percentile)}%`}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                        Current
                    </div>
                </div>
            </div>

            <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-gray-400">평균 {avgPrice.toLocaleString()}</span>
                <span className="text-xs font-medium text-gray-700">
                    위치: <span className="text-[color:var(--color-primary)]" style={{ color: designTokens.colors.primary }}>{Math.round(percentile)}%</span>
                </span>
            </div>
        </div>
    );
}
