/**
 * Pure retry helper for scrape/fetch executors.
 *
 * Retries ONLY on thrown retryable errors (network hiccups, timeouts, 5xx/429 responses).
 * A resolved value — even an "empty" one per the caller's `isEmptyResult` predicate — is
 * returned as-is and never retried; emptiness is a legitimate outcome, not a failure.
 *
 * All timing/randomness is injectable (`now`, `sleep`, `random`) so tests run deterministically
 * with no real timers.
 */

export interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxJitterMs?: number;
    minBudgetForRetryMs?: number;
    isRetryable?: (error: unknown) => boolean;
    now?: () => number;
    sleep?: (ms: number) => Promise<void>;
    random?: () => number;
}

const DEFAULT_MAX_ATTEMPTS = 2;
const DEFAULT_BASE_DELAY_MS = 150;
const DEFAULT_MAX_JITTER_MS = 100;
const DEFAULT_MIN_BUDGET_FOR_RETRY_MS = 800;

const RETRYABLE_ERROR_NAMES = new Set(['AbortError', 'TimeoutError']);
const RETRYABLE_STATUS_PATTERN = /Status (5\d\d|429)/;

function defaultSleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableScrapeError(error: unknown): boolean {
    if (error instanceof TypeError) {
        // fetch() throws a TypeError for network-level failures (DNS, connection reset, etc.)
        return true;
    }

    if (error instanceof Error) {
        if (RETRYABLE_ERROR_NAMES.has(error.name)) {
            return true;
        }
        if (RETRYABLE_STATUS_PATTERN.test(error.message)) {
            return true;
        }
        return false;
    }

    return false;
}

function computeBackoffDelayMs(attemptNumber: number, baseDelayMs: number, maxJitterMs: number, random: () => number): number {
    const exponential = baseDelayMs * Math.pow(2, attemptNumber - 1);
    const jitter = random() * maxJitterMs;
    return exponential + jitter;
}

/**
 * Runs `task`, retrying only on thrown errors that `isRetryable` accepts, up to `maxAttempts`
 * total attempts (initial + retries). A resolved value is always returned immediately,
 * regardless of `isEmptyResult` — emptiness does not trigger a retry.
 *
 * Before each retry, if the remaining budget (`budgetDeadlineMs - now()`) is below
 * `minBudgetForRetryMs`, OR below the computed backoff delay, the retry is skipped and the
 * last error is re-thrown.
 */
export async function withScrapeRetry<T>(
    task: () => Promise<T>,
    isEmptyResult: (value: T) => boolean,
    budgetDeadlineMs: number,
    options: RetryOptions = {}
): Promise<T> {
    // isEmptyResult is intentionally accepted for API completeness/future use (e.g. logging
    // or metrics on empty-vs-error outcomes) — it does not gate retry behavior here since
    // resolved-empty results are never retried.
    void isEmptyResult;

    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const maxJitterMs = options.maxJitterMs ?? DEFAULT_MAX_JITTER_MS;
    const minBudgetForRetryMs = options.minBudgetForRetryMs ?? DEFAULT_MIN_BUDGET_FOR_RETRY_MS;
    const isRetryable = options.isRetryable ?? isRetryableScrapeError;
    const now = options.now ?? Date.now;
    const sleep = options.sleep ?? defaultSleep;
    const random = options.random ?? Math.random;

    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
        attempt += 1;
        try {
            return await task();
        } catch (error) {
            lastError = error;

            if (!isRetryable(error)) {
                throw error;
            }

            if (attempt >= maxAttempts) {
                break;
            }

            const remainingBudgetMs = budgetDeadlineMs - now();
            const delayMs = computeBackoffDelayMs(attempt, baseDelayMs, maxJitterMs, random);

            if (remainingBudgetMs < minBudgetForRetryMs || remainingBudgetMs < delayMs) {
                break;
            }

            await sleep(delayMs);
        }
    }

    throw lastError;
}
