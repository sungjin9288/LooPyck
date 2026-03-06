import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';
import { persistSearchInteraction, recordSearchInteraction, type SearchInteractionEvent, type SearchInteractionType } from '@/lib/api/searchDiagnostics';
import { isProductSource } from '@/lib/api/types';

export const runtime = 'nodejs';

const ALLOWED_TYPES: SearchInteractionType[] = ['suggestion_click', 'product_open', 'store_click'];

function normalizeOptionalQuery(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }

    const normalized = normalizeQuery(value);
    return normalized || undefined;
}

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'realtime-search-interactions'), 120, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfterSec),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    try {
        const body = await request.json();
        const type = typeof body?.type === 'string' ? body.type as SearchInteractionType : null;
        const query = normalizeOptionalQuery(body?.query);

        if (!type || !ALLOWED_TYPES.includes(type) || !query || !isQueryLengthValid(query, 1, 60)) {
            return NextResponse.json({ error: '유효하지 않은 interaction payload 입니다.' }, { status: 400 });
        }

        const selectedQuery = normalizeOptionalQuery(body?.selectedQuery);
        const source = typeof body?.source === 'string' && isProductSource(body.source) ? body.source : undefined;
        const event: SearchInteractionEvent = {
            type,
            query,
            generatedAt: new Date().toISOString(),
            selectedQuery: selectedQuery && isQueryLengthValid(selectedQuery, 1, 60) ? selectedQuery : undefined,
            source,
            productId: typeof body?.productId === 'string' ? body.productId.slice(0, 120) : undefined,
            productTitle: typeof body?.productTitle === 'string' ? body.productTitle.slice(0, 180) : undefined,
            brand: typeof body?.brand === 'string' ? body.brand.slice(0, 80) : undefined,
            context: typeof body?.context === 'string' ? body.context.slice(0, 60) : undefined,
        };

        recordSearchInteraction(event);
        try {
            await persistSearchInteraction(event);
        } catch (persistError) {
            console.warn('[SearchInteraction] persist failed:', persistError);
        }

        return NextResponse.json(
            { ok: true },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        console.error('[SearchInteraction] invalid request:', error);
        return NextResponse.json({ error: 'interaction 저장에 실패했습니다.' }, { status: 500 });
    }
}
