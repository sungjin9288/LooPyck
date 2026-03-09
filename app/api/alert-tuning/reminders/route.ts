import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import { runAlertTuningReminderDigest } from '@/lib/server/alertTuningStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdminRequest(request);
    if (!adminCheck.ok) {
        return NextResponse.json(
            { error: adminCheck.error },
            { status: adminCheck.status }
        );
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
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'approval reminder digest 실행에 실패했습니다.' },
            { status: 500 }
        );
    }
}
