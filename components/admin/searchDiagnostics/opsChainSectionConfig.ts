import type { OpsChainGroupUi, OpsChainSummaryPill } from './opsChainSections';

/**
 * UI + action config for every group of the recursive "search learning ops
 * chain". All copy (headings, intros, empty states, select messages) and the
 * accent/badge classes are transcribed verbatim from the retired per-level
 * section files. The contextBase/noun pairs are persisted in Firestore
 * activity logs and must never change for an existing group.
 */

const PILL_SLATE = 'border-slate-800 bg-slate-900/60 text-slate-300';
const PILL_SLATE_700 = 'border-slate-700 bg-slate-900/60 text-slate-300';
const PILL_EMERALD = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
const PILL_ROSE = 'border-rose-500/30 bg-rose-500/10 text-rose-100';
const PILL_AMBER = 'border-amber-500/30 bg-amber-500/10 text-amber-100';
const PILL_CYAN = 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
const PILL_SKY = 'border-sky-500/30 bg-sky-500/10 text-sky-100';
const PILL_ORANGE = 'border-orange-500/30 bg-orange-500/10 text-orange-100';

const SECTION_SKY = 'border-sky-500/20 bg-sky-500/5';
const SECTION_VIOLET = 'border-violet-500/20 bg-violet-500/5';
const SECTION_EMERALD = 'border-emerald-500/20 bg-emerald-500/5';
const SECTION_TEAL = 'border-teal-500/20 bg-teal-500/5';
const SECTION_LIME = 'border-lime-500/20 bg-lime-500/5';
const SECTION_FUCHSIA = 'border-fuchsia-500/20 bg-fuchsia-500/5';
const SECTION_PLAYBOOK = 'border-slate-800 bg-slate-950/60';

const BTN_CYAN = 'border-cyan-500/40 bg-cyan-500/10 text-cyan-100';
const BTN_SKY = 'border-sky-500/40 bg-sky-500/10 text-sky-100';
const BTN_VIOLET = 'border-violet-500/40 bg-violet-500/10 text-violet-100';
const BTN_EMERALD = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100';
const BTN_TEAL = 'border-teal-500/40 bg-teal-500/10 text-teal-100';
const BTN_LIME = 'border-lime-500/40 bg-lime-500/10 text-lime-100';
const BTN_FUCHSIA = 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100';
const BTN_SLATE = 'border-slate-700 text-slate-200';

const STATE_FALLBACK_SLATE = 'border-slate-700 bg-slate-950/70 text-slate-300';

const REVIEW_RETRAIN_BADGES = { review_now: PILL_EMERALD } as const;

/** deep completion levels label the outcome pills 'ready review / needs attention / awaiting'. */
const DEEP_OUTCOME_PILLS: OpsChainSummaryPill[] = [
    { label: 'total', field: 'total', className: PILL_SLATE },
    { label: 'ready review', field: 'readyReview', className: PILL_EMERALD },
    { label: 'needs attention', field: 'needsAttention', className: PILL_ROSE },
    { label: 'awaiting', field: 'awaitingSamples', className: PILL_AMBER },
    { label: 'validated', field: 'validated', className: PILL_CYAN },
];

/** deep completion queues historically swap the execute/review accents. */
const SWAPPED_QUEUE_STATE_CLASSES: Record<string, string> = {
    execute_now: PILL_EMERALD,
    needs_review: PILL_ROSE,
    sample_collection: PILL_AMBER,
};

const SWAPPED_QUEUE_PILLS: OpsChainSummaryPill[] = [
    { label: 'total', field: 'total', className: PILL_SLATE },
    { label: 'execute', field: 'executeNow', className: PILL_EMERALD },
    { label: 'review', field: 'needsReview', className: PILL_ROSE },
    { label: 'samples', field: 'sampleCollection', className: PILL_AMBER },
    { label: 'observe', field: 'observe', className: PILL_CYAN },
];

const PLAYBOOK_QUEUE_STATE_CLASSES: Record<string, string> = {
    execute_now: PILL_EMERALD,
    needs_review: PILL_SKY,
    sample_collection: PILL_AMBER,
};

export const completionChainGroupsUi: OpsChainGroupUi[] = [
    {
        key: 'completion',
        activity: {
            heading: 'Search Learning Ops Completion Activity',
            intro: 'completion queue에서 실제 실행된 `즉시 AI 제안 / 즉시 승인` 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 아래 queue로 넘길 수 있습니다.',
            emptyText: '아직 completion activity가 없습니다. `Completion Queue`에서 액션을 실행하면 여기에 최근 이력이 쌓입니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_CYAN,
            selectMessage: (title) => `${title} 실행 query를 선택했습니다.`,
            pills: [
                { label: 'total runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'execute', field: 'executeRuns', className: PILL_EMERALD },
                { label: 'review', field: 'reviewRuns', className: PILL_SKY },
                { label: 'queries', field: 'uniqueQueries', className: PILL_CYAN },
            ],
            badgeClassByAction: { execute_now: PILL_EMERALD },
            fallbackBadgeClass: PILL_SKY,
        },
        outcomes: {
            heading: 'Search Learning Ops Completion Outcomes',
            intro: 'completion activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어 보여줍니다.',
            emptyText: '아직 completion outcome이 없습니다. `Completion Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.',
            sectionClass: SECTION_VIOLET,
            selectButtonClass: BTN_VIOLET,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
        },
        recommendations: {
            heading: 'Search Learning Ops Completion Recommendations',
            intro: 'completion outcome을 바로 실행 가능한 triage 액션으로 다시 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.',
            emptyText: '아직 completion recommendation이 없습니다. `Completion Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.',
            sectionClass: SECTION_EMERALD,
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} completion recommendation query를 선택했습니다.`,
        },
        queue: {
            heading: 'Search Learning Ops Completion Recommendation Queue',
            intro: 'completion recommendation을 실제 운영 우선순위로 다시 정렬합니다. execute, review, sample, observe 순으로 바로 처리할 수 있습니다.',
            emptyText: '아직 completion recommendation queue가 없습니다. `Completion Recommendations`가 쌓이면 여기에서 운영 우선순위로 바로 처리할 수 있습니다.',
            sectionClass: SECTION_TEAL,
            runButtonClass: BTN_TEAL,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
        },
    },
    {
        key: 'completionRecommendation',
        activity: {
            heading: 'Search Learning Ops Completion Recommendation Activity',
            intro: 'completion recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 바로 queue로 넘길 수 있습니다.',
            emptyText: '아직 completion recommendation activity가 없습니다. `Completion Recommendation Queue`에서 액션을 실행하면 여기에 최근 이력이 쌓입니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SKY,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'total runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_CYAN },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
        },
        outcomes: {
            heading: 'Search Learning Ops Completion Recommendation Outcomes',
            intro: 'completion recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어 보여줍니다.',
            emptyText: '아직 completion recommendation outcome이 없습니다. `Completion Recommendation Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.',
            sectionClass: SECTION_VIOLET,
            selectButtonClass: BTN_VIOLET,
            selectMessage: (title) => `${title} recommendation outcome query를 선택했습니다.`,
        },
        recommendations: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendations',
            intro: 'completion recommendation outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.',
            emptyText: '아직 completion recommendation outcome recommendation이 없습니다. `Completion Recommendation Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.',
            sectionClass: SECTION_LIME,
            runButtonClass: BTN_LIME,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} completion recommendation outcome recommendation query를 선택했습니다.`,
        },
        queue: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Queue',
            intro: 'completion recommendation outcome recommendation을 실제 운영 우선순위로 다시 정렬합니다. execute, review, sample, observe 순으로 바로 처리할 수 있습니다.',
            emptyText: '아직 completion recommendation outcome recommendation queue가 없습니다. `Completion Recommendation Outcome Recommendations`가 쌓이면 여기에서 운영 우선순위로 바로 처리할 수 있습니다.',
            sectionClass: SECTION_TEAL,
            runButtonClass: BTN_TEAL,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
        },
    },
    {
        key: 'completionOutcomeRecommendation',
        activity: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Activity',
            intro: 'completion recommendation outcome recommendation queue에서 실제로 실행된 review/retrain 이력을 모읍니다. 최근 실행 query를 다시 queue로 넘겨 후속 triage로 이어갈 수 있습니다.',
            emptyText: '아직 completion recommendation outcome recommendation activity가 없습니다. `Completion Recommendation Outcome Recommendation Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.',
            sectionClass: SECTION_FUCHSIA,
            selectButtonClass: BTN_FUCHSIA,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_SLATE_700 },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
            statCards: [
                { label: 'Total Runs', field: 'totalRuns', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-white' },
                { label: 'Review Runs', field: 'reviewRuns', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-emerald-100' },
                { label: 'Retrain Runs', field: 'retrainRuns', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-rose-100' },
                { label: 'Unique Queries', field: 'uniqueQueries', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-slate-100' },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            cornerBadge: { kind: 'count', suffix: 'actions' },
            metaLine: 'time',
            showMetaBox: false,
        },
        outcomes: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcomes',
            intro: 'completion recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome이 없습니다. `Completion Recommendation Outcome Recommendation Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SKY,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: DEEP_OUTCOME_PILLS,
            secondBadge: { kind: 'queryCount' },
            showResultBox: false,
        },
        recommendations: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendations',
            intro: 'completion recommendation outcome recommendation outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation이 없습니다. `Completion Recommendation Outcome Recommendation Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.',
            sectionClass: SECTION_LIME,
            runButtonClass: BTN_LIME,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} completion recommendation outcome recommendation outcome query를 선택했습니다.`,
        },
        queue: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Queue',
            intro: '가장 최근 completion recommendation outcome recommendation outcome recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation queue가 없습니다. `...Outcome Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.',
            sectionClass: SECTION_SKY,
            runButtonClass: BTN_SKY,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
            pills: SWAPPED_QUEUE_PILLS,
            stateClasses: SWAPPED_QUEUE_STATE_CLASSES,
            stateFallbackClass: PILL_CYAN,
        },
    },
    {
        key: 'completionDeep',
        activity: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Activity',
            intro: 'completion recommendation outcome recommendation outcome recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation activity가 없습니다. `...Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SKY,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
            pills: [
                { label: 'runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_CYAN },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
        },
        outcomes: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Outcomes',
            intro: 'completion recommendation outcome recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation outcomes가 없습니다. `...Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SKY,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: DEEP_OUTCOME_PILLS,
            secondBadge: { kind: 'queryCount' },
            showResultBox: false,
        },
        recommendations: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendations',
            intro: 'completion recommendation outcome recommendation outcome recommendation outcomes를 다시 `review / retrain / sample / observe` 액션으로 분류해서 바로 실행할 수 있게 정리합니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation recommendations가 없습니다. `...Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.',
            sectionClass: SECTION_LIME,
            runButtonClass: BTN_LIME,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} completion recommendation outcome recommendation outcome recommendation query를 선택했습니다.`,
        },
        queue: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Queue',
            intro: '가장 최근 completion recommendation outcome recommendation outcome recommendation recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation recommendation queue가 없습니다. `...Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.',
            sectionClass: SECTION_SKY,
            runButtonClass: BTN_SKY,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
            pills: SWAPPED_QUEUE_PILLS,
            stateClasses: SWAPPED_QUEUE_STATE_CLASSES,
            stateFallbackClass: PILL_CYAN,
        },
    },
    {
        key: 'completionTerminal',
        activity: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Activity',
            intro: 'completion recommendation outcome recommendation outcome recommendation recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 바로 queue로 넘길 수 있습니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation recommendation activity가 없습니다. queue에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 확인할 수 있습니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'total runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_SKY },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
            cornerBadge: null,
            showMetaBox: false,
        },
        outcomes: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Outcomes',
            intro: '직전 recommendation recommendation activity가 실제로 review-ready, retrain-needed, sample pending, validated 중 어디로 이어졌는지 다시 묶어 보여줍니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation recommendation outcomes가 없습니다. activity가 쌓이면 여기에서 후속 상태를 다시 확인할 수 있습니다.',
            sectionClass: SECTION_SKY,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: DEEP_OUTCOME_PILLS,
            secondBadge: null,
            showResultBox: false,
        },
        recommendations: {
            heading: 'Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Recommendations',
            intro: 'terminal layer입니다. 직전 outcomes를 `review / retrain / collect samples / observe` 액션으로 다시 묶되, 여기서 더 깊은 queue 체인은 만들지 않고 운영 액션으로 바로 닫습니다.',
            emptyText: '아직 completion recommendation outcome recommendation outcome recommendation recommendation recommendations가 없습니다. outcomes가 쌓이면 여기에서 terminal action으로 바로 닫을 수 있습니다.',
            sectionClass: SECTION_SKY,
            runButtonClass: BTN_LIME,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} terminal recommendation query를 선택했습니다.`,
        },
        queue: null,
    },
];

export const playbookChainGroupsUi: OpsChainGroupUi[] = [
    {
        key: 'playbookRecommendation',
        activity: {
            heading: 'Search Learning Ops Playbook Recommendation Activity',
            intro: 'recommendation queue에서 실제로 실행된 review/retrain activity를 추적해서, 동일 outcome 재실행과 queue 후속 조치를 바로 이어갈 수 있습니다.',
            emptyText: '아직 recommendation queue 실행 activity가 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'total runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'unique queries', field: 'uniqueQueries', className: PILL_SKY },
            ],
            badgeClassByAction: {
                review_now: PILL_EMERALD,
                retrain_now: PILL_ROSE,
                collect_samples: PILL_AMBER,
            },
            fallbackBadgeClass: PILL_SKY,
            statCards: [
                { label: 'Total Runs', field: 'totalRuns', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-400', valueClass: 'text-white', caption: 'recommendation queue 실행 기록', captionClass: 'text-slate-500' },
                { label: 'Review Runs', field: 'reviewRuns', cardClass: 'border-emerald-500/30 bg-emerald-500/10', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100', caption: '즉시 승인 실행 횟수', captionClass: 'text-emerald-100/70' },
                { label: 'Retrain Runs', field: 'retrainRuns', cardClass: 'border-rose-500/30 bg-rose-500/10', labelClass: 'text-rose-200', valueClass: 'text-rose-100', caption: '재학습 AI 제안 실행 횟수', captionClass: 'text-rose-100/70' },
                { label: 'Unique Queries', field: 'uniqueQueries', cardClass: 'border-sky-500/30 bg-sky-500/10', labelClass: 'text-sky-200', valueClass: 'text-sky-100', caption: 'activity가 다룬 query 수', captionClass: 'text-sky-100/70' },
            ],
            statCardsGridClass: 'md:grid-cols-4',
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            secondBadge: { kind: 'queryCount' },
            cornerBadge: { kind: 'actionLabel' },
            metaLine: 'timeActor',
            showMetaBox: false,
            rerunLabel: '동일 recommendation 실행',
            rerunButtonClass: BTN_EMERALD,
        },
        outcomes: {
            heading: 'Search Learning Ops Playbook Recommendation Outcomes',
            intro: 'recommendation activity가 실제로 `review 가능 / 재학습 필요 / 표본 대기 / 안정화` 중 어디에 있는지 다시 분류해서 후속 triage를 바로 탈 수 있게 합니다.',
            emptyText: '아직 평가 가능한 recommendation outcome이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'review', field: 'readyReview', className: PILL_EMERALD },
                { label: 'attention', field: 'needsAttention', className: PILL_ROSE },
                { label: 'awaiting', field: 'awaitingSamples', className: PILL_AMBER },
            ],
            statCards: [
                { label: 'Ready Review', field: 'readyReview', cardClass: 'border-emerald-500/30 bg-emerald-500/10', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100', caption: '즉시 승인 가능한 recommendation outcome', captionClass: 'text-emerald-100/70' },
                { label: 'Needs Attention', field: 'needsAttention', cardClass: 'border-rose-500/30 bg-rose-500/10', labelClass: 'text-rose-200', valueClass: 'text-rose-100', caption: '재학습 또는 rewrite 조정 필요', captionClass: 'text-rose-100/70' },
                { label: 'Awaiting Samples', field: 'awaitingSamples', cardClass: 'border-amber-500/30 bg-amber-500/10', labelClass: 'text-amber-200', valueClass: 'text-amber-100', caption: '표본이 더 필요한 recommendation outcome', captionClass: 'text-amber-100/70' },
                { label: 'Validated', field: 'validated', cardClass: 'border-slate-700 bg-slate-900/60', labelClass: 'text-slate-400', valueClass: 'text-slate-100', caption: '안정적으로 개선된 outcome', captionClass: 'text-slate-400' },
            ],
            statCardsGridClass: 'md:grid-cols-4',
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            statusFallbackClass: STATE_FALLBACK_SLATE,
            secondBadge: { kind: 'queryCount' },
            cornerBadge: { kind: 'action' },
            metaLine: 'timeContext',
            showResultBox: false,
            showMiniStats: true,
            runButtonClass: BTN_EMERALD,
            runLabel: (outcome) => (
                outcome.status === 'ready_review'
                    ? 'review 즉시 승인'
                    : outcome.status === 'needs_attention'
                        ? '재학습 AI 제안'
                        : 'queue 선택'
            ),
            rerunLabel: '동일 recommendation 실행',
            rerunButtonClass: BTN_SLATE,
            hideSelectButton: true,
        },
        recommendations: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendations',
            intro: 'recommendation outcome을 다시 다음 액션으로 재분류해서, review 승인/재학습/표본 수집을 한 단계 더 자동화합니다.',
            emptyText: '아직 실행 가능한 recommendation outcome recommendation이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} recommendation outcome recommendation query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'critical', field: 'critical', className: PILL_ROSE },
                { label: 'high', field: 'highPriority', className: PILL_ORANGE },
            ],
            statCards: [
                { label: 'Review Now', field: 'reviewNow', cardClass: 'border-emerald-500/30 bg-emerald-500/10', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100', caption: '즉시 승인 가능한 outcome recommendation', captionClass: 'text-emerald-100/70' },
                { label: 'Retrain Now', field: 'retrainNow', cardClass: 'border-rose-500/30 bg-rose-500/10', labelClass: 'text-rose-200', valueClass: 'text-rose-100', caption: '즉시 재학습할 outcome recommendation', captionClass: 'text-rose-100/70' },
                { label: 'Collect Samples', field: 'collectSamples', cardClass: 'border-amber-500/30 bg-amber-500/10', labelClass: 'text-amber-200', valueClass: 'text-amber-100', caption: '표본이 더 필요한 outcome recommendation', captionClass: 'text-amber-100/70' },
                { label: 'Observe', field: 'observe', cardClass: 'border-sky-500/30 bg-sky-500/10', labelClass: 'text-sky-200', valueClass: 'text-sky-100', caption: '개선 상태를 관찰할 outcome recommendation', captionClass: 'text-sky-100/70' },
            ],
            statCardsGridClass: 'md:grid-cols-4',
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            primaryBadge: 'priority',
            secondBadge: { kind: 'action' },
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'timeOutcomeStatus',
        },
        queue: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Queue',
            intro: 'outcome recommendation을 다시 실행 우선순위 큐로 정렬해서, 지금 당장 처리할 항목과 관찰 대상으로 남길 항목을 분리합니다.',
            emptyText: '아직 실행 가능한 recommendation outcome recommendation queue가 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'urgent', field: 'urgent', className: PILL_ROSE },
                { label: 'execute', field: 'executeNow', className: PILL_EMERALD },
                { label: 'review', field: 'needsReview', className: PILL_SKY },
            ],
            statCards: [
                { label: 'Execute Now', field: 'executeNow', cardClass: 'border-emerald-500/30 bg-emerald-500/10', labelClass: 'text-emerald-200', valueClass: 'text-emerald-100', caption: '즉시 재학습/실행할 항목', captionClass: 'text-emerald-100/70' },
                { label: 'Needs Review', field: 'needsReview', cardClass: 'border-sky-500/30 bg-sky-500/10', labelClass: 'text-sky-200', valueClass: 'text-sky-100', caption: '즉시 승인 review 대상', captionClass: 'text-sky-100/70' },
                { label: 'Sample Collection', field: 'sampleCollection', cardClass: 'border-amber-500/30 bg-amber-500/10', labelClass: 'text-amber-200', valueClass: 'text-amber-100', caption: '추가 샘플이 필요한 항목', captionClass: 'text-amber-100/70' },
                { label: 'Observe', field: 'observe', cardClass: 'border-slate-700 bg-slate-900/60', labelClass: 'text-slate-400', valueClass: 'text-slate-100', caption: '개선 상태를 관찰할 항목', captionClass: 'text-slate-400' },
            ],
            statCardsGridClass: 'md:grid-cols-4',
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            stateClasses: PLAYBOOK_QUEUE_STATE_CLASSES,
            stateFallbackClass: STATE_FALLBACK_SLATE,
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'timeOutcomeStatus',
        },
    },
    {
        key: 'playbookOutcomeRecommendation',
        activity: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Activity',
            intro: 'outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 outcome을 다시 실행하거나 queue로 넘길 수 있게 합니다.',
            emptyText: '아직 outcome recommendation queue 실행 activity가 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_SLATE_700 },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            secondBadge: { kind: 'count', suffix: 'entries' },
            cornerBadge: { kind: 'priority' },
            metaLine: 'timeContext',
            showMetaBox: false,
            rerunLabel: '동일 outcome recommendation 실행',
            rerunButtonClass: BTN_EMERALD,
        },
        outcomes: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcomes',
            intro: 'outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.',
            emptyText: '아직 outcome recommendation activity 후속 outcome이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'ready review', field: 'readyReview', className: PILL_EMERALD },
                { label: 'needs attention', field: 'needsAttention', className: PILL_ROSE },
                { label: 'awaiting', field: 'awaitingSamples', className: PILL_AMBER },
                { label: 'validated', field: 'validated', className: PILL_SKY },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            statusFallbackClass: PILL_SKY,
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'timeImproved',
            showResultBox: false,
            rerunLabel: '동일 outcome recommendation 실행',
            rerunButtonClass: BTN_EMERALD,
        },
        recommendations: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendations',
            intro: '후속 outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.',
            emptyText: '아직 outcome recommendation outcome 후속 추천이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} outcome recommendation outcome query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'retrain', field: 'retrainNow', className: PILL_ROSE },
                { label: 'review', field: 'reviewNow', className: PILL_EMERALD },
                { label: 'samples', field: 'collectSamples', className: PILL_AMBER },
                { label: 'observe', field: 'observe', className: PILL_SKY },
            ],
            statCards: [
                { label: 'Review Now', field: 'reviewNow', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-emerald-100' },
                { label: 'Retrain Now', field: 'retrainNow', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-rose-100' },
                { label: 'Collect Samples', field: 'collectSamples', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-amber-100' },
                { label: 'Observe', field: 'observe', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-sky-100' },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            actionFallbackClass: PILL_SKY,
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'reason',
            showReasonBox: false,
        },
        queue: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Queue',
            intro: '후속 outcome triage 추천을 `즉시 실행 / review / 표본 수집 / 관찰` 큐로 다시 정렬합니다. 운영자는 이 큐만 보고 우선순위 처리를 이어가면 됩니다.',
            emptyText: '아직 실행 가능한 outcome recommendation outcome recommendation queue가 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} queue query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'execute', field: 'executeNow', className: PILL_EMERALD },
                { label: 'review', field: 'needsReview', className: PILL_SKY },
                { label: 'samples', field: 'sampleCollection', className: PILL_AMBER },
                { label: 'urgent', field: 'urgent', className: PILL_ROSE },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            stateClasses: PLAYBOOK_QUEUE_STATE_CLASSES,
            stateFallbackClass: STATE_FALLBACK_SLATE,
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'timeOutcomeStatus',
        },
    },
    {
        key: 'playbookDeep',
        activity: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Activity',
            intro: 'outcome recommendation outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 recommendation을 다시 실행하거나 queue로 넘길 수 있게 합니다.',
            emptyText: '아직 outcome recommendation outcome recommendation queue 실행 activity가 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} activity query를 선택했습니다.`,
            pills: [
                { label: 'runs', field: 'totalRuns', className: PILL_SLATE },
                { label: 'review', field: 'reviewRuns', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainRuns', className: PILL_ROSE },
                { label: 'queries', field: 'uniqueQueries', className: PILL_SLATE_700 },
            ],
            badgeClassByAction: REVIEW_RETRAIN_BADGES,
            fallbackBadgeClass: PILL_ROSE,
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            secondBadge: { kind: 'count', suffix: 'entries' },
            cornerBadge: { kind: 'priority' },
            metaLine: 'timeContext',
            showMetaBox: false,
            rerunLabel: '동일 outcome recommendation outcome recommendation 실행',
            rerunButtonClass: BTN_EMERALD,
        },
        outcomes: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Outcomes',
            intro: 'outcome recommendation outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.',
            emptyText: '아직 outcome recommendation outcome recommendation activity outcome이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} outcome query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'review', field: 'readyReview', className: PILL_EMERALD },
                { label: 'retrain', field: 'needsAttention', className: PILL_ROSE },
                { label: 'samples', field: 'awaitingSamples', className: PILL_AMBER },
                { label: 'validated', field: 'validated', className: PILL_SKY },
            ],
            statCards: [
                { label: 'Ready Review', field: 'readyReview', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-emerald-100' },
                { label: 'Needs Attention', field: 'needsAttention', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-rose-100' },
                { label: 'Awaiting Samples', field: 'awaitingSamples', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-amber-100' },
                { label: 'Validated', field: 'validated', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-sky-100' },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            statusFallbackClass: PILL_SKY,
            secondBadge: { kind: 'queryCount' },
            metaLine: 'timeContext',
            showResultBox: false,
        },
        recommendations: {
            heading: 'Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Recommendations',
            intro: '후속 outcome recommendation activity 결과를 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.',
            emptyText: '아직 outcome recommendation outcome recommendation recommendation이 없습니다.',
            sectionClass: SECTION_PLAYBOOK,
            introClass: 'text-slate-400',
            runButtonClass: BTN_EMERALD,
            selectButtonClass: BTN_SLATE,
            selectMessage: (title) => `${title} recommendation query를 선택했습니다.`,
            pills: [
                { label: 'total', field: 'total', className: PILL_SLATE },
                { label: 'review', field: 'reviewNow', className: PILL_EMERALD },
                { label: 'retrain', field: 'retrainNow', className: PILL_ROSE },
                { label: 'samples', field: 'collectSamples', className: PILL_AMBER },
                { label: 'observe', field: 'observe', className: PILL_SKY },
            ],
            statCards: [
                { label: 'Review Now', field: 'reviewNow', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-emerald-100' },
                { label: 'Retrain Now', field: 'retrainNow', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-rose-100' },
                { label: 'Collect Samples', field: 'collectSamples', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-amber-100' },
                { label: 'Observe', field: 'observe', cardClass: 'border-slate-800 bg-slate-900/60', labelClass: 'text-slate-500', valueClass: 'text-sky-100' },
            ],
            gridClass: 'xl:grid-cols-2',
            emptyColSpanClass: 'xl:col-span-2',
            maxItems: 6,
            actionFallbackClass: PILL_SKY,
            cornerBadge: { kind: 'queryCount' },
            metaLine: 'timeOutcomeStatus',
        },
        queue: null,
    },
];

export type OpsChainActionPair = {
    contextBase: string;
    noun: string;
};

export type OpsChainRerunSource = 'rootRecommendations' | 'previousGroupRecommendations';

export type OpsChainRerunActionConfig = OpsChainActionPair & {
    source: OpsChainRerunSource;
};

export type OpsChainGroupActionConfig = {
    recommendation: OpsChainActionPair;
    /** completion queues fall back to selecting entries; playbook queues no-op when unresolved. */
    queue?: OpsChainActionPair & { missingFallback: 'select' | 'noop' };
    outcome?: OpsChainActionPair;
    activityRerun?: OpsChainRerunActionConfig;
    outcomeRerun?: OpsChainRerunActionConfig;
};

export const completionChainGroupActions: OpsChainGroupActionConfig[] = [
    {
        recommendation: { contextBase: 'completion_recommendation', noun: 'completion recommendation' },
        queue: { contextBase: 'completion_recommendation', noun: 'completion recommendation', missingFallback: 'select' },
    },
    {
        recommendation: { contextBase: 'completion_recommendation_outcome', noun: 'completion recommendation outcome' },
        queue: { contextBase: 'completion_recommendation_outcome', noun: 'completion recommendation outcome', missingFallback: 'select' },
    },
    {
        recommendation: {
            contextBase: 'completion_recommendation_outcome_recommendation_outcome',
            noun: 'completion recommendation outcome recommendation outcome',
        },
        queue: {
            contextBase: 'completion_recommendation_outcome_recommendation_outcome',
            noun: 'completion recommendation outcome recommendation outcome',
            missingFallback: 'select',
        },
    },
    {
        recommendation: {
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation',
            noun: 'completion recommendation outcome recommendation outcome recommendation',
        },
        // Historical asymmetry: this group's queue logs one extra '_recommendation'
        // segment vs its recommendation handler. Preserved verbatim because both
        // prefixes are persisted in Firestore activity logs.
        queue: {
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            noun: 'completion recommendation outcome recommendation outcome recommendation recommendation',
            missingFallback: 'select',
        },
    },
    {
        recommendation: {
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_recommendation',
            noun: 'completion recommendation outcome recommendation outcome recommendation recommendation',
        },
    },
];

export const playbookChainGroupActions: OpsChainGroupActionConfig[] = [
    {
        recommendation: {
            contextBase: 'ops_playbook_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation',
        },
        queue: {
            contextBase: 'ops_playbook_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation',
            missingFallback: 'noop',
        },
        outcome: { contextBase: 'ops_playbook_recommendation_outcome', noun: 'recommendation outcome' },
        activityRerun: {
            source: 'rootRecommendations',
            contextBase: 'ops_playbook_recommendation',
            noun: 'playbook recommendation',
        },
        outcomeRerun: {
            source: 'rootRecommendations',
            contextBase: 'ops_playbook_recommendation',
            noun: 'playbook recommendation',
        },
    },
    {
        recommendation: {
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation outcome recommendation',
        },
        queue: {
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation outcome recommendation',
            missingFallback: 'noop',
        },
        activityRerun: {
            source: 'previousGroupRecommendations',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation',
        },
        outcomeRerun: {
            source: 'previousGroupRecommendations',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation',
        },
    },
    {
        recommendation: {
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            noun: 'recommendation outcome recommendation outcome recommendation recommendation',
        },
        activityRerun: {
            source: 'previousGroupRecommendations',
            contextBase: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation',
            noun: 'recommendation outcome recommendation outcome recommendation',
        },
    },
];
