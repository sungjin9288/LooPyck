'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getInvestmentRatingPresentation, type InvestmentRating } from '@/lib/product/investmentRating';

interface InvestmentReportProps {
    score: number; // 0-100
    reason: string;
    rating: InvestmentRating;
    label?: string;
}

export default function InvestmentReport({ score, reason, rating, label = 'AI 구매 가치' }: InvestmentReportProps) {
    const presentation = getInvestmentRatingPresentation(rating);

    return (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {label}
                    </span>
                    <h4 className={`text-2xl font-black tracking-tighter ${presentation.textColorClass}`}>
                        {presentation.label}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{rating}</span>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-slate-900">{score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                </div>
            </div>

            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3"
            >
                <div className={`h-full ${presentation.barColorClass}`} />
            </motion.div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                &ldquo;{reason}&rdquo;
            </p>
        </div>
    );
}
