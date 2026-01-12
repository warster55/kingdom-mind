import { test, expect } from '@playwright/test';

test('verify application is in dark mode', async ({ page }) => {
  // 1. Go to the root (Welcome Page)
  await page.goto('http://localhost:4000');
  
  console.log('Welcome Page Loaded.');
  await page.waitForTimeout(1000);

  // 2. Capture Screenshot
  await page.screenshot({ path: 'test-results/theme-verification.png' });

  // 3. Verify Background Color (Obsidian #0c0a09)
  // We check the computed style of the body
  const backgroundColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });

  console.log(`Detected Background Color: ${backgroundColor}`);
  
  // rgb(12, 10, 9) is the RGB equivalent of #0c0a09
  expect(backgroundColor).toBe('rgb(12, 10, 9)');
  
  console.log('✅ PASS: Application is locked in Obsidian Dark Mode.');
});
