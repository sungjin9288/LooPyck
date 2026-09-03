'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    collection,
    deleteDoc,
    deleteField,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    writeBatch,
} from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/lib/firebase';
import type { AppNotificationType } from '@/lib/core/notifications';
import type { AlertPriority } from '@/lib/favorites/alertState';
import { Logger } from '@/lib/core/observability';

export interface AlertInboxItem {
    cheapestLink?: string;
    cheapestMall?: string;
    cheapestPrice?: number;
    createdAt: number;
    currentPrice?: number;
    deepLink?: string;
    favoriteId?: string;
    archivedAt?: number;
    id: string;
    link?: string;
    mallName?: string;
    message: string;
    priority?: AlertPriority;
    productId?: string;
    read: boolean;
    readAt?: number;
    source?: string;
    targetPrice?: number;
    title: string;
    type: AppNotificationType;
    variantKey?: string;
    variantLabel?: string;
}

interface UseAlertInboxOptions {
    includeArchived?: boolean;
}

function normalizeTimestamp(value: unknown): number {
    if (value instanceof Timestamp) {
        return value.toMillis();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    return Date.now();
}

function optionalTimestamp(value: unknown): number | undefined {
    if (value instanceof Timestamp) {
        return value.toMillis();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    return undefined;
}

export function useAlertInbox(limitCount: number = 20, options: UseAlertInboxOptions = {}) {
    const { appId, isAuthenticated, userId } = useUser();
    const [alerts, setAlerts] = useState<AlertInboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const includeArchived = options.includeArchived ?? false;

    useEffect(() => {
        if (!db || !isAuthenticated || !userId) {
            setAlerts([]);
            setLoading(false);
            return;
        }

        const alertsRef = collection(db, `artifacts/${appId}/users/${userId}/alerts`);
        const queryLimit = includeArchived ? Math.max(limitCount, 30) : Math.max(limitCount * 3, 40);
        const alertsQuery = query(alertsRef, orderBy('createdAt', 'desc'), limit(queryLimit));

        return onSnapshot(alertsQuery, (snapshot) => {
            const nextAll: AlertInboxItem[] = snapshot.docs.map((doc) => {
                const data = doc.data() as Record<string, unknown>;

                return {
                    archivedAt: optionalTimestamp(data.archivedAt),
                    cheapestLink: typeof data.cheapestLink === 'string' ? data.cheapestLink : undefined,
                    cheapestMall: typeof data.cheapestMall === 'string' ? data.cheapestMall : undefined,
                    cheapestPrice: typeof data.cheapestPrice === 'number' ? data.cheapestPrice : undefined,
                    createdAt: normalizeTimestamp(data.createdAt),
                    currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : undefined,
                    deepLink: typeof data.deepLink === 'string' ? data.deepLink : undefined,
                    favoriteId: typeof data.favoriteId === 'string' ? data.favoriteId : undefined,
                    id: doc.id,
                    link: typeof data.link === 'string' ? data.link : undefined,
                    mallName: typeof data.mallName === 'string' ? data.mallName : undefined,
                    message: typeof data.message === 'string' ? data.message : '가격 알림이 도착했습니다.',
                    priority: data.priority === 'critical' || data.priority === 'high' || data.priority === 'medium'
                        ? data.priority
                        : undefined,
                    productId: typeof data.productId === 'string' ? data.productId : undefined,
                    read: Boolean(data.read),
                    readAt: optionalTimestamp(data.readAt),
                    source: typeof data.source === 'string' ? data.source : undefined,
                    targetPrice: typeof data.targetPrice === 'number' ? data.targetPrice : undefined,
                    title: typeof data.title === 'string' ? data.title : '가격 알림',
                    type: data.type === 'success' || data.type === 'info' || data.type === 'alert' ? data.type : 'alert',
                    variantKey: typeof data.variantKey === 'string' ? data.variantKey : undefined,
                    variantLabel: typeof data.variantLabel === 'string' ? data.variantLabel : undefined,
                };
            });

            const visibleAlerts = includeArchived
                ? nextAll.slice(0, limitCount)
                : nextAll.filter((alert) => !alert.archivedAt).slice(0, limitCount);

            setAlerts(visibleAlerts);
            setLoading(false);
        }, (error) => {
            Logger.error('[useAlertInbox] Firestore sync failed', error);
            setLoading(false);
        });
    }, [appId, includeArchived, isAuthenticated, limitCount, userId]);

    const markAlertRead = useCallback(async (alertId: string, read: boolean = true) => {
        if (!db || !isAuthenticated || !userId) return;

        const alertRef = doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId);
        await updateDoc(alertRef, {
            read,
            readAt: read ? serverTimestamp() : deleteField(),
        });
    }, [appId, isAuthenticated, userId]);

    const markAllAlertsRead = useCallback(async (alertIds?: string[]) => {
        if (!db || !isAuthenticated || !userId) return;

        const targetIds = (alertIds && alertIds.length > 0)
            ? alertIds
            : alerts.filter((alert) => !alert.read && !alert.archivedAt).map((alert) => alert.id);
        if (targetIds.length === 0) {
            return;
        }

        const batch = writeBatch(db);
        targetIds.forEach((alertId) => {
            batch.update(doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId), {
                read: true,
                readAt: serverTimestamp(),
            });
        });
        await batch.commit();
    }, [alerts, appId, isAuthenticated, userId]);

    const archiveAlert = useCallback(async (alertId: string) => {
        if (!db || !isAuthenticated || !userId) return;

        const alertRef = doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId);
        await updateDoc(alertRef, {
            archivedAt: serverTimestamp(),
        });
    }, [appId, isAuthenticated, userId]);

    const restoreAlert = useCallback(async (alertId: string) => {
        if (!db || !isAuthenticated || !userId) return;

        const alertRef = doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId);
        await updateDoc(alertRef, {
            archivedAt: deleteField(),
        });
    }, [appId, isAuthenticated, userId]);

    const deleteAlert = useCallback(async (alertId: string) => {
        if (!db || !isAuthenticated || !userId) return;

        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId));
    }, [appId, isAuthenticated, userId]);

    const activeAlerts = alerts.filter((alert) => !alert.archivedAt);
    const archivedAlerts = alerts.filter((alert) => Boolean(alert.archivedAt));
    const unreadAlerts = activeAlerts.filter((alert) => !alert.read);

    return {
        activeAlerts,
        archiveAlert,
        archivedAlerts,
        alerts,
        deleteAlert,
        loading,
        markAlertRead,
        markAllAlertsRead,
        restoreAlert,
        unreadAlerts,
        unreadCount: unreadAlerts.length,
    };
}
