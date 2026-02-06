/**
 * Gemini Vision API Test Script
 * 실제 API 호출 테스트 (쿼터 소진 주의!)
 */

import { parseProductImage } from '../lib/ai/visionParser';
import { rateLimiter } from '../lib/ai/rateLimiter';
import { usageTracker } from '../lib/ai/usageTracker';

// 테스트용 샘플 이미지 (1x1 pixel PNG, Base64)
// 실제 테스트 시 쇼핑몰 스크린샷으로 교체
const SAMPLE_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testVisionAPI(): Promise<void> {
    console.log('╔════════════════════════════════════════╗');
    console.log('║      Gemini Vision API Test            ║');
    console.log('╚════════════════════════════════════════╝\n');

    // 사전 체크
    console.log('1. Pre-flight checks...');

    const status = rateLimiter.getStatus();
    console.log(`   RPD: ${status.rpd.current}/${status.rpd.max}`);
    console.log(`   Can request: ${status.canRequest}`);

    if (!status.canRequest) {
        console.error('❌ Rate limit reached! Cannot proceed.');
        return;
    }

    const remaining = rateLimiter.getRemainingDaily();
    console.log(`   Remaining daily quota: ${remaining}`);

    if (remaining <= 2) {
        console.warn('⚠️ Warning: Only 2 or fewer requests remaining today!');
        console.warn('   Skipping test to preserve quota.');
        return;
    }

    console.log('\n2. Testing Gemini Vision API...');
    console.log('   (Using minimal test image to save tokens)\n');

    try {
        // 실제 API 호출
        const result = await parseProductImage(SAMPLE_IMAGE_BASE64, 'image/png');

        if (result) {
            console.log('✅ API Response received!');
            console.log('   Product:', result.productName);
            console.log('   Price:', result.price);
            console.log('   Confidence:', result.confidence);
        } else {
            console.log('⚠️ API returned null (might be expected for test image)');
        }
    } catch (error) {
        console.error('❌ API Error:', error);
    }

    console.log('\n3. Post-test status...');
    usageTracker.printSummary();
}

// 실행
testVisionAPI().then(() => {
    console.log('\nTest complete!');
}).catch(console.error);
