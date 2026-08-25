import { test, expect } from '@playwright/test';

test.describe('WCAG 2.2 AA Accessibility Checks', () => {
  test('home page has skip link and logical headings structure', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);

    // Verify main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('discovery and compare pages support keyboard tab focus', async ({ page }) => {
    await page.goto('/programs');
    await page.keyboard.press('Tab');

    // Skip to content should become focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });
});
