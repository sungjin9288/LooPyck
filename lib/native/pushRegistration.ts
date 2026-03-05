import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type PushRegistrationStatus =
    | 'registered'
    | 'unsupported'
    | 'permission-denied'
    | 'permission-default'
    | 'missing-config'
    | 'no-token'
    | 'failed';

function toDeviceDocId(token: string): string {
    return token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120);
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }
    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return Notification.permission;
    }
    return Notification.requestPermission();
}

async function saveTokenToFirestore(
    appId: string,
    userId: string,
    token: string,
    platform: string
): Promise<void> {
    const deviceDocId = toDeviceDocId(token);
    const deviceRef = doc(db!, `artifacts/${appId}/users/${userId}/devices/${deviceDocId}`);
    await setDoc(deviceRef, {
        token,
        platform,
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

async function registerNativePush(
    appId: string,
    userId: string
): Promise<PushRegistrationStatus> {
    try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { Capacitor } = await import('@capacitor/core');

        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return 'permission-denied';

        await PushNotifications.register();

        return new Promise((resolve) => {
            const registrationHandler = PushNotifications.addListener(
                'registration',
                async (token) => {
                    await registrationHandler.then(h => h.remove());
                    try {
                        const platform = Capacitor.getPlatform(); // 'ios' | 'android'
                        await saveTokenToFirestore(appId, userId, token.value, platform);
                        resolve('registered');
                    } catch {
                        resolve('failed');
                    }
                }
            );

            const errorHandler = PushNotifications.addListener(
                'registrationError',
                async () => {
                    await errorHandler.then(h => h.remove());
                    resolve('failed');
                }
            );

            // Timeout after 10s
            setTimeout(() => resolve('failed'), 10_000);
        });
    } catch {
        return 'failed';
    }
}

export async function registerPushToken(
    appId: string,
    userId: string
): Promise<PushRegistrationStatus> {
    if (typeof window === 'undefined') return 'unsupported';
    if (!db || !appId || !userId) return 'failed';

    // Native path (Capacitor iOS / Android)
    try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
            return registerNativePush(appId, userId);
        }
    } catch {
        // Capacitor not available — fall through to web path
    }

    // Web path (FCM)
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
        return 'unsupported';
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) return 'missing-config';

    const permission = await requestNotificationPermission();
    if (permission === 'denied') return 'permission-denied';
    if (permission !== 'granted') return 'permission-default';

    try {
        const messagingModule = await import('firebase/messaging');
        const supported = await messagingModule.isSupported().catch(() => false);
        if (!supported) return 'unsupported';

        const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = messagingModule.getMessaging();

        const token = await messagingModule.getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: swRegistration,
        });
        if (!token) return 'no-token';

        const platform = /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios-web' : 'web';
        await saveTokenToFirestore(appId, userId, token, platform);

        return 'registered';
    } catch (error) {
        console.error('[Push] token registration failed:', error);
        return 'failed';
    }
}
