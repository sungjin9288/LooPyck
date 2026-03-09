'use client';

import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOut } from '@/lib/auth/firebase';
import { User } from 'firebase/auth';
import StyleDashboard from '@/components/auth/StyleDashboard';
import MyAsset from '@/components/profile/MyAsset'; // Portfolio Component
import { useUser } from '@/contexts/UserContext';
import { pushAppNotification } from '@/lib/core/notifications';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function getReadableAuthMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
        return '로그인에 실패했습니다.';
    }

    const code = typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : '';

    switch (code) {
        case 'auth/unauthorized-domain':
            return 'Firebase Authentication의 Authorized domains에 현재 도메인을 추가해야 합니다.';
        case 'auth/popup-blocked':
            return '브라우저가 로그인 팝업을 차단했습니다. 팝업 차단을 해제하고 다시 시도하세요.';
        case 'auth/popup-closed-by-user':
            return '로그인 팝업이 닫혔습니다. 다시 시도하세요.';
        case 'auth/operation-not-allowed':
            return 'Firebase Authentication에서 Google 로그인이 활성화되지 않았습니다.';
        case 'auth/network-request-failed':
            return '네트워크 문제로 로그인에 실패했습니다.';
        default:
            return error instanceof Error ? error.message : '로그인에 실패했습니다.';
    }
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { user, linkAccount } = useUser();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setLoginError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Glassmorphism */}
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100 opacity-100 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-500/30 rounded-full blur-2xl" />

                <button
                    onClick={onClose}
                    aria-label="로그인 모달 닫기"
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center mb-8 relative z-10">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">LooPyck</h2>
                    <p className="text-gray-200 text-sm font-light">
                        Unlock your personal <br />
                        <span className="font-bold text-white">Fashion Intelligence</span>
                    </p>
                </div>

                <button
                    onClick={async () => {
                        try {
                            setIsSubmitting(true);
                            setLoginError(null);
                            if (user?.isAnonymous) {
                                await linkAccount();
                            } else {
                                await signInWithGoogle();
                            }
                            onClose();
                        } catch (e: unknown) {
                            console.error('Login error:', e);
                            const message = getReadableAuthMessage(e);
                            setLoginError(message);
                            pushAppNotification({ title: '로그인 실패', message, type: 'alert' });
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}
                    disabled={isSubmitting}
                    className="w-full relative z-10 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-black font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg group"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-5 h-5 group-hover:rotate-12 transition-transform"
                    />
                    <span className="tracking-wide">{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                {loginError && (
                    <p className="mt-4 text-center text-sm text-rose-200 relative z-10">
                        {loginError}
                    </p>
                )}

                <p className="text-center text-white/40 text-xs mt-6 relative z-10">
                    By continuing, you agree to our Terms & Privacy.
                </p>
            </div>
        </div>
    );
}

export function UserProfile({ user }: { user: User }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-gray-200"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-sm font-bold text-black truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    {/* Style DNA Section */}
                    <div className="border-b border-gray-50">
                        <StyleDashboard />
                    </div>

                    {/* My Asset Portfolio */}
                    <div className="border-b border-gray-50 p-4">
                        <MyAsset />
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
