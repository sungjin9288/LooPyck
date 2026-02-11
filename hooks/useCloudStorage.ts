'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import { Product } from '@/types/product';

const STORAGE_KEY = 'fashion-favorites';

export function useCloudStorage() {
    const { user, userId, appId, isAuthenticated } = useUser();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Path Helper
    const getCollectionPath = () => {
        if (!userId) return null;
        return `artifacts/${appId}/users/${userId}/favorites`;
    };

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
                cloudData.push(doc.data() as Product);
            });
            setFavorites(cloudData);
            setLoading(false);

            // Sync BACK to local storage for offline reading if needed, 
            // but for now we rely on cloud state as truth.
        }, (error) => {
            console.error("Firestore Sync Error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthenticated, userId, appId]);

    // 2. Migration Logic (Local -> Cloud)
    useEffect(() => {
        const migrate = async () => {
            if (!db || !isAuthenticated || !userId || loading) return;

            const path = getCollectionPath();
            if (!path) return;

            const localDataStr = localStorage.getItem(STORAGE_KEY);
            if (!localDataStr) return;

            try {
                const localData: Product[] = JSON.parse(localDataStr);
                if (localData.length === 0) return;

                // Check if cloud is empty (only migrate if cloud is empty to avoid overwriting/dups logic complexity for now)
                // Or we can just merge. "Pseudocode: if local > 0 and cloud == 0"
                const cloudSnap = await getDocs(collection(db, path));

                if (cloudSnap.empty) {
                    console.log("Migrating Local Data to Cloud...");
                    const batch = writeBatch(db);

                    localData.forEach(item => {
                        const docRef = doc(db, path, item.productId);
                        // Sanitize: ensure no undefined fields if possible, or Firestore ignores them
                        // However, we must ensure item matches Product type
                        batch.set(docRef, item);
                    });

                    await batch.commit();
                    console.log("Migration Complete.");

                    // Clear local storage to avoid re-migration or conflict
                    // localStorage.removeItem(STORAGE_KEY); 
                    // Optional: Keep it as backup or clear it. Request didn't specify clearing, 
                    // but "Migration" usually implies moving. flagging as done using a separate key might be safer.
                    localStorage.setItem(STORAGE_KEY + '_migrated', 'true');
                }
            } catch (e) {
                console.error("Migration Failed:", e);
            }
        };

        migrate();
    }, [isAuthenticated, userId, appId, loading]);

    // 3. Actions
    // Helper for global product stats path
    const getProductStatsPath = (productId: string) => {
        return `artifacts/${appId}/products/${productId}`;
    };

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

                // THEN WRITE: User Favorite
                const userDocRef = doc(db, userPath, product.productId);
                transaction.set(userDocRef, product);

                // THEN WRITE: Increment Global Watch Count
                if (!globalDoc.exists()) {
                    transaction.set(globalDocRef, { watchCount: 1 });
                } else {
                    const newCount = (globalDoc.data().watchCount || 0) + 1;
                    transaction.update(globalDocRef, { watchCount: newCount });
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

                // THEN WRITE
                const userDocRef = doc(db, userPath, productId);
                transaction.delete(userDocRef);

                // THEN WRITE
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
