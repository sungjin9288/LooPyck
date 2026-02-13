import type { UnifiedProduct } from '@/lib/api/types';

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
    try {
        const parsed = JSON.parse(fromBase64(snapshot));
        if (!parsed || typeof parsed !== 'object') return null;
        if (typeof parsed.id !== 'string') return null;
        if (typeof parsed.title !== 'string') return null;
        if (typeof parsed.price !== 'number') return null;
        if (typeof parsed.image !== 'string') return null;
        if (typeof parsed.link !== 'string') return null;
        if (typeof parsed.mallName !== 'string') return null;
        if (typeof parsed.source !== 'string') return null;
        return parsed as UnifiedProduct;
    } catch {
        return null;
    }
}

export function buildProductDetailHref(product: UnifiedProduct): string {
    const snapshot = encodeProductSnapshot(product);
    return `/product/${encodeURIComponent(product.id)}?snapshot=${encodeURIComponent(snapshot)}`;
}
