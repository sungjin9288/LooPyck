/**
 * Price Verdict — 실제 수집된 가격 이력을 바탕으로 "지금 이 가격이 사기 좋은
 * 가격인지"를 결정적으로 판정한다. priceForecaster 의 난수 mock 과 달리 입력이
 * 같으면 결과가 항상 같으므로 테스트가 가능하다.
 */

export interface PriceVerdictPoint {
    price: number;
    capturedAt: number;
}

export type PriceVerdictLevel = 'great_deal' | 'good' | 'fair' | 'high' | 'insufficient';

export interface PriceVerdict {
    level: PriceVerdictLevel;
    /** 한국어 짧은 라벨 (배지용) */
    label: string;
    /** 판단 근거 한 문장 */
    reason: string;
    sampleSize: number;
    lowest: number;
    highest: number;
    average: number;
    median: number;
    currentPrice: number;
    /** 현재가보다 엄격히 싼 과거 데이터의 비율(0~100). 낮을수록 좋은 가격. */
    percentile: number;
    /** 역대 최저가 대비 현재가가 몇 % 높은지 (0 = 역대 최저) */
    vsLowestPct: number;
    /** 평균가 대비 현재가가 몇 % 인지 (음수 = 평균보다 쌈) */
    vsAveragePct: number;
}

/**
 * 판정 경계값. 도메인 튜닝 포인트이므로 한곳에 모아 노출한다.
 * - MIN_SAMPLE_SIZE: 이보다 적으면 통계적으로 판정하지 않는다.
 * - GREAT_DEAL_LOW_MARGIN: 역대 최저가의 몇 배 이내면 "역대급"으로 본다.
 * - GREAT_DEAL_PERCENTILE / GOOD_PERCENTILE / FAIR_PERCENTILE: 분위 경계.
 * - GOOD_BELOW_AVERAGE_PCT: 평균보다 이 % 이상 싸면 "좋은 가격".
 */
export const PRICE_VERDICT_THRESHOLDS = {
    MIN_SAMPLE_SIZE: 3,
    GREAT_DEAL_LOW_MARGIN: 1.02,
    GREAT_DEAL_PERCENTILE: 10,
    GOOD_PERCENTILE: 30,
    FAIR_PERCENTILE: 70,
    GOOD_BELOW_AVERAGE_PCT: -5,
} as const;

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

function median(sortedAsc: number[]): number {
    const mid = Math.floor(sortedAsc.length / 2);
    if (sortedAsc.length % 2 === 0) {
        return Math.round((sortedAsc[mid - 1] + sortedAsc[mid]) / 2);
    }
    return sortedAsc[mid];
}

function insufficientVerdict(sampleSize: number, currentPrice: number): PriceVerdict {
    return {
        level: 'insufficient',
        label: '데이터 모으는 중',
        reason: '가격 데이터가 더 쌓이면 지금이 좋은 시점인지 알려드릴게요.',
        sampleSize,
        lowest: 0,
        highest: 0,
        average: 0,
        median: 0,
        currentPrice: Number.isFinite(currentPrice) ? currentPrice : 0,
        percentile: 0,
        vsLowestPct: 0,
        vsAveragePct: 0,
    };
}

export function computePriceVerdict(
    points: readonly PriceVerdictPoint[],
    currentPrice: number
): PriceVerdict {
    const prices = points
        .map((point) => point.price)
        .filter((price): price is number => Number.isFinite(price) && price > 0);

    const sampleSize = prices.length;

    if (sampleSize < PRICE_VERDICT_THRESHOLDS.MIN_SAMPLE_SIZE || !Number.isFinite(currentPrice) || currentPrice <= 0) {
        return insufficientVerdict(sampleSize, currentPrice);
    }

    const sortedAsc = [...prices].sort((left, right) => left - right);
    const lowest = sortedAsc[0];
    const highest = sortedAsc[sortedAsc.length - 1];
    const average = Math.round(prices.reduce((sum, price) => sum + price, 0) / sampleSize);
    const cheaperCount = prices.filter((price) => price < currentPrice).length;
    const percentile = Math.round((cheaperCount / sampleSize) * 100);
    const vsLowestPct = round1(((currentPrice - lowest) / lowest) * 100);
    const vsAveragePct = round1(((currentPrice - average) / average) * 100);

    const base = {
        sampleSize,
        lowest,
        highest,
        average,
        median: median(sortedAsc),
        currentPrice,
        percentile,
        vsLowestPct,
        vsAveragePct,
    };

    // 가격 변동이 사실상 없는 이력은 "역대급"으로 과장하지 않는다.
    if (lowest === highest) {
        return {
            ...base,
            level: 'fair',
            label: '보통 가격',
            reason: '최근 수집 구간에서 가격 변동이 거의 없어요.',
        };
    }

    if (currentPrice <= lowest * PRICE_VERDICT_THRESHOLDS.GREAT_DEAL_LOW_MARGIN || percentile <= PRICE_VERDICT_THRESHOLDS.GREAT_DEAL_PERCENTILE) {
        return {
            ...base,
            level: 'great_deal',
            label: '역대급 최저가',
            reason: vsLowestPct === 0
                ? `최근 ${sampleSize}회 수집가 중 역대 최저가예요.`
                : `역대 최저가 ${lowest.toLocaleString()}원과 거의 같은 좋은 시점이에요 (+${vsLowestPct}%).`,
        };
    }

    if (vsAveragePct <= PRICE_VERDICT_THRESHOLDS.GOOD_BELOW_AVERAGE_PCT || percentile <= PRICE_VERDICT_THRESHOLDS.GOOD_PERCENTILE) {
        return {
            ...base,
            level: 'good',
            label: '좋은 가격',
            reason: `평균가 ${average.toLocaleString()}원보다 ${Math.abs(vsAveragePct)}% 낮은 좋은 가격대예요.`,
        };
    }

    if (percentile <= PRICE_VERDICT_THRESHOLDS.FAIR_PERCENTILE) {
        return {
            ...base,
            level: 'fair',
            label: '보통 가격',
            reason: '최근 가격대 평균 수준이에요.',
        };
    }

    return {
        ...base,
        level: 'high',
        label: '비싼 편',
        reason: `평균가 ${average.toLocaleString()}원보다 ${vsAveragePct}% 높아요. 조금 기다려볼 만해요.`,
    };
}
