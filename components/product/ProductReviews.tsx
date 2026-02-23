'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';
import AIReviewSummary from './AIReviewSummary';

interface Review {
    id: string;
    rating: number;
    text: string;
    fit: 'small' | 'true' | 'large' | null;
    userName: string;
    createdAt: Timestamp | null;
}

interface ProductReviewsProps {
    productId?: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
    const { user, appId } = useUser();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [fit, setFit] = useState<'small' | 'true' | 'large' | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Firestore에서 리뷰 실시간 구독
    useEffect(() => {
        if (!db || !appId || !productId) return;

        const reviewsRef = collection(db, `artifacts/${appId}/products/${productId}/reviews`);
        const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(10));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: Review[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<Review, 'id'>),
            }));
            setReviews(loaded);
        });

        return () => unsubscribe();
    }, [appId, productId]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !db || !appId || !productId || submitting) return;

        setSubmitting(true);
        try {
            const reviewsRef = collection(db, `artifacts/${appId}/products/${productId}/reviews`);
            await addDoc(reviewsRef, {
                rating,
                text: reviewText.trim(),
                fit,
                userName: user?.displayName || '익명 사용자',
                createdAt: serverTimestamp(),
            });
            setSubmitted(true);
            setRating(0);
            setReviewText('');
            setFit(null);
            setTimeout(() => setSubmitted(false), 3000);
        } catch (error) {
            console.error('리뷰 저장 실패:', error);
        } finally {
            setSubmitting(false);
        }
    }, [rating, reviewText, fit, appId, productId, user, submitting]);

    // 평균 별점
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="mt-8 pt-8 border-t border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">커뮤니티 리뷰</h3>
                {avgRating && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm font-bold text-slate-900">{avgRating}</span>
                        <span className="text-xs text-slate-400">({reviews.length}개)</span>
                    </div>
                )}
            </div>

            {/* AI Review Summary (Beta) */}
            <AIReviewSummary reviews={reviews} />

            {/* Existing Reviews */}
            {reviews.length > 0 && (
                <div className="space-y-3 mb-8">
                    {reviews.map((review, i) => (
                        <motion.div
                            key={review.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-50 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-yellow-400">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </span>
                                    {review.fit && (
                                        <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">
                                            {review.fit === 'small' ? '작아요' : review.fit === 'true' ? '정사이즈' : '커요'}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-400">{review.userName}</span>
                            </div>
                            {review.text && (
                                <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Submit Success Toast */}
            <AnimatePresence>
                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-center text-sm font-medium"
                    >
                        🎉 리뷰가 등록되었습니다!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Write Review Form */}
            <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">리뷰 작성</h4>

                {/* Star Rating */}
                <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">별점</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                            >
                                <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-slate-200'}>★</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Fit Check */}
                <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">사이즈 핏</label>
                    <div className="flex gap-2">
                        {([['small', '작아요'], ['true', '정사이즈'], ['large', '커요']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setFit(val)}
                                className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${fit === val
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text Area */}
                <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="이 상품에 대한 솔직한 리뷰를 남겨주세요..."
                    className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400/50 resize-none h-24"
                />

                <button
                    type="submit"
                    disabled={rating === 0 || submitting}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-all"
                >
                    {submitting ? '등록 중...' : '리뷰 등록'}
                </button>
            </form>
        </div>
    );
}
