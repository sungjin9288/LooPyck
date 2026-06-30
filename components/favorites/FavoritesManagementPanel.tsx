'use client';

import React from 'react';
import type { Product } from '@/types/product';
import { formatPrice } from '@/lib/api';
import { buildFavoriteDocId } from '@/lib/favorites/favoriteProduct';
import { groupFavoritesByBaseProduct, listFavoriteAlerts } from '@/lib/favorites/favoriteGrouping';
import { pushAppNotification } from '@/lib/core/notifications';
import { triggerHaptic } from '@/lib/native/bridge';
import { useAlertInbox } from '@/hooks/useAlertInbox';
import { useAlertPersona } from '@/hooks/useAlertPersona';
import { Spinner } from '@/components/shared/Spinner';
import { buildAlertDetailHref } from '@/lib/favorites/alertLinks';
import { filterAlertsByHistoryView, getAlertHistoryCounts, type AlertHistoryView } from '@/lib/favorites/alertInbox';
import { applyAlertTuningOverrideToProfile, buildPersonalizedSnoozePresets } from '@/lib/favorites/alertPersonalization';
import { buildAlertSnoozeUntil, deriveAlertPriority, formatAlertSnoozeUntil, isFavoriteAlertSnoozed } from '@/lib/favorites/alertState';

interface FavoritesManagementPanelProps {
    favorites: Product[];
    onRemoveFavorite: (favoriteId: string) => Promise<void>;
    onRemoveProductGroup: (productId: string) => Promise<void>;
    onSaveFavorite: (product: Product) => Promise<void>;
}

function priorityBadgeClass(priority: 'critical' | 'high' | 'medium'): string {
    switch (priority) {
        case 'critical':
            return 'bg-rose-100 text-rose-700';
        case 'high':
            return 'bg-amber-100 text-amber-700';
        default:
            return 'bg-slate-200 text-slate-700';
    }
}

function priorityLabel(priority: 'critical' | 'high' | 'medium'): string {
    switch (priority) {
        case 'critical':
            return '긴급';
        case 'high':
            return '높음';
        default:
            return '기본';
    }
}

export default function FavoritesManagementPanel({
    favorites,
    onRemoveFavorite,
    onRemoveProductGroup,
    onSaveFavorite,
}: FavoritesManagementPanelProps) {
    const alerts = React.useMemo(() => listFavoriteAlerts(favorites), [favorites]);
    const groups = React.useMemo(() => groupFavoritesByBaseProduct(favorites), [favorites]);
    const {
        alerts: recentAlerts,
        loading: alertsLoading,
        unreadCount,
        markAlertRead,
        markAllAlertsRead,
        archiveAlert,
        restoreAlert,
        deleteAlert,
    } = useAlertInbox(20, { includeArchived: true });
    const [busyKey, setBusyKey] = React.useState<string | null>(null);
    const [editingAlertId, setEditingAlertId] = React.useState<string | null>(null);
    const [draftTargetPrice, setDraftTargetPrice] = React.useState('');
    const [historyView, setHistoryView] = React.useState<AlertHistoryView>('active');
    const historyCounts = React.useMemo(() => getAlertHistoryCounts(recentAlerts), [recentAlerts]);
    const visibleRecentAlerts = React.useMemo(
        () => filterAlertsByHistoryView(recentAlerts, historyView),
        [historyView, recentAlerts]
    );
    const { alertProfile, status: alertProfileStatus, lastSyncedAt, tuningConfig, rolloutKey } = useAlertPersona({
        alerts: recentAlerts,
        favorites,
    });

    async function handleRemoveFavorite(product: Product) {
        const favoriteId = buildFavoriteDocId(product);
        setBusyKey(favoriteId);
        try {
            await onRemoveFavorite(favoriteId);
            triggerHaptic('medium');
            pushAppNotification({
                title: '저장 항목 제거',
                message: product.variantLabel
                    ? `${product.variantLabel} variant 저장을 해제했습니다.`
                    : '저장한 상품을 목록에서 제거했습니다.',
                type: 'info',
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleRemoveGroup(productId: string, title: string) {
        setBusyKey(productId);
        try {
            await onRemoveProductGroup(productId);
            triggerHaptic('medium');
            pushAppNotification({
                title: '상품 묶음 제거',
                message: `${title}의 저장 항목을 모두 정리했습니다.`,
                type: 'info',
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleSaveTargetPrice(product: Product) {
        const favoriteId = buildFavoriteDocId(product);
        const parsed = Number.parseInt(draftTargetPrice, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            pushAppNotification({
                title: '입력 오류',
                message: '올바른 목표 가격을 입력해주세요.',
                type: 'alert',
            });
            return;
        }

        setBusyKey(favoriteId);
        try {
            await onSaveFavorite({
                ...product,
                favoriteId,
                targetPrice: parsed,
            });
            triggerHaptic('success');
            pushAppNotification({
                title: '목표가 수정 완료',
                message: `${parsed.toLocaleString()}원으로 알림 기준을 업데이트했습니다.`,
                type: 'success',
            });
            setEditingAlertId(null);
            setDraftTargetPrice('');
        } finally {
            setBusyKey(null);
        }
    }

    async function handleSnoozeFavorite(product: Product, hours?: number) {
        const favoriteId = buildFavoriteDocId(product);
        setBusyKey(`snooze:${favoriteId}`);
        try {
            const nextFavorite: Product = {
                ...product,
                favoriteId,
            };
            if (typeof hours === 'number') {
                nextFavorite.alertSnoozedUntil = buildAlertSnoozeUntil(hours);
            } else {
                delete nextFavorite.alertSnoozedUntil;
            }
            await onSaveFavorite(nextFavorite);
            triggerHaptic('medium');
            pushAppNotification({
                title: typeof hours === 'number' ? '알림 스누즈 완료' : '스누즈 해제 완료',
                message: typeof hours === 'number'
                    ? `${hours >= 24 ? `${Math.round(hours / 24)}일` : `${hours}시간`} 동안 가격 알림을 잠시 멈춥니다.`
                    : '가격 알림 추적을 다시 활성화했습니다.',
                type: 'info',
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleClearReachedAlerts() {
        const reachedAlerts = alerts.filter((alert) => alert.isReached);
        if (reachedAlerts.length === 0) {
            return;
        }

        setBusyKey('bulk-clear-reached');
        try {
            await Promise.all(reachedAlerts.map((alert) => onRemoveFavorite(alert.docId)));
            triggerHaptic('medium');
            pushAppNotification({
                title: '도달 알림 정리 완료',
                message: `${reachedAlerts.length}개의 도달 알림을 정리했습니다.`,
                type: 'info',
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleToggleAlertRead(alertId: string, read: boolean) {
        setBusyKey(`alert-read:${alertId}`);
        try {
            await markAlertRead(alertId, read);
            triggerHaptic(read ? 'light' : 'medium');
            pushAppNotification({
                title: read ? '읽음 처리 완료' : '미확인으로 복원',
                message: read ? '알림을 읽음 상태로 변경했습니다.' : '알림을 다시 미확인 상태로 돌렸습니다.',
                type: 'info',
                link: buildAlertDetailHref(alertId),
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleArchiveAlert(alertId: string, archived: boolean) {
        setBusyKey(`alert-archive:${alertId}`);
        try {
            if (archived) {
                await restoreAlert(alertId);
            } else {
                await archiveAlert(alertId);
            }
            triggerHaptic('medium');
            pushAppNotification({
                title: archived ? '알림 복원 완료' : '알림 보관 완료',
                message: archived ? '보관함의 알림을 다시 활성 목록으로 돌렸습니다.' : '알림을 보관함으로 이동했습니다.',
                type: 'info',
                link: buildAlertDetailHref(alertId),
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleDeleteAlert(alertId: string) {
        setBusyKey(`alert-delete:${alertId}`);
        try {
            await deleteAlert(alertId);
            triggerHaptic('medium');
            pushAppNotification({
                title: '알림 삭제 완료',
                message: '도착한 가격 알림 기록을 삭제했습니다.',
                type: 'info',
            });
        } finally {
            setBusyKey(null);
        }
    }

    async function handleMarkAllUnreadAsRead() {
        if (unreadCount === 0) {
            return;
        }

        setBusyKey('alert-mark-all-read');
        try {
            await markAllAlertsRead();
            triggerHaptic('success');
            pushAppNotification({
                title: '전체 읽음 처리 완료',
                message: `${unreadCount}개의 미확인 알림을 정리했습니다.`,
                type: 'success',
            });
        } finally {
            setBusyKey(null);
        }
    }

    if (favorites.length === 0 && !alertsLoading && recentAlerts.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alert Persona</p>
                        <h3 className="mt-2 font-serif text-xl tracking-tight text-slate-900">{alertProfile.summary}</h3>
                        <p className="mt-2 text-sm text-slate-500">{alertProfile.detail}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-2 text-xs font-bold ${
                            alertProfileStatus === 'synced'
                                ? 'bg-emerald-100 text-emerald-700'
                                : alertProfileStatus === 'syncing'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                        }`}>
                            {alertProfileStatus === 'synced' ? 'Cloud Synced' : alertProfileStatus === 'syncing' ? 'Syncing' : 'Local Persona'}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                            기본 스누즈 {alertProfile.defaultSnoozeHours >= 24 ? `${Math.round(alertProfile.defaultSnoozeHours / 24)}d` : `${alertProfile.defaultSnoozeHours}h`}
                        </span>
                    </div>
                </div>
                {lastSyncedAt && alertProfileStatus === 'synced' && (
                    <p className="mt-3 text-xs text-slate-400">
                        마지막 동기화 {new Date(lastSyncedAt).toLocaleString('ko-KR')}
                    </p>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Unread Rate</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alertProfile.unreadRate}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Snooze Share</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alertProfile.snoozeShare}%</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Read Latency</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alertProfile.avgReadLatencyMinutes}m</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tracked Targets</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alertProfile.activeTargets}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alert Manager</p>
                            <h3 className="mt-2 font-serif text-xl tracking-tight text-slate-900">가격 알림 관리</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => void handleClearReachedAlerts()}
                                disabled={busyKey === 'bulk-clear-reached' || !alerts.some((alert) => alert.isReached)}
                                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
                            >
                                도달 알림 정리
                            </button>
                            <span className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                                {alerts.length}개 활성
                            </span>
                        </div>
                    </div>

                    {alerts.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">현재 필터 조건에 맞는 가격 알림이 없습니다.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {alerts.slice(0, 8).map((alert) => {
                                const isEditing = editingAlertId === alert.docId;
                                const priority = deriveAlertPriority({
                                    currentPrice: alert.currentPrice,
                                    targetPrice: alert.targetPrice,
                                });
                                const effectiveAlertProfile = applyAlertTuningOverrideToProfile(
                                    alertProfile,
                                    tuningConfig,
                                    alert.favorite.source,
                                    rolloutKey
                                );
                                const recommendedSnoozes = buildPersonalizedSnoozePresets({
                                    priority,
                                    isReached: alert.isReached,
                                    isSnoozed: alert.isSnoozed,
                                    profile: effectiveAlertProfile,
                                });

                                return (
                                    <div key={alert.docId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-950">{alert.favorite.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {alert.favorite.mallName}
                                                    {alert.favorite.source ? ` · ${alert.favorite.source}` : ''}
                                                    {alert.favorite.variantLabel ? ` · ${alert.favorite.variantLabel}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                                    alert.isReached ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {alert.isReached ? '목표가 도달' : `${formatPrice(alert.gapToTarget)} 남음`}
                                                </span>
                                                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${priorityBadgeClass(priority)}`}>
                                                    우선순위 {priorityLabel(priority)}
                                                </span>
                                                {alert.isSnoozed && (
                                                    <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
                                                        스누즈 중
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {recommendedSnoozes.length > 0 && (
                                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Recommended Snooze</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {recommendedSnoozes.map((preset) => (
                                                        <button
                                                            key={`${alert.docId}_${preset.hours}`}
                                                            type="button"
                                                            onClick={() => void handleSnoozeFavorite(alert.favorite, preset.hours)}
                                                            disabled={busyKey === `snooze:${alert.docId}`}
                                                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                                                                preset.emphasis === 'recommended'
                                                                    ? 'border-slate-900 bg-slate-900 text-white'
                                                                    : 'border-slate-300 bg-white text-slate-700'
                                                            }`}
                                                        >
                                                            {preset.label}
                                                            {preset.emphasis === 'recommended' ? ' 추천' : ''}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="mt-2 text-xs text-slate-500">{recommendedSnoozes[0]?.reason}</p>
                                            </div>
                                        )}

                                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Current</p>
                                                <p className="mt-1 text-sm font-bold text-slate-950">{formatPrice(alert.currentPrice)}</p>
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Target</p>
                                                {isEditing ? (
                                                    <input
                                                        autoFocus
                                                        value={draftTargetPrice}
                                                        onChange={(event) => setDraftTargetPrice(event.target.value)}
                                                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-slate-900"
                                                        inputMode="numeric"
                                                    />
                                                ) : (
                                                    <p className="mt-1 text-sm font-bold text-slate-950">{formatPrice(alert.targetPrice)}</p>
                                                )}
                                            </div>
                                            <div className="rounded-2xl bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Status</p>
                                                <p className="mt-1 text-sm font-bold text-slate-950">
                                                    {alert.isSnoozed
                                                        ? `재개 ${formatAlertSnoozeUntil(alert.snoozedUntil)}`
                                                        : alert.favorite.deepLink ? '비교 링크 있음' : '외부 링크만 있음'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <a
                                                href={alert.favorite.deepLink || alert.favorite.link || '#'}
                                                target={alert.favorite.deepLink ? undefined : '_blank'}
                                                rel={alert.favorite.deepLink ? undefined : 'noopener noreferrer'}
                                                className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                            >
                                                {alert.favorite.deepLink ? '비교 페이지' : '상품 링크'}
                                            </a>
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSaveTargetPrice(alert.favorite)}
                                                        disabled={busyKey === alert.docId}
                                                        className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 disabled:opacity-50"
                                                    >
                                                        저장
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingAlertId(null);
                                                            setDraftTargetPrice('');
                                                        }}
                                                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
                                                    >
                                                        취소
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingAlertId(alert.docId);
                                                        setDraftTargetPrice(String(alert.targetPrice));
                                                    }}
                                                    className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600"
                                                >
                                                    목표가 수정
                                                </button>
                                            )}
                                            {isFavoriteAlertSnoozed(alert.favorite) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSnoozeFavorite(alert.favorite)}
                                                    disabled={busyKey === `snooze:${alert.docId}`}
                                                    className="inline-flex rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 disabled:opacity-50"
                                                >
                                                    스누즈 해제
                                                </button>
                                            ) : null}
                                            <button
                                                type="button"
                                                onClick={() => void handleRemoveFavorite(alert.favorite)}
                                                disabled={busyKey === alert.docId}
                                                className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
                                            >
                                                알림 해제
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Saved Groups</p>
                            <h3 className="mt-2 font-serif text-xl tracking-tight text-slate-900">상품 묶음 관리</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                            {groups.length}개 묶음
                        </span>
                    </div>

                    <div className="mt-4 space-y-3">
                        {groups.slice(0, 8).map((group) => (
                            <div key={group.baseKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-slate-950">{group.title}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {group.mallNames.join(', ')}
                                            {group.variantCount > 0 ? ` · variant ${group.variantCount}개` : ''}
                                            {group.alertCount > 0 ? ` · 알림 ${group.alertCount}개` : ''}
                                            {group.snoozedAlertCount > 0 ? ` · 스누즈 ${group.snoozedAlertCount}개` : ''}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700">
                                        최저 {formatPrice(group.currentLowestPrice)}
                                    </span>
                                </div>

                                {group.variantLabels.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {group.variantLabels.map((label) => (
                                            <span
                                                key={label}
                                                className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700"
                                            >
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <a
                                        href={group.deepLink || group.representative.link || '#'}
                                        target={group.deepLink ? undefined : '_blank'}
                                        rel={group.deepLink ? undefined : 'noopener noreferrer'}
                                        className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                    >
                                        {group.deepLink ? '비교 페이지' : '상품 링크'}
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => void handleRemoveGroup(group.baseProductId, group.title)}
                                        disabled={busyKey === group.baseProductId}
                                        className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
                                    >
                                        전체 해제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alert Inbox</p>
                        <h3 className="mt-2 font-serif text-xl tracking-tight text-slate-900">도착한 가격 알림 인박스</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleMarkAllUnreadAsRead()}
                            disabled={busyKey === 'alert-mark-all-read' || unreadCount === 0}
                            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
                        >
                            전체 읽음 처리
                        </button>
                        <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                            미확인 {historyCounts.unread}개
                        </span>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        { id: 'active', label: '활성', count: historyCounts.active },
                        { id: 'unread', label: '미확인', count: historyCounts.unread },
                        { id: 'archived', label: '보관함', count: historyCounts.archived },
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => setHistoryView(filter.id as AlertHistoryView)}
                            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                                historyView === filter.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {filter.label} · {filter.count}
                        </button>
                    ))}
                </div>

                {alertsLoading ? (
                    <div className="mt-6 flex justify-center py-10">
                        <Spinner size="sm" />
                    </div>
                ) : visibleRecentAlerts.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">
                        {historyView === 'archived'
                            ? '보관된 알림이 아직 없습니다.'
                            : historyView === 'unread'
                                ? '미확인 상태의 알림이 없습니다.'
                                : '도착한 가격 알림 이력이 아직 없습니다.'}
                    </p>
                ) : (
                    <div className="mt-4 space-y-3">
                        {visibleRecentAlerts.map((alert) => (
                            <div key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-bold text-slate-950">{alert.title}</p>
                                        <p className="mt-1 text-xs text-slate-500">{alert.message}</p>
                                        <p className="mt-2 text-[11px] text-slate-400">
                                            {new Date(alert.createdAt).toLocaleString('ko-KR')}
                                            {alert.variantLabel ? ` · ${alert.variantLabel}` : ''}
                                            {alert.mallName ? ` · ${alert.mallName}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                            alert.read ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {alert.read ? '확인됨' : '미확인'}
                                        </span>
                                        {alert.priority && (
                                            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${priorityBadgeClass(alert.priority)}`}>
                                                우선순위 {priorityLabel(alert.priority)}
                                            </span>
                                        )}
                                        {alert.archivedAt && (
                                            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
                                                보관됨
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <a
                                        href={buildAlertDetailHref(alert.id)}
                                        className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                                    >
                                        알림 상세
                                    </a>
                                    {(alert.deepLink || alert.link) && (
                                        <a
                                            href={alert.deepLink || alert.link || '#'}
                                            target={alert.deepLink ? undefined : '_blank'}
                                            rel={alert.deepLink ? undefined : 'noopener noreferrer'}
                                            className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                        >
                                            {alert.deepLink ? '비교 페이지' : '상품 링크'}
                                        </a>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void handleToggleAlertRead(alert.id, !alert.read)}
                                        disabled={busyKey === `alert-read:${alert.id}`}
                                        className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                                    >
                                        {alert.read ? '미확인으로' : '읽음 처리'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleArchiveAlert(alert.id, Boolean(alert.archivedAt))}
                                        disabled={busyKey === `alert-archive:${alert.id}`}
                                        className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 disabled:opacity-50"
                                    >
                                        {alert.archivedAt ? '복원' : '보관'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteAlert(alert.id)}
                                        disabled={busyKey === `alert-delete:${alert.id}`}
                                        className="inline-flex rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 disabled:opacity-50"
                                    >
                                        삭제
                                    </button>
                                    {typeof alert.currentPrice === 'number' && (
                                        <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                                            현재가 {formatPrice(alert.currentPrice)}
                                        </span>
                                    )}
                                    {typeof alert.targetPrice === 'number' && (
                                        <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700">
                                            목표가 {formatPrice(alert.targetPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
