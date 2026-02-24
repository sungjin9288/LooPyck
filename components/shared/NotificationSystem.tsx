'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotificationType, subscribeAppNotifications } from '@/lib/core/notifications';
import { collection, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useUser } from '@/contexts/UserContext';
import { db } from '@/lib/firebase';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: AppNotificationType;
    timestamp: number;
}

export default function NotificationSystem() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const seenAlertIds = useRef(new Set<string>());
    const { userId, appId, isAuthenticated } = useUser();

    useEffect(() => {
        return subscribeAppNotifications((payload) => {
            addNotification(payload);
        });
    }, []);

    useEffect(() => {
        if (!db || !isAuthenticated || !userId) return;

        const alertsRef = collection(db, `artifacts/${appId}/users/${userId}/alerts`);
        const alertsQuery = query(alertsRef, orderBy('createdAt', 'desc'), limit(20));

        return onSnapshot(alertsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type !== 'added') return;

                const id = change.doc.id;
                if (seenAlertIds.current.has(id)) return;
                seenAlertIds.current.add(id);

                const data = change.doc.data() as {
                    type?: AppNotificationType;
                    title?: string;
                    message?: string;
                    read?: boolean;
                };
                if (data.read) return;

                addNotification({
                    title: data.title || '가격 알림',
                    message: data.message || '가격이 목표가에 도달했습니다.',
                    type: data.type || 'alert',
                });

                updateDoc(change.doc.ref, {
                    read: true,
                    readAt: serverTimestamp(),
                }).catch((error) => {
                    console.error('[NotificationSystem] failed to mark alert read:', error);
                });
            });
        });
    }, [appId, isAuthenticated, userId]);

    const addNotification = (notif: Omit<Notification, 'id' | 'timestamp'>) => {
        const newNotif = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now()
        };
        setNotifications(prev => [newNotif, ...prev]);

        // Auto remove after 5s
        setTimeout(() => {
            removeNotification(newNotif.id);
        }, 5000);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        layout
                        className="pointer-events-auto bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-2xl p-4 w-80 flex gap-3 items-start"
                    >
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.type === 'success' ? 'bg-green-500' :
                                n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                            }`} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-black">{n.title}</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-400 hover:text-black transition-colors"
                        >
                            ✕
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
