import type { OpsChainLevelConfig, OpsChainRecommendationsConfig } from './searchLearningOpsChain.ts';

/**
 * Per-level config table for the recursive "search learning ops" chain.
 * All context prefixes, id prefixes, and copy text are transcribed verbatim
 * from the original per-level files. The id/context prefixes are persisted in
 * Firestore activity logs and must never change for an existing level.
 */

export const playbookChainLevels: OpsChainLevelConfig[] = [
    {
        queue: {
            idPrefix: 'playbook_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'ops_playbook_recommendation_review_',
            retrainContextPrefix: 'ops_playbook_recommendation_retrain_',
            reviewMeta: {
                title: 'Recommendation Review Run',
                description: 'playbook recommendation에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Recommendation Retrain Run',
                description: 'playbook recommendation에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'playbook_recommendation_outcome',
            descriptions: {
                readyReview: 'recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'recommendation 실행 후에도 low-fit/0건 개선이 약해 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'recommendation은 실행됐지만 아직 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'playbook_recommendation_outcome_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: 'recommendation outcome이 review 가능한 draft로 이어져, 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 review 대기 query가 recommendation outcome에서 준비됐습니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: 'recommendation outcome 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: 'recommendation outcome은 실행됐지만 표본이 부족해 관찰과 추가 검색이 더 필요합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: 'recommendation outcome이 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태로 유지되고 있습니다.`,
                },
            },
        },
    },
    {
        queue: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'ops_playbook_recommendation_outcome_recommendation_review_',
            retrainContextPrefix: 'ops_playbook_recommendation_outcome_recommendation_retrain_',
            reviewMeta: {
                title: 'Outcome Recommendation Review Run',
                description: 'recommendation outcome recommendation에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Outcome Recommendation Retrain Run',
                description: 'recommendation outcome recommendation에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_outcome',
            descriptions: {
                readyReview: 'outcome recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'outcome recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'outcome recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_outcome_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: '후속 outcome이 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 query가 후속 outcome 단계에서 review 대기 상태입니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: '후속 outcome 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: '후속 outcome은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: '후속 outcome이 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
                },
            },
        },
    },
    {
        queue: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_outcome_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_',
            retrainContextPrefix: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_',
            reviewMeta: {
                title: 'Outcome Recommendation Outcome Recommendation Review Run',
                description: 'outcome recommendation outcome recommendation queue에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Outcome Recommendation Outcome Recommendation Retrain Run',
                description: 'outcome recommendation outcome recommendation queue에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_outcome_recommendation_outcome',
            descriptions: {
                readyReview: 'outcome recommendation outcome recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'outcome recommendation outcome recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'outcome recommendation outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'outcome recommendation outcome recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: '후속 outcome activity가 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 query가 후속 activity outcome 단계에서 review 대기 상태입니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: '후속 outcome activity 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: '후속 outcome activity는 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: '후속 outcome activity가 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
                },
            },
        },
    },
];

export const completionRecommendationsConfig: OpsChainRecommendationsConfig = {
    idPrefix: 'completion_recommendation',
    outcomeIdSource: 'outcomeRecordId',
    classify: {
        readyReview: {
            actionLabel: 'review 즉시 승인',
            description: 'completion outcome 이후 review 가능한 draft가 준비되어 바로 승인 루프로 넘길 수 있습니다.',
            reason: (outcome) => `${outcome.readyReviewCount}개의 review 대기 query가 completion outcome에서 준비됐습니다.`,
        },
        needsAttention: {
            actionLabel: '재학습 AI 제안',
            description: 'completion outcome 이후에도 개선이 약한 query가 남아 있어 재학습이 필요합니다.',
            reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
        },
        awaitingSamples: {
            actionLabel: '표본 수집 대상 선택',
            description: 'completion outcome은 실행됐지만 표본이 부족해 추가 검색과 관찰이 필요합니다.',
            reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
        },
        validated: {
            actionLabel: '개선 query 선택',
            description: 'completion outcome이 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
            reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태로 유지되고 있습니다.`,
        },
    },
};

export const completionChainLevels: OpsChainLevelConfig[] = [
    {
        queue: {
            idPrefix: 'completion_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'completion_recommendation_review_',
            retrainContextPrefix: 'completion_recommendation_retrain_',
            reviewMeta: {
                title: 'Completion Recommendation Review Run',
                description: 'completion recommendation에서 review 가능한 draft를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Completion Recommendation Retrain Run',
                description: 'completion recommendation에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        // Bespoke stage: searchLearningOpsCompletionRecommendationOutcomes.ts
        // keeps the legacy activityId identity field, so it is built outside
        // the generic engine.
        outcomes: null,
        recommendations: {
            idPrefix: 'completion_recommendation_outcome_recommendation',
            outcomeIdSource: 'outcomeRecordId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: 'completion recommendation outcome이 review 가능한 draft로 이어져, 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 review 대기 query가 completion recommendation outcome에서 준비됐습니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: 'completion recommendation outcome 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: 'completion recommendation outcome은 실행됐지만 표본이 부족해 관찰과 추가 검색이 더 필요합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: 'completion recommendation outcome이 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태로 유지되고 있습니다.`,
                },
            },
        },
    },
    {
        queue: {
            idPrefix: 'completion_recommendation_outcome_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'completion_recommendation_outcome_review_',
            retrainContextPrefix: 'completion_recommendation_outcome_retrain_',
            reviewMeta: {
                title: 'Completion Recommendation Outcome Review Run',
                description: 'completion recommendation outcome recommendation에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Completion Recommendation Outcome Retrain Run',
                description: 'completion recommendation outcome recommendation에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome',
            descriptions: {
                readyReview: 'completion recommendation outcome recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'completion recommendation outcome recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'completion recommendation outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'completion recommendation outcome recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: 'completion recommendation outcome recommendation outcome이 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 query가 completion recommendation outcome recommendation outcome 단계에서 review 대기 상태입니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: 'completion recommendation outcome recommendation outcome 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: 'completion recommendation outcome recommendation outcome은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: 'completion recommendation outcome recommendation outcome이 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
                },
            },
        },
    },
    {
        queue: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'completion_recommendation_outcome_recommendation_outcome_review_',
            retrainContextPrefix: 'completion_recommendation_outcome_recommendation_outcome_retrain_',
            reviewMeta: {
                title: 'Completion Recommendation Outcome Recommendation Outcome Review Run',
                description: 'completion recommendation outcome recommendation outcome queue에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Completion Recommendation Outcome Recommendation Outcome Retrain Run',
                description: 'completion recommendation outcome recommendation outcome queue에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_outcome',
            descriptions: {
                readyReview: 'completion recommendation outcome recommendation outcome recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'completion recommendation outcome recommendation outcome recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'completion recommendation outcome recommendation outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'completion recommendation outcome recommendation outcome recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: 'completion recommendation outcome recommendation outcome recommendation 결과가 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 query가 후속 outcome recommendation 단계에서 review 대기 상태입니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: 'completion recommendation outcome recommendation outcome recommendation 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: 'completion recommendation outcome recommendation outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: 'completion recommendation outcome recommendation outcome recommendation이 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
                },
            },
        },
    },
    {
        queue: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_queue',
        },
        activity: {
            reviewContextPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_review_',
            retrainContextPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_retrain_',
            reviewMeta: {
                title: 'Completion Outcome Recommendation Outcome Recommendation Outcome Recommendation Review Run',
                description: 'completion recommendation outcome recommendation outcome recommendation recommendation queue에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            },
            retrainMeta: {
                title: 'Completion Outcome Recommendation Outcome Recommendation Outcome Recommendation Retrain Run',
                description: 'completion recommendation outcome recommendation outcome recommendation recommendation queue에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            },
        },
        outcomes: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_outcome',
            descriptions: {
                readyReview: 'completion recommendation outcome recommendation outcome recommendation recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.',
                needsAttention: 'completion recommendation outcome recommendation outcome recommendation recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.',
                awaitingSamples: 'completion recommendation outcome recommendation outcome recommendation recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                validated: 'completion recommendation outcome recommendation outcome recommendation recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.',
            },
        },
        recommendations: {
            idPrefix: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_recommendation',
            outcomeIdSource: 'parsedOutcomeId',
            classify: {
                readyReview: {
                    actionLabel: 'review 즉시 승인',
                    description: 'completion recommendation outcome recommendation outcome recommendation recommendation 결과가 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                    reason: (outcome) => `${outcome.readyReviewCount}개의 query가 후속 terminal recommendation 단계에서 review 대기 상태입니다.`,
                },
                needsAttention: {
                    actionLabel: '재학습 AI 제안',
                    description: 'completion recommendation outcome recommendation outcome recommendation recommendation 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                    reason: (outcome) => `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
                },
                awaitingSamples: {
                    actionLabel: '표본 수집 대상 선택',
                    description: 'completion recommendation outcome recommendation outcome recommendation recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                    reason: (outcome) => `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
                },
                validated: {
                    actionLabel: '개선 query 선택',
                    description: 'completion recommendation outcome recommendation outcome recommendation recommendation이 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                    reason: (outcome) => `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
                },
            },
        },
    },
];
