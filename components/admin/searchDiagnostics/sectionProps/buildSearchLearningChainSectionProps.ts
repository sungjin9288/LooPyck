import type { BuildSearchLearningSectionPropsParams } from './types';
import { buildSearchLearningChainActionProps } from './buildSearchLearningChainActionProps';
import { buildSearchLearningChainDataProps } from './buildSearchLearningChainDataProps';

export function buildSearchLearningChainSectionProps({
    model,
    actions,
}: Pick<BuildSearchLearningSectionPropsParams, 'model' | 'actions'>) {
    const {
        playbookChainActionProps,
        completionChainActionProps,
        playbookActionProps,
    } = buildSearchLearningChainActionProps({ model, actions });
    const {
        playbookChainDataProps,
        completionChainDataProps,
        playbookDataProps,
    } = buildSearchLearningChainDataProps({ model });

    return {
        playbookChainProps: {
            ...playbookChainDataProps,
            ...playbookChainActionProps,
        },
        completionChainProps: {
            ...completionChainDataProps,
            ...completionChainActionProps,
        },
        playbookProps: {
            ...playbookDataProps,
            ...playbookActionProps,
        },
    };
}
