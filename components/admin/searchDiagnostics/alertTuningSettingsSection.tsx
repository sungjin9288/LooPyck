import type { AlertBehaviorMode, AlertTuningConfig } from '@/lib/favorites/alertPersonalization';
import {
    alertPersonaModeClass,
    alertPersonaModeLabel,
    alertPriorityLabel,
    formatTime,
} from './helpers';
import type {
    AlertRecentEvent,
    DiagnosticsResponse,
} from './types';

const ALERT_BEHAVIOR_MODES: AlertBehaviorMode[] = ['instant', 'balanced', 'batch'];
const ALERT_PRIORITIES: AlertRecentEvent['priority'][] = ['critical', 'high', 'medium'];

type AlertTuningSourceOverride = NonNullable<AlertTuningConfig['sourceOverrides']>[string];
type AlertTuningField = 'defaultSnoozeHours' | 'targetDiscountRate' | AlertRecentEvent['priority'];

type AlertTuningSettingsSectionProps = {
    alertTuning: DiagnosticsResponse['alertTuning'] | null | undefined;
    draftTuning: AlertTuningConfig;
    currentOverrideSource: string | null;
    currentSourceOverride: AlertTuningSourceOverride | null | undefined;
    currentSourceRollout: number;
    availableOverrideSources: string[];
    onUpdateAlertTuningMode: (mode: AlertBehaviorMode, field: AlertTuningField, value: number) => void;
    onUpdateSourceAlertTuningMode: (source: string, mode: AlertBehaviorMode, field: AlertTuningField, value: number) => void;
    onUpdateSourceRolloutPercentage: (source: string, value: number) => void;
    onRemoveSourceOverride: (source: string) => void;
    onSelectOverrideSource: (source: string) => void;
    onSave: () => Promise<void> | void;
    onReset: () => void;
    isSavingTuning: boolean;
    rollbackingHistoryId: string | null;
    isTuningDirty: boolean;
    tuningMessage: string | null;
    onRollbackAlertTuning: (historyId: string) => Promise<void> | void;
};

export function AlertTuningSettingsSection({
    alertTuning,
    draftTuning,
    currentOverrideSource,
    currentSourceOverride,
    currentSourceRollout,
    availableOverrideSources,
    onUpdateAlertTuningMode,
    onUpdateSourceAlertTuningMode,
    onUpdateSourceRolloutPercentage,
    onRemoveSourceOverride,
    onSelectOverrideSource,
    onSave,
    onReset,
    isSavingTuning,
    rollbackingHistoryId,
    isTuningDirty,
    tuningMessage,
    onRollbackAlertTuning,
}: AlertTuningSettingsSectionProps) {
    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Alert Tuning Settings</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        persona별 기본 스누즈, 목표가 할인율, 우선순위별 재확인 시간을 직접 조정합니다.
                    </p>
                </div>
                <div className="text-right text-xs text-slate-400">
                    <div>Storage: <span className="font-semibold text-slate-200">{alertTuning?.storage || 'default'}</span></div>
                    <div className="mt-1">Updated: <span className="font-semibold text-slate-200">{formatTime(alertTuning?.updatedAt)}</span></div>
                    {alertTuning?.updatedBy && (
                        <div className="mt-1">By: <span className="font-semibold text-slate-200">{alertTuning.updatedBy}</span></div>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {ALERT_BEHAVIOR_MODES.map((mode) => {
                    const modeSettings = draftTuning.modes[mode];

                    return (
                        <div key={`alert_tuning_${mode}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{alertPersonaModeLabel(mode)}</p>
                                    <p className="mt-2 text-xs text-slate-400">{mode.toUpperCase()} preset</p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(mode)}`}>
                                    {mode.toUpperCase()}
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3">
                                <label className="text-xs text-slate-400">
                                    기본 스누즈 시간
                                    <input
                                        type="number"
                                        min={1}
                                        value={modeSettings.defaultSnoozeHours}
                                        onChange={(event) => onUpdateAlertTuningMode(mode, 'defaultSnoozeHours', Math.max(1, Number(event.target.value) || 0))}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    추천 목표가 할인율 (%)
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        step={0.5}
                                        value={modeSettings.targetDiscountRate}
                                        onChange={(event) => onUpdateAlertTuningMode(mode, 'targetDiscountRate', Math.max(1, Number(event.target.value) || 0))}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                    />
                                </label>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {ALERT_PRIORITIES.map((priority) => (
                                        <label key={`${mode}_${priority}`} className="text-xs text-slate-400">
                                            {alertPriorityLabel(priority)}
                                            <input
                                                type="number"
                                                min={1}
                                                value={modeSettings.recommendedByPriority[priority]}
                                                onChange={(event) => onUpdateAlertTuningMode(mode, priority, Math.max(1, Number(event.target.value) || 0))}
                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white">Source Override Settings</h3>
                        <p className="mt-2 text-xs text-slate-400">
                            source별로 기본 스누즈와 할인율을 따로 조정하고, rollout 비율로 일부 사용자군에만 적용할 수 있습니다.
                        </p>
                    </div>
                    {currentOverrideSource && currentSourceOverride && (
                        <button
                            type="button"
                            onClick={() => onRemoveSourceOverride(currentOverrideSource)}
                            className="rounded-full border border-rose-700/40 px-4 py-2 text-xs font-bold text-rose-200"
                        >
                            {currentOverrideSource} override 제거
                        </button>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {availableOverrideSources.map((source) => (
                        <button
                            key={`override_source_${source}`}
                            type="button"
                            onClick={() => onSelectOverrideSource(source)}
                            className={`rounded-full px-4 py-2 text-xs font-bold ${
                                currentOverrideSource === source
                                    ? 'bg-slate-100 text-slate-950'
                                    : 'border border-slate-700 text-slate-300'
                            }`}
                        >
                            {source}
                            {draftTuning.sourceOverrides?.[source] ? ' · override' : ''}
                            {draftTuning.sourceOverrides?.[source] ? ` · ${draftTuning.sourceRollouts?.[source] ?? 100}%` : ''}
                        </button>
                    ))}
                    {availableOverrideSources.length === 0 && (
                        <div className="text-xs text-slate-500">override 가능한 source 데이터가 없습니다.</div>
                    )}
                </div>

                {currentOverrideSource && (
                    <div className="mt-4 space-y-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-white">{currentOverrideSource} rollout</p>
                                    <p className="mt-2 text-xs text-slate-400">
                                        선택한 source override를 전체 사용자 중 몇 %에 적용할지 설정합니다. 100이면 전체 적용, 0이면 control 그룹 유지입니다.
                                    </p>
                                </div>
                                <label className="text-xs text-slate-400">
                                    Rollout (%)
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={currentSourceRollout}
                                        onChange={(event) => onUpdateSourceRolloutPercentage(currentOverrideSource, Number(event.target.value) || 0)}
                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400 md:w-40"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            {ALERT_BEHAVIOR_MODES.map((mode) => {
                                const sourceMode = currentSourceOverride?.[mode];
                                const effectiveMode = {
                                    defaultSnoozeHours: sourceMode?.defaultSnoozeHours ?? draftTuning.modes[mode].defaultSnoozeHours,
                                    targetDiscountRate: sourceMode?.targetDiscountRate ?? draftTuning.modes[mode].targetDiscountRate,
                                    recommendedByPriority: {
                                        ...draftTuning.modes[mode].recommendedByPriority,
                                        ...(sourceMode?.recommendedByPriority || {}),
                                    },
                                };

                                return (
                                    <div key={`override_${currentOverrideSource}_${mode}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{currentOverrideSource} · {alertPersonaModeLabel(mode)}</p>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    {sourceMode ? 'custom override' : 'using global default'}
                                                </p>
                                            </div>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(mode)}`}>
                                                {mode.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            <label className="text-xs text-slate-400">
                                                기본 스누즈 시간
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={effectiveMode.defaultSnoozeHours}
                                                    onChange={(event) => onUpdateSourceAlertTuningMode(currentOverrideSource, mode, 'defaultSnoozeHours', Math.max(1, Number(event.target.value) || 0))}
                                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                />
                                            </label>
                                            <label className="text-xs text-slate-400">
                                                추천 목표가 할인율 (%)
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={50}
                                                    step={0.5}
                                                    value={effectiveMode.targetDiscountRate}
                                                    onChange={(event) => onUpdateSourceAlertTuningMode(currentOverrideSource, mode, 'targetDiscountRate', Math.max(1, Number(event.target.value) || 0))}
                                                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                />
                                            </label>
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                {ALERT_PRIORITIES.map((priority) => (
                                                    <label key={`${currentOverrideSource}_${mode}_${priority}`} className="text-xs text-slate-400">
                                                        {alertPriorityLabel(priority)}
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={effectiveMode.recommendedByPriority[priority]}
                                                            onChange={(event) => onUpdateSourceAlertTuningMode(currentOverrideSource, mode, priority, Math.max(1, Number(event.target.value) || 0))}
                                                            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        void onSave();
                    }}
                    disabled={isSavingTuning || Boolean(rollbackingHistoryId) || !isTuningDirty}
                    className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
                >
                    {isSavingTuning ? '저장 중...' : '설정 저장'}
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                    className="rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 disabled:opacity-40"
                >
                    기본값으로 되돌리기
                </button>
                {tuningMessage && (
                    <p className={`text-sm ${tuningMessage.includes('실패') ? 'text-rose-300' : 'text-emerald-300'}`}>
                        {tuningMessage}
                    </p>
                )}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <h3 className="text-sm font-bold text-white">Recent Tuning Changes</h3>
                <div className="mt-4 space-y-3">
                    {(alertTuning?.history || []).map((entry) => (
                        <div key={`tuning_history_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.updatedAt)}</p>
                                    <p className="mt-2 text-sm font-semibold text-white">{entry.summary}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        {entry.updatedBy || 'system'}
                                    </span>
                                    {entry.restorable ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                void onRollbackAlertTuning(entry.id);
                                            }}
                                            disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                                            className="rounded-full border border-emerald-700/40 px-3 py-1 text-[11px] font-bold text-emerald-200 disabled:opacity-40"
                                        >
                                            {rollbackingHistoryId === entry.id ? '복원 중...' : '이 버전으로 복원'}
                                        </button>
                                    ) : (
                                        <span className="rounded-full border border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-500">
                                            snapshot 없음
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(alertTuning?.history || []).length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                            저장된 설정 변경 이력이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
