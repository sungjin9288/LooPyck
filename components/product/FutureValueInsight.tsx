'use client';

import React, { useMemo } from 'react';
import { forecastPrice } from '@/lib/ai/priceForecaster';
import { analyzeTrend } from '@/lib/ai/trendScoring';
import { designTokens } from '@/styles/designTokens';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import InvestmentReport from './InvestmentReport';

interface FutureValueInsightProps {
    product: UnifiedProduct;
}

export default function FutureValueInsight({ product }: FutureValueInsightProps) {
    const forecast = useMemo(() => forecastPrice(product.price), [product.price]);
    const trend = useMemo(() => analyzeTrend(product.title), [product.title]);

    const trendColor = forecast.trend === 'DOWN' ? designTokens.colors.success :
        forecast.trend === 'UP' ? designTokens.colors.error :
            designTokens.colors.textSecondary;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl w-full mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">
                        LooPyck AI 분석
                    </h3>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span className="line-clamp-1">{product.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium flex-shrink-0">
                            {trend.label} ({trend.score}pt)
                        </span>
                    </h2>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500">AI 권장 액션</div>
                    <div className="text-lg font-bold" style={{ color: trendColor }}>
                        {forecast.advice}
                    </div>
                </div>
            </div>

            {/* Report */}
            <InvestmentReport
                score={Math.round(forecast.confidence * 100)}
                reason={forecast.reason}
            />

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>Powered by AI Engine</span>
                <span>Region: {process.env.NEXT_PUBLIC_VERCEL_REGION || 'icn1'}</span>
            </div>
        </div>
    );
}
