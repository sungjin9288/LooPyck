/**
 * Firebase Auth Integration
 * Google Sign-In 및 사용자 인증 상태 관리.
 */

import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

function getAuthOrThrow() {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Check NEXT_PUBLIC_FIREBASE_* environment variables.');
    }
    return auth;
}

function shouldUseRedirectAuth() {
    if (typeof window === 'undefined') return false;
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
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

export const signInWithGoogle = async () => {
    const firebaseAuth = getAuthOrThrow();
    try {
        if (shouldUseRedirectAuth()) {
            await signInWithRedirect(firebaseAuth, googleProvider);
            return null;
        }
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        return result.user;
    } catch (error) {
        if (isPopupFlowError(error)) {
            await signInWithRedirect(firebaseAuth, googleProvider);
            return null;
        }
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(getAuthOrThrow());
    } catch (error) {
        console.error('Sign-Out Error:', error);
        throw error;
    }
};

export { auth };
