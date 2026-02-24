import { NextRequest, NextResponse } from 'next/server';
import { scanAndDispatchPriceAlerts } from '@/lib/server/priceAlertScanner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true;

    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const cronSecret = request.headers.get('x-cron-secret')?.trim();
    return bearer === secret || cronSecret === secret;
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await scanAndDispatchPriceAlerts();
        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error('[scan-price-alerts] failed:', error);
        return NextResponse.json(
            { ok: false, error: '가격 알림 스캔 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}
