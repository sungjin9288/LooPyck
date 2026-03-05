'use client';

import { useState, useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { useCloudStorage } from '@/hooks/useCloudStorage';
import { parsePrice } from '@/lib/api';
import { triggerHaptic } from '@/lib/native/bridge';
import { pushAppNotification } from '@/lib/core/notifications';
import { registerPushToken } from '@/lib/native/pushRegistration';
import { useUser } from '@/contexts/UserContext';

interface PriceAlertButtonProps {
    product: Product;
}

export default function PriceAlertButton({ product }: PriceAlertButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [targetPrice, setTargetPrice] = useState('');
    const [success, setSuccess] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Use cloud storage hook
    const { favorites, addFavorite, loading } = useCloudStorage();
    const { userId, appId } = useUser();

    const currentPrice = parsePrice(product.lprice);
    const favoriteItem = favorites.find(f => f.productId === product.productId);
    const existingTargetPrice = favoriteItem?.targetPrice;

    // Focus trap + Escape to close
    useEffect(() => {
        if (!showModal) return;
        const modal = modalRef.current;
        if (!modal) return;

        const focusable = modal.querySelectorAll<HTMLElement>(
            'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        first?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setShowModal(false); return; }
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showModal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loading) return;

        const target = parseInt(targetPrice, 10);
        if (!Number.isFinite(target) || target <= 0) {
            pushAppNotification({ title: '입력 오류', message: '올바른 목표 가격을 입력해주세요.', type: 'alert' });
            return;
        }

        const updatedProduct = { ...product, targetPrice: target };
        await addFavorite(updatedProduct);

        triggerHaptic('success');
        pushAppNotification({
            title: '가격 알림 설정 완료',
            message: `${target.toLocaleString()}원 이하 도달 시 확인할 수 있도록 저장되었습니다.`,
            type: 'success',
        });

        if (userId) {
            const pushStatus = await registerPushToken(appId, userId);
            if (pushStatus === 'registered') {
                pushAppNotification({
                    title: '푸시 알림 활성화',
                    message: '가격 하락 시 iOS/브라우저 알림으로도 알려드릴게요.',
                    type: 'info',
                });
            }
        }
        setSuccess(true);

        setTimeout(() => {
            setShowModal(false);
            setSuccess(false);
            setTargetPrice('');
        }, 2000);
    };

    const hasAlert = favoriteItem && favoriteItem.targetPrice !== undefined;
    const isInactiveAlert = hasAlert && (favoriteItem.targetPrice || 0) >= parsePrice(product.lprice);

    if (loading) return null;

    return (
        <>
            {/* Badge Slide-in Animation */}
            {hasAlert && (
                <div className={`absolute top-3 left-3 z-10 animate-in slide-in-from-left-2 fade-in duration-500`}>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold shadow-sm border transition-all duration-300
                        ${isInactiveAlert
                            ? 'bg-gray-100 text-gray-400 border-gray-200 grayscale opacity-70'
                            : 'bg-red-100 text-red-600 border-red-200'}`}
                    >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {favoriteItem.targetPrice?.toLocaleString()}원 {isInactiveAlert ? '(도달)' : '알림'}
                    </span>
                </div>
            )}

            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    triggerHaptic('light');
                    setTargetPrice(existingTargetPrice ? String(existingTargetPrice) : '');
                    setShowModal(true);
                }}
                className={`absolute top-16 right-3 w-10 h-10 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center z-10 hover:scale-110 active:scale-95 ${hasAlert
                    ? (isInactiveAlert ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 border border-blue-200 text-blue-600')
                    : 'bg-white/90 text-gray-600 hover:text-blue-600'
                    }`}
                aria-label="가격 알림 설정"
            >
                <svg
                    className="w-5 h-5 transition-colors"
                    fill={hasAlert && !isInactiveAlert ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
            </button>

            {showModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="price-alert-title"
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModal(false);
                    }}
                >
                    <div
                        ref={modalRef}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        {success ? (
                            <div className="text-center py-4 animate-in zoom-in duration-300">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    알림이 설정되었습니다!
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm">
                                    관심 상품에 저장하고 가격을 추적합니다.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3 id="price-alert-title" className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                    {hasAlert ? '가격 알림 수정' : '가격 하락 알림 설정'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                                    현재 가격: <span className="font-bold text-accent">{currentPrice.toLocaleString()}원</span>
                                </p>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="target-price-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            목표 가격 (원)
                                        </label>
                                        <input
                                            id="target-price-input"
                                            type="number"
                                            value={targetPrice}
                                            onChange={(e) => setTargetPrice(e.target.value)}
                                            placeholder="예: 20000"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-shadow"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            이 가격 이하로 떨어지면 알림을 받습니다
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
                                        >
                                            {hasAlert ? '알림 수정' : '알림 설정'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setShowModal(false);
                                            }}
                                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
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
