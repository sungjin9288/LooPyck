import type { ProductSource, UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';

type VariantIdentityInput = Pick<UnifiedProduct, 'source' | 'id' | 'variantId' | 'variantSku'>;

export type VariantHistoryIdentity = {
    variantKey?: string;
    variantLabel?: string;
    variantSignature?: string;
};

function normalizeWhitespace(value: string): string {
    return normalizeTitle(value).replace(/\s+/g, ' ').trim();
}

function normalizeToken(value: string, uppercase: boolean = false): string {
    const normalized = normalizeWhitespace(value);
    return uppercase ? normalized.toUpperCase() : normalized.toLowerCase();
}

function hashString(value: string): string {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
}

function buildVariantLabel(input: VariantIdentityInput): string | undefined {
    const variantSku = normalizeWhitespace(input.variantSku || '');
    const variantId = normalizeWhitespace(input.variantId || '');

    if (variantSku && variantId) {
        return `SKU ${variantSku} · Variant ${variantId}`.slice(0, 200);
    }

    if (variantSku) {
        return `SKU ${variantSku}`.slice(0, 200);
    }

    if (variantId) {
        return `Variant ${variantId}`.slice(0, 200);
    }

    return undefined;
}

export function buildVariantHistoryIdentity(input: VariantIdentityInput): VariantHistoryIdentity {
    const normalizedVariantId = normalizeToken(input.variantId || '');
    const normalizedVariantSku = normalizeToken(input.variantSku || '', true);
    const segments = [
        normalizedVariantId ? `variant:${normalizedVariantId}` : null,
        normalizedVariantSku ? `sku:${normalizedVariantSku}` : null,
    ].filter(Boolean) as string[];

    if (segments.length === 0) {
        return {};
    }

    const variantSignature = segments.join('|').slice(0, 240);
    return {
        variantKey: `var_${hashString(variantSignature)}`,
        variantLabel: buildVariantLabel(input),
        variantSignature,
    };
}

export function buildVariantHistoryStorageKey(
    source: ProductSource,
    productId: string,
    variantKey: string
): string {
    return `${source}:${productId}:${variantKey}`;
}
