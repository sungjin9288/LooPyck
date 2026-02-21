'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Product } from '@/types/product';
import ProductCard from '../product/ProductCard';

const LOOKBOOK_STORAGE_KEY = 'loopyck-lookbooks';

interface Lookbook {
    id: string;
    name: string;
    productIds: string[];
}

function useLookbooks() {
    const [lookbooks, setLookbooks] = useState<Lookbook[]>(() => {
        try {
            const stored = localStorage.getItem(LOOKBOOK_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [{ id: 'all', name: '전체 찜', productIds: [] }];
        } catch {
            return [{ id: 'all', name: '전체 찜', productIds: [] }];
        }
    });

    const save = (next: Lookbook[]) => {
        setLookbooks(next);
        localStorage.setItem(LOOKBOOK_STORAGE_KEY, JSON.stringify(next));
    };

    const addLookbook = (name: string) => {
        const next = [...lookbooks, { id: Date.now().toString(), name, productIds: [] }];
        save(next);
    };

    const deleteLookbook = (id: string) => {
        if (id === 'all') return;
        save(lookbooks.filter(lb => lb.id !== id));
    };

    const addToLookbook = (lookbookId: string, productId: string) => {
        save(lookbooks.map(lb =>
            lb.id === lookbookId && !lb.productIds.includes(productId)
                ? { ...lb, productIds: [...lb.productIds, productId] }
                : lb
        ));
    };

    return { lookbooks, addLookbook, deleteLookbook, addToLookbook };
}

export default function FavoritesPage() {
    const { favorites, loading } = useCloudStorage();
    const { lookbooks, addLookbook, deleteLookbook } = useLookbooks();
    const [activeTab, setActiveTab] = useState('all');
    const [isAddingTab, setIsAddingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');

    const handleAddLookbook = () => {
        if (!newTabName.trim()) return;
        addLookbook(newTabName.trim());
        setNewTabName('');
        setIsAddingTab(false);
    };

    // 'all' 탭이면 전체, 그 외는 해당 컬렉션 (기본은 전체)
    const displayedFavorites: Product[] = activeTab === 'all'
        ? favorites
        : favorites.filter(f => {
            const lb = lookbooks.find(l => l.id === activeTab);
            return lb?.productIds.includes(f.productId);
        });

    if (loading && favorites.length === 0) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    My Lookbook
                </h2>
                <p className="text-slate-500 text-sm">
                    찜한 상품들을 컬렉션으로 정리하고 가격을 비교해보세요
                </p>
            </div>

            {/* Lookbook Tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {lookbooks.map(lb => (
                    <div key={lb.id} className="flex items-center group flex-shrink-0">
                        <button
                            onClick={() => setActiveTab(lb.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === lb.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                        >
                            {lb.name}
                            {lb.id === 'all' && ` (${favorites.length})`}
                        </button>
                        {lb.id !== 'all' && (
                            <button
                                onClick={() => { deleteLookbook(lb.id); if (activeTab === lb.id) setActiveTab('all'); }}
                                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 text-lg leading-none"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                {/* Add new collection */}
                {isAddingTab ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                            autoFocus
                            value={newTabName}
                            onChange={e => setNewTabName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddLookbook(); if (e.key === 'Escape') setIsAddingTab(false); }}
                            placeholder="컬렉션 이름"
                            className="px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-accent-light/50 w-32"
                        />
                        <button onClick={handleAddLookbook} className="text-xs bg-accent text-white px-3 py-2 rounded-xl font-medium hover:bg-accent-dark transition-colors">추가</button>
                        <button onClick={() => setIsAddingTab(false)} className="text-xs text-slate-400 hover:text-slate-600">취소</button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAddingTab(true)}
                        className="flex-shrink-0 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 hover:border-accent-light hover:text-accent-dark transition-all"
                    >
                        + 컬렉션 추가
                    </button>
                )}
            </div>

            {/* Empty State */}
            {displayedFavorites.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-20"
                >
                    <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">찜한 상품이 없습니다</h3>
                    <p className="text-slate-500 text-sm">마음에 드는 상품의 하트 버튼을 눌러보세요</p>
                </motion.div>
            )}

            {/* Product Grid */}
            {displayedFavorites.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayedFavorites.map((product, index) => (
                        <motion.div
                            key={`${product.productId}-${index}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
