import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildShareMessage, pickShareStrategy } from '../lib/native/shareStrategy.ts';

// ── buildShareMessage ────────────────────────────────────────────────

test('buildShareMessage: 상품명·천단위 가격·URL을 모두 포함한다', () => {
    const message = buildShareMessage({
        productTitle: '와이드 데님 팬츠',
        currentPrice: 42900,
        shareUrl: 'https://loo-pyck.netlify.app/product/abc',
    });

    assert.ok(message.includes('와이드 데님 팬츠'));
    assert.ok(message.includes('42,900원'));
    assert.ok(message.includes('https://loo-pyck.netlify.app/product/abc'));
});

test('buildShareMessage: 가격이 0 이하·비유한이면 가격 줄을 생략한다', () => {
    for (const badPrice of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
        const message = buildShareMessage({
            productTitle: '테스트 상품',
            currentPrice: badPrice,
            shareUrl: 'https://example.com/p/1',
        });

        assert.ok(!message.includes('원'), `가격 ${badPrice}에서 가격 줄이 남음`);
        assert.ok(message.includes('테스트 상품'));
    }
});

test('buildShareMessage: 제목 앞뒤 공백을 정리한다', () => {
    const message = buildShareMessage({
        productTitle: '  코듀로이 자켓  ',
        currentPrice: 89000,
        shareUrl: 'https://example.com/p/2',
    });

    assert.ok(message.includes('코듀로이 자켓'));
    assert.ok(!message.includes('  코듀로이'));
});

// ── pickShareStrategy ────────────────────────────────────────────────

test('pickShareStrategy: Toss WebView에서는 항상 toss를 고른다', () => {
    assert.equal(pickShareStrategy({ isToss: true, canWebShare: true }), 'toss');
    assert.equal(pickShareStrategy({ isToss: true, canWebShare: false }), 'toss');
});

test('pickShareStrategy: Toss 밖에서 Web Share 가능하면 web을 고른다', () => {
    assert.equal(pickShareStrategy({ isToss: false, canWebShare: true }), 'web');
});

test('pickShareStrategy: 둘 다 불가하면 clipboard 폴백', () => {
    assert.equal(pickShareStrategy({ isToss: false, canWebShare: false }), 'clipboard');
});
