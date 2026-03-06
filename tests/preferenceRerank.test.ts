import test from 'node:test';
import assert from 'node:assert/strict';
import { rerankProductsByPreference } from '../lib/search/preferenceRerank.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(overrides: Partial<UnifiedProduct>): UnifiedProduct {
    return {
        id: overrides.id || 'test-item',
        title: overrides.title || '기본 상품',
        price: overrides.price || 100000,
        image: overrides.image || 'https://example.com/item.jpg',
        link: overrides.link || `https://example.com/${overrides.id || 'test-item'}`,
        mallName: overrides.mallName || '테스트몰',
        brand: overrides.brand,
        category1: overrides.category1,
        category2: overrides.category2,
        source: overrides.source || 'MUSINSA',
    };
}

test('recently viewed brand and category signals rerank matching products first', () => {
    const history = [
        product({ id: 'history-1', brand: '나이키', category1: '상의', category2: '후드집업', source: 'MUSINSA' }),
        product({ id: 'history-2', brand: '나이키', category1: '상의', category2: '맨투맨', source: '29CM' }),
    ];

    const result = rerankProductsByPreference([
        product({ id: 'match', title: '나이키 스포츠웨어 후드집업', brand: '나이키', category1: '상의', category2: '후드집업' }),
        product({ id: 'other', title: '아디다스 와이드 팬츠', brand: '아디다스', category1: '하의', category2: '팬츠' }),
    ], history);

    assert.equal(result.products[0]?.id, 'match');
    assert.equal(result.profile.totalSignals, 2);
    assert.equal(result.profile.topBrands[0], '나이키');
});
