import { isProductSource, type ProductSource, type ProductVariantCandidate, type UnifiedProduct } from '@/lib/api/types';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';

const MAX_SNAPSHOT_CHARS = 12_000;

function normalizeText(value: string, maxLength: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = normalizeText(value, maxLength);
    return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalMoney(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
        ? Math.floor(value)
        : undefined;
}

function normalizeOptionalStringArray(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
    if (!Array.isArray(value)) return undefined;

    const normalized = value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => normalizeText(entry, maxLength))
        .filter(Boolean)
        .slice(0, maxItems);

    return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalVariantCandidates(value: unknown, maxItems: number = 24): ProductVariantCandidate[] | undefined {
    if (!Array.isArray(value)) return undefined;

    const normalized = value.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
            return [];
        }

        const candidate = entry as Record<string, unknown>;
        const label = normalizeOptionalText(candidate.label, 120);
        if (!label) {
            return [];
        }

        const normalizedCandidate: ProductVariantCandidate = {
            label,
            variantId: normalizeOptionalText(candidate.variantId, 120),
            variantSku: normalizeOptionalText(candidate.variantSku, 120),
            color: normalizeOptionalText(candidate.color, 60),
            size: normalizeOptionalText(candidate.size, 40),
            price: normalizeOptionalMoney(candidate.price),
            stockStatus: candidate.stockStatus === 'in_stock' || candidate.stockStatus === 'low_stock' || candidate.stockStatus === 'sold_out' || candidate.stockStatus === 'unknown'
                ? candidate.stockStatus
                : undefined,
        };

        return [normalizedCandidate];
    }).slice(0, maxItems);

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
    return toBase64(JSON.stringify({
        ...product,
        variantCandidates: product.variantCandidates?.slice(0, 8),
    }));
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
        if (!isProductSource(source)) return null;

        return {
            id,
            title,
            price,
            image,
            link,
            mallName,
            source,
            brand: normalizeOptionalText(parsed.brand, 120),
            category1: normalizeOptionalText(parsed.category1, 80),
            category2: normalizeOptionalText(parsed.category2, 80),
            shippingFee: normalizeOptionalMoney(parsed.shippingFee),
            shippingFreeThreshold: normalizeOptionalMoney(parsed.shippingFreeThreshold),
            shippingText: normalizeOptionalText(parsed.shippingText, 160),
            benefitPrice: normalizeOptionalMoney(parsed.benefitPrice),
            benefitText: normalizeOptionalText(parsed.benefitText, 160),
            stockStatus: parsed.stockStatus === 'in_stock' || parsed.stockStatus === 'low_stock' || parsed.stockStatus === 'sold_out' || parsed.stockStatus === 'unknown'
                ? parsed.stockStatus
                : undefined,
            stockText: normalizeOptionalText(parsed.stockText, 120),
            variantId: normalizeOptionalText(parsed.variantId, 120),
            variantSku: normalizeOptionalText(parsed.variantSku, 120),
            optionSummary: normalizeOptionalText(parsed.optionSummary, 200),
            optionValues: normalizeOptionalStringArray(parsed.optionValues, 12, 60),
            sizeOptions: normalizeOptionalStringArray(parsed.sizeOptions, 12, 40),
            colorOptions: normalizeOptionalStringArray(parsed.colorOptions, 12, 40),
            variantCandidates: normalizeOptionalVariantCandidates(parsed.variantCandidates, 8),
            detailCollectedAt: normalizeOptionalText(parsed.detailCollectedAt, 64),
        };
    } catch {
        return null;
    }
}

export function normalizeProductSource(value: unknown): ProductSource | null {
    return typeof value === 'string' && isProductSource(value) ? value : null;
}

export function buildCanonicalProductDetailHref(
    product: Pick<UnifiedProduct, 'id' | 'source'>,
    options?: { variantKey?: string }
): string {
    const params = new URLSearchParams({ source: product.source });
    if (options?.variantKey) {
        params.set('variantKey', options.variantKey);
    }
    return `/product/${encodeURIComponent(product.id)}?${params.toString()}`;
}

export function buildProductDetailHref(
    product: UnifiedProduct,
    options?: { variantKey?: string }
): string {
    const snapshot = encodeProductSnapshot(product);
    const params = new URLSearchParams({
        source: product.source,
        snapshot,
    });
    if (options?.variantKey) {
        params.set('variantKey', options.variantKey);
    }
    return `/product/${encodeURIComponent(product.id)}?${params.toString()}`;
}
