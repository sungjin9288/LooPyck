'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface InvestmentReportProps {
    score: number; // 0-100
    reason: string;
}

export default function InvestmentReport({ score, reason }: InvestmentReportProps) {
    let rating = '보류';
    let ratingEN = 'HOLD';
    let color = 'bg-yellow-100 text-yellow-800';
    let statusColor = 'text-yellow-600';

    if (score >= 80) {
        rating = '적극 매수';
        ratingEN = 'BUY';
        color = 'bg-green-100 text-green-800';
        statusColor = 'text-green-600';
    } else if (score <= 40) {
        rating = '대기';
        ratingEN = 'WAIT';
        color = 'bg-red-100 text-red-800';
        statusColor = 'text-red-600';
    }

    return (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        AI 구매 의견
                    </span>
                    <h4 className={`text-2xl font-black tracking-tighter ${statusColor}`}>
                        {rating}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">{ratingEN}</span>
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
                <div className={`h-full ${score >= 80 ? 'bg-green-500' : score <= 40 ? 'bg-red-500' : 'bg-yellow-500'}`} />
            </motion.div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                &ldquo;{reason}&rdquo;
            </p>
        </div>
    );
}
