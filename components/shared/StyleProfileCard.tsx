'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '@/types/product';
import { dedupeFavoritesForInsights } from '@/lib/favorites/favoriteProduct';

interface StyleProfileCardProps {
    favorites: Product[];
}

interface StylePersona {
    label: string;
    icon: string;
    description: string;
    gradient: string;
}

const STREET_BRANDS = ['nike', 'adidas', 'jordan', 'supreme', 'stussy', 'kith', 'palace', 'carhartt', 'new era', 'vans', 'new balance'];
const GORPCORE_BRANDS = ['arc\'teryx', 'arcteryx', 'salomon', 'north face', 'patagonia', 'mammut', 'columbia', 'hoka', 'merrell'];
const OLD_MONEY_BRANDS = ['polo', 'lacoste', 'moncler', 'stone island', 'loro piana', 'brunello', 'cos '];
const MINIMAL_BRANDS = ['uniqlo', 'cos', '무신사 스탠다드', 'lemaire', 'a.p.c', 'apc', 'toteme', 'theory'];

function detectPersona(favorites: Product[]): StylePersona {
    if (favorites.length === 0) {
        return { label: '패션 탐험가', icon: '🌟', description: '나만의 스타일을 찾아가는 중', gradient: 'from-slate-400 to-slate-600' };
    }

    const combined = favorites.map(f => `${f.brand} ${f.title}`.toLowerCase());
    const score = { street: 0, gorpcore: 0, oldmoney: 0, minimal: 0 };

    for (const text of combined) {
        if (STREET_BRANDS.some(b => text.includes(b))) score.street++;
        if (GORPCORE_BRANDS.some(b => text.includes(b))) score.gorpcore++;
        if (OLD_MONEY_BRANDS.some(b => text.includes(b))) score.oldmoney++;
        if (MINIMAL_BRANDS.some(b => text.includes(b))) score.minimal++;
    }

    const maxKey = (Object.keys(score) as (keyof typeof score)[]).reduce((a, b) => score[a] >= score[b] ? a : b);
    const maxScore = score[maxKey];

    if (maxScore === 0) return { label: '패션 탐험가', icon: '🌟', description: '다양한 스타일을 자유롭게 탐구하는 개성파', gradient: 'from-purple-500 to-pink-500' };

    const PERSONAS: Record<keyof typeof score, StylePersona> = {
        street: { label: '스트릿 키드', icon: '🔥', description: '힙한 스트릿 컬처와 스니커즈 문화를 즐기는 스타일', gradient: 'from-orange-500 to-red-500' },
        gorpcore: { label: '고프코어 마니아', icon: '🏔️', description: '기능성과 패션을 동시에 추구하는 아웃도어 감성', gradient: 'from-green-500 to-teal-600' },
        oldmoney: { label: '올드머니 클래식', icon: '🎩', description: '절제된 럭셔리와 타임리스 엘레강스를 추구', gradient: 'from-amber-600 to-yellow-700' },
        minimal: { label: '미니멀리스트', icon: '⬜', description: '군더더기 없는 깔끔함과 기본에 충실한 스타일', gradient: 'from-slate-500 to-slate-700' },
    };

    return PERSONAS[maxKey];
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

    const persona = detectPersona(uniqueFavorites);
    const priceProfile = getPriceProfile(uniqueFavorites);
    const topBrands = getTopBrands(uniqueFavorites);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
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
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700 px-1 py-3">
                {/* Total Favorites */}
                <div className="text-center px-3">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{uniqueFavorites.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-semibold">찜 상품</p>
                </div>

                {/* Price Profile */}
                <div className="text-center px-3">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
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
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight line-clamp-2">
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
