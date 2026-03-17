import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const envPath = resolve('.env.local');

export function parseEnvFile(path = envPath) {
    if (!existsSync(path)) {
        throw new Error(`Missing ${path}. Create .env.local before running Netlify admin smoke scripts.`);
    }

    const env = new Map();
    const source = readFileSync(path, 'utf8');

    for (const line of source.split(/\r?\n/)) {
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const separatorIndex = line.indexOf('=');
        if (separatorIndex <= 0) continue;

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();
        if (!key) continue;
        env.set(key, value);
    }

    return env;
}

function getEnvValue(env, key) {
    return process.env[key] || env.get(key) || '';
}

function stripWrappingQuotes(value) {
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }
    return value;
}

export function requiredEnv(env, key) {
    const value = stripWrappingQuotes(getEnvValue(env, key));
    if (!value) {
        throw new Error(`Missing required env: ${key}`);
    }
    return value;
}

export async function createNetlifyAdminAuthPayload() {
    const env = parseEnvFile();
    const apiKey = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_API_KEY');
    const authDomain = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    const projectId = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    const storageBucket = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    const messagingSenderId = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    const appId = requiredEnv(env, 'NEXT_PUBLIC_FIREBASE_APP_ID');
    const adminUids = requiredEnv(env, 'ADMIN_UIDS')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const adminUid = adminUids[0];

    if (!adminUid) {
        throw new Error('ADMIN_UIDS must contain at least one UID.');
    }

    const adminProjectId = requiredEnv(env, 'FIREBASE_ADMIN_PROJECT_ID');
    const clientEmail = requiredEnv(env, 'FIREBASE_ADMIN_CLIENT_EMAIL');
    const privateKey = requiredEnv(env, 'FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n');

    const app = getApps()[0] || initializeApp({
        credential: cert({
            projectId: adminProjectId,
            clientEmail,
            privateKey,
        }),
        projectId: adminProjectId,
    });

    const adminAuth = getAuth(app);
    const customToken = await adminAuth.createCustomToken(adminUid);

    return {
        adminUid,
        customToken,
        firebaseConfig: {
            apiKey,
            authDomain,
            projectId,
            storageBucket,
            messagingSenderId,
            appId,
        },
    };
}
