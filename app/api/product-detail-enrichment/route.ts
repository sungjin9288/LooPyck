import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UnifiedProductSchema } from '@/lib/types/schema';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { enrichProductsWithPdpDetails } from '@/lib/server/pdpDetailService';
import { Logger } from '@/lib/core/observability';

const EnrichmentRequestSchema = z.object({
    products: z.array(UnifiedProductSchema).min(1).max(8),
});

const ENRICHMENT_RATE_LIMIT = {
    limit: 18,
    windowMs: 60_000,
} as const;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(
        getRateLimitKey(request, 'product-detail-enrichment'),
        ENRICHMENT_RATE_LIMIT.limit,
        ENRICHMENT_RATE_LIMIT.windowMs
    );
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
        const parsed = EnrichmentRequestSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
                { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        const products = await enrichProductsWithPdpDetails(parsed.data.products);
        return NextResponse.json(
            { products },
            {
                headers: {
                    'Cache-Control': 'private, no-store',
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        Logger.error('[product-detail-enrichment] request failed', error);
        return NextResponse.json(
            { error: 'internal_error' },
            {
                status: 500,
                headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) },
            }
        );
    }
}
