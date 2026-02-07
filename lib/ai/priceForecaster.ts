/**
 * Price Forecaster (AI - Fashion Domain Adapter)
 * Core Predictive Engine을 사용하여 패션 상품의 가격을 분석합니다.
 */

import { performLinearRegression, TimeSeriesPoint } from '@/lib/core/predictiveEngine';

export interface PriceHistoryPoint {
    date: string;
    price: number;
}

export interface ForecastResult {
    predictedPrices: PriceHistoryPoint[];
    trend: 'UP' | 'DOWN' | 'STABLE';
    advice: string;
    confidence: number;
    reason: string;
}

/**
 * 7일간의 미래 가격을 예측합니다.
 */
export function forecastPrice(currentPrice: number): ForecastResult {
    // 1. Simulate History (Past 30 days) -> Real app would fetch from DB
    const history = generateMockHistory(currentPrice, 30);

    // 2. Map to Generic TimeSeries
    const timeSeriesData: TimeSeriesPoint[] = history.map((h, index) => ({
        time: index, // Use index as time for simplicity in simple linear regression
        value: h.price
    }));

    // 3. Use Core Engine
    const regression = performLinearRegression(timeSeriesData);

    // 4. Domain Logic: Forecast Future (Next 7 days)
    const predictedPrices: PriceHistoryPoint[] = [];
    const lastDate = new Date();

    for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);

        // y = mx + c (plus some seasonality noise for realism)
        const predictedPrice =
            (regression.slope * (29 + i)) + regression.intercept +
            (Math.random() * currentPrice * 0.01); // 1% noise

        predictedPrices.push({
            date: nextDate.toISOString().split('T')[0],
            price: Math.round(predictedPrice)
        });
    }

    // 5. Generate Insight (XAI)
    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    let advice = '지금이 적기입니다.';
    let reason = '가격 변동이 크지 않습니다.';

    // Fashion Domain Specific Thresholds
    // Core Engine returns raw slope, we interpret it for Fashion context
    if (regression.slope < -50) {
        trend = 'DOWN';
        advice = '조금 더 기다리세요!';
        reason = `최근 30일 데이터 분석 결과, 하락세(기울기: ${Math.round(regression.slope)})가 뚜렷합니다.`;
    } else if (regression.slope > 50) {
        trend = 'UP';
        advice = '지금 바로 구매하세요!';
        reason = `가격이 오르는 추세(기울기: +${Math.round(regression.slope)})입니다. 품절 임박 가능성이 있습니다.`;
    }

    return {
        predictedPrices,
        trend,
        advice,
        confidence: regression.confidence,
        reason
    };
}

// --- Helpers ---

function generateMockHistory(basePrice: number, days: number): PriceHistoryPoint[] {
    const history: PriceHistoryPoint[] = [];
    const volatility = basePrice * 0.05; // 5% fluctuation

    for (let i = days; i > 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        // Random walk
        const price = basePrice + (Math.random() * volatility * 2 - volatility);

        history.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price)
        });
    }
    return history;
}
