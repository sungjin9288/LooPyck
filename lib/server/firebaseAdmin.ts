import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Auth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import type { Messaging } from 'firebase-admin/messaging';
import { Logger } from '../core/observability.ts';

type CachedAdmin = {
    app: App | null;
    db: Firestore | null;
    messaging: Messaging | null;
    auth: Auth | null;
    initialized: boolean;
};

const globalAdmin = globalThis as typeof globalThis & {
    __loopyckAdmin?: CachedAdmin;
    __loopyckAdminMissingLogged?: boolean;
};

function getPrivateKey(): string | null {
    const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!raw) return null;
    return raw.replace(/\\n/g, '\n');
}

function initAdmin(): CachedAdmin {
    const existing = globalAdmin.__loopyckAdmin;
    if (existing?.initialized) {
        return existing;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || null;
    const privateKey = getPrivateKey();

    try {
        let app: App;
        if (getApps().length > 0) {
            app = getApps()[0]!;
        } else if (projectId && clientEmail && privateKey) {
            app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
                projectId,
            });
        } else {
            if (!globalAdmin.__loopyckAdminMissingLogged) {
                globalAdmin.__loopyckAdminMissingLogged = true;
                Logger.warn(
                    '[FirebaseAdmin] Missing FIREBASE_ADMIN_* env. Price history and alert scanner are disabled.'
                );
            }
            globalAdmin.__loopyckAdmin = {
                app: null,
                db: null,
                messaging: null,
                auth: null,
                initialized: true,
            };
            return globalAdmin.__loopyckAdmin;
        }

        const cached: CachedAdmin = {
            app,
            db: getFirestore(app),
            messaging: getMessaging(app),
            auth: getAuth(app),
            initialized: true,
        };
        globalAdmin.__loopyckAdmin = cached;
        return cached;
    } catch (error) {
        Logger.error('[FirebaseAdmin] Initialization failed', error);
        globalAdmin.__loopyckAdmin = {
            app: null,
            db: null,
            messaging: null,
            auth: null,
            initialized: true,
        };
        return globalAdmin.__loopyckAdmin;
    }
}

export function getAdminDb(): Firestore | null {
    return initAdmin().db;
}

export function getAdminMessaging(): Messaging | null {
    return initAdmin().messaging;
}

export function getAdminAuth(): Auth | null {
    return initAdmin().auth;
}

export function isFirebaseAdminConfigured(): boolean {
    return Boolean(
        (process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
    );
}
