import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import {
    generateSearchLearningSuggestion,
    loadSearchLearningEntry,
    reviewSearchLearningEntry,
    saveSearchLearningSuggestion,
} from '@/lib/search/queryLearning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GenerateSuggestionSchema = z.object({
    action: z.literal('generate'),
    entryId: z.string().trim().min(1).max(180),
});

const ReviewEntrySchema = z.object({
    action: z.enum(['approve', 'ignore']),
    entryId: z.string().trim().min(1).max(180),
    approvedQueries: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
});

export async function POST(request: NextRequest) {
    try {
        const rateLimit = await checkRateLimit(getRateLimitKey(request, 'search-learning'), 20, 60_000);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        const adminCheck = await requireAdminRequest(request);
        if (!adminCheck.ok) {
            return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
        }

        const payload = GenerateSuggestionSchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json({ error: payload.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' }, { status: 400 });
        }

        const entry = await loadSearchLearningEntry(payload.data.entryId);
        if (!entry) {
            return NextResponse.json({ error: '학습 대상을 찾을 수 없습니다.' }, { status: 404 });
        }

        const suggestion = await generateSearchLearningSuggestion(entry);
        const updated = await saveSearchLearningSuggestion(entry.id, suggestion);

        return NextResponse.json({ entry: updated, suggestion });
    } catch (error) {
        console.error('Search learning suggestion route failed:', error);
        return NextResponse.json({ error: '검색 학습 제안을 생성하지 못했습니다.' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const rateLimit = await checkRateLimit(getRateLimitKey(request, 'search-learning-review'), 20, 60_000);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        const adminCheck = await requireAdminRequest(request);
        if (!adminCheck.ok) {
            return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
        }

        const payload = ReviewEntrySchema.safeParse(await request.json());
        if (!payload.success) {
            return NextResponse.json({ error: payload.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' }, { status: 400 });
        }

        const updated = await reviewSearchLearningEntry(
            payload.data.entryId,
            payload.data.action === 'approve' ? 'approved' : 'ignored',
            adminCheck.uid,
            payload.data.approvedQueries
        );

        if (!updated) {
            return NextResponse.json({ error: '학습 대상을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ entry: updated });
    } catch (error) {
        console.error('Search learning review route failed:', error);
        return NextResponse.json({ error: '검색 학습 검토를 저장하지 못했습니다.' }, { status: 500 });
    }
}
