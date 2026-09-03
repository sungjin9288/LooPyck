'use client';

import { useEffect } from 'react';
import { Logger } from '@/lib/core/observability';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        Logger.error('[Error Boundary] render failed', error);
    }, [error]);

    return (
        <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-3xl border border-stone-200 bg-white p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-8 h-8 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                    문제가 발생했습니다
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                    예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
                </p>

                {process.env.NODE_ENV === 'development' && (
                    <div className="bg-red-50 rounded-xl p-3 mb-6 text-left">
                        <p className="text-red-700 text-xs font-mono break-all">
                            {error.message}
                        </p>
                    </div>
                )}

                <button
                    onClick={reset}
                    className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
                >
                    다시 시도
                </button>
            </div>
        </div>
    );
}
