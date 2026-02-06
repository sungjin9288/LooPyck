/**
 * AI Pipeline Integration Test
 * 브라우저 콘솔에서 실행 가능한 테스트 스크립트
 */

// 이 스크립트를 개발자 도구 콘솔에서 실행하세요
// 또는 Next.js 페이지에 통합하여 사용

import { rateLimiter } from '../lib/ai/rateLimiter';
import { usageTracker } from '../lib/ai/usageTracker';
import { runCrossCheckerTests, summarizeResult, crossCheck } from '../lib/agent/crossChecker';
import type { AIExtractedProduct, DOMExtractedData } from '../types/aiExtraction';

/**
 * 1. Rate Limiter 테스트
 */
export function testRateLimiter(): void {
    console.log('\n=== Rate Limiter Test ===\n');

    // 현재 상태 확인
    const status = rateLimiter.getStatus();
    console.log('Current status:', status);
    console.log('Can make request:', status.canRequest);
    console.log('Remaining daily:', rateLimiter.getRemainingDaily());

    // 연속 요청 시뮬레이션 (실제 요청 X)
    console.log('\nSimulating 5 requests...');
    for (let i = 0; i < 5; i++) {
        if (rateLimiter.canMakeRequest(100)) {
            rateLimiter.recordRequest(100);
            console.log(`Request ${i + 1}: OK`);
        } else {
            console.log(`Request ${i + 1}: BLOCKED`);
        }
    }

    const finalStatus = rateLimiter.getStatus();
    console.log('\nFinal status:', finalStatus);
}

/**
 * 2. Usage Tracker 테스트
 */
export function testUsageTracker(): void {
    console.log('\n=== Usage Tracker Test ===\n');

    // 현재 통계
    const stats = usageTracker.getStats();
    console.log('Today stats:', stats.today);
    console.log('Remaining:', stats.remainingRequests);
    console.log('Usage %:', stats.usagePercentage);
    console.log('Warning level:', stats.warningLevel);

    // 요약 출력
    usageTracker.printSummary();
}

/**
 * 3. CrossChecker 테스트
 */
export function testCrossChecker(): void {
    console.log('\n=== CrossChecker Test ===\n');
    runCrossCheckerTests();
}

/**
 * 4. 실제 가격 비교 시뮬레이션
 */
export function testPriceComparison(): void {
    console.log('\n=== Price Comparison Simulation ===\n');

    // 시나리오: AI가 29,000원, DOM이 29,900원으로 추출
    const aiData: AIExtractedProduct = {
        productName: '오버핏 코튼 티셔츠',
        price: 29000,
        originalPrice: 39000,
        available: true,
        confidence: 0.82,
        material: 'cotton',
        materialConfidence: 0.95,
        materialDetails: '면 100%',
        silhouette: 'oversized',
        silhouetteConfidence: 0.85,
        fit: 'oversized',
        styleCategory: 'casual',
        styleScore: 7,
    };

    const domData: DOMExtractedData = {
        price: 29900,
        originalPrice: 39000,
        productName: '코튼 티셔츠',
        available: true,
        selector: '.product_article_price .price',
    };

    const result = crossCheck(aiData, domData);
    console.log(summarizeResult(result));

    // 검증
    if (result.finalPrice === 29900) {
        console.log('\n✅ DOM 우선 정책 정상 작동!');
    } else {
        console.log('\n❌ DOM 우선 정책 실패!');
    }
}

/**
 * 5. 전체 테스트 실행
 */
export function runAllTests(): void {
    console.log('╔════════════════════════════════════════╗');
    console.log('║     LooPyck AI Pipeline Test Suite     ║');
    console.log('╚════════════════════════════════════════╝');

    testRateLimiter();
    testUsageTracker();
    testCrossChecker();
    testPriceComparison();

    console.log('\n\n✅ All tests completed!');
    console.log('Next step: Test Vision Parser with real Gemini API');
}

// 자동 실행 (CLI)
if (typeof window === 'undefined') {
    runAllTests();
}
