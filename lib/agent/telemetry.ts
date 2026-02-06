/**
 * Agent Telemetry System
 * 실패 시 스냅샷(HTML + Screenshot)을 Firebase Storage에 저장
 */

import { ref, uploadString, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { collection, addDoc, Timestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage } from 'firebase/storage';
import { getApps } from 'firebase/app';

// Firebase 인스턴스 (조건부 초기화)
let storage: FirebaseStorage | null = null;
let firestoreDb: Firestore | null = null;

function getFirebaseInstances() {
    if (typeof window !== 'undefined' && getApps().length > 0) {
        if (!storage) {
            storage = getStorage();
        }
        if (!firestoreDb) {
            firestoreDb = db as Firestore;
        }
    }
    return { storage, firestoreDb };
}

// 실패 원인 타입
export type FailureReason =
    | 'zod_validation_error'
    | 'api_timeout'
    | 'rate_limit_exceeded'
    | 'bot_detection'
    | 'network_error'
    | 'element_not_found'
    | 'popup_blocked'
    | 'unknown';

// 텔레메트리 데이터
export interface TelemetryEvent {
    eventType: 'extraction_success' | 'extraction_failure' | 'healing_attempt' | 'model_switch';
    timestamp: Date;
    sessionId: string;

    // 요청 정보
    url: string;
    mall: string;

    // 성능 메트릭
    latencyMs: number;
    modelUsed: 'flash' | 'pro';
    tokensUsed: number;

    // 실패 정보 (실패 시)
    failureReason?: FailureReason;
    errorMessage?: string;

    // 스냅샷 URL (실패 시)
    snapshotUrl?: string;
    htmlSnapshotUrl?: string;
}

// 집계 통계
export interface AgentStats {
    period: 'daily' | 'hourly';
    timestamp: Date;
    totalRequests: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgLatencyMs: number;
    flashUsage: number;
    proUsage: number;
    estimatedCostUsd: number;
    topFailureReasons: { reason: FailureReason; count: number }[];
}

// 메모리 내 이벤트 버퍼 (배치 업로드용)
const eventBuffer: TelemetryEvent[] = [];
const BUFFER_FLUSH_SIZE = 10;
const BUFFER_FLUSH_INTERVAL_MS = 30000;

let flushTimer: NodeJS.Timeout | null = null;

/**
 * 스크린샷을 Firebase Storage에 업로드
 */
export async function uploadSnapshot(
    screenshotBase64: string,
    sessionId: string,
    timestamp: Date
): Promise<string | null> {
    const { storage } = getFirebaseInstances();
    if (!storage) {
        console.warn('[Telemetry] Storage not available');
        return null;
    }

    try {
        const path = `telemetry/snapshots/${timestamp.toISOString().split('T')[0]}/${sessionId}_${Date.now()}.png`;
        const storageRef = ref(storage, path);

        await uploadString(storageRef, screenshotBase64, 'base64', {
            contentType: 'image/png',
        });

        const downloadUrl = await getDownloadURL(storageRef);
        console.log('[Telemetry] Screenshot uploaded:', path);
        return downloadUrl;
    } catch (error) {
        console.error('[Telemetry] Screenshot upload failed:', error);
        return null;
    }
}

/**
 * HTML 스냅샷을 Firebase Storage에 업로드
 */
export async function uploadHtmlSnapshot(
    html: string,
    sessionId: string,
    timestamp: Date
): Promise<string | null> {
    const { storage } = getFirebaseInstances();
    if (!storage) {
        console.warn('[Telemetry] Storage not available');
        return null;
    }

    try {
        const path = `telemetry/html/${timestamp.toISOString().split('T')[0]}/${sessionId}_${Date.now()}.html`;
        const storageRef = ref(storage, path);

        // HTML을 base64로 인코딩
        const base64Html = Buffer.from(html).toString('base64');
        await uploadString(storageRef, base64Html, 'base64', {
            contentType: 'text/html',
        });

        const downloadUrl = await getDownloadURL(storageRef);
        console.log('[Telemetry] HTML snapshot uploaded:', path);
        return downloadUrl;
    } catch (error) {
        console.error('[Telemetry] HTML upload failed:', error);
        return null;
    }
}

/**
 * 실패 이벤트 기록 (with 스냅샷)
 */
export async function recordFailure(
    sessionId: string,
    url: string,
    mall: string,
    reason: FailureReason,
    errorMessage: string,
    latencyMs: number,
    modelUsed: 'flash' | 'pro',
    tokensUsed: number,
    screenshotBase64?: string,
    html?: string
): Promise<void> {
    const timestamp = new Date();

    // 스냅샷 업로드 (비동기)
    let snapshotUrl: string | undefined;
    let htmlSnapshotUrl: string | undefined;

    if (screenshotBase64) {
        snapshotUrl = (await uploadSnapshot(screenshotBase64, sessionId, timestamp)) || undefined;
    }
    if (html) {
        htmlSnapshotUrl = (await uploadHtmlSnapshot(html, sessionId, timestamp)) || undefined;
    }

    const event: TelemetryEvent = {
        eventType: 'extraction_failure',
        timestamp,
        sessionId,
        url,
        mall,
        latencyMs,
        modelUsed,
        tokensUsed,
        failureReason: reason,
        errorMessage,
        snapshotUrl,
        htmlSnapshotUrl,
    };

    await recordEvent(event);
    console.log(`[Telemetry] Failure recorded: ${reason} at ${url}`);
}

/**
 * 성공 이벤트 기록
 */
export async function recordSuccess(
    sessionId: string,
    url: string,
    mall: string,
    latencyMs: number,
    modelUsed: 'flash' | 'pro',
    tokensUsed: number
): Promise<void> {
    const event: TelemetryEvent = {
        eventType: 'extraction_success',
        timestamp: new Date(),
        sessionId,
        url,
        mall,
        latencyMs,
        modelUsed,
        tokensUsed,
    };

    await recordEvent(event);
}

/**
 * 이벤트를 버퍼에 추가 (배치 처리)
 */
async function recordEvent(event: TelemetryEvent): Promise<void> {
    eventBuffer.push(event);

    // 버퍼가 가득 차면 플러시
    if (eventBuffer.length >= BUFFER_FLUSH_SIZE) {
        await flushBuffer();
    }

    // 타이머 시작 (아직 없으면)
    if (!flushTimer) {
        flushTimer = setTimeout(async () => {
            await flushBuffer();
            flushTimer = null;
        }, BUFFER_FLUSH_INTERVAL_MS);
    }
}

/**
 * 버퍼를 Firestore에 플러시
 */
async function flushBuffer(): Promise<void> {
    if (eventBuffer.length === 0) return;

    const { firestoreDb } = getFirebaseInstances();
    if (!firestoreDb) {
        console.warn('[Telemetry] Firestore not available, skipping flush');
        return;
    }

    const eventsToFlush = [...eventBuffer];
    eventBuffer.length = 0;

    try {
        const eventsRef = collection(firestoreDb, 'telemetry_events');

        for (const event of eventsToFlush) {
            await addDoc(eventsRef, {
                ...event,
                timestamp: Timestamp.fromDate(event.timestamp),
            });
        }

        console.log(`[Telemetry] Flushed ${eventsToFlush.length} events to Firestore`);
    } catch (error) {
        console.error('[Telemetry] Flush failed:', error);
        // 실패 시 버퍼에 다시 추가
        eventBuffer.unshift(...eventsToFlush);
    }
}

/**
 * 실패 원인 분류
 */
export function classifyFailure(error: unknown): FailureReason {
    if (!error) return 'unknown';

    const errorStr = String(error).toLowerCase();

    if (errorStr.includes('zod') || errorStr.includes('validation')) {
        return 'zod_validation_error';
    }
    if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
        return 'api_timeout';
    }
    if (errorStr.includes('rate limit') || errorStr.includes('quota')) {
        return 'rate_limit_exceeded';
    }
    if (errorStr.includes('captcha') || errorStr.includes('bot') || errorStr.includes('blocked')) {
        return 'bot_detection';
    }
    if (errorStr.includes('network') || errorStr.includes('fetch')) {
        return 'network_error';
    }
    if (errorStr.includes('not found') || errorStr.includes('element')) {
        return 'element_not_found';
    }
    if (errorStr.includes('popup') || errorStr.includes('modal')) {
        return 'popup_blocked';
    }

    return 'unknown';
}

/**
 * 통계 계산 (Admin Dashboard용)
 */
export function calculateStats(events: TelemetryEvent[]): AgentStats {
    const now = new Date();
    const successEvents = events.filter(e => e.eventType === 'extraction_success');
    const failureEvents = events.filter(e => e.eventType === 'extraction_failure');

    const totalRequests = successEvents.length + failureEvents.length;
    const successRate = totalRequests > 0 ? successEvents.length / totalRequests : 0;

    const avgLatency = events.length > 0
        ? events.reduce((sum, e) => sum + e.latencyMs, 0) / events.length
        : 0;

    const flashEvents = events.filter(e => e.modelUsed === 'flash');
    const proEvents = events.filter(e => e.modelUsed === 'pro');

    // 실패 원인 집계
    const reasonCounts = new Map<FailureReason, number>();
    for (const e of failureEvents) {
        if (e.failureReason) {
            reasonCounts.set(e.failureReason, (reasonCounts.get(e.failureReason) || 0) + 1);
        }
    }

    const topFailureReasons = Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 비용 계산 (Pro만 유료)
    const proTokens = proEvents.reduce((sum, e) => sum + e.tokensUsed, 0);
    const estimatedCostUsd = (proTokens / 1_000_000) * 1.25; // $1.25 per 1M tokens

    return {
        period: 'daily',
        timestamp: now,
        totalRequests,
        successCount: successEvents.length,
        failureCount: failureEvents.length,
        successRate: Math.round(successRate * 100) / 100,
        avgLatencyMs: Math.round(avgLatency),
        flashUsage: flashEvents.length,
        proUsage: proEvents.length,
        estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
        topFailureReasons,
    };
}

/**
 * 강제 플러시 (종료 시)
 */
export async function forceFlush(): Promise<void> {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    await flushBuffer();
}
