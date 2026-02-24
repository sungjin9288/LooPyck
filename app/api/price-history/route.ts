import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { readPriceHistory } from '@/lib/server/priceHistoryStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HistoryQuerySchema = z.object({
    source: z.enum(['NAVER', 'MUSINSA', '29CM', 'W_CONCEPT', 'ZIGZAG', 'FARFETCH', 'COUPANG', 'SSENSE']),
    id: z.string().trim().min(1).max(160),
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
        limit: request.nextUrl.searchParams.get('limit') || '24',
    });

    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const { source, id, limit } = parsed.data;
    try {
        const result = await readPriceHistory(source, id, limit);
        return NextResponse.json(
            {
                points: result.points,
                enabled: result.enabled,
            },
            { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    } catch (error) {
        console.error('[price-history] error:', error);
        return NextResponse.json(
            { error: '가격 이력 조회 중 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
