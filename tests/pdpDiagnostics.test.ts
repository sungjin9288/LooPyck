import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getPdpDiagnosticsSummary,
    getRecentPdpDiagnostics,
    recordPdpDiagnostics,
    resetPdpDiagnostics,
} from '../lib/api/pdpDiagnostics.ts';

test('pdp diagnostics aggregates cache, fetch and parse outcomes by source', () => {
    resetPdpDiagnostics();

    recordPdpDiagnostics([
        {
            source: 'MUSINSA',
            strategy: 'cache_hit',
            generatedAt: '2026-03-06T12:00:00.000Z',
            durationMs: 0,
            cacheHit: true,
            fetchAttempted: false,
            fetchSucceeded: true,
            parseSucceeded: true,
            reason: 'fresh_cached_detail',
            productId: 'musinsa_1',
        },
        {
            source: 'MUSINSA',
            strategy: 'stale_cache_refreshed',
            generatedAt: '2026-03-06T12:01:00.000Z',
            durationMs: 420,
            cacheHit: false,
            fetchAttempted: true,
            fetchSucceeded: true,
            parseSucceeded: true,
            reason: 'live_fetch_success',
            productId: 'musinsa_1',
        },
        {
            source: 'SSF',
            strategy: 'parse_empty',
            generatedAt: '2026-03-06T12:02:00.000Z',
            durationMs: 510,
            cacheHit: false,
            fetchAttempted: true,
            fetchSucceeded: true,
            parseSucceeded: false,
            reason: 'no_detail_signals',
            productId: 'ssf_1',
        },
    ]);

    const summary = getPdpDiagnosticsSummary();
    const recent = getRecentPdpDiagnostics(3);

    assert.equal(summary.trackedEvents, 3);
    assert.equal(recent.length, 3);
    assert.equal(summary.cacheHitRate, 33.3);
    assert.equal(summary.fetchSuccessRate, 100);
    assert.equal(summary.parseSuccessRate, 66.7);

    const musinsa = summary.sources.find((entry) => entry.source === 'MUSINSA');
    assert.ok(musinsa);
    assert.equal(musinsa?.requests, 2);
    assert.equal(musinsa?.cacheHitRate, 50);
    assert.equal(musinsa?.fetchSuccessRate, 100);
    assert.equal(musinsa?.parseSuccessRate, 100);

    const ssf = summary.sources.find((entry) => entry.source === 'SSF');
    assert.ok(ssf);
    assert.equal(ssf?.requests, 1);
    assert.equal(ssf?.parseSuccessRate, 0);
    assert.equal(ssf?.lastStrategy, 'parse_empty');
});
