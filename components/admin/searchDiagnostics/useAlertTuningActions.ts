'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import type { AlertRolloutRecommendation } from '@/lib/favorites/alertRecommendations';
import { DEFAULT_ALERT_TUNING_CONFIG, type AlertBehaviorMode, type AlertTuningConfig } from '@/lib/favorites/alertPersonalization';
import { pushAppNotification } from '@/lib/core/notifications';
import { primeAlertTuningSettings } from '@/hooks/useAlertTuningSettings';
import {
    buildClientAuditInboxSummary,
    notificationTypeForAudit,
    webhookFormatLabel,
} from './helpers';
import type {
    AlertRecentEvent,
    DiagnosticsResponse,
} from './types';

type AlertTuningField = 'defaultSnoozeHours' | 'targetDiscountRate' | AlertRecentEvent['priority'];

type UseAlertTuningActionsParams = {
    user: User | null;
    data: DiagnosticsResponse | null;
    setData: Dispatch<SetStateAction<DiagnosticsResponse | null>>;
};

export function useAlertTuningActions({
    user,
    data,
    setData,
}: UseAlertTuningActionsParams) {
    const [alertTuningDraft, setAlertTuningDraft] = useState<AlertTuningConfig | null>(null);
    const [isTuningDirty, setIsTuningDirty] = useState(false);
    const [isSavingTuning, setIsSavingTuning] = useState(false);
    const [rollbackingHistoryId, setRollbackingHistoryId] = useState<string | null>(null);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [tuningMessage, setTuningMessage] = useState<string | null>(null);
    const [selectedOverrideSource, setSelectedOverrideSource] = useState<string | null>(null);
    const [queuedRequestNotes, setQueuedRequestNotes] = useState<Record<string, string>>({});
    const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
    const [markingAuditId, setMarkingAuditId] = useState<string | null>(null);
    const [runningReminderDigest, setRunningReminderDigest] = useState(false);
    const seenAuditEventIds = useRef<Set<string>>(new Set());
    const auditFeedHydrated = useRef(false);

    const alertTuning = data?.alertTuning;
    const alertTuningRequests = data?.alertTuningRequests || [];
    const alertTuningAudit = data?.alertTuningAudit || [];
    const alertTuningWebhook = data?.alertTuningWebhook || {
        configured: false,
        format: null,
        targetLabel: null,
    };
    const draftTuning = alertTuningDraft || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
    const availableOverrideSources = Array.from(new Set([
        ...(data?.summary.sources.map((entry) => entry.source) || []),
        ...(data?.alerts.summary.sources.map((entry) => entry.source) || []),
        ...Object.keys(draftTuning.sourceOverrides || {}),
        ...Object.keys(draftTuning.sourceRollouts || {}),
    ])).sort((left, right) => left.localeCompare(right));
    const currentOverrideSource = selectedOverrideSource || availableOverrideSources[0] || null;
    const currentSourceOverride = currentOverrideSource
        ? draftTuning.sourceOverrides?.[currentOverrideSource]
        : undefined;
    const currentSourceRollout = currentOverrideSource
        ? draftTuning.sourceRollouts?.[currentOverrideSource] ?? 100
        : 100;
    const quickRollbackEntries = (alertTuning?.history || []).filter((entry) => entry.restorable).slice(0, 3);

    useEffect(() => {
        if (data?.alertTuning?.config && !isTuningDirty) {
            setAlertTuningDraft(data.alertTuning.config);
        }
    }, [data?.alertTuning, isTuningDirty]);

    useEffect(() => {
        if (!user) {
            seenAuditEventIds.current.clear();
            auditFeedHydrated.current = false;
            return;
        }

        if (!auditFeedHydrated.current) {
            alertTuningAudit.forEach((event) => {
                seenAuditEventIds.current.add(event.id);
            });
            auditFeedHydrated.current = true;
            return;
        }

        alertTuningAudit
            .slice()
            .reverse()
            .forEach((event) => {
                if (seenAuditEventIds.current.has(event.id)) {
                    return;
                }

                seenAuditEventIds.current.add(event.id);
                if (event.level === 'info') {
                    return;
                }

                pushAppNotification({
                    title: event.title,
                    message: event.message,
                    type: notificationTypeForAudit(event.level),
                });
            });
    }, [alertTuningAudit, user]);

    useEffect(() => {
        if (!availableOverrideSources.length) {
            setSelectedOverrideSource(null);
            return;
        }

        if (!selectedOverrideSource || !availableOverrideSources.includes(selectedOverrideSource)) {
            setSelectedOverrideSource(availableOverrideSources[0]);
        }
    }, [availableOverrideSources, selectedOverrideSource]);

    function onQueuedRequestNoteChange(source: string, note: string) {
        setQueuedRequestNotes((current) => ({
            ...current,
            [source]: note,
        }));
    }

    function onResolutionNoteChange(requestId: string, note: string) {
        setResolutionNotes((current) => ({
            ...current,
            [requestId]: note,
        }));
    }

    function updateAlertTuningMode(
        mode: AlertBehaviorMode,
        field: AlertTuningField,
        value: number
    ) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const nextMode = { ...base.modes[mode] };

            if (field === 'defaultSnoozeHours' || field === 'targetDiscountRate') {
                (nextMode[field] as number) = value;
            } else {
                nextMode.recommendedByPriority = {
                    ...nextMode.recommendedByPriority,
                    [field]: value,
                };
            }

            return {
                ...base,
                modes: {
                    ...base.modes,
                    [mode]: nextMode,
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    function updateSourceAlertTuningMode(
        source: string,
        mode: AlertBehaviorMode,
        field: AlertTuningField,
        value: number
    ) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const existingSource = base.sourceOverrides?.[source] || {};
            const nextMode = {
                defaultSnoozeHours: existingSource[mode]?.defaultSnoozeHours ?? base.modes[mode].defaultSnoozeHours,
                targetDiscountRate: existingSource[mode]?.targetDiscountRate ?? base.modes[mode].targetDiscountRate,
                recommendedByPriority: {
                    ...base.modes[mode].recommendedByPriority,
                    ...(existingSource[mode]?.recommendedByPriority || {}),
                },
            };

            if (field === 'defaultSnoozeHours' || field === 'targetDiscountRate') {
                nextMode[field] = value;
            } else {
                nextMode.recommendedByPriority = {
                    ...nextMode.recommendedByPriority,
                    [field]: value,
                };
            }

            return {
                ...base,
                sourceOverrides: {
                    ...(base.sourceOverrides || {}),
                    [source]: {
                        ...existingSource,
                        [mode]: nextMode,
                    },
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    function updateSourceRolloutPercentage(source: string, value: number) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            return {
                ...base,
                sourceRollouts: {
                    ...(base.sourceRollouts || {}),
                    [source]: Math.min(100, Math.max(0, Math.round(value * 10) / 10)),
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    async function queueRecommendedSourceRolloutRequest(recommendation: AlertRolloutRecommendation) {
        if (!user) {
            return;
        }

        setProcessingRequestId(recommendation.source);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/requests', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: recommendation.source,
                    currentRolloutPercentage: recommendation.currentRolloutPercentage,
                    proposedRolloutPercentage: recommendation.recommendedRolloutPercentage,
                    title: recommendation.title,
                    description: recommendation.description,
                    requestNote: queuedRequestNotes[recommendation.source] || '',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval request 생성에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningRequests: payload.requests || [],
            } : current);
            setQueuedRequestNotes((current) => {
                const next = { ...current };
                delete next[recommendation.source];
                return next;
            });
            setTuningMessage(`${recommendation.source} rollout approval request를 생성했습니다.`);
        } catch (requestError) {
            setTuningMessage(requestError instanceof Error ? requestError.message : 'approval request 생성에 실패했습니다.');
        } finally {
            setProcessingRequestId(null);
        }
    }

    async function handleResolveApprovalRequest(requestId: string, action: 'approve' | 'reject') {
        if (!user) {
            return;
        }

        setProcessingRequestId(requestId);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/requests', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    action,
                    resolutionNote: resolutionNotes[requestId] || '',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval request 처리에 실패했습니다.');
            }

            if (payload.alertTuning) {
                primeAlertTuningSettings(payload.alertTuning);
            }
            setData((current) => current ? {
                ...current,
                alertTuning: payload.alertTuning || current.alertTuning,
                alertTuningRequests: payload.requests || [],
            } : current);
            if (payload.alertTuning && !isTuningDirty) {
                setAlertTuningDraft(payload.alertTuning.config);
            }
            setResolutionNotes((current) => {
                const next = { ...current };
                delete next[requestId];
                return next;
            });
            setTuningMessage(action === 'approve' ? 'approval request를 승인해 rollout 설정에 반영했습니다.' : 'approval request를 거절했습니다.');
        } catch (resolveError) {
            setTuningMessage(resolveError instanceof Error ? resolveError.message : 'approval request 처리에 실패했습니다.');
        } finally {
            setProcessingRequestId(null);
        }
    }

    async function handleMarkAuditEventsRead(eventIds: string[], markAll = false) {
        if (!user || (eventIds.length === 0 && !markAll)) {
            return;
        }

        setMarkingAuditId(markAll ? '__all__' : eventIds[0] || null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/audit', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(markAll ? { markAll: true } : { eventIds }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'audit inbox 업데이트에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningAudit: payload.events || [],
                alertTuningAuditInbox: payload.inbox || current.alertTuningAuditInbox,
            } : current);
        } catch (auditError) {
            setTuningMessage(auditError instanceof Error ? auditError.message : 'audit inbox 업데이트에 실패했습니다.');
        } finally {
            setMarkingAuditId(null);
        }
    }

    async function handleRunReminderDigest() {
        if (!user) {
            return;
        }

        setRunningReminderDigest(true);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/reminders', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval reminder digest 실행에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningDigest: payload.digest || current.alertTuningDigest,
                alertTuningAudit: payload.auditEvents || current.alertTuningAudit,
                alertTuningAuditInbox: buildClientAuditInboxSummary(payload.auditEvents || current.alertTuningAudit),
            } : current);
            const formatLabel = webhookFormatLabel(payload.dispatch?.format || alertTuningWebhook.format);
            setTuningMessage(payload.dispatch?.configured
                ? payload.dispatch?.delivered
                    ? `approval reminder digest를 생성하고 ${formatLabel} webhook으로 dispatch했습니다.`
                    : `approval reminder digest를 생성했지만 ${formatLabel} webhook delivery는 실패했습니다.`
                : 'approval reminder digest를 생성했습니다. webhook은 아직 설정되지 않았습니다.');
        } catch (digestError) {
            setTuningMessage(digestError instanceof Error ? digestError.message : 'approval reminder digest 실행에 실패했습니다.');
        } finally {
            setRunningReminderDigest(false);
        }
    }

    function handleRemoveSourceOverride(source: string) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const nextOverrides = { ...(base.sourceOverrides || {}) };
            const nextRollouts = { ...(base.sourceRollouts || {}) };
            delete nextOverrides[source];
            delete nextRollouts[source];
            return {
                ...base,
                sourceOverrides: nextOverrides,
                sourceRollouts: nextRollouts,
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(`${source} source override를 제거했습니다. 저장하면 반영됩니다.`);
    }

    async function handleSaveAlertTuning() {
        if (!user || !draftTuning) {
            return;
        }

        setIsSavingTuning(true);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config: draftTuning }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || '알림 튜닝 설정 저장에 실패했습니다.');
            }

            primeAlertTuningSettings(payload);
            setData((current) => current ? {
                ...current,
                alertTuning: payload,
            } : current);
            setAlertTuningDraft(payload.config);
            setIsTuningDirty(false);
            setTuningMessage('알림 튜닝 설정을 저장했습니다.');
        } catch (saveError) {
            setTuningMessage(saveError instanceof Error ? saveError.message : '알림 튜닝 설정 저장에 실패했습니다.');
        } finally {
            setIsSavingTuning(false);
        }
    }

    async function handleRollbackAlertTuning(historyId: string) {
        if (!user || !historyId) {
            return;
        }

        setRollbackingHistoryId(historyId);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rollbackHistoryId: historyId }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || '알림 튜닝 설정 복원에 실패했습니다.');
            }

            primeAlertTuningSettings(payload);
            setData((current) => current ? {
                ...current,
                alertTuning: payload,
            } : current);
            setAlertTuningDraft(payload.config);
            setIsTuningDirty(false);
            setTuningMessage('선택한 설정 이력으로 복원했습니다.');
        } catch (rollbackError) {
            setTuningMessage(rollbackError instanceof Error ? rollbackError.message : '알림 튜닝 설정 복원에 실패했습니다.');
        } finally {
            setRollbackingHistoryId(null);
        }
    }

    function handleResetAlertTuning() {
        setAlertTuningDraft(DEFAULT_ALERT_TUNING_CONFIG);
        setIsTuningDirty(true);
        setTuningMessage('기본 알림 튜닝값으로 되돌렸습니다. 저장하면 전체에 반영됩니다.');
    }

    return {
        alertTuning,
        availableOverrideSources,
        currentOverrideSource,
        currentSourceOverride,
        currentSourceRollout,
        draftTuning,
        handleMarkAuditEventsRead,
        handleRemoveSourceOverride,
        handleResetAlertTuning,
        handleResolveApprovalRequest,
        handleRollbackAlertTuning,
        handleRunReminderDigest,
        handleSaveAlertTuning,
        isSavingTuning,
        isTuningDirty,
        markingAuditId,
        onQueuedRequestNoteChange,
        onResolutionNoteChange,
        processingRequestId,
        queuedRequestNotes,
        quickRollbackEntries,
        queueRecommendedSourceRolloutRequest,
        resolutionNotes,
        rollbackingHistoryId,
        runningReminderDigest,
        setSelectedOverrideSource,
        tuningMessage,
        updateAlertTuningMode,
        updateSourceAlertTuningMode,
        updateSourceRolloutPercentage,
    };
}
