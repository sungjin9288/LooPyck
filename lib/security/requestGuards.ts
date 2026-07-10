import { NextRequest } from 'next/server';
import { Logger, toErrorMessage } from '@/lib/core/observability';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSec: number;
}

const CLEANUP_INTERVAL_MS = 10_000;
const MAX_RATE_LIMIT_KEYS = 10_000;
const TARGET_RATE_LIMIT_KEYS = 8_000;
const IP_HEADER_PRIORITY = [
    'x-vercel-forwarded-for',
    'cf-connecting-ip',
    'x-real-ip',
    'x-forwarded-for',
] as const;
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6_REGEX = /^[0-9a-f:]{2,45}$/i;
const RATE_LIMIT_PREFIX = process.env.RATE_LIMIT_PREFIX || 'loopyck:rl';
const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_TIMEOUT_MS = 1200;

const globalRateLimit = globalThis as typeof globalThis & {
    __loopyckRateLimitStore?: Map<string, RateLimitEntry>;
    __loopyckRateLimitLastCleanupAt?: number;
    __loopyckRedisFallbackLogged?: boolean;
};

const rateLimitStore =
    globalRateLimit.__loopyckRateLimitStore ?? new Map<string, RateLimitEntry>();
globalRateLimit.__loopyckRateLimitStore = rateLimitStore;

function maybeCleanupExpired(now: number): void {
    const lastCleanupAt = globalRateLimit.__loopyckRateLimitLastCleanupAt ?? 0;
    const shouldCleanup =
        now - lastCleanupAt >= CLEANUP_INTERVAL_MS || rateLimitStore.size >= MAX_RATE_LIMIT_KEYS;

    if (!shouldCleanup) {
        return;
    }

    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetAt <= now) {
            rateLimitStore.delete(key);
        }
    }

    if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
        while (rateLimitStore.size > TARGET_RATE_LIMIT_KEYS) {
            const oldestKey = rateLimitStore.keys().next().value;
            if (!oldestKey) break;
            rateLimitStore.delete(oldestKey);
        }
    }

    globalRateLimit.__loopyckRateLimitLastCleanupAt = now;
}

function normalizeForwardedIp(raw: string): string {
    const first = raw.split(',')[0]?.trim() || '';
    if (!first) return '';

    if (first.startsWith('[') && first.includes(']')) {
        return first.slice(1, first.indexOf(']')).trim();
    }

    const colonCount = (first.match(/:/g) || []).length;
    if (colonCount === 1 && first.includes('.')) {
        const [host] = first.split(':');
        return host.trim();
    }

    return first;
}

function isValidIp(ip: string): boolean {
    if (!ip) return false;
    if (IPV4_REGEX.test(ip)) return true;
    return ip.includes(':') && IPV6_REGEX.test(ip);
}

export function getClientIp(request: NextRequest): string {
    for (const headerName of IP_HEADER_PRIORITY) {
        const value = request.headers.get(headerName);
        if (!value) continue;

        const candidate = normalizeForwardedIp(value);
        if (isValidIp(candidate)) {
            return candidate;
        }
    }

    return 'unknown';
}

function hashClientFingerprint(value: string): string {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

export function getRateLimitKey(request: NextRequest, scope: string): string {
    const ip = getClientIp(request);
    const ua = (request.headers.get('user-agent') || 'unknown')
        .trim()
        .toLowerCase()
        .slice(0, 160);
    const uaHash = hashClientFingerprint(ua);
    return `${scope}:${ip}:${uaHash}`;
}

function checkRateLimitMemory(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    maybeCleanupExpired(now);

    const current = rateLimitStore.get(key);
    if (!current || current.resetAt <= now) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return {
            allowed: true,
            remaining: Math.max(limit - 1, 0),
            retryAfterSec: Math.ceil(windowMs / 1000),
        };
    }

    if (current.count >= limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSec: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
        };
    }

    current.count += 1;
    rateLimitStore.set(key, current);

    return {
        allowed: true,
        remaining: Math.max(limit - current.count, 0),
        retryAfterSec: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
}

function resolvePipelineResult(entry: unknown): unknown {
    if (entry && typeof entry === 'object' && 'result' in entry) {
        return (entry as { result?: unknown }).result;
    }
    return entry;
}

function hasPipelineError(entry: unknown): boolean {
    return Boolean(entry && typeof entry === 'object' && 'error' in entry && (entry as { error?: unknown }).error);
}

function parseNumericResult(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    return NaN;
}

function logRedisFallbackOnce(error: unknown): void {
    if (globalRateLimit.__loopyckRedisFallbackLogged) {
        return;
    }
    globalRateLimit.__loopyckRedisFallbackLogged = true;
    Logger.warn('[RateLimit] Redis unavailable, falling back to in-memory limiter.', { error: toErrorMessage(error) });
}

function buildRedisRateLimitKey(key: string): string {
    return `${RATE_LIMIT_PREFIX}:${key}`;
}

async function checkRateLimitRedis(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult | null> {
    if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
        return null;
    }

    try {
        const redisKey = buildRedisRateLimitKey(key);
        const response = await fetch(`${REDIS_REST_URL}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${REDIS_REST_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', redisKey],
                ['PEXPIRE', redisKey, String(windowMs), 'NX'],
                ['PTTL', redisKey],
            ]),
            cache: 'no-store',
            signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
        });

        if (!response.ok) {
            throw new Error(`Redis HTTP ${response.status}`);
        }

        const payload = await response.json() as unknown;
        if (!Array.isArray(payload) || payload.length < 3) {
            return null;
        }
        if (payload.some(hasPipelineError)) {
            return null;
        }

        const count = parseNumericResult(resolvePipelineResult(payload[0]));
        const ttlMsRaw = parseNumericResult(resolvePipelineResult(payload[2]));
        const ttlMs = Number.isFinite(ttlMsRaw) && ttlMsRaw > 0 ? ttlMsRaw : windowMs;

        if (!Number.isFinite(count) || count <= 0) {
            return null;
        }

        return {
            allowed: count <= limit,
            remaining: Math.max(limit - count, 0),
            retryAfterSec: Math.max(Math.ceil(ttlMs / 1000), 1),
        };
    } catch (error) {
        logRedisFallbackOnce(error);
        return null;
    }
}

export async function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): Promise<RateLimitResult> {
    const redisResult = await checkRateLimitRedis(key, limit, windowMs);
    if (redisResult) {
        return redisResult;
    }
    return checkRateLimitMemory(key, limit, windowMs);
}

export function normalizeQuery(rawQuery: string | null): string {
    if (!rawQuery) return '';
    return rawQuery.trim().replace(/\s+/g, ' ');
}

export function isQueryLengthValid(query: string, min: number = 1, max: number = 60): boolean {
    return query.length >= min && query.length <= max;
}
