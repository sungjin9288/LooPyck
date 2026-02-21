'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnifiedProduct } from '@/lib/api/types';

export interface FilterState {
    priceRange: 'all' | 'under30k' | '30k-50k' | '50k-100k' | 'over100k';
    brand: string;
    source: string;
}

interface FilterPanelProps {
    products: UnifiedProduct[];
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
}

const PRICE_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'under30k', label: '3만원 이하' },
    { value: '30k-50k', label: '3~5만원' },
    { value: '50k-100k', label: '5~10만원' },
    { value: 'over100k', label: '10만원 이상' },
] as const;

export function applyFilters(products: UnifiedProduct[], filters: FilterState): UnifiedProduct[] {
    return products.filter(p => {
        // 가격 필터
        if (filters.priceRange !== 'all') {
            if (filters.priceRange === 'under30k' && p.price >= 30000) return false;
            if (filters.priceRange === '30k-50k' && (p.price < 30000 || p.price >= 50000)) return false;
            if (filters.priceRange === '50k-100k' && (p.price < 50000 || p.price >= 100000)) return false;
            if (filters.priceRange === 'over100k' && p.price < 100000) return false;
        }
        // 브랜드 필터
        if (filters.brand && p.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
        // 소스 필터
        if (filters.source && p.source !== filters.source) return false;
        return true;
    });
}

export default function FilterPanel({ products, filters, onFilterChange }: FilterPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    // 필터 선택지 동적 생성
    const brands = Array.from(new Set(products.map(p => p.brand).filter(Boolean))) as string[];
    const sources = Array.from(new Set(products.map(p => p.source)));
    const activeFilterCount = [
        filters.priceRange !== 'all' ? 1 : 0,
        filters.brand ? 1 : 0,
        filters.source ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const resetFilters = () => onFilterChange({ priceRange: 'all', brand: '', source: '' });

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${activeFilterCount > 0
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                필터
                {activeFilterCount > 0 && (
                    <span className="bg-white text-slate-900 rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full mt-2 left-0 glass-panel rounded-2xl p-4 z-30 w-72 shadow-xl"
                    >
                        {/* 가격대 */}
                        <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">가격대</h4>
                            <div className="flex flex-wrap gap-2">
                                {PRICE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => onFilterChange({ ...filters, priceRange: opt.value })}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filters.priceRange === opt.value
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 쇼핑몰 */}
                        {sources.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">쇼핑몰</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => onFilterChange({ ...filters, source: '' })}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${!filters.source ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                    >전체</button>
                                    {sources.map(src => (
                                        <button
                                            key={src}
                                            onClick={() => onFilterChange({ ...filters, source: src === filters.source ? '' : src })}
                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${filters.source === src ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                                }`}
                                        >
                                            {src}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 브랜드 */}
                        {brands.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">브랜드</h4>
                                <select
                                    value={filters.brand}
                                    onChange={e => onFilterChange({ ...filters, brand: e.target.value })}
                                    className="w-full rounded-xl border border-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-light/50"
                                >
                                    <option value="">전체 브랜드</option>
                                    {brands.slice(0, 30).map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Reset */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                className="w-full text-center text-xs text-rose-500 font-medium hover:text-rose-700 transition-colors"
                            >
                                필터 초기화
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
}
