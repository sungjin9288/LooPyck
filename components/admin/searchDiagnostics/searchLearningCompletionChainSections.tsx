import {
    buildSearchLearningWorkbench,
    type SearchLearningOpsCompletionAction,
    type SearchLearningOpsCompletionQueueItem,
    type OpsChainRecommendation,
} from './searchLearningWorkbench';
import {
    OpsChainGroupSections,
    type OpsChainGroupData,
    type OpsChainGroupHandlers,
} from './opsChainSections';
import { completionChainGroupsUi } from './opsChainSectionConfig';
import { SearchLearningCompletionSections } from './searchLearningCompletionSections';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type SearchLearningCompletionChainSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsCompletionSummary'
    | 'searchLearningOpsCompletionActions'
    | 'searchLearningOpsCompletionQueue'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
> & {
    completionChainGroups: OpsChainGroupData[];
    completionChainHandlers: OpsChainGroupHandlers[];
    showAdvancedSearchLearningChain: boolean;
    onToggleAdvancedChain: () => void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunCompletionAction: (action: SearchLearningOpsCompletionAction) => Promise<void> | void;
    onRunCompletionQueueItem: (item: SearchLearningOpsCompletionQueueItem) => Promise<void> | void;
    onRunSummaryRecommendation: (
        recommendation: OpsChainRecommendation
    ) => Promise<void> | void;
};

export function SearchLearningCompletionChainSections({
    searchLearningOpsCompletionSummary,
    searchLearningOpsCompletionActions,
    searchLearningOpsCompletionQueue,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    completionChainGroups,
    completionChainHandlers,
    showAdvancedSearchLearningChain,
    onToggleAdvancedChain,
    onSelectEntries,
    onRunCompletionAction,
    onRunCompletionQueueItem,
    onRunSummaryRecommendation,
}: SearchLearningCompletionChainSectionsProps) {
    return (
        <>
            <SearchLearningCompletionSections
                searchLearningOpsCompletionSummary={searchLearningOpsCompletionSummary}
                searchLearningOpsCompletionActions={searchLearningOpsCompletionActions}
                searchLearningOpsCompletionQueue={searchLearningOpsCompletionQueue}
                searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations}
                showAdvancedSearchLearningChain={showAdvancedSearchLearningChain}
                onToggleAdvancedChain={onToggleAdvancedChain}
                onSelectEntries={onSelectEntries}
                onRunCompletionAction={onRunCompletionAction}
                onRunCompletionQueueItem={onRunCompletionQueueItem}
                onRunSummaryRecommendation={onRunSummaryRecommendation}
            />

            {showAdvancedSearchLearningChain && completionChainGroups.map((groupData, index) => (
                <OpsChainGroupSections
                    key={completionChainGroupsUi[index].key}
                    ui={completionChainGroupsUi[index]}
                    data={groupData}
                    handlers={completionChainHandlers[index]}
                />
            ))}
        </>
    );
}
