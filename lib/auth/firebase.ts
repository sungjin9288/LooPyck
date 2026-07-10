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
import { Logger } from '@/lib/core/observability';

const googleProvider = new GoogleAuthProvider();

function shouldFallbackToRedirect(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const code = (error as { code?: unknown }).code;
    if (typeof code !== 'string') return false;
    return [
        'auth/popup-blocked',
        'auth/operation-not-supported-in-this-environment',
    ].includes(code);
}

function getAuthOrThrow() {
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Check NEXT_PUBLIC_FIREBASE_* environment variables.');
    }
    return auth;
}

export const signInWithGoogle = async () => {
    const firebaseAuth = getAuthOrThrow();
    try {
        await signInWithPopup(firebaseAuth, googleProvider);
        return null;
    } catch (error) {
        if (shouldFallbackToRedirect(error)) {
            await signInWithRedirect(firebaseAuth, googleProvider);
            return null;
        }
        Logger.error('Google Sign-In Error', error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(getAuthOrThrow());
    } catch (error) {
        Logger.error('Sign-Out Error', error);
        throw error;
    }
};

export { auth };
