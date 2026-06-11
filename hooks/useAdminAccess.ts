'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';

export function useAdminAccess() {
    const { user, loading: authLoading } = useUser();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [accessError, setAccessError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.isAnonymous) {
            setIsAdmin(false);
            setAccessError(null);
            return;
        }

        let cancelled = false;
        setIsAdmin(null);

        const checkAccess = async () => {
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/admin/access', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || '관리자 권한이 필요합니다.');
                }

                if (!cancelled) {
                    setIsAdmin(true);
                    setAccessError(null);
                }
            } catch (error) {
                if (!cancelled) {
                    setIsAdmin(false);
                    setAccessError(error instanceof Error ? error.message : '관리자 권한이 필요합니다.');
                }
            }
        };

        void checkAccess();

        return () => {
            cancelled = true;
        };
    }, [authLoading, user]);

    return {
        user,
        authLoading,
        isAdmin,
        accessError,
    };
}
