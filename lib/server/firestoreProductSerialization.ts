import type { ProductVariantCandidate } from '../api/types.ts';

function normalizeText(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value.trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, maxLength);
    return normalized || undefined;
}

function normalizeMoney(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return undefined;
    }
    return Math.max(0, Math.floor(value));
}

export function normalizeOptionalVariantCandidates(value: unknown, maxItems: number = 24): ProductVariantCandidate[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const candidates = value.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
            return [];
        }

        const candidate = entry as Record<string, unknown>;
        const label = normalizeText(candidate.label, 120);
        if (!label) {
            return [];
        }

        return [{
            label,
            variantId: normalizeText(candidate.variantId, 120),
            variantSku: normalizeText(candidate.variantSku, 120),
            color: normalizeText(candidate.color, 60),
            size: normalizeText(candidate.size, 40),
            price: normalizeMoney(candidate.price),
            stockStatus: candidate.stockStatus === 'in_stock'
                || candidate.stockStatus === 'low_stock'
                || candidate.stockStatus === 'sold_out'
                || candidate.stockStatus === 'unknown'
                ? candidate.stockStatus
                : undefined,
        } satisfies ProductVariantCandidate];
    }).slice(0, maxItems);

    return candidates.length > 0 ? candidates : undefined;
}

export function serializeVariantCandidatesForFirestore(value: unknown): Array<Record<string, unknown>> | null {
    const candidates = normalizeOptionalVariantCandidates(value, 24);
    if (!candidates) {
        return null;
    }

    return candidates.map((candidate) => ({
        label: candidate.label,
        variantId: candidate.variantId || null,
        variantSku: candidate.variantSku || null,
        color: candidate.color || null,
        size: candidate.size || null,
        price: candidate.price ?? null,
        stockStatus: candidate.stockStatus || null,
    }));
}
