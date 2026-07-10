import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveCardCommerceBadges } from '../lib/product/cardCommerceBadges.ts';

test('returns an empty array when no commerce signals are present', () => {
    const badges = deriveCardCommerceBadges({});
    assert.deepEqual(badges, []);
});

test('shows a shipping badge using shippingText when present', () => {
    const badges = deriveCardCommerceBadges({ shippingText: '오늘출발' });
    assert.deepEqual(badges, [{ kind: 'shipping', label: '오늘출발' }]);
});

test('falls back to a generic free-shipping label when shippingFee is 0 and no shippingText', () => {
    const badges = deriveCardCommerceBadges({ shippingFee: 0 });
    assert.deepEqual(badges, [{ kind: 'shipping', label: '무료배송' }]);
});

test('prefers shippingText over the free-shipping fallback when both are present', () => {
    const badges = deriveCardCommerceBadges({ shippingText: '샥배송', shippingFee: 0 });
    assert.deepEqual(badges, [{ kind: 'shipping', label: '샥배송' }]);
});

test('ignores whitespace-only shippingText and does not show a shipping badge without shippingFee === 0', () => {
    const badges = deriveCardCommerceBadges({ shippingText: '   ' });
    assert.deepEqual(badges, []);
});

test('falls back to the free-shipping label when shippingText is whitespace-only but shippingFee is 0', () => {
    const badges = deriveCardCommerceBadges({ shippingText: '   ', shippingFee: 0 });
    assert.deepEqual(badges, [{ kind: 'shipping', label: '무료배송' }]);
});

test('does not show a shipping badge for a non-zero shippingFee without shippingText', () => {
    const badges = deriveCardCommerceBadges({ shippingFee: 3000 });
    assert.deepEqual(badges, []);
});

test('shows a benefit badge with trimmed benefitText when benefitPrice is present', () => {
    const badges = deriveCardCommerceBadges({ benefitPrice: 45000, benefitText: '  전상품 18% 쿠폰  ' });
    assert.deepEqual(badges, [{ kind: 'benefit', label: '전상품 18% 쿠폰' }]);
});

test('ignores a benefit signal when benefitText is whitespace-only', () => {
    const badges = deriveCardCommerceBadges({ benefitPrice: 45000, benefitText: '   ' });
    assert.deepEqual(badges, []);
});

test('ignores a benefit signal when benefitText is missing entirely', () => {
    const badges = deriveCardCommerceBadges({ benefitPrice: 45000 });
    assert.deepEqual(badges, []);
});

test('does not show a benefit badge when benefitText is present but benefitPrice is missing', () => {
    const badges = deriveCardCommerceBadges({ benefitText: '전상품 18% 쿠폰' });
    assert.deepEqual(badges, []);
});

test('returns both badges in shipping-then-benefit priority order when both signals are present', () => {
    const badges = deriveCardCommerceBadges({
        shippingText: '오늘출발',
        benefitPrice: 45000,
        benefitText: '전상품 18% 쿠폰',
    });
    assert.deepEqual(badges, [
        { kind: 'shipping', label: '오늘출발' },
        { kind: 'benefit', label: '전상품 18% 쿠폰' },
    ]);
});

test('never returns more than 2 badges', () => {
    const badges = deriveCardCommerceBadges({
        shippingText: '오늘출발',
        shippingFee: 0,
        benefitPrice: 45000,
        benefitText: '전상품 18% 쿠폰',
    });
    assert.ok(badges.length <= 2);
});
