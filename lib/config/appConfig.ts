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

/**
 * cap sync 시점 안전장치 — 서버 URL이 localhost 폴백이면 명시적으로 실패시킨다.
 * env 누락 상태로 sync하면 cleartext:false와 결합해 아무것도 열지 못하는
 * 빈 껍데기 앱이 조용히 빌드된다(6/30 점검 4.4 위험 ②). 로컬 라이브리로드가
 * 필요하면 CAPACITOR_ALLOW_LOCALHOST=1로 의도를 명시해야 한다.
 */
export function assertCapacitorRemoteServerUrl(
    url: string,
    env: NodeJS.ProcessEnv = process.env
): string {
    const isLocalhostFallback = url === LOCAL_DEV_SITE_URL;
    const localhostExplicitlyAllowed = env.CAPACITOR_ALLOW_LOCALHOST === '1';

    if (isLocalhostFallback && !localhostExplicitlyAllowed) {
        throw new Error(
            'Capacitor server.url이 localhost 폴백입니다 — 프로덕션 앱이 아무 페이지도 열지 못합니다. '
            + 'npm run cap:sync:prod를 사용하거나 CAPACITOR_SERVER_URL을 설정하세요. '
            + '로컬 라이브리로드가 목적이면 CAPACITOR_ALLOW_LOCALHOST=1을 명시하세요.'
        );
    }

    return url;
}
