import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;

type CheckStatus = 'ok' | 'warn' | 'error';

type CheckResult = {
    key: string;
    status: CheckStatus;
    message: string;
};

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const requiredLocal = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

const requiredOps = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'ADMIN_UIDS',
    'NEXT_PUBLIC_SITE_URL',
] as const;

const optionalOps = [
    'CRON_SECRET',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
    'GEMINI_API_KEY',
    'ALERT_TUNING_WEBHOOK_URL',
    'ALERT_TUNING_WEBHOOK_FORMAT',
    'ALERT_TUNING_WEBHOOK_BEARER',
] as const;

function getEnv(key: string): string {
    return (process.env[key] || '').trim();
}

function isValidUrl(value: string): boolean {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function checkPresence(key: string, required = true): CheckResult {
    const value = getEnv(key);
    if (!value) {
        return {
            key,
            status: required ? 'error' : 'warn',
            message: required ? 'missing' : 'not set',
        };
    }

    return {
        key,
        status: 'ok',
        message: 'set',
    };
}

function checkPrivateKey(): CheckResult {
    const value = getEnv('FIREBASE_ADMIN_PRIVATE_KEY');
    if (!value) {
        return { key: 'FIREBASE_ADMIN_PRIVATE_KEY', status: 'error', message: 'missing' };
    }

    const hasBegin = value.includes('-----BEGIN PRIVATE KEY-----');
    const hasEnd = value.includes('-----END PRIVATE KEY-----');
    const hasEscapedLineBreak = value.includes('\\n');
    const hasRealLineBreak = value.includes('\n');
    if (!hasBegin || !hasEnd || (!hasEscapedLineBreak && !hasRealLineBreak)) {
        return {
            key: 'FIREBASE_ADMIN_PRIVATE_KEY',
            status: 'error',
            message: 'invalid format (expected BEGIN/END markers with line breaks)',
        };
    }

    return {
        key: 'FIREBASE_ADMIN_PRIVATE_KEY',
        status: 'ok',
        message: 'set',
    };
}

function checkAdminUids(): CheckResult {
    const value = getEnv('ADMIN_UIDS');
    if (!value) {
        return { key: 'ADMIN_UIDS', status: 'error', message: 'missing' };
    }

    const uidCount = value.split(',').map((entry) => entry.trim()).filter(Boolean).length;
    if (uidCount === 0) {
        return { key: 'ADMIN_UIDS', status: 'error', message: 'invalid (empty list)' };
    }

    return {
        key: 'ADMIN_UIDS',
        status: 'ok',
        message: `${uidCount} uid${uidCount > 1 ? 's' : ''}`,
    };
}

function checkSiteUrl(): CheckResult {
    const value = getEnv('NEXT_PUBLIC_SITE_URL');
    if (!value) {
        return { key: 'NEXT_PUBLIC_SITE_URL', status: 'error', message: 'missing' };
    }

    if (!isValidUrl(value)) {
        return { key: 'NEXT_PUBLIC_SITE_URL', status: 'error', message: 'invalid URL' };
    }

    return { key: 'NEXT_PUBLIC_SITE_URL', status: 'ok', message: 'set' };
}

function checkWebhookConfig(): CheckResult[] {
    const url = getEnv('ALERT_TUNING_WEBHOOK_URL');
    const format = getEnv('ALERT_TUNING_WEBHOOK_FORMAT');
    const bearer = getEnv('ALERT_TUNING_WEBHOOK_BEARER');
    const results: CheckResult[] = [];

    if (!url) {
        results.push({ key: 'ALERT_TUNING_WEBHOOK_URL', status: 'warn', message: 'not set' });
        if (format) {
            results.push({ key: 'ALERT_TUNING_WEBHOOK_FORMAT', status: 'warn', message: 'set without webhook URL' });
        }
        if (bearer) {
            results.push({ key: 'ALERT_TUNING_WEBHOOK_BEARER', status: 'warn', message: 'set without webhook URL' });
        }
        return results;
    }

    results.push({
        key: 'ALERT_TUNING_WEBHOOK_URL',
        status: isValidUrl(url) ? 'ok' : 'error',
        message: isValidUrl(url) ? 'set' : 'invalid URL',
    });

    if (format) {
        const allowed = new Set(['generic', 'slack', 'discord']);
        results.push({
            key: 'ALERT_TUNING_WEBHOOK_FORMAT',
            status: allowed.has(format) ? 'ok' : 'error',
            message: allowed.has(format) ? format : 'invalid (allowed: generic, slack, discord)',
        });
    } else {
        results.push({
            key: 'ALERT_TUNING_WEBHOOK_FORMAT',
            status: 'warn',
            message: 'not set (auto-detect will be used)',
        });
    }

    if (bearer) {
        results.push({ key: 'ALERT_TUNING_WEBHOOK_BEARER', status: 'ok', message: 'set' });
    }

    return results;
}

function printSection(title: string, results: CheckResult[]) {
    console.log(`\n[${title}]`);
    for (const result of results) {
        const prefix = result.status === 'ok'
            ? 'OK'
            : result.status === 'warn'
                ? 'WARN'
                : 'ERROR';
        console.log(`${prefix.padEnd(5)} ${result.key} - ${result.message}`);
    }
}

const localResults = requiredLocal.map((key) => checkPresence(key, true));
const opsResults = [
    checkPresence('FIREBASE_ADMIN_PROJECT_ID', true),
    checkPresence('FIREBASE_ADMIN_CLIENT_EMAIL', true),
    checkPrivateKey(),
    checkAdminUids(),
    checkSiteUrl(),
];
const optionalResults = [
    checkPresence('CRON_SECRET', false),
    checkPresence('UPSTASH_REDIS_REST_URL', false),
    checkPresence('UPSTASH_REDIS_REST_TOKEN', false),
    checkPresence('NEXT_PUBLIC_FIREBASE_VAPID_KEY', false),
    checkPresence('GEMINI_API_KEY', false),
    ...checkWebhookConfig(),
];

printSection('Local Required', localResults);
printSection('Ops Required', opsResults);
printSection('Optional / Feature Flags', optionalResults);

const manualActions: string[] = [];

for (const result of [...localResults, ...opsResults]) {
    if (result.status === 'error') {
        manualActions.push(`${result.key}: ${result.message}`);
    }
}

for (const result of optionalResults) {
    if (result.status === 'warn') {
        manualActions.push(`${result.key}: ${result.message}`);
    }
}

console.log('\n[Manual Actions]');
if (manualActions.length === 0) {
    console.log('OK    no manual action required for current environment');
} else {
    for (const action of manualActions) {
        console.log(`TODO  ${action}`);
    }
}

const hasErrors = [...localResults, ...opsResults, ...optionalResults].some((result) => result.status === 'error');
process.exitCode = hasErrors ? 1 : 0;
