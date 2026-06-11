type SearchLearningRecommendationAction = 'review_now' | 'retrain_now' | 'collect_samples' | 'observe';

type SearchLearningRecommendationLike = {
    id: string;
    outcomeId: string;
    title: string;
    action: SearchLearningRecommendationAction;
    entryIds: string[];
};

type SearchLearningRecommendationSummaryLike<TRecommendation extends { id: string }> = {
    topReviewNow: TRecommendation[];
    topRetrainNow: TRecommendation[];
    topCollectSamples: TRecommendation[];
    topObserve: TRecommendation[];
};

type SearchLearningOutcomeLike = {
    id?: string;
    outcomeId?: string;
    title: string;
    status: string;
    entryIds: string[];
};

export type SearchLearningActionRunnerDeps = {
    reviewableEntryIds: (entryIds: string[]) => string[];
    reviewEntries: (
        entryIds: string[],
        processingKey: string,
        successMessage: (count: number) => string,
        fallbackErrorMessage: string
    ) => Promise<void>;
    generateEntries: (
        entryIds: string[],
        processingKey: string,
        successMessage: (count: number) => string,
        fallbackErrorMessage: string
    ) => Promise<void>;
    selectEntries: (entryIds: string[], message: string) => void;
};

type RunSearchLearningRecommendationActionParams<TRecommendation extends SearchLearningRecommendationLike> = {
    recommendation: TRecommendation;
    noun: string;
    contextBase: string;
    deps: SearchLearningActionRunnerDeps;
};

type RunSearchLearningOutcomeActionParams<TOutcome extends SearchLearningOutcomeLike> = {
    outcome: TOutcome;
    noun: string;
    contextBase: string;
    deps: SearchLearningActionRunnerDeps;
};

type RunSearchLearningRecommendationQueueItemParams<
    TRecommendation extends SearchLearningRecommendationLike,
> = {
    summary: SearchLearningRecommendationSummaryLike<TRecommendation>;
    recommendationId: string;
    entryIds: string[];
    title: string;
    noun: string;
    contextBase: string;
    deps: SearchLearningActionRunnerDeps;
};

function getOutcomeKey(outcome: SearchLearningOutcomeLike): string {
    return outcome.id || outcome.outcomeId || outcome.title;
}

export function findSearchLearningRecommendationById<TRecommendation extends { id: string }>(
    summary: SearchLearningRecommendationSummaryLike<TRecommendation>,
    recommendationId: string
): TRecommendation | undefined {
    return [
        ...summary.topReviewNow,
        ...summary.topRetrainNow,
        ...summary.topCollectSamples,
        ...summary.topObserve,
    ].find((candidate) => candidate.id === recommendationId);
}

export async function runSearchLearningRecommendationAction<TRecommendation extends SearchLearningRecommendationLike>({
    recommendation,
    noun,
    contextBase,
    deps,
}: RunSearchLearningRecommendationActionParams<TRecommendation>) {
    if (recommendation.action === 'review_now') {
        await deps.reviewEntries(
            deps.reviewableEntryIds(recommendation.entryIds),
            `${contextBase}_review_${recommendation.outcomeId}`,
            (count) => `${count}개의 ${noun} query를 승인했습니다.`,
            `${noun} review 승인에 실패했습니다.`
        );
        return;
    }

    if (recommendation.action === 'retrain_now') {
        await deps.generateEntries(
            recommendation.entryIds,
            `${contextBase}_retrain_${recommendation.outcomeId}`,
            (count) => `${count}개의 ${noun} query에 재학습 AI 제안을 생성했습니다.`,
            `${noun} 재학습 AI 제안 생성에 실패했습니다.`
        );
        return;
    }

    deps.selectEntries(recommendation.entryIds, `${recommendation.title} ${noun} query를 선택했습니다.`);
}

export async function runSearchLearningOutcomeAction<TOutcome extends SearchLearningOutcomeLike>({
    outcome,
    noun,
    contextBase,
    deps,
}: RunSearchLearningOutcomeActionParams<TOutcome>) {
    const outcomeKey = getOutcomeKey(outcome);

    if (outcome.status === 'ready_review') {
        await deps.reviewEntries(
            deps.reviewableEntryIds(outcome.entryIds),
            `${contextBase}_review_${outcomeKey}`,
            (count) => `${count}개의 ${noun} query를 승인했습니다.`,
            `${noun} review 승인에 실패했습니다.`
        );
        return;
    }

    if (outcome.status === 'needs_attention') {
        await deps.generateEntries(
            outcome.entryIds,
            `${contextBase}_retrain_${outcomeKey}`,
            (count) => `${count}개의 ${noun} query에 재학습 AI 제안을 생성했습니다.`,
            `${noun} 재학습 AI 제안 생성에 실패했습니다.`
        );
        return;
    }

    deps.selectEntries(outcome.entryIds, `${outcome.title} ${noun} query를 선택했습니다.`);
}

export async function runSearchLearningRecommendationQueueItem<
    TRecommendation extends SearchLearningRecommendationLike,
>({
    summary,
    recommendationId,
    entryIds,
    title,
    noun,
    contextBase,
    deps,
}: RunSearchLearningRecommendationQueueItemParams<TRecommendation>) {
    const recommendation = findSearchLearningRecommendationById(summary, recommendationId);
    if (!recommendation) {
        deps.selectEntries(entryIds, `${title} queue query를 선택했습니다.`);
        return;
    }

    await runSearchLearningRecommendationAction({
        recommendation,
        noun,
        contextBase,
        deps,
    });
}
