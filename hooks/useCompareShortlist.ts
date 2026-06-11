'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@/types/product';
import {
    COMPARE_SHORTLIST_STORAGE_KEY,
    type CompareShortlistItem,
    isShortlisted,
    parseCompareShortlist,
    removeCompareShortlistItem,
    upsertCompareShortlistItem,
} from '@/lib/product/compareShortlist';

const COMPARE_SHORTLIST_EVENT = 'loopyck:compare-shortlist-changed';

function readCompareShortlistFromStorage(): CompareShortlistItem[] {
    try {
        const raw = localStorage.getItem(COMPARE_SHORTLIST_STORAGE_KEY);
        if (!raw) return [];
        return parseCompareShortlist(JSON.parse(raw));
    } catch {
        return [];
    }
}

function writeCompareShortlistToStorage(items: CompareShortlistItem[]) {
    localStorage.setItem(COMPARE_SHORTLIST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent<CompareShortlistItem[]>(COMPARE_SHORTLIST_EVENT, { detail: items }));
}

export function useCompareShortlist() {
    const [items, setItems] = useState<CompareShortlistItem[]>([]);

    useEffect(() => {
        setItems(readCompareShortlistFromStorage());

        const handleStorage = () => {
            setItems(readCompareShortlistFromStorage());
        };

        const handleCustomEvent = (event: Event) => {
            const customEvent = event as CustomEvent<CompareShortlistItem[]>;
            setItems(Array.isArray(customEvent.detail) ? customEvent.detail : readCompareShortlistFromStorage());
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(COMPARE_SHORTLIST_EVENT, handleCustomEvent as EventListener);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(COMPARE_SHORTLIST_EVENT, handleCustomEvent as EventListener);
        };
    }, []);

    const addToShortlist = useCallback((product: Product) => {
        setItems((previous) => {
            const next = upsertCompareShortlistItem(previous, product);
            writeCompareShortlistToStorage(next);
            return next;
        });
    }, []);

    const removeFromShortlist = useCallback((productOrId: string | Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>) => {
        setItems((previous) => {
            const next = removeCompareShortlistItem(previous, productOrId);
            writeCompareShortlistToStorage(next);
            return next;
        });
    }, []);

    const clearShortlist = useCallback(() => {
        setItems([]);
        writeCompareShortlistToStorage([]);
    }, []);

    const toggleShortlist = useCallback((product: Product) => {
        setItems((previous) => {
            const next = isShortlisted(previous, product)
                ? removeCompareShortlistItem(previous, product)
                : upsertCompareShortlistItem(previous, product);
            writeCompareShortlistToStorage(next);
            return next;
        });
    }, []);

    const isInShortlist = useCallback((product: Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>) => (
        isShortlisted(items, product)
    ), [items]);

    return {
        shortlist: items,
        addToShortlist,
        removeFromShortlist,
        clearShortlist,
        toggleShortlist,
        isInShortlist,
    };
}
