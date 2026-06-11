import { NextRequest, NextResponse } from 'next/server';
import {
    loadAlertTuningConfigRecord,
    rollbackAlertTuningConfigRecord,
    saveAlertTuningConfigRecord,
} from '@/lib/server/alertTuningStore';
import { requireAdminRequest } from '@/lib/server/adminAccess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const record = await loadAlertTuningConfigRecord();
    const hasBearerToken = (request.headers.get('authorization') || '').startsWith('Bearer ');

    if (hasBearerToken) {
        const adminCheck = await requireAdminRequest(request);
        if (!adminCheck.ok) {
            return NextResponse.json(
                { error: adminCheck.error },
                { status: adminCheck.status, headers: { 'Cache-Control': 'private, no-store' } }
            );
        }

        return NextResponse.json(record, {
            headers: {
                'Cache-Control': 'private, no-store',
            },
        });
    }

    return NextResponse.json(
        {
            config: record.config,
            updatedAt: record.updatedAt,
            updatedBy: null,
            storage: record.storage,
        },
        {
            headers: {
                'Cache-Control': 'private, no-store',
            },
        }
    );
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
        const record = typeof body?.rollbackHistoryId === 'string' && body.rollbackHistoryId.trim()
            ? await rollbackAlertTuningConfigRecord(body.rollbackHistoryId.trim(), adminCheck.uid)
            : await saveAlertTuningConfigRecord(body?.config ?? body, adminCheck.uid);
        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '알림 튜닝 설정 저장에 실패했습니다.' },
            { status: 500 }
        );
    }
}
