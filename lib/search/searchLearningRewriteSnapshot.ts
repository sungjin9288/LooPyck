import type { SearchLearningImpactClusterSummary } from './searchLearningImpact.ts';
import type { SearchLearningEntry } from './queryLearningTypes.ts';
import { buildSearchLearningRewritePacks } from './searchLearningRewritePacks.ts';
import { buildSearchLearningRewriteRecommendationSummary, buildSearchLearningRewriteRecommendations } from './searchLearningRewriteRecommendations.ts';
import { buildSearchLearningRewriteSourceActionDraftSummary, buildSearchLearningRewriteSourceActionDrafts } from './searchLearningRewriteSourceActionDrafts.ts';
import { buildSearchLearningRewriteSourceActionReviewQueue, buildSearchLearningRewriteSourceActionReviewSummary } from './searchLearningRewriteSourceActionReview.ts';
import { buildSearchLearningRewriteSourceApprovalActivity, buildSearchLearningRewriteSourceApprovalActivitySummary } from './searchLearningRewriteSourceApprovalActivity.ts';
import { buildSearchLearningRewriteSourceApprovalQueue, buildSearchLearningRewriteSourceApprovalQueueSummary } from './searchLearningRewriteSourceApprovalQueue.ts';
import { buildSearchLearningRewriteSourceDraftSummary, buildSearchLearningRewriteSourceDrafts } from './searchLearningRewriteSourceDrafts.ts';
import { buildSearchLearningRewriteSourceOps, buildSearchLearningRewriteSourceOpsSummary } from './searchLearningRewriteSourceOps.ts';

export type SearchLearningRewriteSnapshot = {
    searchLearningRewritePacks: ReturnType<typeof buildSearchLearningRewritePacks>;
    searchLearningRewriteRecommendations: ReturnType<typeof buildSearchLearningRewriteRecommendations>;
    searchLearningRewriteRecommendationSummary: ReturnType<typeof buildSearchLearningRewriteRecommendationSummary>;
    searchLearningRewriteSourceDrafts: ReturnType<typeof buildSearchLearningRewriteSourceDrafts>;
    searchLearningRewriteSourceDraftSummary: ReturnType<typeof buildSearchLearningRewriteSourceDraftSummary>;
    searchLearningRewriteSourceOps: ReturnType<typeof buildSearchLearningRewriteSourceOps>;
    searchLearningRewriteSourceOpsSummary: ReturnType<typeof buildSearchLearningRewriteSourceOpsSummary>;
    searchLearningRewriteSourceActionDrafts: ReturnType<typeof buildSearchLearningRewriteSourceActionDrafts>;
    searchLearningRewriteSourceActionDraftSummary: ReturnType<typeof buildSearchLearningRewriteSourceActionDraftSummary>;
    searchLearningRewriteSourceActionReviewQueue: ReturnType<typeof buildSearchLearningRewriteSourceActionReviewQueue>;
    searchLearningRewriteSourceActionReviewSummary: ReturnType<typeof buildSearchLearningRewriteSourceActionReviewSummary>;
    searchLearningRewriteSourceApprovalQueue: ReturnType<typeof buildSearchLearningRewriteSourceApprovalQueue>;
    searchLearningRewriteSourceApprovalQueueSummary: ReturnType<typeof buildSearchLearningRewriteSourceApprovalQueueSummary>;
    searchLearningRewriteSourceApprovalActivity: ReturnType<typeof buildSearchLearningRewriteSourceApprovalActivity>;
    searchLearningRewriteSourceApprovalActivitySummary: ReturnType<typeof buildSearchLearningRewriteSourceApprovalActivitySummary>;
};

export function buildSearchLearningRewriteSnapshot({
    entries,
    impactClusters,
}: {
    entries: SearchLearningEntry[];
    impactClusters: SearchLearningImpactClusterSummary[];
}): SearchLearningRewriteSnapshot {
    const searchLearningRewritePacks = buildSearchLearningRewritePacks(entries);
    const searchLearningRewriteRecommendations = buildSearchLearningRewriteRecommendations(
        searchLearningRewritePacks,
        impactClusters
    );
    const searchLearningRewriteRecommendationSummary = buildSearchLearningRewriteRecommendationSummary(
        searchLearningRewriteRecommendations
    );
    const searchLearningRewriteSourceDrafts = buildSearchLearningRewriteSourceDrafts(
        searchLearningRewriteRecommendations,
        searchLearningRewritePacks.slice(0, 6)
    );
    const searchLearningRewriteSourceDraftSummary = buildSearchLearningRewriteSourceDraftSummary(
        searchLearningRewriteSourceDrafts
    );
    const searchLearningRewriteSourceOps = buildSearchLearningRewriteSourceOps(searchLearningRewriteSourceDrafts);
    const searchLearningRewriteSourceOpsSummary = buildSearchLearningRewriteSourceOpsSummary(
        searchLearningRewriteSourceOps
    );
    const searchLearningRewriteSourceActionDrafts = buildSearchLearningRewriteSourceActionDrafts(
        searchLearningRewriteSourceOps
    );
    const searchLearningRewriteSourceActionDraftSummary = buildSearchLearningRewriteSourceActionDraftSummary(
        searchLearningRewriteSourceActionDrafts
    );
    const searchLearningRewriteSourceActionReviewQueue = buildSearchLearningRewriteSourceActionReviewQueue(
        searchLearningRewriteSourceActionDrafts,
        entries
    );
    const searchLearningRewriteSourceActionReviewSummary = buildSearchLearningRewriteSourceActionReviewSummary(
        searchLearningRewriteSourceActionReviewQueue
    );
    const searchLearningRewriteSourceApprovalQueue = buildSearchLearningRewriteSourceApprovalQueue(
        searchLearningRewriteSourceActionDrafts,
        searchLearningRewriteSourceActionReviewQueue
    );
    const searchLearningRewriteSourceApprovalQueueSummary = buildSearchLearningRewriteSourceApprovalQueueSummary(
        searchLearningRewriteSourceApprovalQueue
    );
    const searchLearningRewriteSourceApprovalActivity = buildSearchLearningRewriteSourceApprovalActivity(
        searchLearningRewriteSourceApprovalQueue
    );
    const searchLearningRewriteSourceApprovalActivitySummary =
        buildSearchLearningRewriteSourceApprovalActivitySummary(
            searchLearningRewriteSourceApprovalActivity
        );

    return {
        searchLearningRewritePacks: searchLearningRewritePacks.slice(0, 6),
        searchLearningRewriteRecommendations,
        searchLearningRewriteRecommendationSummary,
        searchLearningRewriteSourceDrafts,
        searchLearningRewriteSourceDraftSummary,
        searchLearningRewriteSourceOps,
        searchLearningRewriteSourceOpsSummary,
        searchLearningRewriteSourceActionDrafts,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewQueue,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueue,
        searchLearningRewriteSourceApprovalQueueSummary,
        searchLearningRewriteSourceApprovalActivity,
        searchLearningRewriteSourceApprovalActivitySummary,
    };
}
