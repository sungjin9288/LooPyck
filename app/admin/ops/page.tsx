import SearchDiagnosticsDashboard from '@/components/admin/SearchDiagnosticsDashboard';

export const dynamic = 'force-dynamic';

export default function AdminOpsPage() {
    return <SearchDiagnosticsDashboard scope="ops" />;
}
