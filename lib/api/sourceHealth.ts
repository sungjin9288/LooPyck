import type { ProductSource } from './types.ts';
import { DISABLED_SEARCH_SOURCES } from './searchSourceRegistry.ts';

/** 연속 empty가 이 횟수에 도달하면 성능 저하로 판정 */
const DEGRADED_CONSECUTIVE_EMPTY = 3;
/** 연속 empty가 이 횟수에 도달하면 "되다가 죽은 소스" 경보 */
const FAILING_CONSECUTIVE_EMPTY = 10;

export interface SourceHealthInput {
    source: ProductSource | string;
    searches: number;
    directHits: number;
    /** 상품을 반환한 검색 횟수 — NAVER처럼 strategy=api인 소스는 directHits가
     *  영원히 0이므로, "과거에 작동했는가" 판정에 successCount를 함께 본다 */
    successCount?: number;
    consecutiveEmptyHits?: number;
    lastDirectHitAt?: string;
    /** 최근 최대 20회의 0/1 결과(오래된 것 먼저, 최신이 마지막) — lifetime 누적치와 달리
     *  "지금" 되살아난 소스를 즉시 반영한다. 비어있으면 아직 표본이 없다는 뜻 */
    recentOutcomes?: number[];
}

export type SourceHealthStatus =
    | 'healthy'
    | 'degraded'
    | 'failing'
    | 'never_direct'
    | 'no_data'
    | 'disabled';

export interface SourceHealth {
    source: string;
    status: SourceHealthStatus;
    reason: string;
    consecutiveEmptyHits: number;
    lastDirectHitAt?: string;
    /** 최근 표본(최대 20회) 중 성공 비율(0..1). 표본이 없으면 null — lifetime
     *  successRate와 달리 부활한 소스를 즉시 반영하는 정보성 지표(상태 판정에는 미사용) */
    recentWindowRate: number | null;
}

/** recentOutcomes(0/1 배열)을 성공 비율로 환산한다. 표본 없으면 null. */
function computeRecentWindowRate(recentOutcomes?: number[]): number | null {
    if (!recentOutcomes || recentOutcomes.length === 0) {
        return null;
    }

    const successCount = recentOutcomes.reduce((sum, outcome) => sum + outcome, 0);
    return Math.round((successCount / recentOutcomes.length) * 1000) / 1000;
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
            recentWindowRate: computeRecentWindowRate(rowInput.recentOutcomes),
        };

        // 배선 해제된 소스는 시도가 멈춰 스트릭이 동결된다 — failing 경보가
        // 영원히 남지 않도록, 의도적 해제임을 아는 상태로 먼저 분기한다.
        // 윈도우 통계는 base에서 계속 계산돼 복원 판단 근거로 남는다.
        const disabledReason = DISABLED_SEARCH_SOURCES[rowInput.source as ProductSource];
        if (disabledReason) {
            return {
                ...base,
                status: 'disabled' as const,
                reason: `배선 해제됨 — ${disabledReason}`,
            };
        }

        if (!rowInput.searches || rowInput.searches <= 0) {
            return { ...base, status: 'no_data' as const, reason: '검색 기록 없음' };
        }

        const hasEverProduced = (rowInput.directHits ?? 0) > 0 || (rowInput.successCount ?? 0) > 0;
        if (!hasEverProduced) {
            return {
                ...base,
                status: 'never_direct' as const,
                reason: '수확 이력 없음 — 봇차단/미지원 소스로 기대 무수확',
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
