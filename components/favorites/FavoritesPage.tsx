'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Product } from '@/types/product';
import ProductCard from '../product/ProductCard';
import { Spinner } from '@/components/shared/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StyleProfileCard } from '@/components/shared/StyleProfileCard';
import { buildFavoriteDocId } from '@/lib/favorites/favoriteProduct';
import FavoritesManagementPanel from './FavoritesManagementPanel';

const LOOKBOOK_STORAGE_KEY = 'loopyck-lookbooks';
export type FavoriteFilter = 'all' | 'alerts' | 'variant' | 'product';

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

interface FavoritesPageProps {
    initialFilter?: FavoriteFilter;
    onFilterChange?: (filter: FavoriteFilter) => void;
}

export default function FavoritesPage({ initialFilter = 'all', onFilterChange }: FavoritesPageProps) {
    const { favorites, loading, addFavorite, removeFavorite } = useCloudStorage();
    const { lookbooks, addLookbook, deleteLookbook } = useLookbooks();
    const [activeTab, setActiveTab] = useState('all');
    const [activeFilter, setActiveFilter] = useState<FavoriteFilter>(initialFilter);
    const [isAddingTab, setIsAddingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        setActiveFilter(initialFilter);
    }, [initialFilter]);

    const handleAddLookbook = () => {
        if (!newTabName.trim()) return;
        addLookbook(newTabName.trim());
        setNewTabName('');
        setIsAddingTab(false);
    };

    const summary = useMemo(() => ({
        total: favorites.length,
        alerts: favorites.filter((favorite) => typeof favorite.targetPrice === 'number' && favorite.targetPrice > 0).length,
        variants: favorites.filter((favorite) => Boolean(favorite.variantKey || favorite.variantLabel)).length,
        compareReady: favorites.filter((favorite) => Boolean(favorite.deepLink)).length,
    }), [favorites]);

    const displayedFavorites = useMemo(() => {
        const lookbook = lookbooks.find((entry) => entry.id === activeTab);
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return favorites
            .filter((favorite) => {
                if (activeTab === 'all' || !lookbook) {
                    return true;
                }

                const favoriteId = buildFavoriteDocId(favorite);
                return lookbook.productIds.includes(favoriteId) || lookbook.productIds.includes(favorite.productId);
            })
            .filter((favorite) => {
                switch (activeFilter) {
                    case 'alerts':
                        return typeof favorite.targetPrice === 'number' && favorite.targetPrice > 0;
                    case 'variant':
                        return Boolean(favorite.variantKey || favorite.variantLabel);
                    case 'product':
                        return !favorite.variantKey && !favorite.variantLabel;
                    default:
                        return true;
                }
            })
            .filter((favorite) => {
                if (!normalizedSearch) {
                    return true;
                }

                const haystack = [
                    favorite.title,
                    favorite.brand,
                    favorite.mallName,
                    favorite.source,
                    favorite.variantLabel,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                return haystack.includes(normalizedSearch);
            })
            .sort((left, right) => {
                const leftAlert = typeof left.targetPrice === 'number' ? 1 : 0;
                const rightAlert = typeof right.targetPrice === 'number' ? 1 : 0;
                if (leftAlert !== rightAlert) {
                    return rightAlert - leftAlert;
                }

                const leftVariant = left.variantKey || left.variantLabel ? 1 : 0;
                const rightVariant = right.variantKey || right.variantLabel ? 1 : 0;
                if (leftVariant !== rightVariant) {
                    return rightVariant - leftVariant;
                }

                const leftPrice = Number.parseInt(left.lprice, 10) || 0;
                const rightPrice = Number.parseInt(right.lprice, 10) || 0;
                if (leftPrice !== rightPrice) {
                    return leftPrice - rightPrice;
                }

                return left.title.localeCompare(right.title, 'ko');
            });
    }, [activeFilter, activeTab, favorites, lookbooks, searchTerm]);

    if (loading && favorites.length === 0) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Favorites</p>
                <h2 className="font-serif text-3xl tracking-tight text-slate-900">
                    My Lookbook
                </h2>
                <p className="mt-2 text-slate-500 text-sm">
                    찜과 가격 알림이 상품/variant 단위로 저장됩니다. 비교 페이지와 목표가 상태를 여기서 바로 관리하세요.
                </p>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Saved</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.total}</p>
                    <p className="mt-1 text-xs text-slate-500">전체 저장 항목</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Alerts</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.alerts}</p>
                    <p className="mt-1 text-xs text-slate-500">목표가 알림 설정</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Variants</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.variants}</p>
                    <p className="mt-1 text-xs text-slate-500">선택 variant 저장</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Compare Ready</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{summary.compareReady}</p>
                    <p className="mt-1 text-xs text-slate-500">내부 비교 링크 보유</p>
                </div>
            </div>

            {/* Style Profile */}
            <StyleProfileCard favorites={favorites} />

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

            <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'all', label: '전체', count: summary.total },
                        { id: 'alerts', label: '가격 알림', count: summary.alerts },
                        { id: 'variant', label: 'variant', count: summary.variants },
                        { id: 'product', label: '상품 단위', count: summary.total - summary.variants },
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => {
                                const nextFilter = filter.id as FavoriteFilter;
                                setActiveFilter(nextFilter);
                                onFilterChange?.(nextFilter);
                            }}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                activeFilter === filter.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {filter.label} · {filter.count}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold text-slate-900">
                            variant별 찜과 가격 알림을 분리해서 관리합니다.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            같은 상품도 선택한 색상/사이즈가 다르면 별도 항목으로 저장됩니다. 카드의 하트는 해당 variant만 해제합니다.
                        </p>
                    </div>
                    <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="브랜드, 쇼핑몰, variant 검색"
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-900 lg:max-w-sm"
                    />
                </div>
            </div>

            <FavoritesManagementPanel
                favorites={displayedFavorites}
                onSaveFavorite={addFavorite}
                onRemoveFavorite={removeFavorite}
                onRemoveProductGroup={removeFavorite}
            />

            {/* Empty State */}
            {displayedFavorites.length === 0 && (
                <EmptyState
                    icon={
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    }
                    title="찜한 상품이 없습니다"
                    message={searchTerm || activeFilter !== 'all'
                        ? '현재 필터 조건에 맞는 저장 항목이 없습니다'
                        : '마음에 드는 상품의 하트 버튼을 눌러보세요'}
                />
            )}

            {/* Product Grid */}
            {displayedFavorites.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayedFavorites.map((product, index) => (
                        <motion.div
                            key={buildFavoriteDocId(product)}
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
