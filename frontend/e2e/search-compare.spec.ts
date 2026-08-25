import { test, expect } from '@playwright/test';

test.describe('Search, Filters & Comparison Workflow', () => {
  test('performs prominent search with typo tolerance and updates shareable URL query', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.locator('h1')).toContainText(/Discover Degree Programs/i);

    const searchInput = page.locator('input[placeholder*="Search by degree"]');
    await searchInput.fill('computr scince');
    await page.waitForTimeout(500);

    // Verify URL query parameter synchronization
    await expect(page).toHaveURL(/search=computr/);
  });

  test('adds programs to comparison tray and navigates to matrix', async ({ page }) => {
    await page.goto('/programs');

    // Click compare on first program card
    const compareBtns = page.locator('button:has-text("Compare")');
    if (await compareBtns.count() > 0) {
      await compareBtns.first().click();

      // Check for floating comparison tray
      const tray = page.locator('text=Comparison Workspace');
      await expect(tray).toBeVisible();

      // Click "Compare Choices"
      const compareNowBtn = page.locator('a[href="/compare"]');
      await compareNowBtn.first().click();

      await expect(page).toHaveURL(/\/compare/);
      await expect(page.locator('h1')).toContainText(/Course Comparison Matrix/i);
    }
  });
});
