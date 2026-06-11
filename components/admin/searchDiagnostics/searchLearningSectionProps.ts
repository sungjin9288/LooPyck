import { buildSearchLearningChainSectionProps } from './sectionProps/buildSearchLearningChainSectionProps';
import { buildSearchLearningCoreSectionProps } from './sectionProps/buildSearchLearningCoreSectionProps';
import type { BuildSearchLearningSectionPropsParams } from './sectionProps/types';

export function buildSearchLearningSectionProps(params: BuildSearchLearningSectionPropsParams) {
    return {
        ...buildSearchLearningCoreSectionProps(params),
        ...buildSearchLearningChainSectionProps(params),
    };
}
