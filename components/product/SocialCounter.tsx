'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';

interface SocialCounterProps {
    productId: string;
}

export default function SocialCounter({ productId }: SocialCounterProps) {
    const { appId } = useUser();
    const [count, setCount] = useState<number>(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!db || !appId) return;

        const path = `artifacts/${appId}/products/${productId}`;
        const docRef = doc(db, path);

        const unsubscribe = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const newCount = data.watchCount || 0;
                setCount(newCount);
                if (newCount > 0) setVisible(true);
            } else {
                setCount(0);
            }
        });

        return () => unsubscribe();
    }, [productId, appId]);

    if (!visible || count < 1) return null;

    return (
        <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium mt-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-red-500 ml-1">{count}명</span>
            <span className="text-gray-400">이 지켜보고 있어요</span>
        </div>
    );
}
