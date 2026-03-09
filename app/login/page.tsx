'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRedirectResult } from 'firebase/auth';
import { signInWithGoogle } from '@/lib/auth/firebase';
import { auth } from '@/lib/firebase';
import { useUser } from '@/contexts/UserContext';

const REDIRECT_PENDING_KEY = 'loopyck:google-redirect-pending';
const POST_LOGIN_NEXT_KEY = 'loopyck:post-login-next';

function normalizeNext(nextParam: string | null) {
    if (!nextParam || !nextParam.startsWith('/')) return '/';
    return nextParam;
}

export default function LoginPage() {
    const router = useRouter();
    const { user, loading } = useUser();
    const [status, setStatus] = useState<'preparing' | 'redirecting' | 'failed'>('preparing');
    const [error, setError] = useState<string | null>(null);
    const [nextPath, setNextPath] = useState('/');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const resolvedNext = normalizeNext(params.get('next'));
            setNextPath(resolvedNext);
            window.sessionStorage.setItem(POST_LOGIN_NEXT_KEY, resolvedNext);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(POST_LOGIN_NEXT_KEY, nextPath);
        }
    }, [nextPath]);

    useEffect(() => {
        if (loading) return;
        if (user && !user.isAnonymous) {
            router.replace(nextPath);
        }
    }, [loading, nextPath, router, user]);

    useEffect(() => {
        if (!auth) {
            setStatus('failed');
            setError('Firebase Auth가 초기화되지 않았습니다. NEXT_PUBLIC_FIREBASE_* 설정을 다시 확인하세요.');
            return;
        }

        let cancelled = false;

        const start = async () => {
            try {
                const hadPendingRedirect = typeof window !== 'undefined'
                    && window.sessionStorage.getItem(REDIRECT_PENDING_KEY) === '1';
                const result = await getRedirectResult(auth);

                if (cancelled) return;

                if (result?.user) {
                    if (typeof window !== 'undefined') {
                        window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
                    }
                    router.replace(nextPath);
                    return;
                }

                if (hadPendingRedirect) {
                    if (typeof window !== 'undefined') {
                        window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
                    }
                    setStatus('failed');
                    setError('Google 인증이 완료되지 않았습니다. 브라우저 쿠키 차단 또는 Firebase 인증 설정을 다시 확인하세요.');
                    return;
                }

                setStatus('redirecting');
                setError(null);

                if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
                }

                await signInWithGoogle();
            } catch (redirectError) {
                if (cancelled) return;
                console.error('Dedicated login route error:', redirectError);
                const message = redirectError instanceof Error ? redirectError.message : 'Google 로그인에 실패했습니다.';
                setStatus('failed');
                setError(message);
            }
        };

        start();

        return () => {
            cancelled = true;
        };
    }, [nextPath, router]);

    return (
        <main className="min-h-screen mesh-bg flex items-center justify-center px-4">
            <section className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur-xl">
                <p className="text-xs font-bold tracking-[0.3em] text-slate-400 uppercase">LooPyck Auth</p>
                <h1 className="mt-3 text-3xl font-black text-slate-950">
                    {status === 'failed' ? 'Sign In Failed' : 'Google Sign-In'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                    {status === 'failed'
                        ? '로그인 흐름이 중간에 완료되지 않았습니다. 아래 메시지를 확인한 뒤 다시 시도하세요.'
                        : 'Google 인증 페이지로 이동 중입니다. 잠시 후 자동으로 연결됩니다.'}
                </p>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {status === 'failed'
                        ? `로그인 실패: ${error ?? '원인을 확인하지 못했습니다.'}`
                        : '리디렉트 로그인 준비 중...'}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => {
                            setStatus('redirecting');
                            setError(null);
                            if (typeof window !== 'undefined') {
                                window.sessionStorage.setItem(REDIRECT_PENDING_KEY, '1');
                            }
                            void signInWithGoogle().catch((retryError) => {
                                console.error('Retry Google Sign-In Error:', retryError);
                                if (typeof window !== 'undefined') {
                                    window.sessionStorage.removeItem(REDIRECT_PENDING_KEY);
                                }
                                setStatus('failed');
                                setError(retryError instanceof Error ? retryError.message : 'Google 로그인 재시도에 실패했습니다.');
                            });
                        }}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                        Google 로그인 다시 시도
                    </button>
                    <a
                        href={nextPath === '/' ? '/' : `${nextPath}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                        홈으로 돌아가기
                    </a>
                </div>
            </section>
        </main>
    );
}
