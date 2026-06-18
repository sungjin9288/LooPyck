'use client';

import React, { useState } from 'react';
import { CLOTHING_SIZES, getFitGuide, getRecommendedShoeSize, isShoeCategory, SHOE_SIZES } from '@/lib/product/fitGuide';

interface SizeFitGuideProps {
    productName: string;
    category?: string;
}

export default function SizeFitGuide({ productName, category = '' }: SizeFitGuideProps) {
    const isShoe = isShoeCategory(productName, category);
    const fitInfo = getFitGuide(productName, category);

    const sizeOptions = isShoe ? SHOE_SIZES : CLOTHING_SIZES;
    const [userSize, setUserSize] = useState(isShoe ? '260' : '66(M)');

    const recommendedShoeSize = isShoe ? getRecommendedShoeSize(userSize, fitInfo) : null;

    return (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {fitInfo.icon} 핏 &amp; 사이즈 가이드
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">내 사이즈:</span>
                    <select
                        value={userSize}
                        onChange={(e) => setUserSize(e.target.value)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 font-medium focus:ring-1 focus:ring-accent outline-none text-xs"
                    >
                        {sizeOptions.map(sz => (
                            <option key={sz} value={sz}>{sz}{isShoe ? 'mm' : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-accent-dark text-sm">{fitInfo.fit}</span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                            {fitInfo.recommendation}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{fitInfo.reason}</p>
                </div>

                {isShoe && recommendedShoeSize && (
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100 min-w-[110px] text-center border-l-[3px] border-l-accent">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">추천 사이즈</span>
                        <span className="block text-xl font-black text-slate-900">{recommendedShoeSize}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
