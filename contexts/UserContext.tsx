'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import {
    getRedirectResult,
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    linkWithRedirect,
    signInWithRedirect,
    signOut,
} from 'firebase/auth';
import { pushAppNotification } from '@/lib/core/notifications';

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
    authError: string | null;
    linkAccount: () => Promise<void>;
    clearAuthError: () => void;
}

const GOOGLE_REDIRECT_PENDING_KEY = 'loopyck:google-redirect-pending';

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
    authError: null,
    linkAccount: async () => { },
    clearAuthError: () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
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
            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
            }
            setAuthError(null);
            await signInWithRedirect(auth, provider);
        } catch (error) {
            if (isCredentialConflictError(error)) {
                await signOut(auth);
                if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
                }
                setAuthError(null);
                await signInWithRedirect(auth, provider);
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

        let cancelled = false;

        getRedirectResult(auth)
            .then((result) => {
                if (cancelled) return;
                if (typeof window !== 'undefined') {
                    if (result?.user) {
                        window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
                        setAuthError(null);
                        setUser(result.user);
                        return;
                    }

                    if (window.sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1') {
                        window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
                        const message = 'Google 인증이 완료되지 않았습니다. 브라우저 팝업/리다이렉트 차단 또는 Firebase 인증 설정을 다시 확인하세요.';
                        setAuthError(message);
                        pushAppNotification({
                            title: '로그인 실패',
                            message,
                            type: 'alert',
                        });
                    }
                }
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Redirect auth error:', error);
                if (typeof window !== 'undefined') {
                    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
                }
                const message = error instanceof Error ? error.message : '리디렉트 로그인에 실패했습니다.';
                setAuthError(message);
                pushAppNotification({
                    title: '로그인 실패',
                    message,
                    type: 'alert',
                });
            });

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser && !currentUser.isAnonymous) {
                setAuthError(null);
                if (typeof window !== 'undefined') {
                    window.sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
                }
            }
            setLoading(false);
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    return (
        <UserContext.Provider value={{
            user,
            userId: user?.uid || null,
            appId,
            loading,
            isAuthenticated: !!user && !user.isAnonymous,
            authError,
            linkAccount,
            clearAuthError: () => setAuthError(null),
        }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);
