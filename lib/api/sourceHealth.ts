import type { ProductSource } from './types.ts';

/** 연속 empty가 이 횟수에 도달하면 성능 저하로 판정 */
const DEGRADED_CONSECUTIVE_EMPTY = 3;
/** 연속 empty가 이 횟수에 도달하면 "되다가 죽은 소스" 경보 */
const FAILING_CONSECUTIVE_EMPTY = 10;

export interface SourceHealthInput {
    source: ProductSource | string;
    searches: number;
    directHits: number;
    consecutiveEmptyHits?: number;
    lastDirectHitAt?: string;
}

export type SourceHealthStatus =
    | 'healthy'
    | 'degraded'
    | 'failing'
    | 'never_direct'
    | 'no_data';

export interface SourceHealth {
    source: string;
    status: SourceHealthStatus;
    reason: string;
    consecutiveEmptyHits: number;
    lastDirectHitAt?: string;
}

/**
 * 소스별 누적 진단 카운터를 헬스 판정으로 변환한다.
 *
 * 핵심 구분: "한 번도 direct 성공이 없는 소스"(never_direct — WAF/봇차단으로
 * 기대 무수확인 스크레이퍼)와 "되다가 연속으로 죽기 시작한 소스"(failing —
 * 비공식 API 파라미터/스키마 변경 의심, 진짜 경보 대상)를 분리한다.
 * 6개 비공식 API 소스(NAVER 제외)는 언젠가 조용히 깨진다 — 이 판정이
 * 그 순간을 "사람이 안 봐도 아는" 신호로 승격한다.
 */
export function assessSourceHealth(rows: SourceHealthInput[]): SourceHealth[] {
    return rows.map((rowInput) => {
        const consecutiveEmptyHits = Math.max(0, rowInput.consecutiveEmptyHits ?? 0);
        const base = {
            source: String(rowInput.source),
            consecutiveEmptyHits,
            lastDirectHitAt: rowInput.lastDirectHitAt,
        };

        if (!rowInput.searches || rowInput.searches <= 0) {
            return { ...base, status: 'no_data' as const, reason: '검색 기록 없음' };
        }

        if (!rowInput.directHits || rowInput.directHits <= 0) {
            return {
                ...base,
                status: 'never_direct' as const,
                reason: 'direct 성공 이력 없음 — 봇차단/미지원 소스로 기대 무수확',
            };
        }

        if (consecutiveEmptyHits >= FAILING_CONSECUTIVE_EMPTY) {
            return {
                ...base,
                status: 'failing' as const,
                reason: `과거 direct 성공 이력이 있으나 최근 ${consecutiveEmptyHits}회 연속 무수확 — API 파라미터/스키마 변경 의심`,
            };
        }

        if (consecutiveEmptyHits >= DEGRADED_CONSECUTIVE_EMPTY) {
            return {
                ...base,
                status: 'degraded' as const,
                reason: `최근 ${consecutiveEmptyHits}회 연속 무수확 — 관찰 필요`,
            };
        }

        return { ...base, status: 'healthy' as const, reason: '최근 direct 수확 정상' };
    });
}
