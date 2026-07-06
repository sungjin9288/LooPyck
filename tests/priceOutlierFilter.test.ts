import test from 'node:test';
import assert from 'node:assert/strict';
import { filterLowPriceOutliers } from '../lib/search/priceOutlierFilter.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(id: string, price: number): UnifiedProduct {
    return {
        id,
        title: `상품 ${id}`,
        price,
        image: 'https://example.com/i.jpg',
        link: `https://example.com/${id}`,
        mallName: '테스트몰',
        source: 'NAVER',
    };
}

function prices(from: number, count: number, step: number): UnifiedProduct[] {
    return Array.from({ length: count }, (_, i) => product(`p${from + i * step}`, from + i * step));
}

test('의류 중앙값 대비 극단 저가(부자재·더미가격)를 걸러낸다', () => {
    const garments = prices(30000, 10, 2000); // 30,000~48,000원 의류 10개
    const junk = [product('j20', 20), product('j100', 100), product('j480', 480)];

    const result = filterLowPriceOutliers([...junk, ...garments]);

    assert.equal(result.length, 10);
    assert.ok(result.every((p) => p.price >= 30000));
});

test('가격대가 비슷하면 아무것도 거르지 않는다', () => {
    const input = prices(20000, 12, 1500);

    const result = filterLowPriceOutliers(input);

    assert.equal(result.length, 12);
});

test('고가 카테고리에서 정상 저가템은 보존한다 (절대 상한 3,000원)', () => {
    // 중앙값 30만원대 패딩 결과에 2.5만원 보급형이 섞인 경우 — 10% 비율(3만원)이
    // 아니라 상한 3,000원이 적용되어 살아남아야 한다
    const premium = prices(280000, 9, 10000);
    const budget = product('budget', 25000);

    const result = filterLowPriceOutliers([budget, ...premium]);

    assert.ok(result.some((p) => p.id === 'budget'));
});

test('저가 카테고리(양말류)에서는 비율 기준이 자연 축소된다', () => {
    // 중앙값 3,000원 → 임계 min(3000, 300) = 300원. 500원 아이템 생존.
    const socks = prices(2500, 9, 200);
    const cheap = product('cheap', 500);

    const result = filterLowPriceOutliers([cheap, ...socks]);

    assert.ok(result.some((p) => p.id === 'cheap'));
});

test('결과가 8개 미만이면 필터링을 건너뛴다 (중앙값 신뢰 불가)', () => {
    const input = [product('j20', 20), ...prices(30000, 5, 1000)];

    const result = filterLowPriceOutliers(input);

    assert.equal(result.length, 6);
});

test('전체의 30% 초과를 지우게 되면 필터링을 포기한다 (저가 카테고리 보호)', () => {
    // 절반이 임계 아래인 극단 케이스 — 카테고리 자체가 저가일 가능성
    const low = prices(100, 6, 50);
    const high = prices(30000, 6, 1000);

    const result = filterLowPriceOutliers([...low, ...high]);

    assert.equal(result.length, 12);
});

test('보존 아이템의 상대 순서와 입력 불변성을 유지한다', () => {
    const garments = prices(30000, 10, 2000);
    const input = [product('j20', 20), ...garments];
    const snapshot = input.map((p) => p.id);

    const result = filterLowPriceOutliers(input);

    assert.deepEqual(result.map((p) => p.id), garments.map((p) => p.id));
    assert.deepEqual(input.map((p) => p.id), snapshot);
});
