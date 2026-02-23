'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AIReviewSummaryProps {
    reviews: { text: string; rating: number; fit: string | null }[];
}

interface SummaryData {
    pros: string;
    cons: string;
    sizeTip: string;
}

export default function AIReviewSummary({ reviews }: AIReviewSummaryProps) {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // 리뷰가 3개 이상일 때만 요약 요청
        if (reviews.length < 3) {
            setSummary(null);
            return;
        }

        const fetchSummary = async () => {
            setLoading(true);
            setError(false);
            try {
                // 요약을 위해 텍스트 길이 제한 (토큰 절약)
                const recentReviews = reviews.slice(0, 10).map(r => ({
                    text: r.text.slice(0, 200),
                    rating: r.rating,
                    fit: r.fit
                }));

                const res = await fetch('/api/ai-review-summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reviews: recentReviews })
                });

                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                setSummary(data);
            } catch (err) {
                console.error('리뷰 요약 실패:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        // 디바운스/캐싱 최적화 시 추가 가능. 
        // 일단 컴포넌트 마운트 및 리뷰 업데이트 시 새로 받아옴
        fetchSummary();
    }, [reviews]); // reviews 배열 객체 자체가 변경될 때만 실행 (상위 컨텍스트에서 주의 요망)

    if (reviews.length < 3) return null;

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-4 mb-6 animate-pulse">
                <div className="flex gap-2 mb-3">
                    <div className="w-5 h-5 bg-violet-200 rounded-full" />
                    <div className="h-5 bg-violet-200 rounded w-1/4" />
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-violet-100 rounded w-full" />
                    <div className="h-4 bg-violet-100 rounded w-5/6" />
                    <div className="h-4 bg-violet-100 rounded w-4/6" />
                </div>
            </div>
        );
    }

    if (error || !summary) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4 mb-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-3 opacity-10 blur-[1px]">
                <span className="text-4xl text-violet-600">✨</span>
            </div>

            <div className="flex items-center gap-1.5 mb-3 relative z-10">
                <span className="text-violet-600 text-sm">✨</span>
                <h4 className="font-bold text-sm text-violet-900">AI가 리뷰를 요약했어요</h4>
                <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded ml-2">Beta</span>
            </div>

            <ul className="space-y-2 relative z-10">
                <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 font-bold shrink-0">👍 장점</span>
                    <span className="text-slate-700 leading-snug">{summary.pros}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                    <span className="text-rose-500 font-bold shrink-0">👎 단점</span>
                    <span className="text-slate-700 leading-snug">{summary.cons}</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 font-bold shrink-0">📏 사이즈팁</span>
                    <span className="text-slate-700 leading-snug">{summary.sizeTip}</span>
                </li>
            </ul>
        </motion.div>
    );
}
