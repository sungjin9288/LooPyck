'use client';

import React from 'react';
import type { Product } from '@/types/product';
import { useAlertInbox } from '@/hooks/useAlertInbox';
import { useAlertPersona } from '@/hooks/useAlertPersona';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { buildFavoriteDocId } from '@/lib/favorites/favoriteProduct';
import { pushAppNotification } from '@/lib/core/notifications';
import { registerPushToken } from '@/lib/native/pushRegistration';
import { triggerHaptic } from '@/lib/native/bridge';
import { useUser } from '@/contexts/UserContext';
import { applyAlertTuningOverrideToProfile, buildPersonalizedTargetSuggestion } from '@/lib/favorites/alertPersonalization';
import { formatAlertSnoozeUntil, isFavoriteAlertSnoozed } from '@/lib/favorites/alertState';

interface ComparePriceAlertButtonProps {
    product: Product;
    className?: string;
}

export default function ComparePriceAlertButton({ product, className = '' }: ComparePriceAlertButtonProps) {
    const [showModal, setShowModal] = React.useState(false);
    const [targetPrice, setTargetPrice] = React.useState('');
    const [success, setSuccess] = React.useState(false);
    const { favorites, addFavorite, loading } = useCloudStorage();
    const { alerts: recentAlerts } = useAlertInbox(30, { includeArchived: true });
    const { userId, appId } = useUser();
    const favoriteId = buildFavoriteDocId(product);
    const favoriteItem = favorites.find((item) => buildFavoriteDocId(item) === favoriteId);
    const currentPrice = Number.parseInt(product.lprice.replace(/[^0-9]/g, ''), 10) || 0;
    const isSnoozed = favoriteItem ? isFavoriteAlertSnoozed(favoriteItem) : false;
    const { alertProfile, status: alertProfileStatus, tuningConfig } = useAlertPersona({
        alerts: recentAlerts,
        favorites,
    });
    const effectiveAlertProfile = React.useMemo(
        () => applyAlertTuningOverrideToProfile(alertProfile, tuningConfig, product.source, userId),
        [alertProfile, product.source, tuningConfig, userId]
    );
    const targetSuggestion = React.useMemo(
        () => buildPersonalizedTargetSuggestion({
            currentPrice,
            targetPrice: favoriteItem?.targetPrice,
            profile: effectiveAlertProfile,
        }),
        [currentPrice, effectiveAlertProfile, favoriteItem?.targetPrice]
    );

    React.useEffect(() => {
        if (!showModal) {
            setSuccess(false);
        }
    }, [showModal]);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (loading) return;

        const target = Number.parseInt(targetPrice, 10);
        if (!Number.isFinite(target) || target <= 0) {
            pushAppNotification({ title: '입력 오류', message: '올바른 목표 가격을 입력해주세요.', type: 'alert' });
            return;
        }

        const nextFavorite: Product = {
            ...product,
            favoriteId,
            targetPrice: target,
        };

        if (typeof favoriteItem?.alertSnoozedUntil === 'number') {
            nextFavorite.alertSnoozedUntil = favoriteItem.alertSnoozedUntil;
        }

        await addFavorite(nextFavorite);

        triggerHaptic('success');
        pushAppNotification({
            title: '가격 알림 설정 완료',
            message: `${target.toLocaleString()}원 이하 도달 시 알림을 보냅니다.`,
            type: 'success',
        });

        if (!favoriteItem?.targetPrice && targetSuggestion.suggestedPrice === target) {
            pushAppNotification({
                title: '개인화 추천가 적용',
                message: `${effectiveAlertProfile.summary} 기준 추천 목표가로 알림을 시작했습니다.`,
                type: 'info',
            });
        }

        if (userId) {
            const pushStatus = await registerPushToken(appId, userId);
            if (pushStatus === 'registered') {
                pushAppNotification({
                    title: '푸시 알림 활성화',
                    message: '선택한 variant 가격이 내려오면 푸시로도 알려드립니다.',
                    type: 'info',
                });
            }
        }

        setSuccess(true);
        window.setTimeout(() => {
            setShowModal(false);
            setTargetPrice('');
        }, 1600);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setTargetPrice(
                        favoriteItem?.targetPrice
                            ? String(favoriteItem.targetPrice)
                            : targetSuggestion.suggestedPrice
                                ? String(targetSuggestion.suggestedPrice)
                                : ''
                    );
                    setShowModal(true);
                }}
                className={`inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 ${className}`}
            >
                가격 알림
                {favoriteItem?.targetPrice ? ` · ${favoriteItem.targetPrice.toLocaleString()}원` : ''}
                {isSnoozed ? ' · 스누즈' : ''}
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 z-[7100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {success ? (
                            <div className="py-8 text-center">
                                <p className="text-lg font-bold text-slate-900">가격 알림이 설정되었습니다.</p>
                                <p className="mt-2 text-sm text-slate-500">선택한 variant 기준으로 가격을 추적합니다.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Price Alert</p>
                                    <h3 className="mt-2 text-xl font-black text-slate-950">선택 variant 가격 알림</h3>
                                    <p className="mt-2 text-sm text-slate-600">
                                        현재 가격 {currentPrice.toLocaleString()}원
                                        {product.variantLabel ? ` · ${product.variantLabel}` : ''}
                                    </p>
                                    {isSnoozed && (
                                        <p className="mt-2 text-xs font-semibold text-amber-600">
                                            현재 스누즈 중 · {formatAlertSnoozeUntil(favoriteItem?.alertSnoozedUntil)}
                                        </p>
                                    )}
                                </div>
                                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Alert Persona</p>
                                            <p className="mt-2 text-sm font-bold text-slate-950">{effectiveAlertProfile.summary}</p>
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
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            목표 가격
                                        </label>
                                        <input
                                            type="number"
                                            value={targetPrice}
                                            onChange={(event) => setTargetPrice(event.target.value)}
                                            placeholder="예: 99000"
                                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-slate-900"
                                            required
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            이 가격 이하로 내려오면 선택 variant 기준으로 알림을 보냅니다.
                                        </p>
                                    </div>
                                    {targetSuggestion.suggestedPrice && (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Recommended Target</p>
                                                    <p className="mt-2 text-sm font-bold text-slate-950">
                                                        {targetSuggestion.label} · {targetSuggestion.suggestedPrice.toLocaleString()}원
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500">{targetSuggestion.reason}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setTargetPrice(String(targetSuggestion.suggestedPrice))}
                                                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"
                                                >
                                                    추천가 적용
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                        >
                                            {favoriteItem?.targetPrice ? '알림 수정' : '알림 설정'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
