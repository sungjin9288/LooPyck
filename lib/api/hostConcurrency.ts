/**
 * Per-host concurrency limiter.
 *
 * A simple counting semaphore with a FIFO waiter queue. Used to cap how many in-flight
 * requests we make to a single external host at once, independent of the overall
 * Promise.all fan-out across sources.
 */

export interface Semaphore {
    acquire(): Promise<() => void>;
    run<T>(task: () => Promise<T>): Promise<T>;
}

class CountingSemaphore implements Semaphore {
    private active = 0;
    private readonly waiters: Array<() => void> = [];
    private readonly maxConcurrent: number;

    constructor(maxConcurrent: number) {
        this.maxConcurrent = maxConcurrent;
    }

    acquire(): Promise<() => void> {
        return new Promise((resolve) => {
            const tryAcquire = () => {
                this.active += 1;
                let released = false;
                resolve(() => {
                    if (released) return;
                    released = true;
                    this.release();
                });
            };

            if (this.active < this.maxConcurrent) {
                tryAcquire();
            } else {
                this.waiters.push(tryAcquire);
            }
        });
    }

    private release(): void {
        this.active -= 1;
        const next = this.waiters.shift();
        if (next) {
            next();
        }
    }

    async run<T>(task: () => Promise<T>): Promise<T> {
        const release = await this.acquire();
        try {
            return await task();
        } finally {
            release();
        }
    }
}

export function createSemaphore(maxConcurrent: number): Semaphore {
    return new CountingSemaphore(Math.max(1, maxConcurrent));
}

const DEFAULT_HOST_CONCURRENCY_CAP = 2;
const hostLimiters = new Map<string, Semaphore>();

export function getHostLimiter(host: string, defaultCap: number = DEFAULT_HOST_CONCURRENCY_CAP): Semaphore {
    const existing = hostLimiters.get(host);
    if (existing) {
        return existing;
    }

    const limiter = createSemaphore(defaultCap);
    hostLimiters.set(host, limiter);
    return limiter;
}

export function hostnameFromUrl(url: string): string {
    try {
        return new URL(url).hostname.toLowerCase();
    } catch {
        return '';
    }
}
