/**
 * SDK Independence Test
 * LooPyckSDK가 외부 의존성 없이 독립적으로 초기화되고 검색 기능을 수행하는지 검증.
 */

import { LooPyckSDK } from '../lib/core/loopyckSDK';

async function testSDK() {
    console.log('🧪 Starting SDK Independence Test...');

    try {
        // 1. Initialize
        console.log('Step 1: Initializing SDK...');
        const sdk = LooPyckSDK.init({
            apiKey: 'test-api-key',
            platform: 'generic',
            debug: true
        });

        if (!sdk) throw new Error('SDK Initialization Failed');
        console.log('✅ SDK Initialized');

        // 2. Mock Data
        const mockProducts = [
            { id: '1', title: 'Minimalist T-Shirt', price: 25000, category: 'Top' },
            { id: '2', title: 'Vintage Denim Jeans', price: 45000, category: 'Bottom' },
            { id: '3', title: 'Luxury Leather Bag', price: 150000, category: 'Accessory' }
        ];

        // 3. Test Search
        console.log('Step 2: Testing Search...');
        const results = await sdk.search('denim', mockProducts);

        if (results.length === 1 && results[0].title.includes('Denim')) {
            console.log('✅ Search Test Passed');
        } else {
            console.error('❌ Search Test Failed', results);
            process.exit(1);
        }

        // 4. Test Recommendation (Stylist)
        console.log('Step 3: Testing Recommendation...');
        const recs = sdk.recommend(mockProducts, { style: 'minimal' });

        if (recs.length > 0) {
            console.log('✅ Recommendation Test Passed');
        } else {
            console.error('❌ Recommendation Test Failed');
            process.exit(1);
        }

        console.log('🎉 All SDK Tests Passed!');

    } catch (error) {
        console.error('🚨 Test Failed with Error:', error);
        process.exit(1);
    }
}

testSDK();
