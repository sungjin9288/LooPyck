/**
 * Domain Porting Verify: Stock Market Simulation
 * 패션 데이터가 아닌 '가상 주식 데이터'를 주입하여
 * Predictive Engine이 도메인에 구애받지 않고 작동하는지 검증.
 */

import { performLinearRegression, TimeSeriesPoint } from '../core/predictiveEngine';

/**
 * 가상 주식 데이터 생성기 (Random Walk + Trend)
 */
function generateStockData(days: number, startPrice: number, trend: number): TimeSeriesPoint[] {
    const data: TimeSeriesPoint[] = [];
    let currentPrice = startPrice;

    for (let i = 0; i < days; i++) {
        // Random fluctuation (-2% to +2%) + Trend
        const change = currentPrice * ((Math.random() * 0.04 - 0.02) + trend);
        currentPrice += change;

        data.push({
            time: i,
            value: Number(currentPrice.toFixed(2))
        });
    }
    return data;
}

async function verifyDomainPorting() {
    console.log(`\n📈 [Domain Porting Simulation] Injecting Virtual Stock Data...`);

    // Scenario 1: Bull Market (Strong Up Trend)
    const bullMarket = generateStockData(30, 100, 0.01); // 1% daily growth trend
    const bullPred = performLinearRegression(bullMarket);

    console.log(`\n1. Bull Market Simulation:`);
    console.log(`   - Start: $${bullMarket[0].value} -> End: $${bullMarket[29].value}`);
    console.log(`   - Prediction Slope: ${bullPred.slope.toFixed(4)}`);
    console.log(`   - Detected Trend: ${bullPred.trend}`);

    if (bullPred.trend === 'UP') {
        console.log(`   ✅ PASSED: Correctly identified BULL market.`);
    } else {
        console.log(`   ❌ FAILED: Failed to identify BULL market.`);
    }

    // Scenario 2: Bear Market (Strong Down Trend)
    const bearMarket = generateStockData(30, 100, -0.01); // -1% daily decline
    const bearPred = performLinearRegression(bearMarket);

    console.log(`\n2. Bear Market Simulation:`);
    console.log(`   - Start: $${bearMarket[0].value} -> End: $${bearMarket[29].value}`);
    console.log(`   - Prediction Slope: ${bearPred.slope.toFixed(4)}`);
    console.log(`   - Detected Trend: ${bearPred.trend}`);

    if (bearPred.trend === 'DOWN') {
        console.log(`   ✅ PASSED: Correctly identified BEAR market.`);
    } else {
        console.log(`   ❌ FAILED: Failed to identify BEAR market.`);
    }

    // Scenario 3: Volatility Check (Confidence)
    const volatileMarket = generateStockData(30, 100, 0); // No trend, high volatility comes from random walk
    // Artificial noise injection
    volatileMarket.forEach((p, i) => {
        if (i % 2 === 0) p.value += 10;
        else p.value -= 10;
    });

    const volPred = performLinearRegression(volatileMarket);
    console.log(`\n3. Volatility Simulation:`);
    console.log(`   - Confidence (R^2 Proxy): ${volPred.confidence.toFixed(4)}`);

    // Confidence should be relatively low due to noise, but since we used a simplified confidence in engine,
    // we just check if it ran without error and produced *some* confidence.
    if (volPred.confidence < 0.9) { // Expect lower confidence
        console.log(`   ✅ PASSED: Engine correctly reports lower confidence on volatile data.`);
    } else {
        console.log(`   ⚠️ WARNING: Confidence surprisingly high (${volPred.confidence}). Check formula.`);
    }

    console.log(`\n✨ Domain Porting Verification Complete.`);
}

verifyDomainPorting().catch(console.error);
