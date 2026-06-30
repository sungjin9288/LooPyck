'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/api';
import FavoritesShell from './FavoritesShell';
import { useAlertInbox } from '@/hooks/useAlertInbox';
import { useAlertPersona } from '@/hooks/useAlertPersona';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { Spinner } from '@/components/shared/Spinner';
import { buildAlertDetailHref } from '@/lib/favorites/alertLinks';
import { resolveFavoriteForAlert } from '@/lib/favorites/alertDetail';
import { buildFavoriteDocId } from '@/lib/favorites/favoriteProduct';
import {
    applyAlertTuningOverrideToProfile,
    buildPersonalizedSnoozePresets,
    buildPersonalizedTargetSuggestion,
} from '@/lib/favorites/alertPersonalization';
import { pushAppNotification } from '@/lib/core/notifications';
import { triggerHaptic } from '@/lib/native/bridge';
import { alertPriorityLabel, buildAlertSnoozeUntil, formatAlertSnoozeUntil, isFavoriteAlertSnoozed } from '@/lib/favorites/alertState';

interface AlertDetailViewProps {
    alertId: string;
}

export default function AlertDetailView({ alertId }: AlertDetailViewProps) {
    const router = useRouter();
    const {
        alerts,
        loading,
        markAlertRead,
        archiveAlert,
        restoreAlert,
        deleteAlert,
    } = useAlertInbox(80, { includeArchived: true });
    const { favorites, addFavorite, removeFavorite, loading: favoritesLoading } = useCloudStorage();
    const [targetDraft, setTargetDraft] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const autoMarkedIdsRef = useRef<Set<string>>(new Set());
    const alert = alerts.find((entry) => entry.id === alertId);
    const linkedFavorite = alert ? resolveFavoriteForAlert(alert, favorites) : undefined;
    const { alertProfile, status: alertProfileStatus, lastSyncedAt, tuningConfig, rolloutKey } = useAlertPersona({
        alerts,
        favorites,
    });
    const effectiveAlertProfile = applyAlertTuningOverrideToProfile(
        alertProfile,
        tuningConfig,
        linkedFavorite?.source || alert?.source,
        rolloutKey
    );
    const recommendedSnoozes = buildPersonalizedSnoozePresets({
        priority: alert?.priority || 'medium',
        isReached: typeof alert?.currentPrice === 'number' && typeof alert?.targetPrice === 'number'
            ? alert.currentPrice <= alert.targetPrice
            : false,
        isSnoozed: linkedFavorite ? isFavoriteAlertSnoozed(linkedFavorite) : false,
        profile: effectiveAlertProfile,
    });
    const targetSuggestion = buildPersonalizedTargetSuggestion({
        currentPrice: alert?.currentPrice,
        targetPrice: linkedFavorite?.targetPrice ?? alert?.targetPrice,
        profile: effectiveAlertProfile,
    });

    useEffect(() => {
        const suggested = targetSuggestion.suggestedPrice;
        setTargetDraft(typeof suggested === 'number' ? String(suggested) : '');
    }, [targetSuggestion.suggestedPrice]);

    useEffect(() => {
        if (!alert || alert.read) {
            return;
        }

        if (autoMarkedIdsRef.current.has(alert.id)) {
            return;
        }

        autoMarkedIdsRef.current.add(alert.id);

        markAlertRead(alert.id, true).catch((error) => {
            console.error('[AlertDetailView] failed to mark alert read:', error);
        });
    }, [alert, markAlertRead]);

    async function handleSaveTarget() {
        if (!alert || !linkedFavorite) {
            return;
        }

        const parsed = Number.parseInt(targetDraft, 10);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            pushAppNotification({
                title: '입력 오류',
                message: '올바른 목표 가격을 입력해주세요.',
                type: 'alert',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await addFavorite({
                ...linkedFavorite,
                favoriteId: buildFavoriteDocId(linkedFavorite),
                targetPrice: parsed,
            });
            triggerHaptic('success');
            pushAppNotification({
                title: '알림 재설정 완료',
                message: `${parsed.toLocaleString()}원 기준으로 다시 추적합니다.`,
                type: 'success',
                link: buildAlertDetailHref(alert.id),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSnooze(hours?: number) {
        if (!linkedFavorite) {
            return;
        }

        setIsSubmitting(true);
        try {
            const nextFavorite = {
                ...linkedFavorite,
                favoriteId: buildFavoriteDocId(linkedFavorite),
            };
            if (typeof hours === 'number') {
                nextFavorite.alertSnoozedUntil = buildAlertSnoozeUntil(hours);
            } else {
                delete nextFavorite.alertSnoozedUntil;
            }
            await addFavorite(nextFavorite);
            triggerHaptic('medium');
            pushAppNotification({
                title: typeof hours === 'number' ? '알림 스누즈 완료' : '스누즈 해제 완료',
                message: typeof hours === 'number'
                    ? `${hours >= 24 ? `${Math.round(hours / 24)}일` : `${hours}시간`} 동안 가격 알림을 잠시 멈춥니다.`
                    : '가격 알림 추적을 다시 활성화했습니다.',
                type: 'info',
                link: alert ? buildAlertDetailHref(alert.id) : undefined,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRemoveAlert() {
        if (!linkedFavorite) {
            return;
        }

        setIsSubmitting(true);
        try {
            await removeFavorite(buildFavoriteDocId(linkedFavorite));
            triggerHaptic('medium');
            pushAppNotification({
                title: '알림 해제 완료',
                message: '이 상품의 가격 알림 추적을 중지했습니다.',
                type: 'info',
            });
            router.push('/favorites/alerts');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleToggleRead() {
        if (!alert) {
            return;
        }

        setIsSubmitting(true);
        try {
            const nextRead = !alert.read;
            await markAlertRead(alert.id, nextRead);
            triggerHaptic(nextRead ? 'light' : 'medium');
            pushAppNotification({
                title: nextRead ? '읽음 처리 완료' : '미확인으로 복원',
                message: nextRead ? '알림 상태를 읽음으로 변경했습니다.' : '알림을 다시 미확인 상태로 돌렸습니다.',
                type: 'info',
                link: buildAlertDetailHref(alert.id),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleArchiveToggle() {
        if (!alert) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (alert.archivedAt) {
                await restoreAlert(alert.id);
            } else {
                await archiveAlert(alert.id);
            }
            triggerHaptic('medium');
            pushAppNotification({
                title: alert.archivedAt ? '알림 복원 완료' : '알림 보관 완료',
                message: alert.archivedAt
                    ? '이 알림을 다시 활성 목록으로 돌렸습니다.'
                    : '이 알림을 보관함으로 이동했습니다.',
                type: 'info',
                link: buildAlertDetailHref(alert.id),
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteAlert() {
        if (!alert) {
            return;
        }

        setIsSubmitting(true);
        try {
            await deleteAlert(alert.id);
            triggerHaptic('medium');
            pushAppNotification({
                title: '알림 삭제 완료',
                message: '도착한 가격 알림 기록을 삭제했습니다.',
                type: 'info',
            });
            router.push('/favorites/alerts');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <FavoritesShell>
            {loading ? (
                <div className="flex justify-center py-24">
                    <Spinner size="md" />
                </div>
            ) : !alert ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alert Detail</p>
                    <h1 className="mt-3 font-serif text-2xl tracking-tight text-slate-900">알림을 찾을 수 없습니다</h1>
                    <p className="mt-3 text-sm text-slate-500">이미 정리되었거나 현재 계정에서 접근할 수 없는 알림입니다.</p>
                    <button
                        type="button"
                        onClick={() => router.push('/favorites/alerts')}
                        className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white"
                    >
                        알림 목록으로 돌아가기
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Alert Detail</p>
                            <h1 className="mt-2 font-serif text-3xl tracking-tight text-slate-900">{alert.title}</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {new Date(alert.createdAt).toLocaleString('ko-KR')}
                                {alert.variantLabel ? ` · ${alert.variantLabel}` : ''}
                                {alert.mallName ? ` · ${alert.mallName}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => router.push('/favorites/alerts')}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
                            >
                                알림 목록
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleToggleRead()}
                                disabled={isSubmitting}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
                            >
                                {alert.read ? '미확인으로' : '읽음 처리'}
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleArchiveToggle()}
                                disabled={isSubmitting}
                                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50"
                            >
                                {alert.archivedAt ? '보관 해제' : '보관'}
                            </button>
                            {alert.deepLink && (
                                <Link
                                    href={alert.deepLink}
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                                >
                                    비교 페이지
                                </Link>
                            )}
                            {!alert.deepLink && alert.link && (
                                <a
                                    href={alert.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                                >
                                    상품 링크
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => void handleDeleteAlert()}
                                disabled={isSubmitting}
                                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"
                            >
                                삭제
                            </button>
                        </div>
                    </div>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6">
                        <p className="text-sm leading-7 text-slate-700">{alert.message}</p>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Alert Persona</p>
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-slate-950">{effectiveAlertProfile.summary}</p>
                                    <p className="mt-1 text-xs text-slate-500">{effectiveAlertProfile.detail}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-3 py-2 text-xs font-bold ${
                                        alertProfileStatus === 'synced'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : alertProfileStatus === 'syncing'
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-white text-slate-700'
                                    }`}>
                                        {alertProfileStatus === 'synced' ? 'Cloud Synced' : alertProfileStatus === 'syncing' ? 'Syncing' : 'Local Persona'}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700">
                                        기본 스누즈 {effectiveAlertProfile.defaultSnoozeHours >= 24 ? `${Math.round(effectiveAlertProfile.defaultSnoozeHours / 24)}d` : `${effectiveAlertProfile.defaultSnoozeHours}h`}
                                    </span>
                                </div>
                            </div>
                            {lastSyncedAt && alertProfileStatus === 'synced' && (
                                <p className="mt-3 text-[11px] text-slate-400">
                                    마지막 동기화 {new Date(lastSyncedAt).toLocaleString('ko-KR')}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    {typeof alert.currentPrice === 'number' ? formatPrice(alert.currentPrice) : '정보 없음'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Target</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    {typeof alert.targetPrice === 'number' ? formatPrice(alert.targetPrice) : '정보 없음'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Status</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alert.read ? '확인됨' : '미확인'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Archive</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{alert.archivedAt ? '보관됨' : '활성'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Priority</p>
                                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    {alert.priority ? alertPriorityLabel(alert.priority) : '기본'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Route</p>
                                <p className="mt-2 break-all text-sm font-bold text-slate-950">{buildAlertDetailHref(alert.id)}</p>
                            </div>
                        </div>

                        {(alert.cheapestMall || typeof alert.cheapestPrice === 'number') && (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Cheapest Alternative</p>
                                <p className="mt-2 text-sm font-semibold text-emerald-900">
                                    {alert.cheapestMall || '다른 쇼핑몰'}
                                    {typeof alert.cheapestPrice === 'number' ? ` · ${formatPrice(alert.cheapestPrice)}` : ''}
                                </p>
                                {alert.cheapestLink && (
                                    <a
                                        href={alert.cheapestLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-3 inline-flex rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-bold text-emerald-700"
                                    >
                                        대안 상품 열기
                                    </a>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white p-6">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Retarget</p>
                                <h2 className="mt-2 font-serif text-2xl tracking-tight text-slate-900">알림 재설정</h2>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                                {linkedFavorite ? '활성 추적 중' : '연결된 favorite 없음'}
                            </span>
                        </div>

                        {favoritesLoading ? (
                            <div className="mt-6 flex justify-center py-8">
                                <Spinner size="sm" />
                            </div>
                        ) : linkedFavorite ? (
                            <div className="mt-6 space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Linked Favorite</p>
                                        <p className="mt-2 text-sm font-bold text-slate-950">
                                            {linkedFavorite.variantLabel || linkedFavorite.mallName}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current Tracking</p>
                                        <p className="mt-2 text-sm font-bold text-slate-950">
                                            {typeof linkedFavorite.targetPrice === 'number' ? formatPrice(linkedFavorite.targetPrice) : '미설정'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Suggested Next</p>
                                        <p className="mt-2 text-sm font-bold text-slate-950">
                                            {targetSuggestion.suggestedPrice ? formatPrice(targetSuggestion.suggestedPrice) : '정보 없음'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Snooze</p>
                                        <p className="mt-2 text-sm font-bold text-slate-950">
                                            {isFavoriteAlertSnoozed(linkedFavorite)
                                                ? formatAlertSnoozeUntil(linkedFavorite.alertSnoozedUntil)
                                                : '활성'}
                                        </p>
                                    </div>
                                </div>

                                {targetSuggestion.suggestedPrice && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recommended Target</p>
                                                <p className="mt-2 text-sm font-bold text-slate-950">
                                                    {targetSuggestion.label} · {formatPrice(targetSuggestion.suggestedPrice)}
                                                </p>
                                                <p className="mt-2 text-xs text-slate-500">{targetSuggestion.reason}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setTargetDraft(String(targetSuggestion.suggestedPrice))}
                                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                                            >
                                                추천가 적용
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {recommendedSnoozes.length > 0 && (
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Recommended Snooze</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {recommendedSnoozes.map((preset) => (
                                                <button
                                                    key={`${alert.id}_${preset.hours}`}
                                                    type="button"
                                                    onClick={() => void handleSnooze(preset.hours)}
                                                    disabled={isSubmitting}
                                                    className={`rounded-full border px-4 py-2 text-xs font-bold disabled:opacity-50 ${
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
                                        <p className="mt-3 text-xs text-slate-500">{recommendedSnoozes[0]?.reason}</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
                                    <label htmlFor="alert-target-price" className="sr-only">새 목표가</label>
                                    <input
                                        id="alert-target-price"
                                        value={targetDraft}
                                        onChange={(event) => setTargetDraft(event.target.value)}
                                        inputMode="numeric"
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-colors focus:border-slate-900 lg:max-w-xs"
                                        placeholder="새 목표가"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void handleSaveTarget()}
                                        disabled={isSubmitting}
                                        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                                    >
                                        목표가 저장
                                    </button>
                                    {isFavoriteAlertSnoozed(linkedFavorite) ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleSnooze()}
                                            disabled={isSubmitting}
                                            className="rounded-full border border-sky-300 bg-sky-50 px-5 py-3 text-sm font-bold text-sky-700 disabled:opacity-50"
                                        >
                                            스누즈 해제
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => void handleRemoveAlert()}
                                        disabled={isSubmitting}
                                        className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 disabled:opacity-50"
                                    >
                                        알림 해제
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-600">
                                    현재 이 알림과 연결된 활성 favorite를 찾지 못했습니다. 비교 페이지로 이동해 다시 목표가를 설정할 수 있습니다.
                                </p>
                                {alert.deepLink && (
                                    <Link
                                        href={alert.deepLink}
                                        className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
                                    >
                                        비교 페이지에서 다시 설정
                                    </Link>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </FavoritesShell>
    );
}
