import assert from 'node:assert/strict';
import test from 'node:test';
import {
    isRetryableScrapeError,
    withScrapeRetry,
} from '../lib/api/scrapeRetry.ts';

function makeClock(startAt: number = 0) {
    let now = startAt;
    return {
        now: () => now,
        advance: (ms: number) => {
            now += ms;
        },
    };
}

function noSleep() {
    return async (_ms: number) => {
        // no real timers — resolves immediately
    };
}

test('isRetryableScrapeError identifies retryable failure classes', () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const timeoutError = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
    const status500 = new Error('Status 500');
    const status503 = new Error('Status 503');
    const status429 = new Error('Status 429');
    const fetchTypeError = new TypeError('fetch failed');

    assert.equal(isRetryableScrapeError(abortError), true);
    assert.equal(isRetryableScrapeError(timeoutError), true);
    assert.equal(isRetryableScrapeError(status500), true);
    assert.equal(isRetryableScrapeError(status503), true);
    assert.equal(isRetryableScrapeError(status429), true);
    assert.equal(isRetryableScrapeError(fetchTypeError), true);
});

test('isRetryableScrapeError rejects non-retryable errors', () => {
    const status404 = new Error('Status 404');
    const genericError = new Error('parse failed');
    const notAnError = 'just a string';

    assert.equal(isRetryableScrapeError(status404), false);
    assert.equal(isRetryableScrapeError(genericError), false);
    assert.equal(isRetryableScrapeError(notAnError), false);
    assert.equal(isRetryableScrapeError(null), false);
    assert.equal(isRetryableScrapeError(undefined), false);
});

test('withScrapeRetry retries a retryable failure then succeeds, counting attempts', async () => {
    const clock = makeClock();
    let attempts = 0;

    const result = await withScrapeRetry(
        async () => {
            attempts += 1;
            if (attempts < 2) {
                throw Object.assign(new Error('Status 500'), { name: 'Error' });
            }
            return ['ok'];
        },
        (value) => value.length === 0,
        clock.now() + 10_000,
        {
            now: clock.now,
            sleep: noSleep(),
            random: () => 0,
        }
    );

    assert.deepEqual(result, ['ok']);
    assert.equal(attempts, 2);
});

test('withScrapeRetry does NOT retry a resolved-empty result', async () => {
    const clock = makeClock();
    let attempts = 0;

    const result = await withScrapeRetry(
        async () => {
            attempts += 1;
            return [] as string[];
        },
        (value) => value.length === 0,
        clock.now() + 10_000,
        {
            now: clock.now,
            sleep: noSleep(),
            random: () => 0,
        }
    );

    assert.deepEqual(result, []);
    assert.equal(attempts, 1);
});

test('withScrapeRetry does NOT retry a non-retryable thrown error', async () => {
    const clock = makeClock();
    let attempts = 0;

    await assert.rejects(
        () => withScrapeRetry(
            async () => {
                attempts += 1;
                throw new Error('Status 404');
            },
            (value: string[]) => value.length === 0,
            clock.now() + 10_000,
            {
                now: clock.now,
                sleep: noSleep(),
                random: () => 0,
            }
        ),
        /Status 404/
    );

    assert.equal(attempts, 1);
});

test('withScrapeRetry short-circuits when remaining budget is below minBudgetForRetryMs', async () => {
    const clock = makeClock(0);
    let attempts = 0;

    await assert.rejects(
        () => withScrapeRetry(
            async () => {
                attempts += 1;
                throw Object.assign(new Error('Status 500'), { name: 'Error' });
            },
            (value: string[]) => value.length === 0,
            clock.now() + 500, // deadline is only 500ms away
            {
                now: clock.now,
                sleep: noSleep(),
                random: () => 0,
                minBudgetForRetryMs: 800,
            }
        ),
        /Status 500/
    );

    // Only the first attempt should run — not enough budget remains for a retry.
    assert.equal(attempts, 1);
});

test('withScrapeRetry computes backoff delay as base*2^(n-1) + jitter within bounds', async () => {
    const clock = makeClock(0);
    const sleepCalls: number[] = [];
    let attempts = 0;

    const result = await withScrapeRetry(
        async () => {
            attempts += 1;
            if (attempts < 3) {
                throw Object.assign(new Error('Status 502'), { name: 'Error' });
            }
            return ['ok'];
        },
        (value) => value.length === 0,
        clock.now() + 100_000,
        {
            now: clock.now,
            sleep: async (ms: number) => {
                sleepCalls.push(ms);
            },
            random: () => 0.5,
            baseDelayMs: 150,
            maxJitterMs: 100,
            maxAttempts: 3,
        }
    );

    assert.deepEqual(result, ['ok']);
    assert.equal(attempts, 3);
    assert.equal(sleepCalls.length, 2);

    // attempt 1 -> 2: base*2^0 + jitter(0.5*100=50) = 200
    assert.equal(sleepCalls[0], 150 * Math.pow(2, 0) + 0.5 * 100);
    // attempt 2 -> 3: base*2^1 + jitter(0.5*100=50) = 350
    assert.equal(sleepCalls[1], 150 * Math.pow(2, 1) + 0.5 * 100);

    sleepCalls.forEach((delay, index) => {
        const base = 150 * Math.pow(2, index);
        assert.ok(delay >= base, `delay ${delay} should be >= base ${base}`);
        assert.ok(delay <= base + 100, `delay ${delay} should be <= base+jitter ${base + 100}`);
    });
});

test('withScrapeRetry caps attempts at maxAttempts', async () => {
    const clock = makeClock(0);
    let attempts = 0;

    await assert.rejects(
        () => withScrapeRetry(
            async () => {
                attempts += 1;
                throw Object.assign(new Error('Status 500'), { name: 'Error' });
            },
            (value: string[]) => value.length === 0,
            clock.now() + 100_000,
            {
                now: clock.now,
                sleep: noSleep(),
                random: () => 0,
                maxAttempts: 3,
            }
        ),
        /Status 500/
    );

    assert.equal(attempts, 3);
});

test('withScrapeRetry defaults: maxAttempts 2, baseDelayMs 150, maxJitterMs 100, minBudgetForRetryMs 800', async () => {
    const clock = makeClock(0);
    let attempts = 0;
    const sleepCalls: number[] = [];

    await assert.rejects(
        () => withScrapeRetry(
            async () => {
                attempts += 1;
                throw Object.assign(new Error('Status 500'), { name: 'Error' });
            },
            (value: string[]) => value.length === 0,
            clock.now() + 100_000,
            {
                now: clock.now,
                sleep: async (ms: number) => {
                    sleepCalls.push(ms);
                },
                random: () => 0,
            }
        ),
        /Status 500/
    );

    // default maxAttempts is 2: one initial + one retry, then give up
    assert.equal(attempts, 2);
    assert.equal(sleepCalls.length, 1);
    assert.equal(sleepCalls[0], 150 * Math.pow(2, 0) + 0);
});
