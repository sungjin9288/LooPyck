'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { dedupeFavoritesForInsights } from '@/lib/favorites/favoriteProduct';
import { getDominantPersona } from '@/lib/personalization/styleTaxonomy';

interface StyleProfileCardProps {
    favorites: Product[];
}

function getPriceProfile(favorites: Product[]): { label: string; avg: number } {
    const prices = favorites.map(f => parseInt(f.lprice, 10)).filter(p => p > 0);
    if (prices.length === 0) return { label: '알 수 없음', avg: 0 };
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (avg < 30_000) return { label: '가성비 쇼퍼', avg };
    if (avg < 100_000) return { label: '밸런스 쇼퍼', avg };
    return { label: '프리미엄 쇼퍼', avg };
}

function getTopBrands(favorites: Product[]): string[] {
    const count: Record<string, number> = {};
    for (const f of favorites) {
        const brand = f.brand?.trim();
        if (brand) count[brand] = (count[brand] ?? 0) + 1;
    }
    return Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([brand]) => brand);
}

export function StyleProfileCard({ favorites }: StyleProfileCardProps) {
    const uniqueFavorites = dedupeFavoritesForInsights(favorites);
    if (uniqueFavorites.length < 3) return null;

    const persona = getDominantPersona(uniqueFavorites);
    const priceProfile = getPriceProfile(uniqueFavorites);
    const topBrands = getTopBrands(uniqueFavorites);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm"
        >
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${persona.gradient} px-5 py-4 text-white`}>
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{persona.icon}</span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-0.5">내 스타일 페르소나</p>
                        <h3 className="text-xl font-black">{persona.label}</h3>
                    </div>
                </div>
                <p className="text-xs opacity-75 mt-2 leading-relaxed">{persona.description}</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 px-1 py-3">
                {/* Total Favorites */}
                <div className="text-center px-3">
                    <p className="text-2xl font-black text-slate-900">{uniqueFavorites.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-semibold">찜 상품</p>
                </div>

                {/* Price Profile */}
                <div className="text-center px-3">
                    <p className="text-xs font-bold text-slate-700 leading-tight">
                        {priceProfile.label}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                        평균 {priceProfile.avg > 0 ? `${Math.round(priceProfile.avg / 1000)}K` : '-'}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">가격대</p>
                </div>

                {/* Top Brands */}
                <div className="text-center px-3">
                    {topBrands.length > 0 ? (
                        <>
                            <p className="text-xs font-bold text-slate-700 leading-tight line-clamp-2">
                                {topBrands[0]}
                            </p>
                            {topBrands[1] && (
                                <p className="text-[10px] text-slate-400">{topBrands[1]}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-xs text-slate-400">—</p>
                    )}
                    <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">최애 브랜드</p>
                </div>
            </div>
        </motion.div>
    );
}
