'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { GroupedProduct } from '@/lib/api/types';
import { hasPdpDetailData } from '@/lib/product/pdpDetailEnrichment';
import { getGroupPurchaseMetrics } from '@/lib/product/purchasePricing';

interface ComparisonHighlightsProps {
    groups: GroupedProduct[];
    onProductClick: (group: GroupedProduct) => void;
}

export default function ComparisonHighlights({ groups, onProductClick }: ComparisonHighlightsProps) {
    if (groups.length === 0) return null;

    return (
        <section className="mb-10">
            <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">
                        비교 하이라이트
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        여러 쇼핑몰에서 동시에 잡힌 상품만 모아 최저가와 가격 차이를 바로 확인하세요.
                    </p>
                </div>
                <span className="hidden sm:inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-bold">
                    Compare Ready
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group, index) => {
                    const product = group.representative;
                    const metrics = getGroupPurchaseMetrics(group);
                    const spread = metrics.highestCheckoutPrice - metrics.lowestCheckoutPrice;
                    const confidence = Math.round(group.matchConfidence * 100);
                    const verifiedCount = group.variants.filter((variant) => hasPdpDetailData(variant)).length;

                    return (
                        <motion.button
                            key={group.groupKey}
                            type="button"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: index * 0.08 }}
                            onClick={() => onProductClick(group)}
                            className="text-left rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all overflow-hidden"
                        >
                            <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={product.image}
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                        {group.mallCount}개 쇼핑몰 비교
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-sky-50 text-sky-700 px-2.5 py-1 text-[11px] font-bold">
                                            매칭 {confidence}%
                                        </span>
                                        <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[11px] font-bold">
                                            최대 {spread.toLocaleString()}원 차이
                                        </span>
                                        {verifiedCount > 0 && (
                                            <span className="rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 text-[11px] font-bold">
                                                PDP {verifiedCount}/{group.variants.length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-3">
                                    {product.title}
                                </h3>
                                {product.optionSummary && (
                                    <p className="mb-3 text-xs text-slate-500 line-clamp-2">
                                        {product.optionSummary}
                                    </p>
                                )}
                                <div className="flex items-end justify-between gap-3">
                                    <div>
                                        <p className="text-xs text-slate-500">배송 반영 결제가 기준 최저</p>
                                        <p className="text-2xl font-black tracking-tight text-slate-900">
                                            {metrics.lowestCheckoutPrice.toLocaleString()}원
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{product.mallName}</p>
                                        <p className="text-sm font-semibold text-slate-600">
                                            혜택 적용시 최저 {metrics.lowestBestCasePrice.toLocaleString()}원
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </section>
    );
}
