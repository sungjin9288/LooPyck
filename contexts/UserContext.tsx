'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithRedirect,
    signOut,
} from 'firebase/auth';
import { Logger } from '@/lib/core/observability';

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

function isCredentialConflictError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: unknown }).code;
    if (typeof code !== 'string') return false;
    return [
        'auth/credential-already-in-use',
        'auth/email-already-in-use',
        'auth/account-exists-with-different-credential',
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
        if (!auth) {
            throw new Error('Authentication is not initialized.');
        }

        if (auth.currentUser && !auth.currentUser.isAnonymous) {
            return;
        }

        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
        } catch (error) {
            if (isCredentialConflictError(error)) {
                await signOut(auth);
                await signInWithRedirect(auth, provider);
                return;
            }

            Logger.error('[UserContext] account linking failed', error);
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

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            userId: user?.uid || null,
            appId,
            loading,
            isAuthenticated: !!user && !user.isAnonymous,
            linkAccount,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
