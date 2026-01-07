
import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Production Health', () => {
  
  test('Visuals: Verify CSS and Fonts load over HTTPS', async ({ page }) => {
    await page.goto('/');
    
    // 1. Check title visibility (Standard check)
    const title = page.getByRole('heading', { name: 'Kingdom Mind' });
    await expect(title).toBeVisible();

    // 2. Verify Computed Styles (Ensures Tailwind actually processed)
    // Checking for our specific stone-50 background variable
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('Production Body BG:', bodyBg);
    // rgb(250, 250, 249) is stone-50
    expect(bodyBg).toBe('rgb(250, 250, 249)');

    // 3. Verify Font (Crimson Pro)
    const fontFamily = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    console.log('Production Font Family:', fontFamily);
    expect(fontFamily).toContain('Crimson Pro');
  });

  test('Security: Check for HTTPS redirect', async ({ page }) => {
    // If we try to go to http, it should redirect to https
    await page.goto('http://kingdomind.com', { waitUntil: 'networkidle' });
    expect(page.url()).toContain('https://');
  });

  test('Auth: Live Login Flow', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Enter the Sanctuary', { force: true });
    
    // Check if we reach the sign-in page without a 500 error
    await expect(page).toHaveURL(/.*auth\/signin/);
    
    // Try a dummy login to check for 401 vs 500
    await page.fill('input[name="email"]', 'prod-test@kingdommind.app');
    await page.fill('input[name="password"]', 'wrong-pass');
    await page.click('button[type="submit"]', { force: true });

    // It should stay on signin with an error, not crash
    await expect(page).toHaveURL(/.*error=CredentialsSignin/);
  });

  test('Performance: Page load speed', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const duration = Date.now() - start;
    console.log(`Landing page loaded in ${duration}ms`);
    expect(duration).toBeLessThan(3000); // Should load in under 3s
  });
});
