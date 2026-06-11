'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchDiagnosticsDashboard from '@/components/admin/SearchDiagnosticsDashboard';
import { useAdminAccess } from '@/hooks/useAdminAccess';

export default function AdminPage() {
    const { authLoading, isAdmin } = useAdminAccess();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && isAdmin === false) {
            router.replace('/');
        }
    }, [authLoading, isAdmin, router]);

    if (authLoading || isAdmin !== true) return null;

    return <SearchDiagnosticsDashboard scope="full" />;
}
