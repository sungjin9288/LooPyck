import type { BuildSearchLearningSectionPropsParams } from './types';

export function buildSearchLearningPlaybookActionProps({
    actions,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions'>) {
    const {
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleSearchLearningOpsCenterAction,
        handleSearchLearningOpsPlaybookAction,
        handleSearchLearningOpsPlaybookOutcomeAction,
        handleSearchLearningOpsPlaybookRecommendationAction,
        selectSearchLearningEntries,
    } = actions;

    return {
        onBulkGenerateSuggestionsForIds: handleBulkGenerateSearchLearningSuggestionsForIds,
        onRunOpsCenterAction: handleSearchLearningOpsCenterAction,
        onRunPlaybookAction: handleSearchLearningOpsPlaybookAction,
        onRunPlaybookOutcomeAction: handleSearchLearningOpsPlaybookOutcomeAction,
        onRunPlaybookRecommendationAction: handleSearchLearningOpsPlaybookRecommendationAction,
        onSelectEntries: selectSearchLearningEntries,
    };
}
