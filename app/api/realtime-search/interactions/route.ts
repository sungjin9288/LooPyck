import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { persistSearchInteraction, recordSearchInteraction } from '@/lib/api/searchDiagnostics';
import { parseSearchInteractionPayload, type SearchInteractionEvent } from '@/lib/search/searchInteractionContract';
import { Logger, toErrorMessage } from '@/lib/core/observability';

export const runtime = 'nodejs';

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

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: '유효하지 않은 JSON payload 입니다.' }, { status: 400 });
    }

    const parsed = parseSearchInteractionPayload(body);
    if (parsed.ok === false) {
        return NextResponse.json(
            { error: '유효하지 않은 interaction payload 입니다.', reason: parsed.error },
            { status: 400 }
        );
    }

    const event: SearchInteractionEvent = {
        ...parsed.data,
        generatedAt: new Date().toISOString(),
    };

    recordSearchInteraction(event);
    try {
        await persistSearchInteraction(event);
    } catch (persistError) {
        Logger.warn('[SearchInteraction] persist failed', { error: toErrorMessage(persistError) });
    }

    return NextResponse.json(
        { ok: true },
        {
            headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
        }
    );
}
