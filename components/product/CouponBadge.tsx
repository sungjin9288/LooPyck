'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCouponsForSource } from '@/lib/product/commerceRules';
import type { ProductSource } from '@/lib/api/types';

interface CouponBadgeProps {
    mallName: string;
    source: ProductSource;
}

export default function CouponBadge({ mallName, source }: CouponBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const coupons = getCouponsForSource(source);
    if (coupons.length === 0) return null;

    const handleCopy = async (code: string) => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            // Fallback
        }
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-full font-bold hover:bg-rose-100 transition-all"
            >
                🏷️ 할인
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.95 }}
                            className="absolute top-full mt-1 right-0 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-3 space-y-2"
                        >
                            <h4 className="text-xs font-bold text-slate-900 mb-2">
                                {mallName} 예상 혜택
                            </h4>
                            {coupons.map(c => (
                                <div key={c.code || c.description} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                                    <div>
                                        <p className="text-xs font-medium text-slate-700">{c.description}</p>
                                        <p className="text-sm font-bold text-rose-600">{c.discount}</p>
                                        {c.code && (
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{c.code}</p>
                                        )}
                                    </div>
                                    {c.code && (
                                        <button
                                            onClick={() => handleCopy(c.code)}
                                            className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all ${copiedCode === c.code
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-slate-900 text-white hover:bg-slate-700'
                                                }`}
                                        >
                                            {copiedCode === c.code ? '복사됨 ✓' : '복사'}
                                        </button>
                                    )}
                                </div>
                            ))}
                            <p className="text-[9px] text-slate-400 text-center mt-1">
                                회원등급, 앱 결제, 신규 여부에 따라 실제 적용 가능 혜택은 달라질 수 있습니다.
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
