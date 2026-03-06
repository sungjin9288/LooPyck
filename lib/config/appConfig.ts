const LOCAL_DEV_SITE_URL = 'http://localhost:3000';
const DEFAULT_APP_NAME = 'LooPyck';
const DEFAULT_CAPACITOR_APP_ID = 'app.loopyck.fashion';

function sanitizeOrigin(rawUrl: string | undefined, fallback: string): string {
    if (!rawUrl) return fallback;

    try {
        return new URL(rawUrl).origin;
    } catch {
        return fallback;
    }
}

function getVercelOrigin(env: NodeJS.ProcessEnv): string | undefined {
    const explicit = env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || env.VERCEL_URL?.trim();
    if (!explicit) return undefined;

    const normalized = explicit.startsWith('http://') || explicit.startsWith('https://')
        ? explicit
        : `https://${explicit}`;

    return sanitizeOrigin(normalized, LOCAL_DEV_SITE_URL);
}

export function resolveSiteName(env: NodeJS.ProcessEnv = process.env): string {
    return env.NEXT_PUBLIC_SITE_NAME?.trim() || env.SITE_NAME?.trim() || DEFAULT_APP_NAME;
}

export function resolveSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
    const fallback = getVercelOrigin(env) || LOCAL_DEV_SITE_URL;
    return sanitizeOrigin(
        env.NEXT_PUBLIC_SITE_URL?.trim() || env.SITE_URL?.trim(),
        fallback
    );
}

export function resolveCapacitorAppId(env: NodeJS.ProcessEnv = process.env): string {
    return env.CAPACITOR_APP_ID?.trim() || DEFAULT_CAPACITOR_APP_ID;
}

export function resolveCapacitorAppName(env: NodeJS.ProcessEnv = process.env): string {
    return env.CAPACITOR_APP_NAME?.trim() || resolveSiteName(env);
}

export function resolveCapacitorServerUrl(env: NodeJS.ProcessEnv = process.env): string {
    return sanitizeOrigin(
        env.CAPACITOR_SERVER_URL?.trim() || resolveSiteUrl(env),
        LOCAL_DEV_SITE_URL
    );
}
