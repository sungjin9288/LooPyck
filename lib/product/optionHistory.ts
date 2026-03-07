import type { ProductSource, UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';

type OptionIdentityInput = Pick<
    UnifiedProduct,
    'source' | 'id' | 'variantId' | 'variantSku' | 'optionSummary' | 'optionValues' | 'sizeOptions' | 'colorOptions'
>;

export type OptionHistoryIdentity = {
    optionKey?: string;
    optionLabel?: string;
    optionSignature?: string;
};

function normalizeWhitespace(value: string): string {
    return normalizeTitle(value).replace(/\s+/g, ' ').trim();
}

function normalizeToken(value: string, uppercase: boolean = false): string {
    const normalized = normalizeWhitespace(value);
    return uppercase ? normalized.toUpperCase() : normalized.toLowerCase();
}

function toDistinctNormalized(values: string[] | undefined, uppercase: boolean = false): string[] {
    if (!Array.isArray(values)) return [];

    return Array.from(new Set(
        values
            .map((value) => normalizeToken(value, uppercase))
            .filter(Boolean)
    )).sort((left, right) => left.localeCompare(right));
}

function toDistinctLabels(values: string[] | undefined, uppercase: boolean = false): string[] {
    if (!Array.isArray(values)) return [];

    return Array.from(new Set(
        values
            .map((value) => normalizeWhitespace(value))
            .filter(Boolean)
            .map((value) => uppercase ? value.toUpperCase() : value)
    ));
}

function previewList(prefix: string, values: string[]): string | undefined {
    if (values.length === 0) return undefined;
    const preview = values.slice(0, 3).join(', ');
    return values.length > 3 ? `${prefix} ${preview} 외 ${values.length - 3}` : `${prefix} ${preview}`;
}

function buildOptionLabel(input: OptionIdentityInput): string | undefined {
    const summary = normalizeWhitespace(input.optionSummary || '');
    if (summary) {
        return summary.slice(0, 200);
    }

    const variantSku = normalizeWhitespace(input.variantSku || '');
    if (variantSku) {
        return `SKU ${variantSku}`.slice(0, 200);
    }

    const colorLabels = toDistinctLabels(input.colorOptions);
    const sizeLabels = toDistinctLabels(input.sizeOptions, true);
    const optionLabels = toDistinctLabels(input.optionValues);
    const parts = [
        previewList('색상', colorLabels),
        previewList('사이즈', sizeLabels),
    ].filter(Boolean) as string[];

    if (parts.length > 0) {
        return parts.join(' · ').slice(0, 200);
    }

    if (optionLabels.length === 0) {
        return undefined;
    }

    const preview = optionLabels.slice(0, 4).join(', ');
    return (optionLabels.length > 4 ? `옵션 ${preview} 외 ${optionLabels.length - 4}` : `옵션 ${preview}`).slice(0, 200);
}

function hashString(value: string): string {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
}

export function buildOptionHistoryIdentity(input: OptionIdentityInput): OptionHistoryIdentity {
    const normalizedVariantId = normalizeToken(input.variantId || '');
    const normalizedVariantSku = normalizeToken(input.variantSku || '', true);
    const colors = toDistinctNormalized(input.colorOptions);
    const sizes = toDistinctNormalized(input.sizeOptions, true);
    const options = toDistinctNormalized(input.optionValues);
    const normalizedSummary = normalizeWhitespace(input.optionSummary || '').toLowerCase();
    const segments = [
        normalizedVariantId ? `variant:${normalizedVariantId}` : null,
        normalizedVariantSku ? `sku:${normalizedVariantSku}` : null,
        colors.length > 0 ? `c:${colors.join(',')}` : null,
        sizes.length > 0 ? `s:${sizes.join(',')}` : null,
        options.length > 0 ? `o:${options.join(',')}` : null,
        !normalizedVariantId && !normalizedVariantSku && !colors.length && !sizes.length && !options.length && normalizedSummary ? `summary:${normalizedSummary}` : null,
    ].filter(Boolean) as string[];

    if (segments.length === 0) {
        return {};
    }

    const optionSignature = segments.join('|').slice(0, 400);
    return {
        optionKey: `opt_${hashString(optionSignature)}`,
        optionLabel: buildOptionLabel(input),
        optionSignature,
    };
}

export function buildOptionHistoryStorageKey(
    source: ProductSource,
    productId: string,
    optionKey: string
): string {
    return `${source}:${productId}:${optionKey}`;
}
