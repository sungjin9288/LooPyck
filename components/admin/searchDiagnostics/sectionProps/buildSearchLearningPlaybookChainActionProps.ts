import type { BuildSearchLearningSectionPropsParams } from './types';

export function buildSearchLearningPlaybookChainActionProps({
    actions,
    model,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions' | 'model'>) {
    const { searchLearningImpactClusterRollup } = model.searchLearningWorkbench;
    const {
        handleGenerateImpactAwaitingClusterSuggestions,
        handleGenerateImpactAwaitingSuggestions,
        handleGenerateImpactNoImprovementClusterSuggestions,
        handleGenerateImpactNoImprovementSuggestions,
        handleSearchLearningOpsPlaybookRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
        processingSearchLearningId,
        selectImpactAwaitingEntries,
        selectImpactClusterEntries,
        selectImpactClusters,
        selectImpactImprovedEntries,
        selectImpactNoImprovementEntries,
        selectSearchLearningEntries,
        setShowAdvancedPlaybookChain,
        showAdvancedPlaybookChain,
    } = actions;

    return {
        processingSearchLearningId,
        showAdvancedPlaybookChain,
        onToggleAdvancedChain: () => setShowAdvancedPlaybookChain((current) => !current),
        onSelectEntries: selectSearchLearningEntries,
        onRunOutcomeRecommendationAction: handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction,
        onRunAdvancedRecommendationAction: handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
        onRunPlaybookRecommendationAction: handleSearchLearningOpsPlaybookRecommendationAction,
        onRunPlaybookRecommendationOutcomeAction: handleSearchLearningOpsPlaybookRecommendationOutcomeAction,
        onRunOutcomeOutcomeRecommendationAction: handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction,
        onRunOutcomeRecommendationRecommendationAction: handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction,
        onGenerateImpactAwaitingClusterSuggestions: handleGenerateImpactAwaitingClusterSuggestions,
        onGenerateImpactAwaitingSuggestions: handleGenerateImpactAwaitingSuggestions,
        onGenerateImpactNoImprovementClusterSuggestions: handleGenerateImpactNoImprovementClusterSuggestions,
        onGenerateImpactNoImprovementSuggestions: handleGenerateImpactNoImprovementSuggestions,
        onSelectImpactAwaitingClusters: () => selectImpactClusters(
            searchLearningImpactClusterRollup.topAwaitingSamples,
            `${searchLearningImpactClusterRollup.topAwaitingSamples.length}개의 샘플 대기 semantic cluster query를 선택했습니다.`
        ),
        onSelectImpactAwaitingEntries: selectImpactAwaitingEntries,
        onSelectImpactClusterEntries: selectImpactClusterEntries,
        onSelectImpactImprovedEntries: selectImpactImprovedEntries,
        onSelectImpactNoImprovementClusters: () => selectImpactClusters(
            searchLearningImpactClusterRollup.topNeedsAttention,
            `${searchLearningImpactClusterRollup.topNeedsAttention.length}개의 개선 없음 semantic cluster query를 선택했습니다.`
        ),
        onSelectImpactNoImprovementEntries: selectImpactNoImprovementEntries,
    };
}
