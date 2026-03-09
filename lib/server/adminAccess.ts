import type { NextRequest } from 'next/server';
import { getAdminAuth } from './firebaseAdmin.ts';

export function getConfiguredAdminUids(): string[] {
    return (process.env.ADMIN_UIDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
        .split(',')
        .map((uid) => uid.trim())
        .filter(Boolean);
}

export function isAdminUid(uid: string | null | undefined): boolean {
    if (!uid) return false;
    return getConfiguredAdminUids().includes(uid);
}

export async function requireAdminRequest(request: NextRequest): Promise<{
    ok: boolean;
    status: number;
    uid?: string;
    error?: string;
}> {
    const adminUids = getConfiguredAdminUids();
    if (adminUids.length === 0) {
        return { ok: false, status: 503, error: '관리자 UID가 설정되지 않았습니다.' };
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
        return { ok: false, status: 401, error: '관리자 인증 토큰이 필요합니다.' };
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
        return { ok: false, status: 503, error: 'Firebase Admin 인증이 설정되지 않았습니다.' };
    }

    try {
        const decoded = await adminAuth.verifyIdToken(token);
        if (!isAdminUid(decoded.uid)) {
            return { ok: false, status: 403, error: '관리자 권한이 필요합니다.' };
        }

        return { ok: true, status: 200, uid: decoded.uid };
    } catch {
        return { ok: false, status: 401, error: '유효하지 않은 관리자 토큰입니다.' };
    }
}
