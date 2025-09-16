import { test, expect } from '@playwright/test';

test.describe('Smoke Tests @smoke', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/Crowe Logic/);
    
    // Check main heading is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('API health check returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status');
  });

  test('navigation links work', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to Agriculture
    await page.click('text=Agriculture');
    await expect(page).toHaveURL(/.*agriculture/);
    
    // Test navigation to ML Lab
    await page.goto('/');
    await page.click('text=ML Lab');
    await expect(page).toHaveURL(/.*ml-lab/);
  });

  test('responsive design works', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });
});
