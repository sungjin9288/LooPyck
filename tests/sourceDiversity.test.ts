import test from 'node:test';
import assert from 'node:assert/strict';
import { diversifyProductsBySource } from '../lib/search/sourceDiversity.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(id: string, source: UnifiedProduct['source']): UnifiedProduct {
    return {
        id,
        title: `상품 ${id}`,
        price: 10000,
        image: 'https://example.com/i.jpg',
        link: `https://example.com/${id}`,
        mallName: '테스트몰',
        source,
    };
}

test('같은 소스 3연속 이상 run을 maxRun=2로 끊고 다른 소스를 끼워넣는다', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('a3', 'ABLY'),
        product('a4', 'ABLY'),
        product('a5', 'ABLY'),
        product('h1', 'HAGO'),
        product('m1', 'MUSINSA'),
    ];

    const result = diversifyProductsBySource(input);

    // 어떤 소스도 3연속 등장하지 않는다 (대안이 존재하는 한)
    for (let i = 2; i < result.length; i++) {
        const run3 = result[i].source === result[i - 1].source && result[i].source === result[i - 2].source;
        // 남은 아이템이 전부 같은 소스인 꼬리 구간은 예외
        const tailAllSame = result.slice(i - 2).every((p) => p.source === result[i].source);
        assert.ok(!run3 || tailAllSame, `3연속 발견: index ${i}`);
    }
});

test('멀티셋 보존 — 아이템이 추가/삭제되지 않는다', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('a3', 'ABLY'),
        product('n1', 'NAVER'),
        product('h1', 'HAGO'),
    ];

    const result = diversifyProductsBySource(input);

    assert.equal(result.length, input.length);
    assert.deepEqual(
        result.map((p) => p.id).sort(),
        input.map((p) => p.id).sort()
    );
});

test('소스 내 상대 순서 보존 — 같은 소스끼리는 원래 순서 유지', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('a3', 'ABLY'),
        product('h1', 'HAGO'),
        product('h2', 'HAGO'),
    ];

    const result = diversifyProductsBySource(input);

    const ablyOrder = result.filter((p) => p.source === 'ABLY').map((p) => p.id);
    const hagoOrder = result.filter((p) => p.source === 'HAGO').map((p) => p.id);
    assert.deepEqual(ablyOrder, ['a1', 'a2', 'a3']);
    assert.deepEqual(hagoOrder, ['h1', 'h2']);
});

test('이미 다양한 입력은 순서가 바뀌지 않는다', () => {
    const input = [
        product('n1', 'NAVER'),
        product('m1', 'MUSINSA'),
        product('a1', 'ABLY'),
        product('h1', 'HAGO'),
    ];

    const result = diversifyProductsBySource(input);

    assert.deepEqual(result.map((p) => p.id), ['n1', 'm1', 'a1', 'h1']);
});

test('전부 같은 소스면 그대로 반환한다 (무한루프 없음)', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('a3', 'ABLY'),
    ];

    const result = diversifyProductsBySource(input);

    assert.deepEqual(result.map((p) => p.id), ['a1', 'a2', 'a3']);
});

test('입력 배열을 변형하지 않는다 (불변성)', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('a3', 'ABLY'),
        product('n1', 'NAVER'),
    ];
    const snapshot = input.map((p) => p.id);

    diversifyProductsBySource(input);

    assert.deepEqual(input.map((p) => p.id), snapshot);
});

test('maxRun=1이면 가능한 한 엄격 교차 배치한다', () => {
    const input = [
        product('a1', 'ABLY'),
        product('a2', 'ABLY'),
        product('n1', 'NAVER'),
        product('n2', 'NAVER'),
    ];

    const result = diversifyProductsBySource(input, { maxRun: 1 });

    assert.deepEqual(result.map((p) => p.id), ['a1', 'n1', 'a2', 'n2']);
});

test('빈 입력은 빈 배열을 반환한다', () => {
    assert.deepEqual(diversifyProductsBySource([]), []);
});
