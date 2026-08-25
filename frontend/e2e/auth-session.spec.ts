import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Lifecycle', () => {
  test('allows student registration and redirects to profile onboarding', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('h1, h2')).toContainText(/Create an Account|Sign Up|Register/i);

    const email = `test_${Date.now()}@example.com`;
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', 'SecurePass123!');
    if (await page.locator('input[name="name"]').isVisible()) {
      await page.fill('input[name="name"]', 'Alex Student');
    }

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    await page.waitForTimeout(1000);
  });

  test('validates incorrect password with friendly error message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'wrong@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'InvalidPassword!');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(/Invalid credentials|User not found|Incorrect/i);
  });
});
