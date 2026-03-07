import { Timestamp } from 'firebase-admin/firestore';
import { resolveAlertTuningConfig, type AlertTuningConfig } from '../favorites/alertPersonalization.ts';
import { getAdminDb } from './firebaseAdmin.ts';

const COLLECTION = 'opsConfig';
const DOC_ID = 'alertTuning';
const HISTORY_LIMIT = 12;

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

async function loadHistoryEntries(
    docRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
): Promise<AlertTuningHistoryEntry[]> {
    const historySnap = await docRef.collection('history').orderBy('updatedAt', 'desc').limit(HISTORY_LIMIT).get();
    return historySnap.docs.map((doc) => mapHistoryEntry(doc));
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
    return persistAlertTuningConfigRecord(docRef, configInput, updatedBy);
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
    return persistAlertTuningConfigRecord(
        docRef,
        configSnapshot,
        updatedBy,
        `rollback -> ${targetSummary}`
    );
}
