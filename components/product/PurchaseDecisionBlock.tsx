'use client';

import React from 'react';
import type { PurchasePriceEstimate } from '@/lib/product/purchasePricing';
import { buildPurchaseDecisionSummary, type PurchaseDecisionTone } from '@/lib/product/purchaseDecision';

interface PurchaseDecisionBlockProps {
    offers: PurchasePriceEstimate[];
    productName: string;
    category?: string;
    selectedVariantLabel?: string;
}

function getToneClassName(tone: PurchaseDecisionTone): string {
    switch (tone) {
        case 'positive':
            return 'border-emerald-200 bg-emerald-50 text-emerald-900';
        case 'warning':
            return 'border-amber-200 bg-amber-50 text-amber-900';
        case 'danger':
            return 'border-rose-200 bg-rose-50 text-rose-900';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-900';
    }
}

function getPillClassName(tone: PurchaseDecisionTone): string {
    switch (tone) {
        case 'positive':
            return 'border-emerald-200 bg-white text-emerald-700';
        case 'warning':
            return 'border-amber-200 bg-white text-amber-700';
        case 'danger':
            return 'border-rose-200 bg-white text-rose-700';
        default:
            return 'border-slate-200 bg-white text-slate-600';
    }
}

export default function PurchaseDecisionBlock({
    offers,
    productName,
    category,
    selectedVariantLabel,
}: PurchaseDecisionBlockProps) {
    if (offers.length === 0) {
        return null;
    }

    const summary = buildPurchaseDecisionSummary({
        offers,
        productName,
        category,
        selectedVariantLabel,
    });

    return (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.08)]">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-4 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Decision Block</p>
                <h3 className="mt-2 text-xl font-black">{summary.headline}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{summary.detail}</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {summary.cards.map((card) => (
                    <div key={card.key} className={`rounded-2xl border px-4 py-4 ${getToneClassName(card.tone)}`}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">{card.label}</p>
                        <p className="mt-2 text-lg font-black">{card.headline}</p>
                        <p className="mt-2 text-sm leading-6 opacity-80">{card.detail}</p>
                        {card.pills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {card.pills.map((pill) => (
                                    <span
                                        key={`${card.key}:${pill}`}
                                        className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getPillClassName(card.tone)}`}
                                    >
                                        {pill}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
