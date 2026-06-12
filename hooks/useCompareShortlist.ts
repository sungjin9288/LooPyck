'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
    // Mutations must not run inside setState updaters: the storage write
    // dispatches an event that setStates other hook instances, which React
    // forbids mid-render. Keep the latest list in a ref and commit from the
    // event handler scope instead.
    const itemsRef = useRef<CompareShortlistItem[]>([]);

    useEffect(() => {
        const initial = readCompareShortlistFromStorage();
        itemsRef.current = initial;
        setItems(initial);

        const handleStorage = () => {
            const next = readCompareShortlistFromStorage();
            itemsRef.current = next;
            setItems(next);
        };

        const handleCustomEvent = (event: Event) => {
            const customEvent = event as CustomEvent<CompareShortlistItem[]>;
            const next = Array.isArray(customEvent.detail)
                ? customEvent.detail
                : readCompareShortlistFromStorage();
            itemsRef.current = next;
            setItems(next);
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(COMPARE_SHORTLIST_EVENT, handleCustomEvent as EventListener);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(COMPARE_SHORTLIST_EVENT, handleCustomEvent as EventListener);
        };
    }, []);

    const commit = useCallback((next: CompareShortlistItem[]) => {
        itemsRef.current = next;
        setItems(next);
        writeCompareShortlistToStorage(next);
    }, []);

    const addToShortlist = useCallback((product: Product) => {
        commit(upsertCompareShortlistItem(itemsRef.current, product));
    }, [commit]);

    const removeFromShortlist = useCallback((productOrId: string | Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>) => {
        commit(removeCompareShortlistItem(itemsRef.current, productOrId));
    }, [commit]);

    const clearShortlist = useCallback(() => {
        commit([]);
    }, [commit]);

    const toggleShortlist = useCallback((product: Product) => {
        const previous = itemsRef.current;
        commit(
            isShortlisted(previous, product)
                ? removeCompareShortlistItem(previous, product)
                : upsertCompareShortlistItem(previous, product)
        );
    }, [commit]);

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
