import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke tests for core user flows.
 *
 * These are deterministic and do NOT depend on external APIs (search / Gemini /
 * Firebase). Their job is to guard against *rendering* regressions — a route or
 * view that builds fine but renders blank at runtime — which the 282 pure-function
 * unit tests cannot catch. The blank "추천" tab (AnimatePresence deadlock) shipped
 * for exactly this reason; the spec here would have failed on it.
 *
 * Run: `npm run test:e2e` (starts `next dev` on port 3210 automatically).
 */
export default defineConfig({
    testDir: './e2e',
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    // CI additionally emits an HTML report so a failure is debuggable from the
    // uploaded artifact; local runs stay lightweight with console-only output.
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:3210',
        trace: 'on-first-retry',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        // CI runs against the production build (deterministic, no on-demand
        // compilation); locally `next dev` is faster and needs no prior build.
        command: process.env.CI ? 'npx next start --port 3210' : 'npx next dev --port 3210',
        url: 'http://localhost:3210',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
