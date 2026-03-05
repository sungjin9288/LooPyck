'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import {
    signInAnonymously,
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    linkWithPopup,
    linkWithRedirect,
} from 'firebase/auth';

declare global {
    interface Window {
        __app_id?: string;
    }
}

interface UserContextType {
    user: User | null;
    userId: string | null;
    appId: string;
    loading: boolean;
    isAuthenticated: boolean;
    linkAccount: () => Promise<void>;
}

function isPopupFlowError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: unknown }).code;
    if (typeof code !== 'string') return false;
    return [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/operation-not-supported-in-this-environment',
    ].includes(code);
}

const UserContext = createContext<UserContextType>({
    user: null,
    userId: null,
    appId: 'default-app-id',
    loading: true,
    isAuthenticated: false,
    linkAccount: async () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // Safe resolution of global __app_id
    const [appId] = useState(() => {
        if (typeof window !== 'undefined' && window.__app_id) {
            return window.__app_id;
        }
        return 'default-app-id';
    });

    const linkAccount = async () => {
        if (!auth || !auth.currentUser) {
            throw new Error('Authentication is not initialized.');
        }

        if (!auth.currentUser.isAnonymous) {
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            if (typeof window !== 'undefined' && /iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
                await linkWithRedirect(auth.currentUser, provider);
                return;
            }
            await linkWithPopup(auth.currentUser, provider);
        } catch (error) {
            if (isPopupFlowError(error)) {
                await linkWithRedirect(auth.currentUser, provider);
                return;
            }
            console.error('Link account error:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // Initialize Anonymous Auth if not already signed in
        if (!auth.currentUser) {
            signInAnonymously(auth).catch((error) => {
                console.error("Auth Error:", error);
                setLoading(false);
            });
        }

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            userId: user?.uid || null,
            appId,
            loading,
            isAuthenticated: !!user,
            linkAccount
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
