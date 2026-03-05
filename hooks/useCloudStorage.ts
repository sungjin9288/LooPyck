'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import { Product } from '@/types/product';

function isProduct(data: unknown): data is Product {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.productId === 'string' &&
        typeof d.title === 'string' &&
        typeof d.lprice === 'string'
    );
}

const STORAGE_KEY = 'fashion-favorites';

export function useCloudStorage() {
    const { userId, appId, isAuthenticated } = useUser();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Path Helpers — useCallback으로 메모이제이션하여 리렌더 시 안정성 보장
    const getCollectionPath = useCallback(() => {
        if (!userId) return null;
        return `artifacts/${appId}/users/${userId}/favorites`;
    }, [userId, appId]);

    const getProductStatsPath = useCallback((productId: string) => {
        return `artifacts/${appId}/products/${productId}`;
    }, [appId]);

    // 1. Initial Load & Realtime Sync
    useEffect(() => {
        if (!db || !isAuthenticated || !userId) {
            setLoading(false);
            return;
        }

        const path = getCollectionPath();
        if (!path) return;

        const q = query(collection(db, path));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cloudData: Product[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (isProduct(data)) cloudData.push(data);
            });
            setFavorites(cloudData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Sync Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthenticated, userId, getCollectionPath]);

    // 2. Migration Logic (Local -> Cloud)
    useEffect(() => {
        const migrate = async () => {
            if (!db || !isAuthenticated || !userId || loading) return;
            const migratedKey = `${STORAGE_KEY}_migrated_${userId}`;

            // 이미 마이그레이션이 완료된 경우 스킵
            if (localStorage.getItem(migratedKey) === 'true') return;

            const path = getCollectionPath();
            if (!path) return;

            const localDataStr = localStorage.getItem(STORAGE_KEY);
            if (!localDataStr) return;

            try {
                const localData: Product[] = JSON.parse(localDataStr);
                if (localData.length === 0) return;

                const cloudSnap = await getDocs(collection(db, path));

                if (cloudSnap.empty) {
                    const batch = writeBatch(db);

                    localData.forEach(item => {
                        const docRef = doc(db, path, item.productId);
                        batch.set(docRef, item);
                    });

                    await batch.commit();

                    // 마이그레이션 완료 후 로컬 데이터 정리
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.setItem(migratedKey, 'true');
                }
            } catch (e) {
                console.error("Migration Failed:", e);
            }
        };

        migrate();
    }, [isAuthenticated, userId, loading, getCollectionPath]);

    // 3. Actions
    const addFavorite = async (product: Product) => {
        if (!db || !userId) return;
        const userPath = getCollectionPath();
        if (!userPath) return;

        const globalPath = getProductStatsPath(product.productId);

        try {
            await runTransaction(db, async (transaction) => {
                // READ FIRST: Global Watch Count
                const globalDocRef = doc(db, globalPath);
                const globalDoc = await transaction.get(globalDocRef);
                const userDocRef = doc(db, userPath, product.productId);
                const userDoc = await transaction.get(userDocRef);

                // THEN WRITE: User Favorite (upsert)
                transaction.set(userDocRef, product);

                // Increment only when user favorites this product for the first time.
                if (!userDoc.exists()) {
                    if (!globalDoc.exists()) {
                        transaction.set(globalDocRef, { watchCount: 1 });
                    } else {
                        const newCount = (globalDoc.data().watchCount || 0) + 1;
                        transaction.update(globalDocRef, { watchCount: newCount });
                    }
                }
            });
        } catch (e) {
            console.error("Add Failed:", e);
        }
    };

    const removeFavorite = async (productId: string) => {
        if (!db || !userId) return;
        const userPath = getCollectionPath();
        if (!userPath) return;

        const globalPath = getProductStatsPath(productId);

        try {
            await runTransaction(db, async (transaction) => {
                // READ FIRST
                const globalDocRef = doc(db, globalPath);
                const globalDoc = await transaction.get(globalDocRef);
                const userDocRef = doc(db, userPath, productId);
                const userDoc = await transaction.get(userDocRef);

                if (!userDoc.exists()) {
                    return;
                }

                // THEN WRITE
                transaction.delete(userDocRef);

                if (globalDoc.exists()) {
                    const current = globalDoc.data().watchCount || 0;
                    if (current > 0) {
                        transaction.update(globalDocRef, { watchCount: current - 1 });
                    }
                }
            });
        } catch (e) {
            console.error("Remove Failed:", e);
        }
    };

    const isFavorite = (productId: string) => {
        return favorites.some(p => p.productId === productId);
    };

    return {
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        isFavorite
    };
}
