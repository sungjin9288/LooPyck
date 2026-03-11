import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import {
    generateSearchLearningSuggestions,
    generateSearchLearningSuggestion,
    loadSearchLearningActivity,
    loadSearchLearningEntry,
    recordSearchLearningActivity,
    reviewSearchLearningEntry,
    reviewSearchLearningEntries,
    saveSearchLearningSuggestion,
    seedSearchLearningEntries,
} from '@/lib/search/queryLearning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GenerateSuggestionSchema = z.object({
    action: z.literal('generate'),
    entryId: z.string().trim().min(1).max(180),
});

const BulkGenerateSuggestionSchema = z.object({
    action: z.literal('bulk_generate'),
    entryIds: z.array(z.string().trim().min(1).max(180)).min(1).max(12),
    context: z.string().trim().min(1).max(80).optional(),
});

const SeedCoverageQueriesSchema = z.object({
    action: z.literal('seed_queries'),
    queries: z.array(z.string().trim().min(1).max(80)).min(1).max(24),
    context: z.string().trim().min(1).max(80).optional(),
});

const ReviewEntrySchema = z.object({
    action: z.enum(['approve', 'ignore']),
    entryId: z.string().trim().min(1).max(180),
    approvedQueries: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
});

const BulkReviewEntrySchema = z.object({
    action: z.enum(['bulk_approve', 'bulk_ignore']),
    entryIds: z.array(z.string().trim().min(1).max(180)).min(1).max(24),
    context: z.string().trim().min(1).max(80).optional(),
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

        const raw = await request.json();
        const seedPayload = SeedCoverageQueriesSchema.safeParse(raw);
        if (seedPayload.success) {
            const entries = await seedSearchLearningEntries(seedPayload.data.queries, {
                context: seedPayload.data.context,
                actorUid: adminCheck.uid,
            });
            const activity = (await loadSearchLearningActivity(1)).events[0] || null;
            return NextResponse.json({ entries, activity });
        }

        const bulkPayload = BulkGenerateSuggestionSchema.safeParse(raw);
        if (bulkPayload.success) {
            const entries = await generateSearchLearningSuggestions(bulkPayload.data.entryIds, {
                context: bulkPayload.data.context,
                actorUid: adminCheck.uid,
            });
            const activity = (await loadSearchLearningActivity(1)).events[0] || null;
            return NextResponse.json({ entries, activity });
        }

        const payload = GenerateSuggestionSchema.safeParse(raw);
        if (!payload.success) {
            return NextResponse.json({ error: payload.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' }, { status: 400 });
        }

        const entry = await loadSearchLearningEntry(payload.data.entryId);
        if (!entry) {
            return NextResponse.json({ error: '학습 대상을 찾을 수 없습니다.' }, { status: 404 });
        }

        const suggestion = await generateSearchLearningSuggestion(entry);
        const updated = await saveSearchLearningSuggestion(entry.id, suggestion);
        const activity = await recordSearchLearningActivity({
            type: 'generate_suggestions',
            context: 'single_generate',
            actorUid: adminCheck.uid,
            entryIds: updated ? [updated.id] : [entry.id],
            queries: updated ? [updated.query] : [entry.query],
        });

        return NextResponse.json({ entry: updated, suggestion, activity });
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

        const raw = await request.json();
        const bulkPayload = BulkReviewEntrySchema.safeParse(raw);
        if (bulkPayload.success) {
            const entries = await reviewSearchLearningEntries(
                bulkPayload.data.entryIds,
                bulkPayload.data.action === 'bulk_approve' ? 'approved' : 'ignored',
                adminCheck.uid,
                { context: bulkPayload.data.context }
            );

            const activity = (await loadSearchLearningActivity(1)).events[0] || null;
            return NextResponse.json({ entries, activity });
        }

        const payload = ReviewEntrySchema.safeParse(raw);
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

        const activity = updated
            ? await recordSearchLearningActivity({
                type: 'review_entries',
                context: `single_review:${payload.data.action}`,
                reviewedStatus: payload.data.action === 'approve' ? 'approved' : 'ignored',
                actorUid: adminCheck.uid,
                entryIds: [updated.id],
                queries: [updated.query],
            })
            : null;

        return NextResponse.json({ entry: updated, activity });
    } catch (error) {
        console.error('Search learning review route failed:', error);
        return NextResponse.json({ error: '검색 학습 검토를 저장하지 못했습니다.' }, { status: 500 });
    }
}
