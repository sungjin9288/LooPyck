import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import type { SearchAggregationDiagnostics } from '../api/realtimeAggregator.ts';
import { parseGeminiJson, normalizeKeywordList } from '../ai/geminiJson.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import { analyzeFashionQuery, buildSourceAwareSearchPlan } from './fashionQueryAssistant.ts';

const SEARCH_LEARNING_COLLECTION = 'searchLearningQueries';
const MAX_MEMORY_ENTRIES = 80;
const APPROVED_CACHE_TTL_MS = 5 * 60_000;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const globalSearchLearning = globalThis as typeof globalThis & {
    __loopyckSearchLearningEntries?: Map<string, SearchLearningEntry>;
    __loopyckSearchLearningApprovedCache?: Map<string, { queries: string[]; expiresAt: number }>;
};

export type SearchLearningStatus = 'pending' | 'approved' | 'ignored';

export type SearchLearningSuggestion = {
    normalizedQuery: string;
    categoryHint: string | null;
    suggestedQueries: string[];
    rationale: string;
    model: 'heuristic' | 'gemini';
    generatedAt: string;
};

export type SearchLearningApprovalBaseline = {
    approvedAt: string;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type SearchLearningEntry = {
    id: string;
    query: string;
    normalizedQuery: string;
    effectiveQuery: string;
    queryIntent: SearchAggregationDiagnostics['queryIntent'] | null;
    status: SearchLearningStatus;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    lastResultQuality: SearchAggregationDiagnostics['resultQuality'] | null;
    lastTotalProducts: number;
    suggestedQueries: string[];
    approvedQueries: string[];
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    lastSeenAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

type SearchLearningQueue = {
    entries: SearchLearningEntry[];
    summary: {
        total: number;
        pending: number;
        approved: number;
        ignored: number;
        zeroResult: number;
    };
    storage: 'memory' | 'firestore';
};

const SearchLearningSuggestionSchema = z.object({
    normalizedQuery: z.string().trim().min(1).max(80),
    categoryHint: z.string().trim().max(60).nullable().optional().default(null),
    suggestedQueries: z.array(z.string().trim().min(1).max(60)).max(8).optional().default([]),
    rationale: z.string().trim().min(1).max(240),
});

function getMemoryEntries(): Map<string, SearchLearningEntry> {
    if (!globalSearchLearning.__loopyckSearchLearningEntries) {
        globalSearchLearning.__loopyckSearchLearningEntries = new Map();
    }

    return globalSearchLearning.__loopyckSearchLearningEntries;
}

function getApprovedCache(): Map<string, { queries: string[]; expiresAt: number }> {
    if (!globalSearchLearning.__loopyckSearchLearningApprovedCache) {
        globalSearchLearning.__loopyckSearchLearningApprovedCache = new Map();
    }

    return globalSearchLearning.__loopyckSearchLearningApprovedCache;
}

function normalizeSearchLearningQuery(query: string): string {
    return normalizeTitle(query)
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        if (!value || seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

function buildSearchLearningDocId(query: string): string {
    return normalizeSearchLearningQuery(query).replace(/[^\w:-]/g, '_').slice(0, 180);
}

function buildEntryFromSnapshot(snapshot: SearchAggregationDiagnostics): SearchLearningEntry {
    const normalizedQuery = normalizeSearchLearningQuery(snapshot.query);
    return {
        id: buildSearchLearningDocId(snapshot.query),
        query: snapshot.query,
        normalizedQuery,
        effectiveQuery: snapshot.effectiveQuery || normalizedQuery,
        queryIntent: snapshot.queryIntent || null,
        status: 'pending',
        occurrenceCount: 1,
        lowFitCount: snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed' ? 1 : 0,
        zeroResultCount: snapshot.totalProducts === 0 ? 1 : 0,
        lastResultQuality: snapshot.resultQuality || null,
        lastTotalProducts: snapshot.totalProducts,
        suggestedQueries: snapshot.suggestedQueries || [],
        approvedQueries: [],
        aiSuggestion: null,
        approvalBaseline: null,
        lastSeenAt: snapshot.generatedAt,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: snapshot.generatedAt,
        updatedAt: snapshot.generatedAt,
    };
}

function shouldRecordSnapshot(snapshot: SearchAggregationDiagnostics): boolean {
    return snapshot.totalProducts === 0 || snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed';
}

function mergeEntry(existing: SearchLearningEntry | undefined, snapshot: SearchAggregationDiagnostics): SearchLearningEntry {
    if (!existing) {
        return buildEntryFromSnapshot(snapshot);
    }

    const base = existing;
    return {
        ...base,
        query: snapshot.query,
        effectiveQuery: snapshot.effectiveQuery || base.effectiveQuery,
        queryIntent: snapshot.queryIntent || base.queryIntent,
        occurrenceCount: base.occurrenceCount + 1,
        lowFitCount: base.lowFitCount + (snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed' ? 1 : 0),
        zeroResultCount: base.zeroResultCount + (snapshot.totalProducts === 0 ? 1 : 0),
        lastResultQuality: snapshot.resultQuality || base.lastResultQuality,
        lastTotalProducts: snapshot.totalProducts,
        suggestedQueries: uniqueOrdered([...(base.suggestedQueries || []), ...(snapshot.suggestedQueries || [])]).slice(0, 8),
        lastSeenAt: snapshot.generatedAt,
        updatedAt: snapshot.generatedAt,
    };
}

function evictMemoryEntries(entries: Map<string, SearchLearningEntry>): void {
    if (entries.size <= MAX_MEMORY_ENTRIES) {
        return;
    }

    const ordered = Array.from(entries.values()).sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
    entries.clear();
    ordered.slice(0, MAX_MEMORY_ENTRIES).forEach((entry) => {
        entries.set(entry.id, entry);
    });
}

function summarizeEntries(entries: SearchLearningEntry[]): SearchLearningQueue['summary'] {
    return {
        total: entries.length,
        pending: entries.filter((entry) => entry.status === 'pending').length,
        approved: entries.filter((entry) => entry.status === 'approved').length,
        ignored: entries.filter((entry) => entry.status === 'ignored').length,
        zeroResult: entries.filter((entry) => entry.zeroResultCount > 0).length,
    };
}

function buildApprovalBaseline(entry: Pick<SearchLearningEntry, 'occurrenceCount' | 'lowFitCount' | 'zeroResultCount'>, approvedAt: string): SearchLearningApprovalBaseline {
    return {
        approvedAt,
        occurrenceCount: entry.occurrenceCount,
        lowFitCount: entry.lowFitCount,
        zeroResultCount: entry.zeroResultCount,
    };
}

function parseApprovalBaseline(raw: Record<string, unknown> | null | undefined): SearchLearningApprovalBaseline | null {
    if (!raw) {
        return null;
    }

    return {
        approvedAt: typeof raw.approvedAt === 'string' ? raw.approvedAt : new Date(0).toISOString(),
        occurrenceCount: typeof raw.occurrenceCount === 'number' ? raw.occurrenceCount : 0,
        lowFitCount: typeof raw.lowFitCount === 'number' ? raw.lowFitCount : 0,
        zeroResultCount: typeof raw.zeroResultCount === 'number' ? raw.zeroResultCount : 0,
    };
}

function serializeApprovalBaseline(baseline: SearchLearningApprovalBaseline | null): Record<string, unknown> | null {
    if (!baseline) {
        return null;
    }

    return {
        approvedAt: baseline.approvedAt,
        occurrenceCount: baseline.occurrenceCount,
        lowFitCount: baseline.lowFitCount,
        zeroResultCount: baseline.zeroResultCount,
    };
}

function serializeSuggestion(suggestion: SearchLearningSuggestion | null): Record<string, unknown> | null {
    if (!suggestion) {
        return null;
    }

    return {
        ...suggestion,
        categoryHint: suggestion.categoryHint || null,
    };
}

function parseSuggestion(raw: Record<string, unknown> | null | undefined): SearchLearningSuggestion | null {
    if (!raw) {
        return null;
    }

    return {
        normalizedQuery: typeof raw.normalizedQuery === 'string' ? raw.normalizedQuery : '',
        categoryHint: typeof raw.categoryHint === 'string' ? raw.categoryHint : null,
        suggestedQueries: Array.isArray(raw.suggestedQueries)
            ? raw.suggestedQueries.filter((entry): entry is string => typeof entry === 'string')
            : [],
        rationale: typeof raw.rationale === 'string' ? raw.rationale : '',
        model: raw.model === 'gemini' ? 'gemini' : 'heuristic',
        generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date(0).toISOString(),
    };
}

function parseEntry(id: string, raw: Record<string, unknown>): SearchLearningEntry {
    return {
        id,
        query: typeof raw.query === 'string' ? raw.query : '',
        normalizedQuery: typeof raw.normalizedQuery === 'string' ? raw.normalizedQuery : '',
        effectiveQuery: typeof raw.effectiveQuery === 'string' ? raw.effectiveQuery : '',
        queryIntent: typeof raw.queryIntent === 'string' ? raw.queryIntent as SearchLearningEntry['queryIntent'] : null,
        status: raw.status === 'approved' || raw.status === 'ignored' ? raw.status : 'pending',
        occurrenceCount: typeof raw.occurrenceCount === 'number' ? raw.occurrenceCount : 0,
        lowFitCount: typeof raw.lowFitCount === 'number' ? raw.lowFitCount : 0,
        zeroResultCount: typeof raw.zeroResultCount === 'number' ? raw.zeroResultCount : 0,
        lastResultQuality: typeof raw.lastResultQuality === 'string' ? raw.lastResultQuality as SearchLearningEntry['lastResultQuality'] : null,
        lastTotalProducts: typeof raw.lastTotalProducts === 'number' ? raw.lastTotalProducts : 0,
        suggestedQueries: Array.isArray(raw.suggestedQueries) ? raw.suggestedQueries.filter((entry): entry is string => typeof entry === 'string') : [],
        approvedQueries: Array.isArray(raw.approvedQueries) ? raw.approvedQueries.filter((entry): entry is string => typeof entry === 'string') : [],
        aiSuggestion: parseSuggestion(typeof raw.aiSuggestion === 'object' && raw.aiSuggestion ? raw.aiSuggestion as Record<string, unknown> : null),
        approvalBaseline: parseApprovalBaseline(typeof raw.approvalBaseline === 'object' && raw.approvalBaseline ? raw.approvalBaseline as Record<string, unknown> : null),
        lastSeenAt: typeof raw.lastSeenAt === 'string' ? raw.lastSeenAt : new Date(0).toISOString(),
        reviewedAt: typeof raw.reviewedAt === 'string' ? raw.reviewedAt : null,
        reviewedBy: typeof raw.reviewedBy === 'string' ? raw.reviewedBy : null,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    };
}

function serializeEntry(entry: SearchLearningEntry): Record<string, unknown> {
    return {
        query: entry.query,
        normalizedQuery: entry.normalizedQuery,
        effectiveQuery: entry.effectiveQuery,
        queryIntent: entry.queryIntent || null,
        status: entry.status,
        occurrenceCount: entry.occurrenceCount,
        lowFitCount: entry.lowFitCount,
        zeroResultCount: entry.zeroResultCount,
        lastResultQuality: entry.lastResultQuality || null,
        lastTotalProducts: entry.lastTotalProducts,
        suggestedQueries: entry.suggestedQueries,
        approvedQueries: entry.approvedQueries,
        aiSuggestion: serializeSuggestion(entry.aiSuggestion),
        approvalBaseline: serializeApprovalBaseline(entry.approvalBaseline),
        lastSeenAt: entry.lastSeenAt,
        reviewedAt: entry.reviewedAt,
        reviewedBy: entry.reviewedBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}

function buildSeedEntry(query: string, timestamp: string): SearchLearningEntry {
    const analysis = analyzeFashionQuery(query);
    const plan = buildSourceAwareSearchPlan(analysis);
    const suggestedQueries = uniqueOrdered([
        analysis.normalizedQuery || analysis.originalQuery,
        ...(plan.NAVER || []),
        ...analysis.suggestedQueries,
    ]).slice(0, 8);

    return {
        id: buildSearchLearningDocId(query),
        query,
        normalizedQuery: normalizeSearchLearningQuery(query),
        effectiveQuery: analysis.normalizedQuery || normalizeSearchLearningQuery(query),
        queryIntent: analysis.intent,
        status: 'pending',
        occurrenceCount: 1,
        lowFitCount: 1,
        zeroResultCount: 1,
        lastResultQuality: 'weak',
        lastTotalProducts: 0,
        suggestedQueries,
        approvedQueries: [],
        aiSuggestion: null,
        approvalBaseline: null,
        lastSeenAt: timestamp,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

function mergeSeedEntry(existing: SearchLearningEntry | undefined, query: string, timestamp: string): SearchLearningEntry {
    const seed = buildSeedEntry(query, timestamp);
    if (!existing) {
        return seed;
    }

    return {
        ...existing,
        query,
        normalizedQuery: seed.normalizedQuery,
        effectiveQuery: seed.effectiveQuery,
        queryIntent: seed.queryIntent || existing.queryIntent,
        occurrenceCount: existing.occurrenceCount + 1,
        lowFitCount: existing.lowFitCount + 1,
        zeroResultCount: existing.zeroResultCount + 1,
        lastResultQuality: 'weak',
        lastTotalProducts: 0,
        suggestedQueries: uniqueOrdered([...(existing.suggestedQueries || []), ...seed.suggestedQueries]).slice(0, 8),
        lastSeenAt: timestamp,
        updatedAt: timestamp,
    };
}

export function recordSearchLearningCandidate(snapshot: SearchAggregationDiagnostics): void {
    if (!shouldRecordSnapshot(snapshot)) {
        return;
    }

    const entries = getMemoryEntries();
    const id = buildSearchLearningDocId(snapshot.query);
    const next = mergeEntry(entries.get(id), snapshot);
    entries.set(id, next);
    evictMemoryEntries(entries);
}

export function buildFallbackSearchLearningSuggestion(entry: Pick<SearchLearningEntry, 'query' | 'suggestedQueries'>): SearchLearningSuggestion {
    const analysis = analyzeFashionQuery(entry.query);
    const plan = buildSourceAwareSearchPlan(analysis);
    const suggestedQueries = uniqueOrdered([
        analysis.normalizedQuery,
        ...(plan.NAVER || []),
        ...analysis.suggestedQueries,
        ...entry.suggestedQueries,
    ]).slice(0, 12);

    return {
        normalizedQuery: analysis.normalizedQuery || entry.query,
        categoryHint: analysis.categorySignals[0] || null,
        suggestedQueries,
        rationale: analysis.categorySignals[0]
            ? `${analysis.categorySignals[0]} 카테고리를 기준으로 기본 키워드와 연관 검색어를 넓혔습니다.`
            : '원본 검색어를 유지하면서 결과 확보용 broad query를 추천합니다.',
        model: 'heuristic',
        generatedAt: new Date().toISOString(),
    };
}

export async function persistSearchLearningCandidate(snapshot: SearchAggregationDiagnostics): Promise<{ enabled: boolean; persisted: boolean }> {
    if (!shouldRecordSnapshot(snapshot)) {
        return { enabled: true, persisted: false };
    }

    const db = getAdminDb();
    if (!db) {
        return { enabled: false, persisted: false };
    }

    const id = buildSearchLearningDocId(snapshot.query);
    const ref = db.collection(SEARCH_LEARNING_COLLECTION).doc(id);
    await db.runTransaction(async (transaction) => {
        const existingSnap = await transaction.get(ref);
        const existing = existingSnap.exists ? parseEntry(existingSnap.id, existingSnap.data() as Record<string, unknown>) : undefined;
        const next = mergeEntry(existing, snapshot);
        transaction.set(ref, {
            ...serializeEntry(next),
            createdAt: existing?.createdAt || snapshot.generatedAt,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    return { enabled: true, persisted: true };
}

export async function loadSearchLearningQueue(limit: number = 20): Promise<SearchLearningQueue> {
    const db = getAdminDb();
    if (!db) {
        const entries = Array.from(getMemoryEntries().values())
            .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
            .slice(0, limit);
        return {
            entries,
            summary: summarizeEntries(entries),
            storage: 'memory',
        };
    }

    const snapshot = await db.collection(SEARCH_LEARNING_COLLECTION)
        .orderBy('lastSeenAt', 'desc')
        .limit(Math.max(1, Math.min(limit, 80)))
        .get();

    const entries = snapshot.docs.map((doc) => parseEntry(doc.id, doc.data() as Record<string, unknown>));
    return {
        entries,
        summary: summarizeEntries(entries),
        storage: 'firestore',
    };
}

export async function loadSearchLearningEntry(entryId: string): Promise<SearchLearningEntry | null> {
    const memory = getMemoryEntries().get(entryId);
    const db = getAdminDb();
    if (!db) {
        return memory || null;
    }

    const snapshot = await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).get();
    if (!snapshot.exists) {
        return memory || null;
    }

    return parseEntry(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function loadApprovedSearchLearningQueries(queries: string[]): Promise<string[]> {
    const normalizedIds = uniqueOrdered(queries.map((query) => buildSearchLearningDocId(query)));
    const now = Date.now();
    const cache = getApprovedCache();
    const cachedQueries = normalizedIds.flatMap((id) => {
        const entry = cache.get(id);
        if (entry && entry.expiresAt > now) {
            return entry.queries;
        }
        return [];
    });

    const missingIds = normalizedIds.filter((id) => {
        const entry = cache.get(id);
        return !entry || entry.expiresAt <= now;
    });

    if (missingIds.length === 0) {
        return uniqueOrdered(cachedQueries);
    }

    const db = getAdminDb();
    if (!db) {
        const memoryQueries = missingIds.flatMap((id) => {
            const entry = getMemoryEntries().get(id);
            return entry?.status === 'approved' ? entry.approvedQueries : [];
        });
        return uniqueOrdered([...cachedQueries, ...memoryQueries]);
    }

    try {
        const refs = missingIds.map((id) => db.collection(SEARCH_LEARNING_COLLECTION).doc(id));
        const docs = await db.getAll(...refs);
        const loadedQueries = docs.flatMap((doc) => {
            if (!doc.exists) {
                return [];
            }
            const entry = parseEntry(doc.id, doc.data() as Record<string, unknown>);
            const approved = entry.status === 'approved' ? entry.approvedQueries : [];
            cache.set(doc.id, { queries: approved, expiresAt: now + APPROVED_CACHE_TTL_MS });
            return approved;
        });

        return uniqueOrdered([...cachedQueries, ...loadedQueries]);
    } catch {
        return uniqueOrdered(cachedQueries);
    }
}

export function mergeLearnedQueriesIntoPlan(
    plan: Partial<Record<string, string[]>>,
    learnedQueries: string[]
): Partial<Record<string, string[]>> {
    if (learnedQueries.length === 0) {
        return plan;
    }

    const nextPlan: Partial<Record<string, string[]>> = { ...plan };
    Object.entries(nextPlan).forEach(([source, queries]) => {
        nextPlan[source] = uniqueOrdered([...(queries || []), ...learnedQueries]);
    });

    if (!nextPlan.NAVER) {
        nextPlan.NAVER = learnedQueries;
    }

    return nextPlan;
}

export async function generateSearchLearningSuggestion(entry: SearchLearningEntry): Promise<SearchLearningSuggestion> {
    const fallback = buildFallbackSearchLearningSuggestion(entry);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return fallback;
    }

    const prompt = `
당신은 한국 패션 가격비교 서비스의 검색어 튜닝 어시스턴트입니다.
검색 결과가 약하거나 0건인 패션 검색어를 더 잘 검색되게 보정해야 합니다.

[원본 검색어]
${entry.query}

[현재 시스템 제안]
${entry.suggestedQueries.join(', ') || '없음'}

[출력 규칙]
- JSON만 반환
- suggestedQueries는 실제 패션 쇼핑몰에서 검색 가능한 구체적인 검색어만 포함
- 원본 검색어와 완전히 무관한 카테고리는 금지

{
  "normalizedQuery": "보정 검색어",
  "categoryHint": "대표 카테고리",
  "suggestedQueries": ["검색어1", "검색어2", "검색어3"],
  "rationale": "왜 이런 확장을 추천하는지 1문장"
}
`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    responseMimeType: 'application/json',
                    maxOutputTokens: 400,
                },
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            return fallback;
        }

        const data = await response.json() as unknown;
        const parsed = parseGeminiJson(data, SearchLearningSuggestionSchema);
        if (!parsed.ok) {
            return fallback;
        }

        return {
            normalizedQuery: parsed.data.normalizedQuery,
            categoryHint: parsed.data.categoryHint,
            suggestedQueries: uniqueOrdered(normalizeKeywordList(parsed.data.suggestedQueries, 8)),
            rationale: parsed.data.rationale,
            model: 'gemini',
            generatedAt: new Date().toISOString(),
        };
    } catch {
        return fallback;
    }
}

export async function generateSearchLearningSuggestions(entryIds: string[]): Promise<SearchLearningEntry[]> {
    const normalizedIds = uniqueOrdered(entryIds.map((entryId) => entryId.trim()).filter(Boolean)).slice(0, 12);
    if (normalizedIds.length === 0) {
        return [];
    }

    const updatedEntries = await Promise.all(
        normalizedIds.map(async (entryId) => {
            const entry = await loadSearchLearningEntry(entryId);
            if (!entry) {
                return null;
            }

            const suggestion = await generateSearchLearningSuggestion(entry);
            return await saveSearchLearningSuggestion(entryId, suggestion);
        })
    );

    return updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
}

export async function seedSearchLearningEntries(queries: string[]): Promise<SearchLearningEntry[]> {
    const normalizedQueries = uniqueOrdered(
        queries.map((query) => normalizeTitle(query).trim()).filter(Boolean)
    ).slice(0, 24);

    if (normalizedQueries.length === 0) {
        return [];
    }

    const timestamp = new Date().toISOString();
    const memory = getMemoryEntries();
    const db = getAdminDb();

    const updatedEntries = await Promise.all(
        normalizedQueries.map(async (query) => {
            const entryId = buildSearchLearningDocId(query);
            const existing = await loadSearchLearningEntry(entryId);
            const next = mergeSeedEntry(existing || memory.get(entryId), query, timestamp);

            memory.set(entryId, next);
            evictMemoryEntries(memory);

            if (!db) {
                return next;
            }

            await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).set({
                ...serializeEntry(next),
                createdAt: existing?.createdAt || timestamp,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            return await loadSearchLearningEntry(entryId);
        })
    );

    return updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
}

export async function saveSearchLearningSuggestion(entryId: string, suggestion: SearchLearningSuggestion): Promise<SearchLearningEntry | null> {
    const entries = getMemoryEntries();
    const memoryEntry = entries.get(entryId);
    if (memoryEntry) {
        entries.set(entryId, {
            ...memoryEntry,
            aiSuggestion: suggestion,
            updatedAt: new Date().toISOString(),
        });
    }

    const db = getAdminDb();
    if (!db) {
        return entries.get(entryId) || null;
    }

    const ref = db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId);
    await ref.set({
        aiSuggestion: serializeSuggestion(suggestion),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return await loadSearchLearningEntry(entryId);
}

export async function reviewSearchLearningEntry(
    entryId: string,
    status: SearchLearningStatus,
    reviewedBy: string,
    approvedQueries: string[] = []
): Promise<SearchLearningEntry | null> {
    const reviewedAt = new Date().toISOString();
    const nextApprovedQueries = status === 'approved' ? uniqueOrdered(approvedQueries).slice(0, 8) : [];
    const cache = getApprovedCache();
    cache.delete(entryId);

    const entries = getMemoryEntries();
    const memoryEntry = entries.get(entryId);
    const currentEntry = memoryEntry || await loadSearchLearningEntry(entryId);
    const approvalBaseline = status === 'approved'
        ? (currentEntry?.approvalBaseline || buildApprovalBaseline(currentEntry || {
            occurrenceCount: 0,
            lowFitCount: 0,
            zeroResultCount: 0,
        }, reviewedAt))
        : null;
    if (memoryEntry) {
        entries.set(entryId, {
            ...memoryEntry,
            status,
            approvedQueries: nextApprovedQueries,
            reviewedAt,
            reviewedBy,
            approvalBaseline,
            updatedAt: reviewedAt,
        });
    }

    const db = getAdminDb();
    if (!db) {
        return entries.get(entryId) || null;
    }

    const ref = db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId);
    await ref.set({
        status,
        approvedQueries: nextApprovedQueries,
        reviewedAt,
        reviewedBy,
        approvalBaseline: serializeApprovalBaseline(approvalBaseline),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return await loadSearchLearningEntry(entryId);
}

export async function reviewSearchLearningEntries(
    entryIds: string[],
    status: SearchLearningStatus,
    reviewedBy: string
): Promise<SearchLearningEntry[]> {
    const normalizedIds = uniqueOrdered(entryIds.map((entryId) => entryId.trim()).filter(Boolean)).slice(0, 24);
    if (normalizedIds.length === 0) {
        return [];
    }

    const updatedEntries = await Promise.all(
        normalizedIds.map(async (entryId) => {
            const entry = await loadSearchLearningEntry(entryId);
            if (!entry) {
                return null;
            }

            const approvedQueries = status === 'approved'
                ? uniqueOrdered([
                    ...(entry.aiSuggestion?.suggestedQueries || []),
                    ...entry.approvedQueries,
                    ...entry.suggestedQueries,
                ]).slice(0, 8)
                : [];

            return await reviewSearchLearningEntry(entryId, status, reviewedBy, approvedQueries);
        })
    );

    return updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
}

export function resetSearchLearningEntries(): void {
    getMemoryEntries().clear();
    getApprovedCache().clear();
}
