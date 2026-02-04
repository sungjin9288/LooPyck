'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';

interface UserContextType {
    user: User | null;
    userId: string | null;
    appId: string;
    loading: boolean;
    isAuthenticated: boolean;
    linkAccount: () => Promise<void>;
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
        if (typeof window !== 'undefined' && (window as any).__app_id) {
            return (window as any).__app_id;
        }
        return 'default-app-id';
    });

    const linkAccount = async () => {
        if (!auth.currentUser) return;
        const provider = new GoogleAuthProvider();
        try {
            await linkWithPopup(auth.currentUser, provider);
            console.log("Account Linked Successfully");
        } catch (error) {
            console.error("Link Account Error:", error);
        }
    };

    useEffect(() => {
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
