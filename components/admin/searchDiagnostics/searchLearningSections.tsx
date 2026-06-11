import type { useSearchLearningSectionProps } from './useSearchLearningSectionProps';
import { SearchLearningCompletionChainSections } from './searchLearningCompletionChainSections';
import { SearchLearningActivitySections } from './searchLearningActivitySections';
import { SearchLearningCoverageSections } from './searchLearningCoverageSections';
import { SearchDiagnosticsSourceSections } from './searchDiagnosticsSourceSections';
import { SearchLearningPlaybookChainSections } from './searchLearningPlaybookChainSections';
import { SearchLearningPlaybookSections } from './searchLearningPlaybookSections';
import { SearchLearningQueueSections } from './searchLearningQueueSections';
import { SearchLearningTerminalSections } from './searchLearningTerminalSections';

type SearchLearningSectionsProps = {
    sectionProps: ReturnType<typeof useSearchLearningSectionProps>;
};

export function SearchLearningSections({
    sectionProps,
}: SearchLearningSectionsProps) {
    return (
        <>
            <SearchLearningCoverageSections
                {...sectionProps.coverageProps}
            />

            <SearchLearningTerminalSections
                {...sectionProps.terminalProps}
            />

            <SearchLearningPlaybookChainSections
                {...sectionProps.playbookChainProps}
            >
                <SearchLearningCompletionChainSections
                    {...sectionProps.completionChainProps}
                />
            </SearchLearningPlaybookChainSections>

            <SearchLearningPlaybookSections
                {...sectionProps.playbookProps}
            />

            <SearchLearningActivitySections
                {...sectionProps.activityProps}
            />

            <SearchLearningQueueSections
                {...sectionProps.queueProps}
            />

            <SearchDiagnosticsSourceSections
                {...sectionProps.sourceProps}
            />
        </>
    );
}
