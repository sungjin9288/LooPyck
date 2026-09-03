import { NextRequest, NextResponse } from 'next/server';
import { loadPdpDiagnostics } from '@/lib/api/pdpDiagnostics';
import { loadSearchDiagnostics } from '@/lib/api/searchDiagnostics';
import { assessSourceHealth } from '@/lib/api/sourceHealth';
import { buildSearchQualityCoverageSummary } from '@/lib/search/searchQualityCoverage';
import { loadSearchLearningActivity, loadSearchLearningQueue } from '@/lib/searchLearning/searchLearningDiagnostics';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { loadAlertDiagnostics } from '@/lib/server/alertDiagnostics';
import { requireAdminRequest } from '@/lib/server/adminAccess';
import { Logger } from '@/lib/core/observability';
import {
    buildAlertTuningAuditInboxSummary,
    buildAlertTuningReminderDigest,
    getAlertTuningWebhookConfig,
    loadAlertTuningApprovalRequests,
    loadAlertTuningAuditEvents,
    loadAlertTuningConfigRecord,
} from '@/lib/server/alertTuningStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const rateLimit = await checkRateLimit(getRateLimitKey(request, 'realtime-search-diagnostics'), 30, 60_000);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfterSec),
                        'X-RateLimit-Remaining': '0',
                    },
                }
            );
        }

        const adminCheck = await requireAdminRequest(request);
        if (!adminCheck.ok) {
            return NextResponse.json(
                { error: adminCheck.error },
                {
                    status: adminCheck.status,
                    headers: {
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                    },
                }
            );
        }

        const limitRaw = Number.parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
        const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 120)) : 10;
        const includeRecent = request.nextUrl.searchParams.get('include') === 'recent';
        const [diagnostics, pdpDiagnostics, searchLearning, searchLearningActivity, alertTuning, alertTuningRequests, alertTuningAudit] = await Promise.all([
            loadSearchDiagnostics(limit),
            loadPdpDiagnostics(limit),
            loadSearchLearningQueue(Math.min(limit, 30)),
            loadSearchLearningActivity(Math.min(limit, 20)),
            loadAlertTuningConfigRecord(),
            loadAlertTuningApprovalRequests(),
            loadAlertTuningAuditEvents(undefined, adminCheck.uid),
        ]);
        const alertDiagnostics = await loadAlertDiagnostics(limit, alertTuning.config);
        const searchQualityCoverage = buildSearchQualityCoverageSummary();
        const alertTuningDigest = buildAlertTuningReminderDigest(alertTuningRequests);
        const alertTuningAuditInbox = buildAlertTuningAuditInboxSummary(alertTuningAudit);
        const alertTuningWebhook = getAlertTuningWebhookConfig();

        // 소스 헬스: "되다가 죽은 소스"(failing)를 사람이 안 봐도 아는 신호로 승격
        const sourceHealth = assessSourceHealth(diagnostics.summary.sources);
        const failingSources = sourceHealth.filter((health) => health.status === 'failing');

        return NextResponse.json(
            {
                summary: diagnostics.summary,
                sourceHealth,
                failingSources,
                recent: includeRecent ? diagnostics.recent : [],
                recentInteractions: includeRecent ? diagnostics.recentInteractions : [],
                quality: diagnostics.quality,
                interactionSummary: diagnostics.interactionSummary,
                storage: diagnostics.storage,
                searchLearning,
                searchLearningActivity,
                searchQualityCoverage,
                pdp: {
                    summary: pdpDiagnostics.summary,
                    recent: includeRecent ? pdpDiagnostics.recent : [],
                    storage: pdpDiagnostics.storage,
                },
                alerts: {
                    summary: alertDiagnostics.summary,
                    recent: includeRecent ? alertDiagnostics.recent : [],
                    drilldown: alertDiagnostics.drilldown,
                    personas: alertDiagnostics.personas,
                    rollout: alertDiagnostics.rollout,
                    rolloutTrends: alertDiagnostics.rolloutTrends,
                    storage: alertDiagnostics.storage,
                },
                alertTuning,
                alertTuningRequests,
                alertTuningAudit,
                alertTuningAuditInbox,
                alertTuningDigest,
                alertTuningWebhook,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                    'Cache-Control': 'private, max-age=15',
                },
            },
        );
    } catch (error) {
        Logger.error('[RealtimeSearchDiagnostics] request failed', error);
        return NextResponse.json(
            {
                error: error instanceof Error
                    ? error.message
                    : '진단 데이터를 불러오는 중 알 수 없는 오류가 발생했습니다.',
            },
            {
                status: 500,
            }
        );
    }
}
