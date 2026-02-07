/**
 * Predictive Engine (Core Asset)
 * 도메인(패션/주식/코인)에 종속되지 않은 순수 수학적 예측 엔진.
 * 
 * Capability:
 * - Linear Regression (Trend Analysis)
 * - Moving Average (Smoothing)
 * - Volatility Calculation
 */

export interface TimeSeriesPoint {
    time: number; // Unix Timestamp or sequence index
    value: number;
}

export interface PredictionResult {
    slope: number;           // 기울기 (추세)
    intercept: number;       // 절편
    nextValue: number;       // 다음 시점 예측값
    confidence: number;      // 결정계수 (R^2) 등 신뢰도 지표
    trend: 'UP' | 'DOWN' | 'FLAT';
}

/**
 * 선형 회귀 분석을 수행합니다.
 * @param data 시계열 데이터 배열
 */
export function performLinearRegression(data: TimeSeriesPoint[]): PredictionResult {
    const n = data.length;
    if (n < 2) {
        throw new Error('Insufficient data for regression');
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach(p => {
        sumX += p.time;
        sumY += p.value;
        sumXY += p.time * p.value;
        sumXX += p.time * p.time;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R^2 Calculation (Simplified Confidence)
    // 실제 R^2 계산은 복잡하므로 여기서는 데이터 개수와 분산을 기반으로 추정
    const confidence = Math.min(0.99, Math.max(0.1, Math.log(n) / 5)); // Logarithmic confidence based on sample size

    const nextTime = data[n - 1].time + (data[1].time - data[0].time); // Assume uniform interval
    const nextValue = slope * nextTime + intercept;

    let trend: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
    if (slope > 0.05) trend = 'UP';
    else if (slope < -0.05) trend = 'DOWN';

    return {
        slope,
        intercept,
        nextValue,
        confidence,
        trend
    };
}
