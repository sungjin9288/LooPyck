'use client';

import type {
    SearchLearningOpsPlaybookOutcome,
    SearchLearningOpsPlaybookRecommendation,
    OpsChainOutcome,
    OpsChainRecommendation,
} from './searchLearningWorkbench';
import {
    runSearchLearningOutcomeAction,
    runSearchLearningRecommendationAction,
    type SearchLearningActionRunnerDeps,
} from './searchLearningActionRunners';

type UseSearchLearningPlaybookActionsParams = {
    searchLearningActionRunnerDeps: SearchLearningActionRunnerDeps;
};

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

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeAction(
        outcome: OpsChainOutcome
    ) {
        await runSearchLearningOutcomeAction({
            outcome,
            noun: 'recommendation outcome',
            contextBase: 'ops_playbook_recommendation_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'recommendation outcome recommendation',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'recommendation outcome recommendation outcome recommendation',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'recommendation outcome recommendation outcome recommendation recommendation',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    return {
        handleSearchLearningOpsPlaybookOutcomeAction,
        handleSearchLearningOpsPlaybookRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
    };
}
