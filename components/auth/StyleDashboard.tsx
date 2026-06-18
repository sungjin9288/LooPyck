'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { dedupeFavoritesForInsights } from '@/lib/favorites/favoriteProduct';
import { scoreStyleAxes } from '@/lib/personalization/styleTaxonomy';

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-5 py-8 text-center">
            <p className="text-sm font-bold text-gray-700">아직 스타일 DNA가 없어요</p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
                마음에 드는 상품을 찜하면 찜 목록을 분석해 당신의 스타일 DNA를 만들어 드려요.
            </p>
        </div>
    );
}

export default function StyleDashboard() {
    const { favorites, loading } = useCloudStorage();
    const uniqueFavorites = useMemo(() => dedupeFavoritesForInsights(favorites), [favorites]);

    const styleDNA = useMemo(() => scoreStyleAxes(uniqueFavorites), [uniqueFavorites]);

    const hasData = styleDNA.length > 0;
    const topTwo = styleDNA.slice(0, 2).map(d => d.label);
    const lowConfidence = hasData && uniqueFavorites.length < 3;

    return (
        <div className="w-full bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            My Style DNA
                            {lowConfidence && (
                                <span className="normal-case font-normal text-gray-300"> (찜이 늘수록 정확해져요)</span>
                            )}
                        </h2>
                        {hasData ? (
                            <h1 className="text-2xl font-serif font-medium text-black">
                                {topTwo[0]}
                                {topTwo[1] && (
                                    <>
                                        {' '}
                                        <span className="text-gray-400 italic">&</span>{' '}
                                        {topTwo[1]}
                                    </>
                                )}
                            </h1>
                        ) : (
                            <h1 className="text-2xl font-serif font-medium text-gray-400">
                                Your Style, Decoded
                            </h1>
                        )}
                    </motion.div>

                    <motion.button
                        variants={InteractionNarrative.elasticBounce}
                        whileHover="hover"
                        whileTap="tap"
                        className="text-sm text-gray-500 hover:text-black underline underline-offset-4"
                    >
                        View Full Report
                    </motion.button>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-20 h-3 bg-slate-200 rounded" />
                                <div className="flex-1 h-3 bg-slate-100 rounded-full" />
                                <div className="w-8 h-3 bg-slate-200 rounded" />
                            </div>
                        ))}
                    </div>
                ) : !hasData ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-4">
                        {styleDNA.map((item, index) => (
                            <div key={item.label} className="group flex items-center gap-4">
                                <span className="w-20 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                                    {item.label}
                                </span>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                                    <motion.div
                                        className={`h-full ${item.color}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.value}%` }}
                                        transition={{ duration: 1.5, delay: index * 0.15, ease: 'easeOut' }}
                                    />
                                </div>
                                <span className="w-8 text-xs font-medium text-gray-900">
                                    {item.value}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
