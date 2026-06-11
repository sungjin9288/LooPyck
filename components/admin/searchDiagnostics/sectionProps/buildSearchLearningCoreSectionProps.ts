import type { BuildSearchLearningSectionPropsParams } from './types';
import { buildSearchLearningCoreActionProps } from './buildSearchLearningCoreActionProps';
import { buildSearchLearningCoreDataProps } from './buildSearchLearningCoreDataProps';

export function buildSearchLearningCoreSectionProps({
    data,
    selectedSource,
    onSelectSource,
    model,
    actions,
}: BuildSearchLearningSectionPropsParams) {
    const {
        coverageActionProps,
        terminalActionProps,
        activityActionProps,
        queueActionProps,
    } = buildSearchLearningCoreActionProps({ actions });
    const {
        coverageDataProps,
        terminalDataProps,
        activityDataProps,
        queueDataProps,
        sourceDataProps,
    } = buildSearchLearningCoreDataProps({ data, selectedSource, model });

    return {
        coverageProps: {
            ...coverageDataProps,
            ...coverageActionProps,
        },
        terminalProps: {
            ...terminalDataProps,
            ...terminalActionProps,
        },
        activityProps: {
            ...activityDataProps,
            ...activityActionProps,
        },
        queueProps: {
            ...queueDataProps,
            ...queueActionProps,
        },
        sourceProps: {
            ...sourceDataProps,
            onSelectSource,
        },
    };
}
