'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import type { Product } from '@/types/product';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/lib/firebase';
import {
    areAlertBehaviorProfilesEqual,
    buildAlertBehaviorProfile,
    parseAlertBehaviorProfileSnapshot,
    toAlertBehaviorProfileSnapshot,
    type AlertBehaviorProfile,
    type AlertBehaviorProfileSnapshot,
    type AlertTuningConfig,
} from '@/lib/favorites/alertPersonalization';
import { useAlertTuningSettings } from './useAlertTuningSettings';
import type { AlertInboxItem } from './useAlertInbox';

type UseAlertPersonaArgs = {
    alerts: AlertInboxItem[];
    favorites: Product[];
};

type StoredAlertPersona = {
    profile: AlertBehaviorProfileSnapshot | null;
    updatedAt?: number;
};

function toMillis(value: unknown): number | undefined {
    if (value instanceof Timestamp) {
        return value.toMillis();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    return undefined;
}

export function useAlertPersona({ alerts, favorites }: UseAlertPersonaArgs): {
    alertProfile: AlertBehaviorProfile;
    derivedProfile: AlertBehaviorProfile;
    storedProfile: AlertBehaviorProfileSnapshot | null;
    status: 'local' | 'syncing' | 'synced';
    lastSyncedAt?: number;
    tuningConfig: AlertTuningConfig;
    rolloutKey: string | null;
} {
    const { appId, isAuthenticated, userId } = useUser();
    const { config: tuningConfig } = useAlertTuningSettings();
    const derivedProfile = useMemo(
        () => buildAlertBehaviorProfile({ alerts, favorites }, tuningConfig),
        [alerts, favorites, tuningConfig]
    );
    const hasSignals = useMemo(
        () => alerts.length > 0 || favorites.some((favorite) => typeof favorite.targetPrice === 'number' && favorite.targetPrice > 0),
        [alerts.length, favorites]
    );
    const [storedState, setStoredState] = useState<StoredAlertPersona>({ profile: null });
    const writeSignatureRef = useRef<string | null>(null);
    const derivedSnapshot = useMemo(
        () => toAlertBehaviorProfileSnapshot(derivedProfile),
        [derivedProfile]
    );
    const storedSnapshot = storedState.profile;

    useEffect(() => {
        if (!db || !isAuthenticated || !userId) {
            setStoredState({ profile: null });
            return;
        }

        const personaRef = doc(db, `artifacts/${appId}/users/${userId}/preferences`, 'alertPersona');
        return onSnapshot(personaRef, (snapshot) => {
            if (!snapshot.exists()) {
                setStoredState({ profile: null });
                return;
            }

            const data = snapshot.data() as Record<string, unknown>;
            setStoredState({
                profile: parseAlertBehaviorProfileSnapshot(data.profile ?? data, tuningConfig),
                updatedAt: toMillis(data.updatedAt),
            });
        }, (error) => {
            console.error('[useAlertPersona] failed to load stored persona:', error);
            setStoredState({ profile: null });
        });
    }, [appId, isAuthenticated, tuningConfig, userId]);

    useEffect(() => {
        if (!db || !isAuthenticated || !userId || !hasSignals) {
            return;
        }

        if (areAlertBehaviorProfilesEqual(storedSnapshot, derivedSnapshot)) {
            return;
        }

        const signature = JSON.stringify(derivedSnapshot);
        if (writeSignatureRef.current === signature) {
            return;
        }

        writeSignatureRef.current = signature;

        const personaRef = doc(db, `artifacts/${appId}/users/${userId}/preferences`, 'alertPersona');
        setDoc(personaRef, {
            profile: derivedSnapshot,
            updatedAt: serverTimestamp(),
        }, { merge: true }).catch((error) => {
            console.error('[useAlertPersona] failed to persist persona:', error);
            writeSignatureRef.current = null;
        });
    }, [appId, derivedSnapshot, hasSignals, isAuthenticated, storedSnapshot, userId]);

    const alertProfile = hasSignals && derivedSnapshot
        ? derivedProfile
        : storedSnapshot
            ? storedSnapshot
            : derivedProfile;
    const status: 'local' | 'syncing' | 'synced' = !isAuthenticated || !userId
        ? 'local'
        : areAlertBehaviorProfilesEqual(storedSnapshot, derivedSnapshot)
            ? 'synced'
            : hasSignals
                ? 'syncing'
                : storedSnapshot
                    ? 'synced'
                    : 'local';

    return {
        alertProfile,
        derivedProfile,
        storedProfile: storedSnapshot,
        status,
        lastSyncedAt: storedState.updatedAt,
        tuningConfig,
        rolloutKey: userId || null,
    };
}
