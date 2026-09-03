import { isProductSource, type ProductSource } from '../api/types.ts';

export const SEARCH_INTERACTION_TYPES = [
    'suggestion_click',
    'product_impression',
    'product_open',
    'store_click',
] as const;

export type SearchInteractionType = typeof SEARCH_INTERACTION_TYPES[number];

export interface SearchInteractionPayload {
    type: SearchInteractionType;
    query: string;
    selectedQuery?: string;
    source?: ProductSource;
    productId?: string;
    productIds?: string[];
    productTitle?: string;
    brand?: string;
    context?: string;
}

export interface SearchInteractionEvent extends SearchInteractionPayload {
    generatedAt: string;
}

export type SearchInteractionClientPayload =
    | (SearchInteractionPayload & {
        type: 'suggestion_click';
        selectedQuery: string;
    })
    | (SearchInteractionPayload & {
        type: 'product_impression';
        productIds: string[];
        context: string;
    })
    | (SearchInteractionPayload & {
        type: 'product_open';
        productId: string;
        context: string;
    })
    | (SearchInteractionPayload & {
        type: 'store_click';
        source: ProductSource;
        productId: string;
    });

export type SearchInteractionPayloadResult =
    | { ok: true; data: SearchInteractionPayload }
    | { ok: false; error: string };

const BADGE_CONTEXT_PATTERN = /^search_results:badges=(shipping\+benefit|shipping|benefit|none)$/;

function normalizeText(value: unknown, maxLength: number, truncate: boolean = true): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = value
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
    if (!normalized || (!truncate && normalized.length > maxLength)) {
        return undefined;
    }
    return truncate ? normalized.slice(0, maxLength) : normalized;
}

function isInteractionType(value: unknown): value is SearchInteractionType {
    return typeof value === 'string'
        && SEARCH_INTERACTION_TYPES.includes(value as SearchInteractionType);
}

export function parseSearchInteractionPayload(value: unknown): SearchInteractionPayloadResult {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { ok: false, error: 'invalid_payload' };
    }

    const raw = value as Record<string, unknown>;
    const type = raw.type;
    const query = normalizeText(raw.query, 60, false);
    if (!isInteractionType(type) || !query) {
        return { ok: false, error: 'invalid_base_fields' };
    }

    const source = typeof raw.source === 'string' && isProductSource(raw.source)
        ? raw.source
        : undefined;
    const selectedQuery = normalizeText(raw.selectedQuery, 60, false);
    const productId = normalizeText(raw.productId, 120);
    const productIds = Array.isArray(raw.productIds)
        ? Array.from(new Set(
            raw.productIds
                .map((entry) => normalizeText(entry, 120))
                .filter((entry): entry is string => Boolean(entry))
        )).slice(0, 40)
        : undefined;
    const context = normalizeText(raw.context, 60);

    if (type === 'suggestion_click' && !selectedQuery) {
        return { ok: false, error: 'selected_query_required' };
    }
    if (
        type === 'product_impression'
        && (!productIds?.length || !context || !BADGE_CONTEXT_PATTERN.test(context))
    ) {
        return { ok: false, error: 'invalid_product_impression' };
    }
    if (
        type === 'product_open'
        && (!productId || !context || !BADGE_CONTEXT_PATTERN.test(context))
    ) {
        return { ok: false, error: 'invalid_product_open' };
    }
    if (type === 'store_click' && (!productId || !source)) {
        return { ok: false, error: 'invalid_store_click' };
    }

    return {
        ok: true,
        data: {
            type,
            query,
            selectedQuery,
            source,
            productId,
            productIds: productIds?.length ? productIds : undefined,
            productTitle: normalizeText(raw.productTitle, 180),
            brand: normalizeText(raw.brand, 80),
            context,
        },
    };
}
