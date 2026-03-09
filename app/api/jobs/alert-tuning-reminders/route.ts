import { NextRequest, NextResponse } from 'next/server';
import { runAlertTuningReminderDigest } from '@/lib/server/alertTuningStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return false;

    const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    const cronSecret = request.headers.get('x-cron-secret')?.trim();
    return bearer === secret || cronSecret === secret;
}

export async function GET(request: NextRequest) {
    if (!process.env.CRON_SECRET) {
        return NextResponse.json(
            { error: 'CRON_SECRET is not configured.' },
            { status: 503 }
        );
    }

    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await runAlertTuningReminderDigest();
        if (!result.enabled) {
            return NextResponse.json(
                { ok: false, error: 'Firebase Admin is not configured.', ...result },
                { status: 503 }
            );
        }

        return NextResponse.json({ ok: true, ...result });
    } catch (error) {
        console.error('[alert-tuning-reminders] failed:', error);
        return NextResponse.json(
            { ok: false, error: 'approval reminder digest 생성 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}
