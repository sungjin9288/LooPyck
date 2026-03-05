'use client';

import React, { useState, useEffect } from 'react';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import { Spinner } from '@/components/shared/Spinner';

interface AffordableAlternativesProps {
    baseProduct: UnifiedProduct;
}

export default function AffordableAlternatives({ baseProduct }: AffordableAlternativesProps) {
    const [alternatives, setAlternatives] = useState<UnifiedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const fetchAlternatives = async () => {
            setLoading(true);
            try {
                // 상품명 앞 3단어로 핵심 키워드 추출
                const titleKeyword = baseProduct.title
                    .replace(/<[^>]*>/g, '')
                    .split(/\s+/)
                    .slice(0, 3)
                    .join(' ');

                const params = new URLSearchParams({
                    q: titleKeyword,
                    price: String(baseProduct.price),
                    id: baseProduct.id,
                });
                const res = await fetch(`/api/affordable-alternatives?${params}`, {
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                setAlternatives(data.alternatives || []);
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setAlternatives([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAlternatives();
        return () => controller.abort();
    }, [baseProduct.id, baseProduct.price, baseProduct.title]);

    if (loading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">💡 가성비 대체 상품 제안</h3>
                <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                </div>
            </div>
        );
    }

    if (alternatives.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
            <div className="mb-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    💡 가성비 대체 상품 제안
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                    비슷한 스타일의 더 저렴한 상품들을 찾아봤어요.
                </p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {alternatives.map((alt) => {
                    const safeLink = sanitizeExternalUrl(alt.link);
                    const savePct = Math.round((1 - alt.price / baseProduct.price) * 100);
                    return (
                        <a
                            key={alt.id}
                            href={safeLink || '#'}
                            target={safeLink ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="min-w-[140px] max-w-[160px] snap-start shrink-0 group block"
                            onClick={!safeLink ? (e) => e.preventDefault() : undefined}
                        >
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={alt.image}
                                    alt={alt.title.replace(/<[^>]*>/g, '')}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                {savePct > 0 && (
                                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {savePct}% 더 저렴
                                    </div>
                                )}
                            </div>
                            <h4
                                className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-1 group-hover:text-accent transition-colors"
                                dangerouslySetInnerHTML={{ __html: alt.title }}
                            />
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                    {alt.mallName}
                                </span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                    {alt.price.toLocaleString()}원
                                </span>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
