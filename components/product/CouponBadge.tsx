'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CouponInfo {
    code: string;
    description: string;
    discount: string;
    mallName: string;
    expiry: string;
}

/**
 * 쇼핑몰별 할인/쿠폰 정보 (실제로는 API 또는 크롤링 연동 필요)
 * 현재는 쇼핑몰별 대표 프로모션 하드코딩 → 추후 동적 업데이트
 */
const MALL_COUPONS: Record<string, CouponInfo[]> = {
    MUSINSA: [
        { code: 'MSNEW10', description: '무신사 신규 가입 할인', discount: '10%', mallName: '무신사', expiry: '2026-03-31' },
        { code: 'MSAPP15', description: '무신사 앱 전용 할인', discount: '15%', mallName: '무신사', expiry: '2026-03-31' },
    ],
    '29CM': [
        { code: '29WELCOME', description: '29CM 첫 구매 혜택', discount: '12%', mallName: '29CM', expiry: '2026-03-31' },
    ],
    NAVER: [
        { code: '', description: '네이버 페이 포인트 적립', discount: '최대 3%', mallName: '네이버쇼핑', expiry: '상시' },
    ],
    W_CONCEPT: [
        { code: 'WCNEW20', description: 'W컨셉 신규 회원 할인', discount: '20%', mallName: 'W컨셉', expiry: '2026-03-31' },
    ],
};

interface CouponBadgeProps {
    mallName: string;
    source: string;
}

export default function CouponBadge({ mallName, source }: CouponBadgeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const coupons = MALL_COUPONS[source] || [];
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
                                {mallName} 할인 혜택
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
                                쿠폰은 해당 쇼핑몰에서 직접 적용해주세요
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
