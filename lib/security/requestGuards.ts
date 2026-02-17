import { NextRequest } from 'next/server';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSec: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpired(now: number): void {
    for (const [key, value] of rateLimitStore.entries()) {
        if (value.resetAt <= now) {
            rateLimitStore.delete(key);
        }
    }
}

export function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const first = forwardedFor.split(',')[0]?.trim();
        if (first) return first;
    }

    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;

    return 'unknown';
}

export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
): RateLimitResult {
    const now = Date.now();
    cleanupExpired(now);

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

export function normalizeQuery(rawQuery: string | null): string {
    if (!rawQuery) return '';
    return rawQuery.trim().replace(/\s+/g, ' ');
}

export function isQueryLengthValid(query: string, min: number = 1, max: number = 60): boolean {
    return query.length >= min && query.length <= max;
}
