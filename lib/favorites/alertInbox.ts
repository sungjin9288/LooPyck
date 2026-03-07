import type { AlertInboxItem } from '../../hooks/useAlertInbox.ts';

export type AlertHistoryView = 'active' | 'unread' | 'archived';

export function getAlertHistoryCounts(alerts: AlertInboxItem[]): Record<AlertHistoryView, number> {
    const active = alerts.filter((alert) => !alert.archivedAt);
    const archived = alerts.filter((alert) => Boolean(alert.archivedAt));
    const unread = active.filter((alert) => !alert.read);

    return {
        active: active.length,
        archived: archived.length,
        unread: unread.length,
    };
}

export function filterAlertsByHistoryView(alerts: AlertInboxItem[], view: AlertHistoryView): AlertInboxItem[] {
    switch (view) {
        case 'archived':
            return alerts.filter((alert) => Boolean(alert.archivedAt));
        case 'unread':
            return alerts.filter((alert) => !alert.archivedAt && !alert.read);
        case 'active':
        default:
            return alerts.filter((alert) => !alert.archivedAt);
    }
}
