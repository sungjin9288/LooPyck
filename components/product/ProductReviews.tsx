'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProductReviews() {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [fit, setFit] = useState<'small' | 'true' | 'large' | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        setSubmitted(true);
        // Here you would send data to backend
    };

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gray-50 rounded-2xl p-8 text-center"
            >
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-bold text-lg mb-1">Thanks for sharing!</h3>
                <p className="text-gray-500 text-sm">Your review helps others shop smarter.</p>
                <button
                    onClick={() => { setSubmitted(false); setRating(0); setReviewText(''); setFit(null); }}
                    className="mt-4 text-xs text-blue-500 underline"
                >
                    Write another review
                </button>
            </motion.div>
        );
    }

    return (
        <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold mb-6">Community Reviews</h3>

            {/* Existing Reviews Mock */}
            <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">JD</div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">Jane Doe</span>
                            <span className="text-yellow-400 text-xs">★★★★★</span>
                            <span className="text-[10px] bg-gray-100 px-1 py-0.5 rounded text-gray-500">True to Size</span>
                        </div>
                        <p className="text-sm text-gray-600">This fits perfectly! The material is surprisingly premium for the price.</p>
                    </div>
                </div>
            </div>

            {/* Write Review Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-sm mb-4">Write a Review</h4>

                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                        >
                            <span className={star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-200'}>
                                ★
                            </span>
                        </button>
                    ))}
                </div>

                {/* Fit Check */}
                <div className="mb-4">
                    <label className="text-xs font-bold text-gray-500 block mb-2">HOW'S THE FIT?</label>
                    <div className="flex gap-2">
                        {['small', 'true', 'large'].map((opt) => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setFit(opt as any)}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${fit === opt
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {opt === 'small' ? 'Run Small' : opt === 'true' ? 'True to Size' : 'Runs Large'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text Area */}
                <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Tell us what you liked (or didn't like)..."
                    className="w-full p-3 bg-gray-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-black mb-4 resize-none h-24"
                />

                <button
                    type="submit"
                    disabled={rating === 0}
                    className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
                >
                    Submit Review
                </button>
            </form>
        </div>
    );
}
