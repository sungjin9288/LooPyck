import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import {
    createAlertTuningApprovalRequest,
    loadAlertTuningApprovalRequests,
    resolveAlertTuningApprovalRequest,
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

    const requests = await loadAlertTuningApprovalRequests();
    return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
    const adminCheck = await requireAdminRequest(request);
    if (!adminCheck.ok) {
        return NextResponse.json(
            { error: adminCheck.error },
            { status: adminCheck.status }
        );
    }

    try {
        const body = await request.json();
        const requests = await createAlertTuningApprovalRequest(body, adminCheck.uid);
        return NextResponse.json({ requests });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '승인 요청 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
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
        const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
        const action = body?.action === 'approve' ? 'approve' : body?.action === 'reject' ? 'reject' : null;
        if (!requestId || !action) {
            return NextResponse.json(
                { error: 'requestId와 action이 필요합니다.' },
                { status: 400 }
            );
        }

        const payload = await resolveAlertTuningApprovalRequest(
            requestId,
            action,
            adminCheck.uid,
            body?.resolutionNote
        );
        return NextResponse.json(payload);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '승인 요청 처리에 실패했습니다.' },
            { status: 500 }
        );
    }
}
