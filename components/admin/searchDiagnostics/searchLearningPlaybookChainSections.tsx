import type { ReactNode } from 'react';
import {
    buildSearchLearningWorkbench,
    type SearchLearningOpsPlaybookRecommendation,
    type SearchLearningOpsPlaybookRecommendationOutcome,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendation,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
} from './searchLearningWorkbench';
import { SearchLearningImpactSections } from './searchLearningImpactSections';
import { SearchLearningPlaybookAdvancedSections } from './searchLearningPlaybookAdvancedSections';
import { SearchLearningPlaybookRecommendationOutcomeSections } from './searchLearningPlaybookRecommendationOutcomeSections';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type SearchLearningPlaybookChainSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsPlaybookRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomes'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningImpactSummary'
    | 'searchLearningImpactClusterRollup'
    | 'searchLearningImpactClusters'
    | 'searchLearningRewritePacks'
    | 'searchLearningRewriteRecommendationSummary'
    | 'searchLearningRewriteRecommendations'
    | 'searchLearningRewriteSourceDraftSummary'
    | 'searchLearningRewriteSourceDrafts'
> & {
    children: ReactNode;
    processingSearchLearningId: string | null;
    showAdvancedPlaybookChain: boolean;
    onToggleAdvancedChain: () => void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunOutcomeRecommendationAction: (
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation
    ) => Promise<void> | void;
    onRunAdvancedRecommendationAction: (
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
    ) => Promise<void> | void;
    onRunPlaybookRecommendationAction: (
        recommendation: SearchLearningOpsPlaybookRecommendation
    ) => Promise<void> | void;
    onRunPlaybookRecommendationOutcomeAction: (
        outcome: SearchLearningOpsPlaybookRecommendationOutcome
    ) => Promise<void> | void;
    onRunOutcomeOutcomeRecommendationAction: (
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation
    ) => Promise<void> | void;
    onRunOutcomeRecommendationRecommendationAction: (
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendation
    ) => Promise<void> | void;
    onGenerateImpactAwaitingClusterSuggestions: () => Promise<void> | void;
    onGenerateImpactAwaitingSuggestions: () => Promise<void> | void;
    onGenerateImpactNoImprovementClusterSuggestions: () => Promise<void> | void;
    onGenerateImpactNoImprovementSuggestions: () => Promise<void> | void;
    onSelectImpactAwaitingClusters: () => void;
    onSelectImpactAwaitingEntries: () => void;
    onSelectImpactClusterEntries: (entryIds: string[], clusterLabel: string) => void;
    onSelectImpactImprovedEntries: () => void;
    onSelectImpactNoImprovementClusters: () => void;
    onSelectImpactNoImprovementEntries: () => void;
};

export function SearchLearningPlaybookChainSections({
    children,
    processingSearchLearningId,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
    searchLearningOpsPlaybookRecommendationActivity,
    searchLearningOpsPlaybookRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomes,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes,
    searchLearningImpactSummary,
    searchLearningImpactClusterRollup,
    searchLearningImpactClusters,
    searchLearningRewritePacks,
    searchLearningRewriteRecommendationSummary,
    searchLearningRewriteRecommendations,
    searchLearningRewriteSourceDraftSummary,
    searchLearningRewriteSourceDrafts,
    showAdvancedPlaybookChain,
    onToggleAdvancedChain,
    onSelectEntries,
    onRunOutcomeRecommendationAction,
    onRunAdvancedRecommendationAction,
    onRunPlaybookRecommendationAction,
    onRunPlaybookRecommendationOutcomeAction,
    onRunOutcomeOutcomeRecommendationAction,
    onRunOutcomeRecommendationRecommendationAction,
    onGenerateImpactAwaitingClusterSuggestions,
    onGenerateImpactAwaitingSuggestions,
    onGenerateImpactNoImprovementClusterSuggestions,
    onGenerateImpactNoImprovementSuggestions,
    onSelectImpactAwaitingClusters,
    onSelectImpactAwaitingEntries,
    onSelectImpactClusterEntries,
    onSelectImpactImprovedEntries,
    onSelectImpactNoImprovementClusters,
    onSelectImpactNoImprovementEntries,
}: SearchLearningPlaybookChainSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Advanced Playbook Chain</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            playbook recommendation의 깊은 outcome/recommendation 반복 체인은 기본 화면에서 숨깁니다. 일반 운영은 `Playbooks`, `Playbook Activity`, `Playbook Outcomes`, `Playbook Recommendations` 중심으로 처리하고, 상세 추적이 필요할 때만 아래 chain을 펼치세요.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleAdvancedChain}
                        className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                    >
                        {showAdvancedPlaybookChain ? 'Advanced Playbook Chain 접기' : 'Advanced Playbook Chain 펼치기'}
                    </button>
                </div>
            </section>

            {showAdvancedPlaybookChain && (
                <SearchLearningPlaybookAdvancedSections
                    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations}
                    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity}
                    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes}
                    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations}
                    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue}
                    onSelectEntries={onSelectEntries}
                    onRunOutcomeRecommendationAction={onRunOutcomeRecommendationAction}
                    onRunAdvancedRecommendationAction={onRunAdvancedRecommendationAction}
                />
            )}

            {children}

            {showAdvancedPlaybookChain && (
                <>
                    <SearchLearningPlaybookRecommendationOutcomeSections
                        searchLearningOpsPlaybookRecommendationActivity={searchLearningOpsPlaybookRecommendationActivity}
                        searchLearningOpsPlaybookRecommendations={searchLearningOpsPlaybookRecommendations}
                        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations}
                        searchLearningOpsPlaybookRecommendationOutcomes={searchLearningOpsPlaybookRecommendationOutcomes}
                        searchLearningOpsPlaybookRecommendationOutcomeRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendations}
                        searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue={searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue}
                        searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity={searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity}
                        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes}
                        onSelectEntries={onSelectEntries}
                        onRunPlaybookRecommendationAction={onRunPlaybookRecommendationAction}
                        onRunPlaybookRecommendationOutcomeAction={onRunPlaybookRecommendationOutcomeAction}
                        onRunOutcomeOutcomeRecommendationAction={onRunOutcomeOutcomeRecommendationAction}
                        onRunOutcomeRecommendationAction={onRunOutcomeRecommendationRecommendationAction}
                    />

                    <SearchLearningImpactSections
                        processingSearchLearningId={processingSearchLearningId}
                        searchLearningImpactSummary={searchLearningImpactSummary}
                        searchLearningImpactClusterRollup={searchLearningImpactClusterRollup}
                        searchLearningImpactClusters={searchLearningImpactClusters}
                        searchLearningRewritePacks={searchLearningRewritePacks}
                        searchLearningRewriteRecommendationSummary={searchLearningRewriteRecommendationSummary}
                        searchLearningRewriteRecommendations={searchLearningRewriteRecommendations}
                        searchLearningRewriteSourceDraftSummary={searchLearningRewriteSourceDraftSummary}
                        searchLearningRewriteSourceDrafts={searchLearningRewriteSourceDrafts}
                        onGenerateImpactAwaitingClusterSuggestions={onGenerateImpactAwaitingClusterSuggestions}
                        onGenerateImpactAwaitingSuggestions={onGenerateImpactAwaitingSuggestions}
                        onGenerateImpactNoImprovementClusterSuggestions={onGenerateImpactNoImprovementClusterSuggestions}
                        onGenerateImpactNoImprovementSuggestions={onGenerateImpactNoImprovementSuggestions}
                        onSelectEntries={onSelectEntries}
                        onSelectImpactAwaitingClusters={onSelectImpactAwaitingClusters}
                        onSelectImpactAwaitingEntries={onSelectImpactAwaitingEntries}
                        onSelectImpactClusterEntries={onSelectImpactClusterEntries}
                        onSelectImpactImprovedEntries={onSelectImpactImprovedEntries}
                        onSelectImpactNoImprovementClusters={onSelectImpactNoImprovementClusters}
                        onSelectImpactNoImprovementEntries={onSelectImpactNoImprovementEntries}
                    />
                </>
            )}
        </>
    );
}
