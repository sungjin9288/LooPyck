import { ALLOWED_PRODUCT_SOURCES, type ProductSource } from '../api/types.ts';
import {
    analyzeFashionQuery,
    buildSourceAwareQueryCandidates,
    type FashionQueryAnalysis,
    type SearchQueryCandidatePlan,
} from './fashionQueryAssistant.ts';
import { getSemanticFashionClusterLabel } from './fashionOntology.ts';

export type SearchLearningRewriteEntryLike = {
    id: string;
    query: string;
    status: 'pending' | 'approved' | 'ignored';
    approvedQueries: string[];
    suggestedQueries?: string[];
    aiSuggestion?: {
        suggestedQueries: string[];
    } | null;
    lastSeenAt?: string | null;
};

export type SearchLearningRewritePack = {
    clusterId: string;
    clusterLabel: string;
    entryIds: string[];
    entryCount: number;
    approvedQueryCount: number;
    commonQueries: string[];
    sourceQueries: SearchQueryCandidatePlan;
    sourceCount: number;
    lastSeenAt: string | null;
};

function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);
        return true;
    });
}

function buildEntryPromotionQueries(entry: SearchLearningRewriteEntryLike): string[] {
    return uniqueOrdered([
        ...entry.approvedQueries,
        ...(entry.aiSuggestion?.suggestedQueries || []),
        ...(entry.suggestedQueries || []),
        entry.query,
    ]).slice(0, 10);
}

function mergeSourceCandidates(
    current: SearchQueryCandidatePlan,
    source: ProductSource,
    queries: string[]
): SearchQueryCandidatePlan {
    return {
        ...current,
        [source]: uniqueOrdered([...(current[source] || []), ...queries]).slice(0, 12),
    };
}

export function mergeSourceQueryPlans(
    base: SearchQueryCandidatePlan,
    extra: SearchQueryCandidatePlan
): SearchQueryCandidatePlan {
    const next: SearchQueryCandidatePlan = { ...base };
    ALLOWED_PRODUCT_SOURCES.forEach((source) => {
        const merged = uniqueOrdered([...(base[source] || []), ...(extra[source] || [])]).slice(0, 12);
        if (merged.length > 0) {
            next[source] = merged;
        }
    });
    return next;
}

export function buildSearchLearningRewritePacks(
    entries: SearchLearningRewriteEntryLike[]
): SearchLearningRewritePack[] {
    const packs = new Map<string, SearchLearningRewritePack>();

    entries
        .filter((entry) => entry.status === 'approved' && entry.approvedQueries.length > 0)
        .forEach((entry) => {
            const baseAnalysis = analyzeFashionQuery(entry.query);
            const clusterIds = baseAnalysis.semanticClusterIds.length > 0 ? baseAnalysis.semanticClusterIds : ['other'];
            const promotionQueries = buildEntryPromotionQueries(entry);

            clusterIds.forEach((clusterId) => {
                const current = packs.get(clusterId) || {
                    clusterId,
                    clusterLabel: getSemanticFashionClusterLabel(clusterId),
                    entryIds: [],
                    entryCount: 0,
                    approvedQueryCount: 0,
                    commonQueries: [],
                    sourceQueries: {},
                    sourceCount: 0,
                    lastSeenAt: null,
                };

                current.entryIds = uniqueOrdered([...current.entryIds, entry.id]);
                current.entryCount = current.entryIds.length;
                current.approvedQueryCount += entry.approvedQueries.length;
                current.commonQueries = uniqueOrdered([...current.commonQueries, ...promotionQueries]).slice(0, 12);
                current.lastSeenAt = !current.lastSeenAt || ((entry.lastSeenAt || '') > current.lastSeenAt)
                    ? (entry.lastSeenAt || current.lastSeenAt)
                    : current.lastSeenAt;

                promotionQueries.forEach((query) => {
                    const analysis = analyzeFashionQuery(query);
                    ALLOWED_PRODUCT_SOURCES.forEach((source) => {
                        const candidates = buildSourceAwareQueryCandidates(analysis, source);
                        current.sourceQueries = mergeSourceCandidates(current.sourceQueries, source, candidates);
                    });
                });

                current.sourceCount = ALLOWED_PRODUCT_SOURCES.filter((source) => (current.sourceQueries[source] || []).length > 0).length;
                packs.set(clusterId, current);
            });
        });

    return Array.from(packs.values()).sort((left, right) =>
        right.entryCount - left.entryCount
        || right.approvedQueryCount - left.approvedQueryCount
        || (right.lastSeenAt || '').localeCompare(left.lastSeenAt || '')
    );
}

export function buildSearchLearningRewritePlanForAnalysis(
    analysis: Pick<FashionQueryAnalysis, 'semanticClusterIds' | 'categorySignals'>,
    packs: SearchLearningRewritePack[]
): SearchQueryCandidatePlan {
    const matchedPacks = packs.filter((pack) =>
        analysis.semanticClusterIds.includes(pack.clusterId)
        || (pack.clusterId === 'other' && analysis.categorySignals.length === 0)
    );

    return matchedPacks.reduce<SearchQueryCandidatePlan>((plan, pack) => mergeSourceQueryPlans(plan, pack.sourceQueries), {});
}
