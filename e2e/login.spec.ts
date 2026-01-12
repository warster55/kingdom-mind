import { test, expect } from '@playwright/test';

test('verify production login failure', async ({ page }) => {
  // 1. Visit production
  await page.goto('https://kingdomind.com');
  
  console.log('Page loaded. Checking title...');
  await expect(page).toHaveTitle(/Kingdom Mind/);

  // 2. Click Enter
  await page.click('button:has-text("Enter the Sanctuary")');

  // 3. Type Email
  await page.fill('input[placeholder*="email"]', 'wmoore@securesentrypro.com');
  await page.keyboard.press('Enter');

  // 4. Wait for response and capture error
  console.log('OTP Requested. Waiting for server response...');
  await page.waitForTimeout(3000);

  // Take screenshot of the error state
  await page.screenshot({ path: 'test-results/production-login-failure.png' });
  
  // Check for error text in the UI
  // Note: if it's a 500, the frontend might show a generic "Something went wrong" or nothing.
});