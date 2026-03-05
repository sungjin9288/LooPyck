import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildWorkerScript() {
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId) {
        return `self.addEventListener('install', () => self.skipWaiting());`;
    }

    return `
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(firebaseConfig)});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};
  const title = payload?.notification?.title || data.title || '가격 알림';
  const body = payload?.notification?.body || data.body || '설정한 목표가에 도달했습니다.';
  const link = data.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { link }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification?.data?.link || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
      return Promise.resolve();
    })
  );
});
`;
}

export async function GET() {
    return new NextResponse(buildWorkerScript(), {
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Service-Worker-Allowed': '/',
            'Cache-Control': 'public, max-age=300',
        },
    });
}
