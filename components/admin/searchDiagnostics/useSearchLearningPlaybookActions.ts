'use client';

import type {
    SearchLearningOpsPlaybookOutcome,
    SearchLearningOpsPlaybookRecommendation,
} from './searchLearningWorkbench';
import {
    runSearchLearningOutcomeAction,
    runSearchLearningRecommendationAction,
    type SearchLearningActionRunnerDeps,
} from './searchLearningActionRunners';

type UseSearchLearningPlaybookActionsParams = {
    searchLearningActionRunnerDeps: SearchLearningActionRunnerDeps;
};

/**
 * Root playbook-lane handlers used by SearchLearningPlaybookSections.
 * The deeper per-level chain handlers live in useOpsChainActions.ts.
 */
export function useSearchLearningPlaybookActions({
    searchLearningActionRunnerDeps,
}: UseSearchLearningPlaybookActionsParams) {
    async function handleSearchLearningOpsPlaybookOutcomeAction(outcome: SearchLearningOpsPlaybookOutcome) {
        await runSearchLearningOutcomeAction({
            outcome,
            noun: 'playbook outcome',
            contextBase: 'ops_playbook_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsPlaybookRecommendationAction(
        recommendation: SearchLearningOpsPlaybookRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'playbook recommendation',
            contextBase: 'ops_playbook_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    return {
        handleSearchLearningOpsPlaybookOutcomeAction,
        handleSearchLearningOpsPlaybookRecommendationAction,
    };
}
