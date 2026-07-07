import { test, expect } from '@playwright/test';

/**
 * Entry-surface render guards — UAT quick-pass 수동 체크리스트 중 결정적으로
 * (외부 API 결과 없이) 검증 가능한 항목의 자동화.
 *
 * 의도적으로 제외한 체크리스트 항목과 사유:
 * - "guest shortlist 재진입 유지": shortlist 담기는 라이브 검색 결과의
 *   compare-ready 카드가 필요 — CI(무자격증명) 환경에서 비결정적.
 * - "정렬 유지": 정렬 UI는 검색 결과 존재 시에만 렌더 — 동일 사유.
 * 두 항목은 UAT 수동 패스(ntl:uat)에 남는다.
 */

test('brand compare entry renders hero and CTA on /brand/musinsa', async ({ page }) => {
    await page.goto('/brand/musinsa');
    // SUN-11 다크 히어로의 ROUTE 칩 + 비교 CTA — 정적 콘텐츠라 결정적.
    // CTA는 시나리오 카드마다 반복되므로 first()로 존재만 가드.
    await expect(page.getByText(/^ROUTE /)).toBeVisible();
    await expect(page.getByText('바로 비교하기').first()).toBeVisible();
});

test('category compare entry renders hero and CTA on /category/sneakers', async ({ page }) => {
    await page.goto('/category/sneakers');
    await expect(page.getByText(/^ROUTE /)).toBeVisible();
    await expect(page.getByText('바로 비교하기').first()).toBeVisible();
});

test('search query persists in URL and survives back-navigation', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/검색/);
    await input.fill('테스트 후드');
    await input.press('Enter');
    // URL ?q= 동기화 (결과 로딩 여부와 무관한 UI 상태 계약)
    await expect(page).toHaveURL(/q=/);

    await page.goto('/favorites');
    await page.goBack();
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByPlaceholder(/검색/)).toHaveValue(/테스트/);
});

test('login page renders the editorial auth card', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('LooPyck Auth')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Google Sign-In' })).toBeVisible();
});

test('unknown route renders the custom 404 page', async ({ page }) => {
    await page.goto('/definitely-not-a-real-page-xyz');
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없어요' })).toBeVisible();
});

/**
 * 시각 회귀 가드 — 픽셀 스냅샷 대신 계산된 스타일 단언.
 * 픽셀 diff는 macOS(로컬)/Linux(CI) 폰트 렌더링 차이로 비결정적이라
 * 이 리포의 E2E 원칙(결정적)에 맞지 않는다. core-flows의 라이트 테마
 * bodyBg 가드와 같은 패턴으로, 디자인 토큰이 실제로 페인트되는지 본다.
 */
test('compare entry keeps the neon CTA token (visual regression: editorial palette)', async ({ page }) => {
    await page.goto('/brand/musinsa');
    const cta = page.getByText('바로 비교하기').first();
    await expect(cta).toBeVisible();
    const color = await cta.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(244, 255, 58)'); // #F4FF3A — 네온 팝 CTA
});
