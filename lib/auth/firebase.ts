/**
 * Firebase Auth Integration
 * Google Sign-In 및 사용자 인증 상태 관리.
 */

import {
    GoogleAuthProvider,
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

export const signInWithGoogle = async () => {
    const firebaseAuth = getAuthOrThrow();
    try {
        // Redirect flow is more reliable than popup flow on deployed web surfaces.
        await signInWithRedirect(firebaseAuth, googleProvider);
        return null;
    } catch (error) {
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
