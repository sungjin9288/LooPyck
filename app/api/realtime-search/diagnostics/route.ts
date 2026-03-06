import { NextRequest, NextResponse } from 'next/server';
import { loadPdpDiagnostics } from '@/lib/api/pdpDiagnostics';
import { loadSearchDiagnostics } from '@/lib/api/searchDiagnostics';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { requireAdminRequest } from '@/lib/server/adminAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'realtime-search-diagnostics'), 30, 60_000);
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

    const adminCheck = await requireAdminRequest(request);
    if (!adminCheck.ok) {
        return NextResponse.json(
            { error: adminCheck.error },
            {
                status: adminCheck.status,
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    }

    const limitRaw = Number.parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 120)) : 10;
    const includeRecent = request.nextUrl.searchParams.get('include') === 'recent';
    const [diagnostics, pdpDiagnostics] = await Promise.all([
        loadSearchDiagnostics(limit),
        loadPdpDiagnostics(limit),
    ]);

    return NextResponse.json(
        {
            summary: diagnostics.summary,
            recent: includeRecent ? diagnostics.recent : [],
            recentInteractions: includeRecent ? diagnostics.recentInteractions : [],
            quality: diagnostics.quality,
            interactionSummary: diagnostics.interactionSummary,
            storage: diagnostics.storage,
            pdp: {
                summary: pdpDiagnostics.summary,
                recent: includeRecent ? pdpDiagnostics.recent : [],
                storage: pdpDiagnostics.storage,
            },
        },
        {
            headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'Cache-Control': 'private, max-age=15',
            },
        }
    );
}
