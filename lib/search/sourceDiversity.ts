import type { UnifiedProduct } from '../api/types.ts';

export interface DiversifyOptions {
    /** 같은 소스가 연속으로 노출될 수 있는 최대 길이 (기본 2) */
    maxRun?: number;
}

/**
 * 관련도 정렬 결과에서 같은 소스의 연속 점유(run)를 끊어 상위권에
 * 여러 쇼핑몰이 섞여 보이게 한다 — 가격 "비교" 플랫폼의 상위 노출이
 * 한 몰처럼 보이는 문제 방지.
 *
 * 성질:
 * - 멀티셋 보존 (아이템 추가/삭제 없음)
 * - 같은 소스 내 상대 순서 보존 (가장 앞선 대안부터 당겨옴)
 * - 대안 소스가 없으면 run 규칙보다 순서 보존 우선 (꼬리 구간 예외)
 * - 입력 불변 (새 배열 반환)
 *
 * 가격 정렬(asc/dsc)에는 적용하지 말 것 — 가격 순서가 깨진다.
 */
export function diversifyProductsBySource(
    products: UnifiedProduct[],
    options?: DiversifyOptions
): UnifiedProduct[] {
    const maxRun = Math.max(1, options?.maxRun ?? 2);
    const remaining = [...products];
    const result: UnifiedProduct[] = [];

    while (remaining.length > 0) {
        // 현재 결과 꼬리의 연속 run 길이 계산
        let runSource: UnifiedProduct['source'] | null = null;
        let runLength = 0;
        for (let i = result.length - 1; i >= 0; i--) {
            if (runSource === null) {
                runSource = result[i].source;
                runLength = 1;
            } else if (result[i].source === runSource) {
                runLength++;
            } else {
                break;
            }
        }

        let pickIndex = 0;
        if (runSource !== null && runLength >= maxRun && remaining[0].source === runSource) {
            const alternative = remaining.findIndex((candidate) => candidate.source !== runSource);
            if (alternative !== -1) {
                pickIndex = alternative;
            }
        }

        result.push(remaining.splice(pickIndex, 1)[0]);
    }

    return result;
}
