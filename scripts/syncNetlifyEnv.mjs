import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('.env.local');
const targetPath = resolve('.netlify.env');
const netlifySiteUrl = 'https://loo-pyck.netlify.app';

const allowlist = [
    'NAVER_CLIENT_ID',
    'NAVER_CLIENT_SECRET',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'ADMIN_UIDS',
    'NEXT_PUBLIC_SITE_URL',
    'SITE_URL',
    'GEMINI_API_KEY',
    'CRON_SECRET',
    'ALERT_TUNING_WEBHOOK_URL',
    'ALERT_TUNING_WEBHOOK_FORMAT',
    'ALERT_TUNING_WEBHOOK_BEARER',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'RATE_LIMIT_PREFIX',
];

if (!existsSync(sourcePath)) {
    console.error('Missing .env.local. Create it before syncing Netlify vars.');
    process.exit(1);
}

const normalized = new Map();
const source = readFileSync(sourcePath, 'utf8');

for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    if (!key || !allowlist.includes(key)) continue;

    normalized.set(key, value);
}

normalized.set('NEXT_PUBLIC_SITE_URL', netlifySiteUrl);
normalized.set('SITE_URL', netlifySiteUrl);

const output = [
    '# Generated from .env.local by npm run ntl:sync-env',
    '# Do not commit this file.',
    ...Array.from(normalized.entries()).map(([key, value]) => `${key}=${value}`),
    '',
].join('\n');

writeFileSync(targetPath, output, 'utf8');
console.log(`Wrote ${normalized.size} Netlify variables to ${targetPath}`);
