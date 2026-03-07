import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlertSnoozeUntil, deriveAlertPriority, formatAlertSnoozeUntil, isFavoriteAlertSnoozed } from '../lib/favorites/alertState.ts';

test('deriveAlertPriority returns critical when cross-mall alternative is cheaper', () => {
    assert.equal(
        deriveAlertPriority({ currentPrice: 119000, targetPrice: 125000, cheapestPrice: 99000 }),
        'critical'
    );
});

test('deriveAlertPriority returns high when current price reached target', () => {
    assert.equal(
        deriveAlertPriority({ currentPrice: 119000, targetPrice: 119000 }),
        'high'
    );
});

test('deriveAlertPriority returns medium when price is still above target', () => {
    assert.equal(
        deriveAlertPriority({ currentPrice: 129000, targetPrice: 119000 }),
        'medium'
    );
});

test('isFavoriteAlertSnoozed checks future timestamp', () => {
    assert.equal(isFavoriteAlertSnoozed({ alertSnoozedUntil: 20_000 }, 10_000), true);
    assert.equal(isFavoriteAlertSnoozed({ alertSnoozedUntil: 5_000 }, 10_000), false);
});

test('buildAlertSnoozeUntil offsets current time by hours', () => {
    assert.equal(buildAlertSnoozeUntil(24, 1_000), 86_401_000);
});

test('formatAlertSnoozeUntil formats known timestamps', () => {
    assert.notEqual(formatAlertSnoozeUntil(1_700_000_000_000), '미설정');
});
