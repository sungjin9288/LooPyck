import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildAlertTuningAuditInboxSummary,
    buildAlertTuningReminderDigest,
    buildAlertTuningReminderWebhookPayload,
    buildAlertTuningApprovalQueueSummary,
    getAlertTuningDecisionNoteError,
    getAlertTuningDuplicateApprovalGuardError,
    getAlertTuningApprovalRequestAgeHours,
    getAlertTuningApprovalRequestExpiresAt,
    getAlertTuningRequiredApprovals,
    getAlertTuningSelfApprovalGuardError,
    isAlertTuningApprovalRequestExpired,
    normalizeAlertTuningApprovalNote,
    resolveAlertTuningWebhookFormat,
    resolveAlertTuningHistorySnapshot,
    summarizeAlertTuningApprovalRequest,
    summarizeAlertTuningChange,
} from '../lib/server/alertTuningStore.ts';

test('summarizeAlertTuningChange includes source override modifications', () => {
    const summary = summarizeAlertTuningChange(
        {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
            sourceOverrides: {
                MUSINSA: {
                    balanced: {
                        defaultSnoozeHours: 48,
                        targetDiscountRate: 4,
                    },
                },
            },
            sourceRollouts: {
                MUSINSA: 100,
            },
        },
        {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
            sourceOverrides: {
                MUSINSA: {
                    balanced: {
                        defaultSnoozeHours: 60,
                        targetDiscountRate: 6,
                    },
                },
            },
            sourceRollouts: {
                MUSINSA: 35,
            },
        }
    );

    assert.match(summary, /MUSINSA\/balanced/);
    assert.match(summary, /rollout/);
});

test('resolveAlertTuningHistorySnapshot supports configSnapshot and legacy config payloads', () => {
    const configSnapshot = resolveAlertTuningHistorySnapshot({
        configSnapshot: {
            modes: {
                instant: { defaultSnoozeHours: 12, targetDiscountRate: 2, recommendedByPriority: { critical: 6, high: 12, medium: 24 } },
                balanced: { defaultSnoozeHours: 36, targetDiscountRate: 4, recommendedByPriority: { critical: 12, high: 36, medium: 72 } },
                batch: { defaultSnoozeHours: 96, targetDiscountRate: 7, recommendedByPriority: { critical: 48, high: 96, medium: 168 } },
            },
        },
    });
    assert.equal(configSnapshot?.modes.instant.defaultSnoozeHours, 12);
    assert.equal(configSnapshot?.modes.batch.targetDiscountRate, 7);

    const legacyConfig = resolveAlertTuningHistorySnapshot({
        config: {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
        },
    });
    assert.equal(legacyConfig?.modes.balanced.defaultSnoozeHours, 72);

    const missing = resolveAlertTuningHistorySnapshot({
        summary: 'no snapshot',
    });
    assert.equal(missing, null);
});

test('summarizeAlertTuningApprovalRequest captures rollout transition clearly', () => {
    const summary = summarizeAlertTuningApprovalRequest({
        source: 'MUSINSA',
        currentRolloutPercentage: 50,
        proposedRolloutPercentage: 75,
        title: 'rollout 확대 후보',
        description: '실험군 개선',
        requestNote: 'unread rate 개선',
    });

    assert.equal(summary, 'MUSINSA rollout 50% -> 75%');
});

test('normalizeAlertTuningApprovalNote trims whitespace and caps note length', () => {
    assert.equal(normalizeAlertTuningApprovalNote('   rollout   확대 필요   '), 'rollout 확대 필요');
    assert.equal(normalizeAlertTuningApprovalNote('   '), null);
    assert.equal(normalizeAlertTuningApprovalNote('a'.repeat(400))?.length, 280);
});

test('getAlertTuningSelfApprovalGuardError blocks self approval only in multi-admin approve flow', () => {
    const blocked = getAlertTuningSelfApprovalGuardError(
        'approve',
        'admin-a',
        'admin-a',
        ['admin-a', 'admin-b']
    );
    assert.match(blocked || '', /직접 approve할 수 없습니다/);

    assert.equal(
        getAlertTuningSelfApprovalGuardError('approve', 'admin-a', 'admin-a', ['admin-a']),
        null
    );
    assert.equal(
        getAlertTuningSelfApprovalGuardError('reject', 'admin-a', 'admin-a', ['admin-a', 'admin-b']),
        null
    );
    assert.equal(
        getAlertTuningSelfApprovalGuardError('approve', 'admin-a', 'admin-b', ['admin-a', 'admin-b']),
        null
    );
});

test('getAlertTuningRequiredApprovals enables second approver only when three or more admins are configured', () => {
    assert.equal(getAlertTuningRequiredApprovals([]), 1);
    assert.equal(getAlertTuningRequiredApprovals(['admin-a']), 1);
    assert.equal(getAlertTuningRequiredApprovals(['admin-a', 'admin-b']), 1);
    assert.equal(getAlertTuningRequiredApprovals(['admin-a', 'admin-b', 'admin-c']), 2);
});

test('getAlertTuningDuplicateApprovalGuardError blocks duplicate approver votes', () => {
    assert.match(
        getAlertTuningDuplicateApprovalGuardError('admin-a', [{ uid: 'admin-a' }]) || '',
        /두 번 approve/
    );
    assert.equal(
        getAlertTuningDuplicateApprovalGuardError('admin-b', [{ uid: 'admin-a' }]),
        null
    );
});

test('getAlertTuningDecisionNoteError requires note on reject only', () => {
    assert.match(
        getAlertTuningDecisionNoteError('reject', null) || '',
        /decision note가 필요/
    );
    assert.equal(getAlertTuningDecisionNoteError('approve', null), null);
    assert.equal(getAlertTuningDecisionNoteError('reject', 'manual rollback risk'), null);
});

test('approval request age and expires helpers calculate SLA windows correctly', () => {
    const createdAt = '2026-03-05T00:00:00.000Z';
    const now = Date.parse('2026-03-06T12:00:00.000Z');

    assert.equal(getAlertTuningApprovalRequestAgeHours(createdAt, now), 36);
    assert.equal(getAlertTuningApprovalRequestExpiresAt(createdAt), '2026-03-07T00:00:00.000Z');
    assert.equal(
        isAlertTuningApprovalRequestExpired({ status: 'pending', createdAt }, Date.parse('2026-03-07T00:00:00.000Z')),
        true
    );
    assert.equal(
        isAlertTuningApprovalRequestExpired({ status: 'approved', createdAt }, Date.parse('2026-03-08T00:00:00.000Z')),
        false
    );
});

test('buildAlertTuningApprovalQueueSummary aggregates SLA and aging metrics', () => {
    const summary = buildAlertTuningApprovalQueueSummary([
        {
            id: 'pending-1',
            source: 'MUSINSA',
            currentRolloutPercentage: 30,
            proposedRolloutPercentage: 60,
            title: 'pending',
            description: 'open request',
            status: 'pending',
            requiredApprovals: 1,
            approvalCount: 0,
            approvals: [],
            createdAt: '2026-03-06T12:00:00.000Z',
            createdBy: 'admin-a',
            requestNote: null,
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
        {
            id: 'pending-2',
            source: '29CM',
            currentRolloutPercentage: 20,
            proposedRolloutPercentage: 40,
            title: 'second',
            description: 'waiting second approval',
            status: 'pending_second_approval',
            requiredApprovals: 2,
            approvalCount: 1,
            approvals: [{ uid: 'admin-b', note: 'looks good', approvedAt: '2026-03-05T10:00:00.000Z' }],
            createdAt: '2026-03-05T00:00:00.000Z',
            createdBy: 'admin-c',
            requestNote: 'needs expansion',
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
        {
            id: 'approved-1',
            source: 'SSF',
            currentRolloutPercentage: 10,
            proposedRolloutPercentage: 25,
            title: 'approved',
            description: 'done',
            status: 'approved',
            requiredApprovals: 1,
            approvalCount: 1,
            approvals: [{ uid: 'admin-d', note: 'ship it', approvedAt: '2026-03-05T02:00:00.000Z' }],
            createdAt: '2026-03-05T00:00:00.000Z',
            createdBy: 'admin-e',
            requestNote: null,
            resolvedAt: '2026-03-05T12:00:00.000Z',
            resolvedBy: 'admin-d',
            resolutionNote: null,
        },
        {
            id: 'expired-1',
            source: 'ABLY',
            currentRolloutPercentage: 50,
            proposedRolloutPercentage: 70,
            title: 'expired',
            description: 'timed out',
            status: 'expired',
            requiredApprovals: 1,
            approvalCount: 0,
            approvals: [],
            createdAt: '2026-03-03T00:00:00.000Z',
            createdBy: 'admin-z',
            requestNote: null,
            resolvedAt: '2026-03-05T00:30:00.000Z',
            resolvedBy: 'system:auto-expire',
            resolutionNote: 'stale request auto-expired',
        },
    ], Date.parse('2026-03-06T12:00:00.000Z'));

    assert.equal(summary.openCount, 2);
    assert.equal(summary.pendingCount, 1);
    assert.equal(summary.secondApprovalCount, 1);
    assert.equal(summary.approvedCount, 1);
    assert.equal(summary.expiredCount, 1);
    assert.equal(summary.overdueCount, 1);
    assert.equal(summary.expiringSoonCount, 1);
    assert.equal(summary.avgOpenAgeHours, 18);
    assert.equal(summary.maxOpenAgeHours, 36);
    assert.equal(summary.avgResolutionHours, 30.3);
    assert.equal(summary.withinSlaRate, 50);
    assert.equal(summary.oldestOpenAt, '2026-03-05T00:00:00.000Z');
});

test('buildAlertTuningReminderDigest returns overdue and expiring request slices', () => {
    const digest = buildAlertTuningReminderDigest([
        {
            id: 'pending-1',
            source: 'MUSINSA',
            currentRolloutPercentage: 30,
            proposedRolloutPercentage: 60,
            title: 'open request',
            description: 'open request',
            status: 'pending',
            requiredApprovals: 1,
            approvalCount: 0,
            approvals: [],
            createdAt: '2026-03-06T12:00:00.000Z',
            createdBy: 'admin-a',
            requestNote: null,
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
        {
            id: 'pending-2',
            source: '29CM',
            currentRolloutPercentage: 40,
            proposedRolloutPercentage: 70,
            title: 'older request',
            description: 'older request',
            status: 'pending_second_approval',
            requiredApprovals: 2,
            approvalCount: 1,
            approvals: [{ uid: 'admin-b', note: null, approvedAt: '2026-03-05T10:00:00.000Z' }],
            createdAt: '2026-03-05T00:00:00.000Z',
            createdBy: 'admin-b',
            requestNote: null,
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
        {
            id: 'expired-1',
            source: 'SSF',
            currentRolloutPercentage: 10,
            proposedRolloutPercentage: 20,
            title: 'expired request',
            description: 'expired request',
            status: 'expired',
            requiredApprovals: 1,
            approvalCount: 0,
            approvals: [],
            createdAt: '2026-03-03T00:00:00.000Z',
            createdBy: 'admin-c',
            requestNote: null,
            resolvedAt: '2026-03-05T00:30:00.000Z',
            resolvedBy: 'system:auto-expire',
            resolutionNote: 'expired',
        },
    ], Date.parse('2026-03-06T12:00:00.000Z'));

    assert.equal(digest.openCount, 2);
    assert.equal(digest.overdueCount, 1);
    assert.equal(digest.expiringSoonCount, 1);
    assert.equal(digest.expiredCount, 1);
    assert.equal(digest.oldestOpenAt, '2026-03-05T00:00:00.000Z');
    assert.equal(digest.overdueRequests[0]?.requestId, 'pending-2');
    assert.equal(digest.expiringSoonRequests[0]?.requestId, 'pending-2');
});

test('resolveAlertTuningWebhookFormat supports explicit config and URL auto-detection', () => {
    assert.equal(resolveAlertTuningWebhookFormat('slack', ''), 'slack');
    assert.equal(resolveAlertTuningWebhookFormat(undefined, 'https://hooks.slack.com/services/test'), 'slack');
    assert.equal(resolveAlertTuningWebhookFormat(undefined, 'https://discord.com/api/webhooks/1/2'), 'discord');
    assert.equal(resolveAlertTuningWebhookFormat(undefined, 'https://example.com/webhook'), 'generic');
});

test('buildAlertTuningReminderWebhookPayload returns Slack blocks payload', () => {
    const digest = buildAlertTuningReminderDigest([
        {
            id: 'pending-2',
            source: '29CM',
            currentRolloutPercentage: 40,
            proposedRolloutPercentage: 70,
            title: 'older request',
            description: 'older request',
            status: 'pending_second_approval',
            requiredApprovals: 2,
            approvalCount: 1,
            approvals: [{ uid: 'admin-b', note: null, approvedAt: '2026-03-05T10:00:00.000Z' }],
            createdAt: '2026-03-05T00:00:00.000Z',
            createdBy: 'admin-b',
            requestNote: null,
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
    ], Date.parse('2026-03-06T12:00:00.000Z'));

    const payload = buildAlertTuningReminderWebhookPayload(digest, 'slack');

    assert.equal(typeof payload.text, 'string');
    assert.ok(Array.isArray(payload.blocks));
    assert.match(String(payload.text), /LooPyck alert tuning digest/i);
});

test('buildAlertTuningReminderWebhookPayload returns Discord embed payload', () => {
    const digest = buildAlertTuningReminderDigest([
        {
            id: 'pending-2',
            source: '29CM',
            currentRolloutPercentage: 40,
            proposedRolloutPercentage: 70,
            title: 'older request',
            description: 'older request',
            status: 'pending_second_approval',
            requiredApprovals: 2,
            approvalCount: 1,
            approvals: [{ uid: 'admin-b', note: null, approvedAt: '2026-03-05T10:00:00.000Z' }],
            createdAt: '2026-03-05T00:00:00.000Z',
            createdBy: 'admin-b',
            requestNote: null,
            resolvedAt: null,
            resolvedBy: null,
            resolutionNote: null,
        },
    ], Date.parse('2026-03-06T12:00:00.000Z'));

    const payload = buildAlertTuningReminderWebhookPayload(digest, 'discord');

    assert.equal(typeof payload.content, 'string');
    assert.ok(Array.isArray(payload.embeds));
    assert.equal((payload.embeds as Array<{ title?: string }>)[0]?.title, 'LooPyck Alert Tuning Digest');
});

test('buildAlertTuningReminderWebhookPayload returns generic JSON payload', () => {
    const digest = buildAlertTuningReminderDigest([], Date.parse('2026-03-06T12:00:00.000Z'));
    const payload = buildAlertTuningReminderWebhookPayload(digest, 'generic');

    assert.equal(payload.source, 'loopyck.alert_tuning');
    assert.deepEqual(payload.summary, {
        openCount: 0,
        overdueCount: 0,
        expiringSoonCount: 0,
        expiredCount: 0,
    });
});

test('buildAlertTuningAuditInboxSummary counts unread warning and critical events', () => {
    const summary = buildAlertTuningAuditInboxSummary([
        {
            id: 'evt-1',
            type: 'request_created',
            level: 'info',
            title: 'created',
            message: 'created',
            createdAt: '2026-03-08T00:00:00.000Z',
            source: 'MUSINSA',
            requestId: 'req-1',
            actorUid: 'admin-a',
            note: null,
            historyId: null,
            read: false,
            readAt: null,
        },
        {
            id: 'evt-2',
            type: 'request_expired',
            level: 'warning',
            title: 'expired',
            message: 'expired',
            createdAt: '2026-03-08T01:00:00.000Z',
            source: '29CM',
            requestId: 'req-2',
            actorUid: 'system',
            note: null,
            historyId: null,
            read: false,
            readAt: null,
        },
        {
            id: 'evt-3',
            type: 'webhook_failed',
            level: 'critical',
            title: 'failed',
            message: 'failed',
            createdAt: '2026-03-08T02:00:00.000Z',
            source: null,
            requestId: null,
            actorUid: 'system',
            note: null,
            historyId: null,
            read: false,
            readAt: null,
        },
        {
            id: 'evt-4',
            type: 'request_approved',
            level: 'success',
            title: 'approved',
            message: 'approved',
            createdAt: '2026-03-08T03:00:00.000Z',
            source: 'SSF',
            requestId: 'req-3',
            actorUid: 'admin-b',
            note: null,
            historyId: null,
            read: true,
            readAt: '2026-03-08T03:05:00.000Z',
        },
    ]);

    assert.equal(summary.total, 4);
    assert.equal(summary.unreadCount, 3);
    assert.equal(summary.warningUnreadCount, 1);
    assert.equal(summary.criticalUnreadCount, 1);
});
