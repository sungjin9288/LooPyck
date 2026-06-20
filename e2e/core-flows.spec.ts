import { test, expect } from '@playwright/test';

/**
 * Core navigation flows must actually RENDER at runtime, not just build.
 * Each test below is a regression guard for a real failure mode this app has
 * had (or could silently have): a view that compiles but paints blank.
 */

test('home renders the search view', async ({ page }) => {
    await page.goto('/');
    // Trend chips only render in the default (search) view.
    await expect(page.getByText('이번 주 트렌드')).toBeVisible();
    await expect(page.getByPlaceholder(/검색/)).toBeVisible();
});

test('추천 tab renders the recommender form via ?view=recommend (regression: blank tab)', async ({ page }) => {
    // This exact view rendered completely blank in production (AnimatePresence
    // mode="wait" deadlock). Assert the form actually appears.
    await page.goto('/?view=recommend');
    await expect(page.getByRole('heading', { name: '나만의 스타일 추천' })).toBeVisible();
    await expect(page.getByText('선호 스타일')).toBeVisible();
    await expect(page.getByRole('button', { name: /AI 스타일 추천 받기/ })).toBeVisible();
});

test('switching to 추천 via the nav renders the form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '추천', exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { name: '나만의 스타일 추천' })).toBeVisible();
});

test('favorites page renders My Lookbook', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page.getByRole('heading', { name: 'My Lookbook' })).toBeVisible();
});

test('app stays light even under OS dark preference (regression: half-baked dark mode)', async ({ page }) => {
    // Auto dark mode was removed because only ~7% of components supported it.
    // If a prefers-color-scheme rule sneaks back in, the body would flip dark.
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe('rgb(248, 250, 252)'); // slate-50 — stays light
});
