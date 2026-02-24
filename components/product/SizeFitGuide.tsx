'use client';

import React, { useState } from 'react';

interface SizeFitGuideProps {
    productName: string;
    category?: string;
}

export default function SizeFitGuide({ productName, category = '신발' }: SizeFitGuideProps) {
    // In a real app, this would come from a user profile hook
    // const { userProfile } = useProfile();
    const [userSize, setUserSize] = useState<string>('260');

    // Simulated AI/Review based sizing intelligence
    const sizingLogic = (() => {
        const nameLower = productName.toLowerCase();
        if (nameLower.includes('조던') || nameLower.includes('jordan') || nameLower.includes('덩크') || nameLower.includes('dunk')) {
            return {
                fit: '작게 나옴 (Runs Small)',
                recommendation: '반업 (+5mm) 추천',
                reason: '발볼이 좁게 나오는 모델입니다. 평소 발볼이 넓다면 일업(+10mm)도 좋습니다.',
                icon: '📏'
            };
        } else if (nameLower.includes('포스') || nameLower.includes('force') || nameLower.includes('에어맥스')) {
            return {
                fit: '정사이즈 (True to Size)',
                recommendation: '정사이즈 추천',
                reason: '일반적인 발볼에 맞게 제작되었습니다.',
                icon: '👟'
            };
        } else {
            return {
                fit: '보통 (Standard Fit)',
                recommendation: '정사이즈 혹 반업 추천',
                reason: '사용자 리뷰 데이터를 분석한 결과 대부분 정사이즈를 구매했습니다.',
                icon: '✨'
            };
        }
    })();

    const displaySize = Number(userSize);
    const recommendedSize = sizingLogic.fit.includes('작게') ? displaySize + 5 : displaySize;

    return (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {sizingLogic.icon} 핏 & 사이즈 가이드
                </h3>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">나의 기준 사이즈:</span>
                    <select
                        value={userSize}
                        onChange={(e) => setUserSize(e.target.value)}
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 font-medium focus:ring-1 focus:ring-accent outline-none"
                    >
                        {['250', '255', '260', '265', '270', '275', '280'].map(sz => (
                            <option key={sz} value={sz}>{sz}mm</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-accent-dark">{sizingLogic.fit}</span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {sizingLogic.recommendation}
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {sizingLogic.reason}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[120px] text-center border-l-[3px] border-l-accent">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                        추천 사이즈
                    </span>
                    <span className="block text-xl font-black text-slate-900 dark:text-white">
                        {recommendedSize} <span className="text-sm font-bold text-slate-500">mm</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
