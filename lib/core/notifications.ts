export type AppNotificationType = 'info' | 'success' | 'alert';

export interface AppNotificationPayload {
    title: string;
    message: string;
    type: AppNotificationType;
}

export const APP_NOTIFICATION_EVENT = 'loopyck:notify';

export function pushAppNotification(payload: AppNotificationPayload): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<AppNotificationPayload>(APP_NOTIFICATION_EVENT, { detail: payload }));
}

export function subscribeAppNotifications(
    handler: (payload: AppNotificationPayload) => void
): () => void {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const listener = (event: Event) => {
        const customEvent = event as CustomEvent<AppNotificationPayload>;
        if (!customEvent.detail) return;
        handler(customEvent.detail);
    };

    window.addEventListener(APP_NOTIFICATION_EVENT, listener);
    return () => window.removeEventListener(APP_NOTIFICATION_EVENT, listener);
}
