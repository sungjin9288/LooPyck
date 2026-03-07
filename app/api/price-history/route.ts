import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ALLOWED_PRODUCT_SOURCES } from '@/lib/api/types';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { readPriceHistory } from '@/lib/server/priceHistoryStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HistoryQuerySchema = z.object({
    source: z.enum(ALLOWED_PRODUCT_SOURCES),
    id: z.string().trim().min(1).max(160),
    variantKey: z.string().trim().min(1).max(120).optional(),
    optionKey: z.string().trim().min(1).max(120).optional(),
    limit: z.coerce.number().int().min(1).max(120).optional().default(24),
});

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'price-history'), 60, 60_000);
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

    const parsed = HistoryQuerySchema.safeParse({
        source: request.nextUrl.searchParams.get('source'),
        id: request.nextUrl.searchParams.get('id'),
        variantKey: request.nextUrl.searchParams.get('variantKey') || undefined,
        optionKey: request.nextUrl.searchParams.get('optionKey') || undefined,
        limit: request.nextUrl.searchParams.get('limit') || '24',
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const { source, id, limit, optionKey, variantKey } = parsed.data;
    try {
        const result = await readPriceHistory(source, id, limit, { optionKey, variantKey });
        return NextResponse.json(
            {
                points: result.points,
                enabled: result.enabled,
                scope: result.scope,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
                },
            }
        );
    } catch (error) {
        console.error('[price-history] error:', error);
        return NextResponse.json(
            { error: '가격 이력 조회 중 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
