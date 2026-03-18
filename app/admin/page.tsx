'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import SearchDiagnosticsDashboard from '@/components/admin/SearchDiagnosticsDashboard';

const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS ?? '')
    .split(',')
    .map((uid) => uid.trim())
    .filter(Boolean);

export default function AdminPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    const isAdmin = !!user && adminUids.length > 0 && adminUids.includes(user.uid);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.replace('/');
        }
    }, [loading, isAdmin, router]);

    if (loading || !isAdmin) return null;

    return <SearchDiagnosticsDashboard scope="full" />;
}
