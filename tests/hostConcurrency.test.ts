import assert from 'node:assert/strict';
import test from 'node:test';
import {
    createSemaphore,
    getHostLimiter,
    hostnameFromUrl,
} from '../lib/api/hostConcurrency.ts';

function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

test('semaphore never exceeds the configured concurrency cap', async () => {
    const sem = createSemaphore(2);
    let live = 0;
    let maxLive = 0;

    const task = async () => {
        live += 1;
        maxLive = Math.max(maxLive, live);
        await new Promise((resolve) => setTimeout(resolve, 10));
        live -= 1;
        return 'done';
    };

    await Promise.all([
        sem.run(task),
        sem.run(task),
        sem.run(task),
        sem.run(task),
        sem.run(task),
    ]);

    assert.ok(maxLive <= 2, `expected maxLive <= 2, got ${maxLive}`);
});

test('semaphore releases the slot on success', async () => {
    const sem = createSemaphore(1);

    await sem.run(async () => 'first');
    // If the slot wasn't released, this would hang forever — race against a timeout.
    const second = await Promise.race([
        sem.run(async () => 'second'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('deadlock')), 200)),
    ]);

    assert.equal(second, 'second');
});

test('semaphore releases the slot on rejection (no deadlock)', async () => {
    const sem = createSemaphore(1);

    await assert.rejects(() => sem.run(async () => {
        throw new Error('boom');
    }));

    const result = await Promise.race([
        sem.run(async () => 'recovered'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('deadlock')), 200)),
    ]);

    assert.equal(result, 'recovered');
});

test('semaphore queues tasks beyond the cap and all eventually run', async () => {
    const sem = createSemaphore(2);
    const completedOrder: number[] = [];
    const gates = [deferred<void>(), deferred<void>(), deferred<void>(), deferred<void>()];

    const runs = gates.map((gate, index) =>
        sem.run(async () => {
            await gate.promise;
            completedOrder.push(index);
            return index;
        })
    );

    // Release gates in reverse — regardless of order, all 4 must eventually complete.
    gates.forEach((gate) => gate.resolve());

    const results = await Promise.all(runs);
    assert.deepEqual(results, [0, 1, 2, 3]);
    assert.equal(completedOrder.length, 4);
});

test('acquire() returns a release function usable directly', async () => {
    const sem = createSemaphore(1);
    const release = await sem.acquire();
    assert.equal(typeof release, 'function');

    let secondAcquired = false;
    const secondAcquirePromise = sem.acquire().then((releaseSecond) => {
        secondAcquired = true;
        releaseSecond();
    });

    // Give the event loop a tick — second acquire should still be pending.
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(secondAcquired, false);

    release();
    await secondAcquirePromise;
    assert.equal(secondAcquired, true);
});

test('getHostLimiter gives independent caps per host', async () => {
    const hostA = `test-host-a-${Date.now()}.example.com`;
    const hostB = `test-host-b-${Date.now()}.example.com`;

    const limiterA = getHostLimiter(hostA, 1);
    const limiterB = getHostLimiter(hostB, 1);

    let liveA = 0;
    let maxLiveA = 0;
    let liveB = 0;
    let maxLiveB = 0;

    const taskA = async () => {
        liveA += 1;
        maxLiveA = Math.max(maxLiveA, liveA);
        await new Promise((resolve) => setTimeout(resolve, 20));
        liveA -= 1;
    };
    const taskB = async () => {
        liveB += 1;
        maxLiveB = Math.max(maxLiveB, liveB);
        await new Promise((resolve) => setTimeout(resolve, 20));
        liveB -= 1;
    };

    await Promise.all([
        limiterA.run(taskA),
        limiterA.run(taskA),
        limiterB.run(taskB),
        limiterB.run(taskB),
    ]);

    assert.ok(maxLiveA <= 1, `expected host A maxLive <= 1, got ${maxLiveA}`);
    assert.ok(maxLiveB <= 1, `expected host B maxLive <= 1, got ${maxLiveB}`);
});

test('getHostLimiter returns the same limiter instance for the same host', () => {
    const host = `test-host-same-${Date.now()}.example.com`;
    const limiter1 = getHostLimiter(host);
    const limiter2 = getHostLimiter(host);
    assert.equal(limiter1, limiter2);
});

test('getHostLimiter defaults to a cap of 2', async () => {
    const host = `test-host-default-cap-${Date.now()}.example.com`;
    const limiter = getHostLimiter(host);
    let live = 0;
    let maxLive = 0;

    const task = async () => {
        live += 1;
        maxLive = Math.max(maxLive, live);
        await new Promise((resolve) => setTimeout(resolve, 10));
        live -= 1;
    };

    await Promise.all([limiter.run(task), limiter.run(task), limiter.run(task), limiter.run(task)]);
    assert.ok(maxLive <= 2, `expected default cap maxLive <= 2, got ${maxLive}`);
});

test('hostnameFromUrl extracts the lowercase hostname', () => {
    assert.equal(hostnameFromUrl('https://www.MUSINSA.com/search?keyword=x'), 'www.musinsa.com');
    assert.equal(hostnameFromUrl('https://search-api.29cm.co.kr/api/v4/products/search'), 'search-api.29cm.co.kr');
});

test('hostnameFromUrl returns empty string on parse failure', () => {
    assert.equal(hostnameFromUrl('not a url'), '');
    assert.equal(hostnameFromUrl(''), '');
});
