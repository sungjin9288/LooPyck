import { Timestamp } from 'firebase-admin/firestore';
import { resolveAlertTuningConfig, type AlertTuningConfig } from '../favorites/alertPersonalization.ts';
import { getConfiguredAdminUids } from './adminAccess.ts';
import { getAdminDb } from './firebaseAdmin.ts';

const COLLECTION = 'opsConfig';
const DOC_ID = 'alertTuning';
const HISTORY_LIMIT = 12;
const REQUEST_LIMIT = 20;
const OPEN_REQUEST_SCAN_LIMIT = 60;
const AUDIT_LIMIT = 24;
const APPROVAL_REQUEST_EXPIRY_HOURS = 48;
const APPROVAL_REQUEST_SLA_HOURS = 24;

export type AlertTuningApprovalRequestStatus = 'pending' | 'pending_second_approval' | 'approved' | 'rejected' | 'expired';

export type AlertTuningApprovalEvent = {
    uid: string;
    note: string | null;
    approvedAt: string | null;
};

export type AlertTuningHistoryEntry = {
    id: string;
    updatedAt: string | null;
    updatedBy: string | null;
    summary: string;
    restorable: boolean;
};

export type AlertTuningConfigRecord = {
    config: AlertTuningConfig;
    updatedAt: string | null;
    updatedBy: string | null;
    storage: 'firestore' | 'default';
    history: AlertTuningHistoryEntry[];
};

export type AlertTuningApprovalRequest = {
    id: string;
    source: string;
    currentRolloutPercentage: number;
    proposedRolloutPercentage: number;
    title: string;
    description: string;
    status: AlertTuningApprovalRequestStatus;
    requiredApprovals: number;
    approvalCount: number;
    approvals: AlertTuningApprovalEvent[];
    createdAt: string | null;
    createdBy: string | null;
    requestNote: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    resolutionNote: string | null;
};

export type AlertTuningApprovalQueueSummary = {
    trackedRequests: number;
    openCount: number;
    pendingCount: number;
    secondApprovalCount: number;
    approvedCount: number;
    rejectedCount: number;
    expiredCount: number;
    overdueCount: number;
    expiringSoonCount: number;
    avgOpenAgeHours: number;
    maxOpenAgeHours: number;
    avgResolutionHours: number;
    withinSlaRate: number;
    oldestOpenAt: string | null;
};

export type AlertTuningAuditEventLevel = 'info' | 'success' | 'warning' | 'critical';
export type AlertTuningAuditEventType =
    | 'request_created'
    | 'approval_recorded'
    | 'second_approval_required'
    | 'request_approved'
    | 'request_rejected'
    | 'request_expired'
    | 'config_saved'
    | 'config_rolled_back'
    | 'sla_digest'
    | 'webhook_dispatched'
    | 'webhook_failed';

export type AlertTuningAuditEvent = {
    id: string;
    type: AlertTuningAuditEventType;
    level: AlertTuningAuditEventLevel;
    title: string;
    message: string;
    createdAt: string | null;
    source: string | null;
    requestId: string | null;
    actorUid: string | null;
    note: string | null;
    historyId: string | null;
    read: boolean;
    readAt: string | null;
};

export type AlertTuningReminderDigestItem = {
    requestId: string;
    source: string;
    title: string;
    status: AlertTuningApprovalRequestStatus;
    createdAt: string | null;
    expiresAt: string | null;
    ageHours: number;
    proposedRolloutPercentage: number;
};

export type AlertTuningReminderDigest = {
    generatedAt: string;
    openCount: number;
    overdueCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    oldestOpenAt: string | null;
    overdueRequests: AlertTuningReminderDigestItem[];
    expiringSoonRequests: AlertTuningReminderDigestItem[];
};

export type AlertTuningAuditInboxSummary = {
    total: number;
    unreadCount: number;
    criticalUnreadCount: number;
    warningUnreadCount: number;
};

export type AlertTuningWebhookFormat = 'generic' | 'slack' | 'discord';

export type AlertTuningWebhookConfig = {
    configured: boolean;
    format: AlertTuningWebhookFormat | null;
    targetLabel: string | null;
};

export type AlertTuningReminderDispatchResult = {
    configured: boolean;
    attempted: boolean;
    delivered: boolean;
    status: number | null;
    target: string | null;
    format: AlertTuningWebhookFormat | null;
    error: string | null;
};

type AlertTuningApprovalRequestInput = {
    source: string;
    currentRolloutPercentage: number;
    proposedRolloutPercentage: number;
    title: string;
    description: string;
    requestNote: string | null;
};

type AlertTuningAuditEventInput = {
    type: AlertTuningAuditEventType;
    level: AlertTuningAuditEventLevel;
    title: string;
    message: string;
    source?: string | null;
    requestId?: string | null;
    actorUid?: string | null;
    note?: string | null;
    historyId?: string | null;
    dedupeKey?: string | null;
};

function toIso(value: Timestamp | Date | number | null | undefined): string | null {
    if (value instanceof Timestamp) {
        return value.toDate().toISOString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value).toISOString();
    }

    return null;
}

function trimTrailingSlash(value: string): string {
    return value.replace(/\/+$/, '');
}

export function resolveAlertTuningWebhookFormat(
    configuredFormat: string | null | undefined,
    webhookUrl: string | null | undefined
): AlertTuningWebhookFormat {
    const normalizedFormat = (configuredFormat || '').trim().toLowerCase();
    if (normalizedFormat === 'slack' || normalizedFormat === 'discord' || normalizedFormat === 'generic') {
        return normalizedFormat;
    }

    const normalizedUrl = (webhookUrl || '').trim().toLowerCase();
    if (normalizedUrl.includes('hooks.slack.com/services/')) {
        return 'slack';
    }

    if (
        normalizedUrl.includes('discord.com/api/webhooks/')
        || normalizedUrl.includes('discordapp.com/api/webhooks/')
    ) {
        return 'discord';
    }

    return 'generic';
}

function buildAlertTuningWebhookTargetLabel(webhookUrl: string): string | null {
    try {
        const url = new URL(webhookUrl);
        return `${url.host}${url.pathname}`;
    } catch {
        return webhookUrl || null;
    }
}

export function getAlertTuningWebhookConfig(): AlertTuningWebhookConfig {
    const webhookUrl = trimTrailingSlash(process.env.ALERT_TUNING_WEBHOOK_URL || '');
    if (!webhookUrl) {
        return {
            configured: false,
            format: null,
            targetLabel: null,
        };
    }

    return {
        configured: true,
        format: resolveAlertTuningWebhookFormat(process.env.ALERT_TUNING_WEBHOOK_FORMAT, webhookUrl),
        targetLabel: buildAlertTuningWebhookTargetLabel(webhookUrl),
    };
}

function clampPercentage(value: unknown, fallback = 0): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
}

function clampNote(value: string): string {
    return value.trim().replace(/\s+/g, ' ').slice(0, 280);
}

export function normalizeAlertTuningApprovalNote(input: unknown): string | null {
    if (typeof input !== 'string') {
        return null;
    }

    const note = clampNote(input);
    return note.length > 0 ? note : null;
}

export function getAlertTuningRequiredApprovals(adminUids: string[] = []): number {
    const configuredAdmins = Array.from(new Set(adminUids.filter(Boolean)));
    return configuredAdmins.length >= 3 ? 2 : 1;
}

function summarizeApprovalNote(note: string | null): string {
    if (!note) {
        return '';
    }

    return ` | note: ${note.slice(0, 80)}`;
}

export function getAlertTuningSelfApprovalGuardError(
    action: 'approve' | 'reject',
    createdBy: string | null | undefined,
    resolvedBy: string | null | undefined,
    adminUids: string[] = []
): string | null {
    const configuredAdmins = Array.from(new Set(adminUids.filter(Boolean)));
    if (
        action === 'approve'
        && configuredAdmins.length > 1
        && createdBy
        && resolvedBy
        && createdBy === resolvedBy
    ) {
        return 'multi-admin 환경에서는 request 생성자가 직접 approve할 수 없습니다. 다른 관리자에게 승인받으세요.';
    }

    return null;
}

export function getAlertTuningDuplicateApprovalGuardError(
    actorUid: string | null | undefined,
    approvals: Array<{ uid: string | null | undefined }> = []
): string | null {
    if (!actorUid) {
        return null;
    }

    if (approvals.some((approval) => approval.uid === actorUid)) {
        return '같은 관리자는 동일 request를 두 번 approve할 수 없습니다.';
    }

    return null;
}

export function getAlertTuningDecisionNoteError(
    action: 'approve' | 'reject',
    note: string | null
): string | null {
    if (action === 'reject' && !note) {
        return 'reject 처리에는 decision note가 필요합니다.';
    }

    return null;
}

function toMillisFromIso(value: string | null | undefined): number | null {
    if (!value) {
        return null;
    }

    const millis = Date.parse(value);
    return Number.isFinite(millis) ? millis : null;
}

export function isAlertTuningApprovalRequestOpen(status: AlertTuningApprovalRequestStatus): boolean {
    return status === 'pending' || status === 'pending_second_approval';
}

export function getAlertTuningApprovalRequestAgeHours(
    createdAt: string | null | undefined,
    nowMs = Date.now()
): number | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) {
        return null;
    }

    return Math.max(0, (nowMs - createdAtMs) / 3_600_000);
}

export function getAlertTuningApprovalRequestExpiresAt(
    createdAt: string | null | undefined
): string | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) {
        return null;
    }

    return new Date(createdAtMs + APPROVAL_REQUEST_EXPIRY_HOURS * 3_600_000).toISOString();
}

export function isAlertTuningApprovalRequestExpired(
    request: Pick<AlertTuningApprovalRequest, 'status' | 'createdAt'>,
    nowMs = Date.now()
): boolean {
    if (!isAlertTuningApprovalRequestOpen(request.status)) {
        return false;
    }

    const ageHours = getAlertTuningApprovalRequestAgeHours(request.createdAt, nowMs);
    return ageHours !== null && ageHours >= APPROVAL_REQUEST_EXPIRY_HOURS;
}

export function buildAlertTuningApprovalQueueSummary(
    requests: AlertTuningApprovalRequest[],
    nowMs = Date.now()
): AlertTuningApprovalQueueSummary {
    const openRequests = requests.filter((request) => isAlertTuningApprovalRequestOpen(request.status));
    const resolvedRequests = requests.filter((request) => !isAlertTuningApprovalRequestOpen(request.status));
    const openAges = openRequests
        .map((request) => getAlertTuningApprovalRequestAgeHours(request.createdAt, nowMs))
        .filter((value): value is number => value !== null);
    const resolutionHours = resolvedRequests
        .map((request) => {
            const createdAtMs = toMillisFromIso(request.createdAt);
            const resolvedAtMs = toMillisFromIso(request.resolvedAt);
            if (createdAtMs === null || resolvedAtMs === null) {
                return null;
            }

            return Math.max(0, (resolvedAtMs - createdAtMs) / 3_600_000);
        })
        .filter((value): value is number => value !== null);
    const withinSlaResolvedCount = resolutionHours.filter((hours) => hours <= APPROVAL_REQUEST_SLA_HOURS).length;

    return {
        trackedRequests: requests.length,
        openCount: openRequests.length,
        pendingCount: requests.filter((request) => request.status === 'pending').length,
        secondApprovalCount: requests.filter((request) => request.status === 'pending_second_approval').length,
        approvedCount: requests.filter((request) => request.status === 'approved').length,
        rejectedCount: requests.filter((request) => request.status === 'rejected').length,
        expiredCount: requests.filter((request) => request.status === 'expired').length,
        overdueCount: openAges.filter((hours) => hours >= APPROVAL_REQUEST_SLA_HOURS).length,
        expiringSoonCount: openAges.filter((hours) => hours >= APPROVAL_REQUEST_SLA_HOURS - 6 && hours < APPROVAL_REQUEST_EXPIRY_HOURS).length,
        avgOpenAgeHours: openAges.length > 0 ? Number((openAges.reduce((sum, hours) => sum + hours, 0) / openAges.length).toFixed(1)) : 0,
        maxOpenAgeHours: openAges.length > 0 ? Number(Math.max(...openAges).toFixed(1)) : 0,
        avgResolutionHours: resolutionHours.length > 0 ? Number((resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length).toFixed(1)) : 0,
        withinSlaRate: resolutionHours.length > 0 ? Number(((withinSlaResolvedCount / resolutionHours.length) * 100).toFixed(1)) : 0,
        oldestOpenAt: openRequests
            .map((request) => request.createdAt)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => left.localeCompare(right))[0] || null,
    };
}

function toReminderDigestItem(
    request: AlertTuningApprovalRequest,
    nowMs: number
): AlertTuningReminderDigestItem | null {
    const ageHours = getAlertTuningApprovalRequestAgeHours(request.createdAt, nowMs);
    if (ageHours === null) {
        return null;
    }

    return {
        requestId: request.id,
        source: request.source,
        title: request.title,
        status: request.status,
        createdAt: request.createdAt,
        expiresAt: getAlertTuningApprovalRequestExpiresAt(request.createdAt),
        ageHours: Number(ageHours.toFixed(1)),
        proposedRolloutPercentage: request.proposedRolloutPercentage,
    };
}

export function buildAlertTuningReminderDigest(
    requests: AlertTuningApprovalRequest[],
    nowMs = Date.now()
): AlertTuningReminderDigest {
    const openRequests = requests.filter((request) => isAlertTuningApprovalRequestOpen(request.status));
    const overdueCandidates = openRequests
        .map((request) => toReminderDigestItem(request, nowMs))
        .filter((entry): entry is AlertTuningReminderDigestItem => Boolean(entry))
        .filter((entry) => entry.ageHours >= APPROVAL_REQUEST_SLA_HOURS)
        .sort((left, right) => right.ageHours - left.ageHours);
    const expiringSoonCandidates = openRequests
        .map((request) => toReminderDigestItem(request, nowMs))
        .filter((entry): entry is AlertTuningReminderDigestItem => Boolean(entry))
        .filter((entry) => entry.ageHours >= APPROVAL_REQUEST_SLA_HOURS - 6 && entry.ageHours < APPROVAL_REQUEST_EXPIRY_HOURS)
        .sort((left, right) => right.ageHours - left.ageHours);

    return {
        generatedAt: new Date(nowMs).toISOString(),
        openCount: openRequests.length,
        overdueCount: overdueCandidates.length,
        expiringSoonCount: expiringSoonCandidates.length,
        expiredCount: requests.filter((request) => request.status === 'expired').length,
        oldestOpenAt: openRequests
            .map((request) => request.createdAt)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => left.localeCompare(right))[0] || null,
        overdueRequests: overdueCandidates.slice(0, 5),
        expiringSoonRequests: expiringSoonCandidates.slice(0, 5),
    };
}

export function summarizeAlertTuningApprovalRequest(input: AlertTuningApprovalRequestInput): string {
    return `${input.source} rollout ${input.currentRolloutPercentage}% -> ${input.proposedRolloutPercentage}%`;
}

export function resolveAlertTuningHistorySnapshot(data: Record<string, unknown>): AlertTuningConfig | null {
    const snapshot = data.configSnapshot ?? data.config;
    return snapshot && typeof snapshot === 'object'
        ? resolveAlertTuningConfig(snapshot)
        : null;
}

function mapHistoryEntry(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): AlertTuningHistoryEntry {
    const data = doc.data() as Record<string, unknown> | undefined;
    const snapshot = data ? resolveAlertTuningHistorySnapshot(data) : null;
    return {
        id: doc.id,
        updatedAt: toIso(data?.updatedAt as Timestamp | Date | number | null | undefined),
        updatedBy: typeof data?.updatedBy === 'string' ? data.updatedBy : null,
        summary: typeof data?.summary === 'string' ? data.summary : '변경 이력',
        restorable: Boolean(snapshot),
    };
}

function mapAuditEvent(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): AlertTuningAuditEvent {
    const data = doc.data() as Record<string, unknown> | undefined;
    const type = typeof data?.type === 'string' ? data.type as AlertTuningAuditEventType : 'config_saved';
    const level = typeof data?.level === 'string' ? data.level as AlertTuningAuditEventLevel : 'info';
    return {
        id: doc.id,
        type,
        level,
        title: typeof data?.title === 'string' ? data.title : 'Alert Tuning Audit',
        message: typeof data?.message === 'string' ? data.message : '운영 이벤트 기록',
        createdAt: toIso(data?.createdAt as Timestamp | Date | number | null | undefined),
        source: typeof data?.source === 'string' ? data.source : null,
        requestId: typeof data?.requestId === 'string' ? data.requestId : null,
        actorUid: typeof data?.actorUid === 'string' ? data.actorUid : null,
        note: normalizeAlertTuningApprovalNote(data?.note),
        historyId: typeof data?.historyId === 'string' ? data.historyId : null,
        read: false,
        readAt: null,
    };
}

function auditAckDocId(adminUid: string, eventId: string): string {
    return `${adminUid}__${eventId}`;
}

async function loadHistoryEntries(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
): Promise<AlertTuningHistoryEntry[]> {
    const historySnap = await docRef.collection('history').orderBy('updatedAt', 'desc').limit(HISTORY_LIMIT).get();
    return historySnap.docs.map((doc) => mapHistoryEntry(doc));
}

async function loadAuditEntries(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
    limit = AUDIT_LIMIT
): Promise<AlertTuningAuditEvent[]> {
    const auditSnap = await docRef.collection('audit')
        .orderBy('createdAt', 'desc')
        .limit(Math.max(1, Math.min(limit, AUDIT_LIMIT)))
        .get();
    return auditSnap.docs.map((doc) => mapAuditEvent(doc));
}

async function recordAlertTuningAuditEvent(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
    input: AlertTuningAuditEventInput
): Promise<void> {
    const payload = {
        type: input.type,
        level: input.level,
        title: input.title,
        message: input.message,
        source: input.source || null,
        requestId: input.requestId || null,
        actorUid: input.actorUid || null,
        note: input.note || null,
        historyId: input.historyId || null,
        createdAt: new Date(),
    };

    if (input.dedupeKey) {
        await docRef.collection('audit').doc(input.dedupeKey).set(payload, { merge: true });
        return;
    }

    await docRef.collection('audit').add(payload);
}

export function buildAlertTuningAuditInboxSummary(events: AlertTuningAuditEvent[]): AlertTuningAuditInboxSummary {
    const unreadEvents = events.filter((event) => !event.read);
    return {
        total: events.length,
        unreadCount: unreadEvents.length,
        criticalUnreadCount: unreadEvents.filter((event) => event.level === 'critical').length,
        warningUnreadCount: unreadEvents.filter((event) => event.level === 'warning').length,
    };
}

function buildAlertTuningWebhookSummaryLine(digest: AlertTuningReminderDigest): string {
    return `open ${digest.openCount} · overdue ${digest.overdueCount} · expiring ${digest.expiringSoonCount} · expired ${digest.expiredCount}`;
}

function formatAlertTuningReminderDigestItems(items: AlertTuningReminderDigestItem[]): string[] {
    return items.slice(0, 5).map((item) => {
        const expiresAt = item.expiresAt ? item.expiresAt.slice(5, 16).replace('T', ' ') : '-';
        return `${item.source} ${item.proposedRolloutPercentage}% · ${Math.round(item.ageHours)}h · exp ${expiresAt}`;
    });
}

export function buildAlertTuningReminderWebhookPayload(
    digest: AlertTuningReminderDigest,
    format: AlertTuningWebhookFormat
): Record<string, unknown> {
    const summaryLine = buildAlertTuningWebhookSummaryLine(digest);
    const overdueLines = formatAlertTuningReminderDigestItems(digest.overdueRequests);
    const expiringLines = formatAlertTuningReminderDigestItems(digest.expiringSoonRequests);

    if (format === 'slack') {
        const blocks: Array<Record<string, unknown>> = [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: 'LooPyck Alert Tuning Digest',
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*${summaryLine}*\nGenerated ${digest.generatedAt}`,
                },
            },
        ];

        if (overdueLines.length > 0) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Overdue Requests*\n${overdueLines.map((line) => `• ${line}`).join('\n')}`,
                },
            });
        }

        if (expiringLines.length > 0) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Expiring Soon*\n${expiringLines.map((line) => `• ${line}`).join('\n')}`,
                },
            });
        }

        return {
            text: `LooPyck alert tuning digest: ${summaryLine}`,
            blocks,
        };
    }

    if (format === 'discord') {
        return {
            content: `LooPyck alert tuning digest: ${summaryLine}`,
            embeds: [{
                title: 'LooPyck Alert Tuning Digest',
                description: summaryLine,
                color: digest.overdueCount > 0 ? 0xf97316 : digest.expiringSoonCount > 0 ? 0xfacc15 : 0x38bdf8,
                timestamp: digest.generatedAt,
                fields: [
                    {
                        name: 'Overdue Requests',
                        value: overdueLines.length > 0 ? overdueLines.join('\n') : 'none',
                        inline: false,
                    },
                    {
                        name: 'Expiring Soon',
                        value: expiringLines.length > 0 ? expiringLines.join('\n') : 'none',
                        inline: false,
                    },
                ],
            }],
        };
    }

    return {
        source: 'loopyck.alert_tuning',
        generatedAt: digest.generatedAt,
        summary: {
            openCount: digest.openCount,
            overdueCount: digest.overdueCount,
            expiringSoonCount: digest.expiringSoonCount,
            expiredCount: digest.expiredCount,
        },
        overdueRequests: digest.overdueRequests,
        expiringSoonRequests: digest.expiringSoonRequests,
    };
}

function mapApprovalRequest(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): AlertTuningApprovalRequest {
    const data = doc.data() as Record<string, unknown> | undefined;
    const approvals = Array.isArray(data?.approvals)
        ? data.approvals.flatMap((entry) => {
            if (!entry || typeof entry !== 'object') {
                return [];
            }

            const approval = entry as Record<string, unknown>;
            const uid = typeof approval.uid === 'string' ? approval.uid : null;
            if (!uid) {
                return [];
            }

            return [{
                uid,
                note: normalizeAlertTuningApprovalNote(approval.note),
                approvedAt: toIso(approval.approvedAt as Timestamp | Date | number | null | undefined),
            }];
        })
        : [];
    const requiredApprovals = Math.max(
        1,
        clampPercentage(
            typeof data?.requiredApprovals === 'number' ? data.requiredApprovals : getAlertTuningRequiredApprovals(getConfiguredAdminUids()),
            1
        )
    );
    return {
        id: doc.id,
        source: typeof data?.source === 'string' ? data.source : 'UNKNOWN',
        currentRolloutPercentage: clampPercentage(data?.currentRolloutPercentage, 0),
        proposedRolloutPercentage: clampPercentage(data?.proposedRolloutPercentage, 0),
        title: typeof data?.title === 'string' ? data.title : 'Rollout Approval Request',
        description: typeof data?.description === 'string' ? data.description : '승인 요청 설명이 없습니다.',
        status: data?.status === 'approved' || data?.status === 'rejected' || data?.status === 'pending_second_approval' || data?.status === 'expired' ? data.status : 'pending',
        requiredApprovals,
        approvalCount: approvals.length,
        approvals,
        createdAt: toIso(data?.createdAt as Timestamp | Date | number | null | undefined),
        createdBy: typeof data?.createdBy === 'string' ? data.createdBy : null,
        requestNote: normalizeAlertTuningApprovalNote(data?.requestNote),
        resolvedAt: toIso(data?.resolvedAt as Timestamp | Date | number | null | undefined),
        resolvedBy: typeof data?.resolvedBy === 'string' ? data.resolvedBy : null,
        resolutionNote: normalizeAlertTuningApprovalNote(data?.resolutionNote),
    };
}

async function expireStaleAlertTuningApprovalRequests(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
): Promise<void> {
    const now = new Date();
    const nowMs = now.getTime();
    const openSnapshots = await Promise.all(
        (['pending', 'pending_second_approval'] as const).map((status) =>
            docRef.collection('requests')
                .where('status', '==', status)
                .orderBy('createdAt', 'asc')
                .limit(OPEN_REQUEST_SCAN_LIMIT)
                .get()
        )
    );

    const staleDocs = openSnapshots
        .flatMap((snapshot) => snapshot.docs)
        .filter((doc) => isAlertTuningApprovalRequestExpired(mapApprovalRequest(doc), nowMs));

    if (staleDocs.length === 0) {
        return;
    }

    const batch = docRef.firestore.batch();
    staleDocs.forEach((doc) => {
        batch.set(doc.ref, {
            status: 'expired',
            resolvedAt: now,
            resolvedBy: 'system:auto-expire',
            resolutionNote: `stale request auto-expired after ${APPROVAL_REQUEST_EXPIRY_HOURS}h without completion`,
        }, { merge: true });
    });
    await batch.commit();

    await Promise.all(staleDocs.map((doc) => {
        const request = mapApprovalRequest(doc);
        return recordAlertTuningAuditEvent(docRef, {
            type: 'request_expired',
            level: 'warning',
            title: `${request.source} approval request expired`,
            message: `${request.title} request가 ${APPROVAL_REQUEST_EXPIRY_HOURS}h를 초과해 자동 만료됐습니다.`,
            source: request.source,
            requestId: request.id,
            actorUid: 'system:auto-expire',
            note: request.requestNote,
        });
    }));
}

export async function loadAlertTuningApprovalRequests(limit = REQUEST_LIMIT): Promise<AlertTuningApprovalRequest[]> {
    const db = getAdminDb();
    if (!db) {
        return [];
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    await expireStaleAlertTuningApprovalRequests(docRef);
    const snapshot = await docRef.collection('requests')
        .orderBy('createdAt', 'desc')
        .limit(Math.max(1, Math.min(limit, REQUEST_LIMIT)))
        .get();

    return snapshot.docs.map((doc) => mapApprovalRequest(doc));
}

export async function loadAlertTuningAuditEvents(limit = AUDIT_LIMIT, adminUid?: string): Promise<AlertTuningAuditEvent[]> {
    const db = getAdminDb();
    if (!db) {
        return [];
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const events = await loadAuditEntries(docRef, limit);
    if (!adminUid || events.length === 0) {
        return events;
    }

    const ackRefs = events.map((event) => docRef.collection('auditReadStates').doc(auditAckDocId(adminUid, event.id)));
    const ackSnapshots = await db.getAll(...ackRefs);
    const ackMap = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    ackSnapshots.forEach((snapshot) => ackMap.set(snapshot.id, snapshot));

    return events.map((event) => {
        const ack = ackMap.get(auditAckDocId(adminUid, event.id));
        const ackData = ack?.data() as Record<string, unknown> | undefined;
        return {
            ...event,
            read: Boolean(ack?.exists),
            readAt: toIso(ackData?.readAt as Timestamp | Date | number | null | undefined),
        };
    });
}

export async function markAlertTuningAuditEventsRead(
    eventIds: string[],
    adminUid: string
): Promise<AlertTuningAuditEvent[]> {
    const db = getAdminDb();
    if (!db) {
        throw new Error('Firebase Admin Firestore가 설정되지 않았습니다.');
    }

    const normalizedIds = Array.from(new Set(eventIds.map((id) => id.trim()).filter(Boolean)));
    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    if (normalizedIds.length > 0) {
        const batch = db.batch();
        normalizedIds.forEach((eventId) => {
            batch.set(
                docRef.collection('auditReadStates').doc(auditAckDocId(adminUid, eventId)),
                {
                    adminUid,
                    eventId,
                    readAt: new Date(),
                },
                { merge: true }
            );
        });
        await batch.commit();
    }

    return loadAlertTuningAuditEvents(AUDIT_LIMIT, adminUid);
}

export async function markAllAlertTuningAuditEventsRead(adminUid: string): Promise<AlertTuningAuditEvent[]> {
    const events = await loadAlertTuningAuditEvents(AUDIT_LIMIT, adminUid);
    const unreadIds = events.filter((event) => !event.read).map((event) => event.id);
    return markAlertTuningAuditEventsRead(unreadIds, adminUid);
}

function normalizeApprovalRequestInput(input: unknown): AlertTuningApprovalRequestInput {
    const data = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
    const source = typeof data.source === 'string' ? data.source.trim().toUpperCase() : '';
    if (!source) {
        throw new Error('승인 요청 source가 필요합니다.');
    }

    const title = typeof data.title === 'string' && data.title.trim()
        ? data.title.trim()
        : 'Alert rollout recommendation';
    const description = typeof data.description === 'string' && data.description.trim()
        ? data.description.trim()
        : '운영 추천값 적용 요청';

    return {
        source,
        currentRolloutPercentage: clampPercentage(data.currentRolloutPercentage, 0),
        proposedRolloutPercentage: clampPercentage(data.proposedRolloutPercentage, 0),
        title,
        description,
        requestNote: normalizeAlertTuningApprovalNote(data.requestNote),
    };
}

export async function loadAlertTuningConfigRecord(): Promise<AlertTuningConfigRecord> {
    const db = getAdminDb();
    if (!db) {
        return {
            config: resolveAlertTuningConfig(),
            updatedAt: null,
            updatedBy: null,
            storage: 'default',
            history: [],
        };
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const [snapshot, history] = await Promise.all([
        docRef.get(),
        loadHistoryEntries(docRef),
    ]);
    if (!snapshot.exists) {
        return {
            config: resolveAlertTuningConfig(),
            updatedAt: null,
            updatedBy: null,
            storage: 'default',
            history,
        };
    }

    const data = snapshot.data() as Record<string, unknown>;
    return {
        config: resolveAlertTuningConfig(data.config ?? data),
        updatedAt: toIso(data.updatedAt as Timestamp | Date | number | null | undefined),
        updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
        storage: 'firestore',
        history,
    };
}

function summarizeModeChange(mode: string, previous: { defaultSnoozeHours: number; targetDiscountRate: number }, next: { defaultSnoozeHours: number; targetDiscountRate: number }): string[] {
    const changes: string[] = [];
    if (previous.defaultSnoozeHours !== next.defaultSnoozeHours) {
        changes.push(`${mode} snooze ${previous.defaultSnoozeHours}h -> ${next.defaultSnoozeHours}h`);
    }
    if (previous.targetDiscountRate !== next.targetDiscountRate) {
        changes.push(`${mode} discount ${previous.targetDiscountRate}% -> ${next.targetDiscountRate}%`);
    }
    return changes;
}

function summarizeRolloutChange(source: string, previous: number, next: number): string[] {
    if (previous === next) {
        return [];
    }

    return [`${source} rollout ${previous}% -> ${next}%`];
}

export function summarizeAlertTuningChange(previousInput: unknown, nextInput: unknown): string {
    const previous = resolveAlertTuningConfig(previousInput);
    const next = resolveAlertTuningConfig(nextInput);
    const changes: string[] = [];

    (['instant', 'balanced', 'batch'] as const).forEach((mode) => {
        changes.push(...summarizeModeChange(mode, previous.modes[mode], next.modes[mode]));
    });

    const previousSources = new Set(Object.keys(previous.sourceOverrides || {}));
    const nextSources = new Set(Object.keys(next.sourceOverrides || {}));
    nextSources.forEach((source) => {
        if (!previousSources.has(source)) {
            changes.push(`source override 추가: ${source}`);
        }
    });
    previousSources.forEach((source) => {
        if (!nextSources.has(source)) {
            changes.push(`source override 제거: ${source}`);
        }
    });

    Array.from(nextSources)
        .filter((source) => previousSources.has(source))
        .forEach((source) => {
            const previousRollout = Math.min(100, Math.max(0, previous.sourceRollouts?.[source] ?? 100));
            const nextRollout = Math.min(100, Math.max(0, next.sourceRollouts?.[source] ?? 100));
            changes.push(...summarizeRolloutChange(source, previousRollout, nextRollout));

            (['instant', 'balanced', 'batch'] as const).forEach((mode) => {
                const previousMode = previous.sourceOverrides?.[source]?.[mode];
                const nextMode = next.sourceOverrides?.[source]?.[mode];
                if (!previousMode && !nextMode) {
                    return;
                }

                const previousSettings = {
                    defaultSnoozeHours: previousMode?.defaultSnoozeHours ?? previous.modes[mode].defaultSnoozeHours,
                    targetDiscountRate: previousMode?.targetDiscountRate ?? previous.modes[mode].targetDiscountRate,
                };
                const nextSettings = {
                    defaultSnoozeHours: nextMode?.defaultSnoozeHours ?? next.modes[mode].defaultSnoozeHours,
                    targetDiscountRate: nextMode?.targetDiscountRate ?? next.modes[mode].targetDiscountRate,
                };
                summarizeModeChange(`${source}/${mode}`, previousSettings, nextSettings).forEach((entry) => changes.push(entry));
            });
        });

    return changes.length > 0 ? changes.slice(0, 4).join(' · ') : '설정 변경 없음';
}

async function persistAlertTuningConfigRecord(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
    configInput: unknown,
    updatedBy?: string,
    historySummary?: string
): Promise<AlertTuningConfigRecord> {
    const config = resolveAlertTuningConfig(configInput);
    const previousSnapshot = await docRef.get();
    const previousConfig = previousSnapshot.exists ? previousSnapshot.data()?.config : undefined;
    const updatedAt = new Date();

    await docRef.set({
        config,
        updatedAt,
        updatedBy: updatedBy || null,
    }, { merge: true });

    await docRef.collection('history').add({
        updatedAt,
        updatedBy: updatedBy || null,
        summary: historySummary || summarizeAlertTuningChange(previousConfig, config),
        configSnapshot: config,
    });

    const history = await loadHistoryEntries(docRef);

    return {
        config,
        updatedAt: updatedAt.toISOString(),
        updatedBy: updatedBy || null,
        storage: 'firestore',
        history,
    };
}

export async function saveAlertTuningConfigRecord(
    configInput: unknown,
    updatedBy?: string
): Promise<AlertTuningConfigRecord> {
    const db = getAdminDb();
    if (!db) {
        throw new Error('Firebase Admin Firestore가 설정되지 않았습니다.');
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const record = await persistAlertTuningConfigRecord(docRef, configInput, updatedBy);
    await recordAlertTuningAuditEvent(docRef, {
        type: 'config_saved',
        level: 'info',
        title: 'Alert tuning settings updated',
        message: 'persona tuning / source override 설정이 저장됐습니다.',
        actorUid: updatedBy || null,
    });
    return record;
}

export async function rollbackAlertTuningConfigRecord(
    historyId: string,
    updatedBy?: string
): Promise<AlertTuningConfigRecord> {
    const db = getAdminDb();
    if (!db) {
        throw new Error('Firebase Admin Firestore가 설정되지 않았습니다.');
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const historyRef = docRef.collection('history').doc(historyId);
    const historySnapshot = await historyRef.get();

    if (!historySnapshot.exists) {
        throw new Error('복원할 설정 이력을 찾지 못했습니다.');
    }

    const historyData = historySnapshot.data() as Record<string, unknown>;
    const configSnapshot = resolveAlertTuningHistorySnapshot(historyData);
    if (!configSnapshot) {
        throw new Error('이 이력은 복원 가능한 설정 스냅샷이 없습니다.');
    }

    const targetSummary = typeof historyData.summary === 'string' ? historyData.summary : '저장된 설정';
    const record = await persistAlertTuningConfigRecord(
        docRef,
        configSnapshot,
        updatedBy,
        `rollback -> ${targetSummary}`
    );
    await recordAlertTuningAuditEvent(docRef, {
        type: 'config_rolled_back',
        level: 'warning',
        title: 'Alert tuning rollback applied',
        message: `설정을 이전 버전으로 복원했습니다. (${targetSummary})`,
        actorUid: updatedBy || null,
        historyId,
    });
    return record;
}

export async function createAlertTuningApprovalRequest(
    input: unknown,
    createdBy?: string
): Promise<AlertTuningApprovalRequest[]> {
    const db = getAdminDb();
    if (!db) {
        throw new Error('Firebase Admin Firestore가 설정되지 않았습니다.');
    }

    const payload = normalizeApprovalRequestInput(input);
    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const createdAt = new Date();
    const requiredApprovals = getAlertTuningRequiredApprovals(getConfiguredAdminUids());
    await docRef.collection('requests').add({
        ...payload,
        summary: `${summarizeAlertTuningApprovalRequest(payload)}${summarizeApprovalNote(payload.requestNote)}`,
        status: 'pending',
        requiredApprovals,
        approvals: [],
        createdAt,
        createdBy: createdBy || null,
        requestNote: payload.requestNote,
        resolvedAt: null,
        resolvedBy: null,
        resolutionNote: null,
    });

    const latestRequests = await loadAlertTuningApprovalRequests();
    const createdRequest = latestRequests[0];
    if (createdRequest) {
        await recordAlertTuningAuditEvent(docRef, {
            type: 'request_created',
            level: 'info',
            title: `${createdRequest.source} rollout request created`,
            message: `${createdRequest.currentRolloutPercentage}% -> ${createdRequest.proposedRolloutPercentage}% approval request가 queue에 추가됐습니다.`,
            source: createdRequest.source,
            requestId: createdRequest.id,
            actorUid: createdBy || null,
            note: createdRequest.requestNote,
        });
    }

    return latestRequests;
}

export async function resolveAlertTuningApprovalRequest(
    requestId: string,
    action: 'approve' | 'reject',
    resolvedBy?: string,
    resolutionNoteInput?: unknown
): Promise<{
    requests: AlertTuningApprovalRequest[];
    alertTuning?: AlertTuningConfigRecord;
}> {
    const db = getAdminDb();
    if (!db) {
        throw new Error('Firebase Admin Firestore가 설정되지 않았습니다.');
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const requestRef = docRef.collection('requests').doc(requestId);
    const snapshot = await requestRef.get();
    if (!snapshot.exists) {
        throw new Error('승인 요청을 찾지 못했습니다.');
    }

    const current = mapApprovalRequest(snapshot);
    if (current.status !== 'pending' && current.status !== 'pending_second_approval') {
        throw new Error('이미 처리된 승인 요청입니다.');
    }
    if (isAlertTuningApprovalRequestExpired(current)) {
        await requestRef.set({
            status: 'expired',
            resolvedAt: new Date(),
            resolvedBy: 'system:auto-expire',
            resolutionNote: `stale request auto-expired after ${APPROVAL_REQUEST_EXPIRY_HOURS}h without completion`,
        }, { merge: true });
        await recordAlertTuningAuditEvent(docRef, {
            type: 'request_expired',
            level: 'warning',
            title: `${current.source} approval request expired`,
            message: `${current.title} request가 만료되어 더 이상 처리할 수 없습니다.`,
            source: current.source,
            requestId,
            actorUid: 'system:auto-expire',
            note: current.requestNote,
        });
        throw new Error('승인 요청이 만료되었습니다. 새 request를 생성하세요.');
    }

    const resolutionNote = normalizeAlertTuningApprovalNote(resolutionNoteInput);
    const decisionNoteError = getAlertTuningDecisionNoteError(action, resolutionNote);
    if (decisionNoteError) {
        throw new Error(decisionNoteError);
    }

    if (action === 'approve') {
        const selfApprovalGuardError = getAlertTuningSelfApprovalGuardError(
            action,
            current.createdBy,
            resolvedBy,
            getConfiguredAdminUids()
        );
        if (selfApprovalGuardError) {
            throw new Error(selfApprovalGuardError);
        }

        const duplicateApprovalError = getAlertTuningDuplicateApprovalGuardError(resolvedBy, current.approvals);
        if (duplicateApprovalError) {
            throw new Error(duplicateApprovalError);
        }
    }

    const resolvedAt = new Date();

    let alertTuning: AlertTuningConfigRecord | undefined;
    if (action === 'approve') {
        const nextApprovals = [
            ...current.approvals,
            {
                uid: resolvedBy || 'system',
                note: resolutionNote,
                approvedAt: resolvedAt.toISOString(),
            },
        ];
        const approvalComplete = nextApprovals.length >= current.requiredApprovals;

        await requestRef.set({
            status: approvalComplete ? 'approved' : 'pending_second_approval',
            approvals: nextApprovals.map((approval) => ({
                uid: approval.uid,
                note: approval.note,
                approvedAt: approval.approvedAt ? new Date(approval.approvedAt) : null,
            })),
            resolvedAt: approvalComplete ? resolvedAt : null,
            resolvedBy: approvalComplete ? (resolvedBy || null) : null,
            resolutionNote: null,
        }, { merge: true });

        await recordAlertTuningAuditEvent(docRef, {
            type: approvalComplete ? 'request_approved' : 'approval_recorded',
            level: approvalComplete ? 'success' : 'info',
            title: approvalComplete
                ? `${current.source} rollout approved`
                : `${current.source} first approval recorded`,
            message: approvalComplete
                ? `${current.proposedRolloutPercentage}% rollout approval이 완료되어 설정에 반영됩니다.`
                : `${current.title} request에 1차 approval이 기록됐습니다.`,
            source: current.source,
            requestId,
            actorUid: resolvedBy || null,
            note: resolutionNote,
        });

        if (!approvalComplete) {
            await recordAlertTuningAuditEvent(docRef, {
                type: 'second_approval_required',
                level: 'warning',
                title: `${current.source} requires second approval`,
                message: `${current.requiredApprovals}인 승인 정책으로 인해 추가 approver가 필요합니다.`,
                source: current.source,
                requestId,
                actorUid: resolvedBy || null,
                note: resolutionNote,
            });
        }

        if (!approvalComplete) {
            return {
                requests: await loadAlertTuningApprovalRequests(),
            };
        }

        const currentConfig = await loadAlertTuningConfigRecord();
        const nextConfig = resolveAlertTuningConfig(currentConfig.config);
        nextConfig.sourceRollouts = {
            ...(nextConfig.sourceRollouts || {}),
            [current.source]: current.proposedRolloutPercentage,
        };
        alertTuning = await persistAlertTuningConfigRecord(
            docRef,
            nextConfig,
            resolvedBy,
            `approval -> ${summarizeAlertTuningApprovalRequest({
                source: current.source,
                currentRolloutPercentage: current.currentRolloutPercentage,
                proposedRolloutPercentage: current.proposedRolloutPercentage,
                title: current.title,
                description: current.description,
                requestNote: current.requestNote,
            })}${summarizeApprovalNote(resolutionNote)}`
        );
    } else {
        await requestRef.set({
            status: 'rejected',
            resolvedAt,
            resolvedBy: resolvedBy || null,
            resolutionNote,
        }, { merge: true });
        await recordAlertTuningAuditEvent(docRef, {
            type: 'request_rejected',
            level: 'warning',
            title: `${current.source} rollout request rejected`,
            message: `${current.title} request가 reject 처리됐습니다.`,
            source: current.source,
            requestId,
            actorUid: resolvedBy || null,
            note: resolutionNote,
        });
    }

    return {
        requests: await loadAlertTuningApprovalRequests(),
        alertTuning,
    };
}

export async function runAlertTuningReminderDigest(): Promise<{
    enabled: boolean;
    digest: AlertTuningReminderDigest;
    auditEvents: AlertTuningAuditEvent[];
    dispatch: AlertTuningReminderDispatchResult;
}> {
    const db = getAdminDb();
    if (!db) {
        return {
            enabled: false,
            digest: buildAlertTuningReminderDigest([]),
            auditEvents: [],
            dispatch: {
                configured: false,
                attempted: false,
                delivered: false,
                status: null,
                target: null,
                format: null,
                error: null,
            },
        };
    }

    const docRef = db.collection(COLLECTION).doc(DOC_ID);
    const requests = await loadAlertTuningApprovalRequests(OPEN_REQUEST_SCAN_LIMIT);
    const digest = buildAlertTuningReminderDigest(requests);
    if (digest.openCount > 0) {
        const dayKey = digest.generatedAt.slice(0, 10);
        await recordAlertTuningAuditEvent(docRef, {
            type: 'sla_digest',
            level: digest.overdueCount > 0 ? 'critical' : digest.expiringSoonCount > 0 ? 'warning' : 'info',
            title: 'Alert tuning approval digest generated',
            message: `open ${digest.openCount} · overdue ${digest.overdueCount} · expiring ${digest.expiringSoonCount}`,
            dedupeKey: `sla-digest-${dayKey}`,
        });
    }

    const webhookConfig = getAlertTuningWebhookConfig();
    const webhookUrl = trimTrailingSlash(process.env.ALERT_TUNING_WEBHOOK_URL || '');
    const webhookFormat = webhookConfig.format || 'generic';
    const dispatch: AlertTuningReminderDispatchResult = {
        configured: webhookConfig.configured,
        attempted: false,
        delivered: false,
        status: null,
        target: webhookConfig.targetLabel,
        format: webhookConfig.format,
        error: null,
    };
    if (webhookUrl && (digest.overdueCount > 0 || digest.expiringSoonCount > 0)) {
        dispatch.attempted = true;
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(process.env.ALERT_TUNING_WEBHOOK_BEARER
                        ? { Authorization: `Bearer ${process.env.ALERT_TUNING_WEBHOOK_BEARER}` }
                        : {}),
                },
                body: JSON.stringify(buildAlertTuningReminderWebhookPayload(digest, webhookFormat)),
            });
            dispatch.status = response.status;
            dispatch.delivered = response.ok;

            await recordAlertTuningAuditEvent(docRef, {
                type: response.ok ? 'webhook_dispatched' : 'webhook_failed',
                level: response.ok ? 'success' : 'warning',
                title: response.ok ? 'Alert tuning webhook dispatched' : 'Alert tuning webhook delivery failed',
                message: response.ok
                    ? `approval digest를 ${webhookFormat} webhook으로 전송했습니다. (${response.status})`
                    : `approval digest ${webhookFormat} webhook 응답이 실패했습니다. (${response.status})`,
                actorUid: 'system:webhook',
                dedupeKey: `webhook-digest-${digest.generatedAt.slice(0, 13)}`,
            });
        } catch (error) {
            dispatch.error = error instanceof Error ? error.message : 'webhook dispatch failed';
            await recordAlertTuningAuditEvent(docRef, {
                type: 'webhook_failed',
                level: 'critical',
                title: 'Alert tuning webhook delivery failed',
                message: `${webhookFormat} webhook dispatch failed: ${dispatch.error}`,
                actorUid: 'system:webhook',
                dedupeKey: `webhook-digest-${digest.generatedAt.slice(0, 13)}`,
            });
        }
    }

    return {
        enabled: true,
        digest,
        auditEvents: await loadAuditEntries(docRef, 8),
        dispatch,
    };
}
