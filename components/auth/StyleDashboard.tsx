'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Product } from '@/types/product';
import { dedupeFavoritesForInsights } from '@/lib/favorites/favoriteProduct';

const DNA_CONFIG: { label: string; color: string; keywords: string[] }[] = [
    { label: 'Minimal',  color: 'bg-stone-800',  keywords: ['uniqlo', '유니클로', 'cos ', 'muji', '무신사 스탠다드', '무지', 'lemaire'] },
    { label: 'Street',   color: 'bg-blue-600',   keywords: ['supreme', 'stussy', 'carhartt', 'palace', 'kith', '스투시', '카하트', '슈프림', 'vans', 'new era'] },
    { label: 'Vintage',  color: 'bg-amber-700',  keywords: ['vintage', '빈티지', "levi's", '리바이스', '리바이', 'wrangler', '복고', 'retro'] },
    { label: 'Sporty',   color: 'bg-green-600',  keywords: ['nike', 'adidas', 'new balance', '뉴발란스', 'jordan', 'salomon', 'hoka', '아디다스', '나이키'] },
    { label: 'Luxury',   color: 'bg-purple-700', keywords: ['moncler', 'stone island', 'arc\'teryx', 'arcteryx', 'human made', '아더에러', 'ader error'] },
];

function scoreFavorites(favorites: Product[]): { label: string; value: number; color: string }[] {
    const raw: Record<string, number> = {};
    for (const fav of favorites) {
        const haystack = [fav.brand, fav.title, fav.category1].join(' ').toLowerCase();
        for (const dna of DNA_CONFIG) {
            if (dna.keywords.some(kw => haystack.includes(kw))) {
                raw[dna.label] = (raw[dna.label] ?? 0) + 1;
            }
        }
    }
    const maxRaw = Math.max(1, ...Object.values(raw));
    return DNA_CONFIG.map(d => ({
        label: d.label,
        value: Math.round(((raw[d.label] ?? 0) / maxRaw) * 90 + (raw[d.label] ? 10 : 5)),
        color: d.color,
    })).sort((a, b) => b.value - a.value);
}

const FALLBACK_DNA = [
    { label: 'Minimal', value: 75, color: 'bg-stone-800' },
    { label: 'Street',  value: 45, color: 'bg-blue-600' },
    { label: 'Vintage', value: 30, color: 'bg-amber-700' },
    { label: 'Sporty',  value: 20, color: 'bg-green-600' },
    { label: 'Luxury',  value: 10, color: 'bg-purple-700' },
];

export default function StyleDashboard() {
    const { favorites, loading } = useCloudStorage();
    const uniqueFavorites = useMemo(() => dedupeFavoritesForInsights(favorites), [favorites]);

    const styleDNA = useMemo(() => {
        if (uniqueFavorites.length === 0) return FALLBACK_DNA;
        return scoreFavorites(uniqueFavorites);
    }, [uniqueFavorites]);

    const topTwo = styleDNA.slice(0, 2).map(d => d.label);
    const headline = topTwo.length >= 2
        ? `${topTwo[0]} & ${topTwo[1]}`
        : topTwo[0] ?? 'Contemporary';

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
                            My Style DNA {favorites.length === 0 && <span className="normal-case font-normal text-gray-300">(찜 상품 기반)</span>}
                        </h2>
                        <h1 className="text-2xl font-serif font-medium text-black">
                            {topTwo[0] ?? 'Minimalist'}{' '}
                            <span className="text-gray-400 italic">&</span>{' '}
                            {topTwo[1] ?? 'Contemporary'}
                        </h1>
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

                {/* DNA Bars */}
                {loading ? (
                    <div className="space-y-4">
                        {[1,2,3,4].map(i => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-20 h-3 bg-slate-200 rounded" />
                                <div className="flex-1 h-3 bg-slate-100 rounded-full" />
                                <div className="w-8 h-3 bg-slate-200 rounded" />
                            </div>
                        ))}
                    </div>
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
