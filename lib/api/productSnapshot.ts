import type { UnifiedProduct } from '@/lib/api/types';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';

const MAX_SNAPSHOT_CHARS = 12_000;
const ALLOWED_SOURCES = new Set<UnifiedProduct['source']>([
    'NAVER',
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'FARFETCH',
    'COUPANG',
    'SSENSE',
]);

function normalizeText(value: string, maxLength: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = normalizeText(value, maxLength);
    return normalized.length > 0 ? normalized : undefined;
}

function toBase64(input: string): string {
    if (typeof window !== 'undefined') {
        return btoa(unescape(encodeURIComponent(input)));
    }
    return Buffer.from(input, 'utf8').toString('base64url');
}

function fromBase64(input: string): string {
    if (typeof window !== 'undefined') {
        return decodeURIComponent(escape(atob(input)));
    }
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

export function encodeProductSnapshot(product: UnifiedProduct): string {
    return toBase64(JSON.stringify(product));
}

export function decodeProductSnapshot(snapshot: string): UnifiedProduct | null {
    if (snapshot.length > MAX_SNAPSHOT_CHARS) {
        return null;
    }

    try {
        const parsed = JSON.parse(fromBase64(snapshot));
        if (!parsed || typeof parsed !== 'object') return null;

        const id = typeof parsed.id === 'string' ? normalizeText(parsed.id, 120) : '';
        const title = typeof parsed.title === 'string' ? normalizeText(parsed.title, 300) : '';
        const price = typeof parsed.price === 'number' && Number.isFinite(parsed.price)
            ? Math.max(0, Math.floor(parsed.price))
            : NaN;
        const image = typeof parsed.image === 'string' ? sanitizeExternalUrl(parsed.image) : null;
        const link = typeof parsed.link === 'string' ? sanitizeExternalUrl(parsed.link) : null;
        const mallName = typeof parsed.mallName === 'string' ? normalizeText(parsed.mallName, 120) : '';
        const source = typeof parsed.source === 'string' ? parsed.source : '';

        if (!id || !title || !mallName) return null;
        if (!Number.isFinite(price)) return null;
        if (!image || !link) return null;
        if (!ALLOWED_SOURCES.has(source as UnifiedProduct['source'])) return null;

        return {
            id,
            title,
            price,
            image,
            link,
            mallName,
            source: source as UnifiedProduct['source'],
            brand: normalizeOptionalText(parsed.brand, 120),
            category1: normalizeOptionalText(parsed.category1, 80),
            category2: normalizeOptionalText(parsed.category2, 80),
        };
    } catch {
        return null;
    }
}

export function buildProductDetailHref(product: UnifiedProduct): string {
    const snapshot = encodeProductSnapshot(product);
    return `/product/${encodeURIComponent(product.id)}?snapshot=${encodeURIComponent(snapshot)}`;
}
