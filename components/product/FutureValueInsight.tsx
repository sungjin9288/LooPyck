'use client';

import React, { useMemo } from 'react';
import { forecastPrice } from '@/lib/ai/priceForecaster';
import { analyzeTrend } from '@/lib/ai/trendScoring';
import { designTokens } from '@/styles/designTokens';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import PriceHistoryChart from './PriceHistoryChart';
import InvestmentReport from './InvestmentReport';

interface FutureValueInsightProps {
    product: UnifiedProduct;
}

export default function FutureValueInsight({ product }: FutureValueInsightProps) {
    // AI Analysis (Client-side simulation for demo)
    const forecast = useMemo(() => forecastPrice(product.price), [product.price]);
    const trend = useMemo(() => analyzeTrend(product.title), [product.title]);

    // Chart Data Preparation
    const chartData = [
        ...forecast.predictedPrices.map(p => ({
            label: p.date.slice(5), // MM-DD
            value: p.price,
            date: p.date.slice(5),
            price: p.price,
            type: 'Prediction'
        }))
    ];

    // Colors based on trend
    const trendColor = forecast.trend === 'DOWN' ? designTokens.colors.success : // Price Drop is Good for Buyer
        forecast.trend === 'UP' ? designTokens.colors.error :
            designTokens.colors.textSecondary;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-2xl w-full mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">
                        LooPyck AI Intelligence
                    </h3>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {product.title}
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {trend.label} ({trend.score}pt)
                        </span>
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">AI 권장 액션</div>
                    <div className={`text-lg font-bold`} style={{ color: trendColor }}>
                        {forecast.advice}
                    </div>
                </div>
            </div>

            {/* Insight Report */}
            <InvestmentReport
                score={Math.round(forecast.confidence * 100)}
                reason={forecast.reason}
            />

            {/* Price Chart (Replaces old DataVisualizer) */}
            <div className="mt-6">
                <PriceHistoryChart currentPrice={product.price} />
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span>Powered by Prophet-Engine</span>
                <span>Edge Region: {process.env.NEXT_PUBLIC_VERCEL_REGION || 'icn1'}</span>
            </div>
        </div>
    );
}
