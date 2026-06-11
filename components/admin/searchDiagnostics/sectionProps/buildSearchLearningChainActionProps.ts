import type { BuildSearchLearningSectionPropsParams } from './types';
import { buildSearchLearningCompletionChainActionProps } from './buildSearchLearningCompletionChainActionProps';
import { buildSearchLearningPlaybookActionProps } from './buildSearchLearningPlaybookActionProps';
import { buildSearchLearningPlaybookChainActionProps } from './buildSearchLearningPlaybookChainActionProps';

export function buildSearchLearningChainActionProps({
    actions,
    model,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions' | 'model'>) {
    return {
        playbookChainActionProps: buildSearchLearningPlaybookChainActionProps({ model, actions }),
        completionChainActionProps: buildSearchLearningCompletionChainActionProps({ actions }),
        playbookActionProps: buildSearchLearningPlaybookActionProps({ actions }),
    };
}
