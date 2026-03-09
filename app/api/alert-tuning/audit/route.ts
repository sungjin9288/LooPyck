import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import {
    buildAlertTuningAuditInboxSummary,
    loadAlertTuningAuditEvents,
    markAlertTuningAuditEventsRead,
    markAllAlertTuningAuditEventsRead,
} from '@/lib/server/alertTuningStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const adminCheck = await requireAdminRequest(request);
    if (!adminCheck.ok) {
        return NextResponse.json(
            { error: adminCheck.error },
            { status: adminCheck.status }
        );
    }

    const events = await loadAlertTuningAuditEvents(undefined, adminCheck.uid);
    return NextResponse.json({
        events,
        inbox: buildAlertTuningAuditInboxSummary(events),
    });
}

export async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdminRequest(request);
    if (!adminCheck.ok) {
        return NextResponse.json(
            { error: adminCheck.error },
            { status: adminCheck.status }
        );
    }

    try {
        const body = await request.json();
        const markAll = body?.markAll === true;
        const eventIds = Array.isArray(body?.eventIds)
            ? body.eventIds.filter((value: unknown): value is string => typeof value === 'string')
            : [];

        const events = markAll
            ? await markAllAlertTuningAuditEventsRead(adminCheck.uid!)
            : await markAlertTuningAuditEventsRead(eventIds, adminCheck.uid!);
        return NextResponse.json({
            events,
            inbox: buildAlertTuningAuditInboxSummary(events),
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'audit inbox 갱신에 실패했습니다.' },
            { status: 500 }
        );
    }
}
