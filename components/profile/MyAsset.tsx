'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Product } from '@/types/product';
import { dedupeFavoritesForInsights } from '@/lib/favorites/favoriteProduct';

const CATEGORY_CONFIG: { label: string; color: string; keywords: string[] }[] = [
    { label: 'Outer',  color: '#000000', keywords: ['아우터', '코트', '자켓', '점퍼', '패딩', 'coat', 'jacket'] },
    { label: 'Top',    color: '#333333', keywords: ['상의', '티셔츠', '맨투맨', '후드', '니트', '셔츠', 'top', 'shirt', 'knit'] },
    { label: 'Bottom', color: '#666666', keywords: ['하의', '바지', '팬츠', '스커트', '청바지', 'pants', 'skirt', 'denim'] },
    { label: 'Shoes',  color: '#999999', keywords: ['신발', '스니커즈', '부츠', '샌들', '로퍼', 'shoes', 'sneakers', 'boots'] },
    { label: 'Acc',    color: '#cccccc', keywords: ['악세서리', '가방', '백', '모자', '벨트', 'bag', 'cap', 'acc'] },
];

function classifyProduct(product: Product): string {
    const haystack = [product.category1, product.category2, product.title].join(' ').toLowerCase();
    for (const cat of CATEGORY_CONFIG) {
        if (cat.keywords.some(kw => haystack.includes(kw))) return cat.label;
    }
    return 'Etc';
}

export default function MyAsset() {
    const { favorites, loading } = useCloudStorage();
    const uniqueFavorites = useMemo(() => dedupeFavoritesForInsights(favorites), [favorites]);

    const assetData = useMemo(() => {
        if (uniqueFavorites.length === 0) return [];
        const grouped: Record<string, number> = {};
        for (const fav of uniqueFavorites) {
            const cat = classifyProduct(fav);
            const price = parseInt(fav.lprice, 10) || 0;
            grouped[cat] = (grouped[cat] ?? 0) + price;
        }
        return CATEGORY_CONFIG
            .map(c => ({ name: c.label, value: grouped[c.label] ?? 0, color: c.color }))
            .concat(grouped['Etc'] ? [{ name: 'Etc', value: grouped['Etc'], color: '#e5e5e5' }] : [])
            .filter(d => d.value > 0);
    }, [uniqueFavorites]);

    const totalValue = useMemo(() => assetData.reduce((a, d) => a + d.value, 0), [assetData]);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-6" />
                <div className="h-48 bg-slate-100 rounded-xl" />
            </div>
        );
    }

    if (uniqueFavorites.length === 0 || assetData.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">My Wardrobe Value</p>
                <p className="text-xs text-gray-400">찜한 상품을 추가하면<br />워드로브 포트폴리오가 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                        My Wardrobe Value
                    </h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-black">
                            ₩{totalValue.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            기준 상품 {uniqueFavorites.length}개
                        </span>
                    </div>
                </div>
                <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                    PORTFOLIO
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Pie Chart */}
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={assetData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {assetData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => `₩${value.toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-gray-400">ALLOCATION</span>
                    </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-3">
                    {assetData.map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08 }}
                            className="flex justify-between items-center"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-medium text-gray-600">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-black">
                                {totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(0) : 0}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">찜한 상품의 최저가 기준 포트폴리오입니다.</p>
            </div>
        </div>
    );
}
