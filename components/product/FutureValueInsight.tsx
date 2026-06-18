'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import InvestmentReport from './InvestmentReport';
import { designTokens } from '@/styles/designTokens';

interface FutureValueInsightProps {
    product: UnifiedProduct;
}

interface ReasoningItem {
    factor: string;
    score: number;
    note: string;
}

interface AIAnalysisResult {
    insight: {
        score: number;
        ratingEN: string;
        advice: string;
        reason: string;
        reasoning?: ReasoningItem[];
    };
    trend: {
        score: number;
        label: string;
        keywords: string[];
    };
}

export default function FutureValueInsight({ product }: FutureValueInsightProps) {
    const [result, setResult] = useState<AIAnalysisResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showReasoning, setShowReasoning] = useState(false);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setLoading(true);
            setError(false);
            try {
                const res = await fetch('/api/ai-insight', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: product.title,
                        price: product.price,
                        brand: product.brand,
                        category: product.category1 || '패션',
                        // identity lets the server ground the price judgment in real history
                        source: product.source,
                        productId: product.id,
                    })
                });

                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                setResult(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalysis();
    }, [product.title, product.price, product.brand, product.category1]);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl w-full mx-auto my-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-6"></div>
                <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
            </div>
        );
    }

    if (error || !result) {
        return null; // 분석 실패 시 조용히 숨김 (결제 핵심 흐름 방해 방지)
    }

    const { insight, trend } = result;

    const trendColor = insight.ratingEN.includes('BUY') ? designTokens.colors.success :
        insight.ratingEN === 'WAIT' ? designTokens.colors.error :
            designTokens.colors.textSecondary;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-2xl w-full mx-auto my-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-1">
                        LooPyck AI 구매 인사이트
                    </h3>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span className="line-clamp-1">{product.title}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium flex-shrink-0">
                            {trend.label} ({trend.score}pt)
                        </span>
                    </h2>
                    {trend.keywords.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                            {trend.keywords.map(kw => (
                                <span key={kw} className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 border border-slate-100 rounded-md">
                                    #{kw}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500">구매 의견</div>
                    <div className="text-sm font-bold mt-1" style={{ color: trendColor }}>
                        {insight.advice}
                    </div>
                </div>
            </div>

            <InvestmentReport
                score={insight.score}
                reason={insight.reason}
            />

            {/* Reasoning Breakdown */}
            {insight.reasoning && insight.reasoning.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowReasoning(v => !v)}
                        className="flex items-center gap-1.5 text-xs text-violet-600 font-semibold hover:text-violet-700 transition-colors"
                    >
                        <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${showReasoning ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        {showReasoning ? 'AI 분석 근거 접기' : 'AI 분석 근거 보기'}
                    </button>

                    <AnimatePresence>
                        {showReasoning && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-3 space-y-3 pt-3 border-t border-slate-100">
                                    {insight.reasoning.map((item, i) => (
                                        <motion.div
                                            key={item.factor}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-semibold text-slate-700">{item.factor}</span>
                                                <span className="text-xs font-bold text-violet-600">{item.score}pt</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                                                <motion.div
                                                    className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${item.score}%` }}
                                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500">{item.note}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                <span>AI 분석은 참고용입니다.</span>
                <span>실제 최저가와 함께 판단하세요.</span>
            </div>
        </div>
    );
}
