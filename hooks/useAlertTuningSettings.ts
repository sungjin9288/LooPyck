'use client';

import { useEffect, useState } from 'react';
import { resolveAlertTuningConfig, type AlertTuningConfig } from '@/lib/favorites/alertPersonalization';

type AlertTuningResponse = {
    config?: unknown;
    updatedAt?: string | null;
    updatedBy?: string | null;
    storage?: 'firestore' | 'default';
};

type AlertTuningState = {
    config: AlertTuningConfig;
    updatedAt: string | null;
    updatedBy: string | null;
    storage: 'firestore' | 'default';
};

const CACHE_TTL_MS = 60_000;

let cachedState: AlertTuningState | null = null;
let cachedAt = 0;
let inflightRequest: Promise<AlertTuningState> | null = null;

async function fetchAlertTuningState(): Promise<AlertTuningState> {
    const now = Date.now();
    if (cachedState && now - cachedAt < CACHE_TTL_MS) {
        return cachedState;
    }

    if (inflightRequest) {
        return inflightRequest;
    }

    inflightRequest = fetch('/api/alert-tuning', { cache: 'no-store' })
        .then(async (response) => {
            const payload = await response.json() as AlertTuningResponse;
            if (!response.ok) {
                throw new Error('알림 튜닝 설정을 불러오지 못했습니다.');
            }

            const nextState: AlertTuningState = {
                config: resolveAlertTuningConfig(payload.config),
                updatedAt: payload.updatedAt || null,
                updatedBy: payload.updatedBy || null,
                storage: payload.storage === 'firestore' ? 'firestore' : 'default',
            };
            cachedState = nextState;
            cachedAt = Date.now();
            return nextState;
        })
        .catch((error) => {
            if (cachedState) {
                return cachedState;
            }

            console.error('[useAlertTuningSettings] failed to fetch tuning config:', error);
            return {
                config: resolveAlertTuningConfig(),
                updatedAt: null,
                updatedBy: null,
                storage: 'default',
            } satisfies AlertTuningState;
        })
        .finally(() => {
            inflightRequest = null;
        });

    return inflightRequest;
}

export function primeAlertTuningSettings(state: AlertTuningState) {
    cachedState = state;
    cachedAt = Date.now();
}

export function useAlertTuningSettings() {
    const [state, setState] = useState<AlertTuningState>(() => cachedState || {
        config: resolveAlertTuningConfig(),
        updatedAt: null,
        updatedBy: null,
        storage: 'default',
    });
    const [loading, setLoading] = useState(!cachedState);

    useEffect(() => {
        let cancelled = false;

        void fetchAlertTuningState().then((nextState) => {
            if (!cancelled) {
                setState(nextState);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    return {
        config: state.config,
        updatedAt: state.updatedAt,
        updatedBy: state.updatedBy,
        storage: state.storage,
        loading,
    };
}
