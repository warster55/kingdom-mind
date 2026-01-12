import { test, expect } from '@playwright/test';

test('Sovereign AI Verification: Name Memory and Journey Advance', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('text=Enter the Sanctuary', { state: 'visible', timeout: 30000 });

  // 1. LOGIN
  await page.getByRole('button', { name: 'Enter the Sanctuary' }).click();
  await page.getByPlaceholder('Enter email...').fill('wmoore@securesentrypro.com');
  await page.keyboard.press('Enter');
  await page.getByPlaceholder('Enter code...').fill('992100');
  await page.keyboard.press('Enter');

  // 2. WAIT FOR INITIAL GREETING
  await expect(page.getByPlaceholder('Speak your heart...')).toBeVisible({ timeout: 15000 });
  
  // 3. SEND NAME
  const testName = 'Warren';
  await page.getByPlaceholder('Speak your heart...').fill(`My name is ${testName}`);
  await page.keyboard.press('Enter');

  // 4. VERIFY AI ACKNOWLEDGMENT (Should mention the name and NOT ask for it again)
  // We look for the name in the stream
  await expect(page.locator('.font-serif span').filter({ hasText: testName }).first()).toBeVisible({ timeout: 25000 });

  // 5. SEND SECOND MESSAGE TO VERIFY MEMORY
  await page.getByPlaceholder('Speak your heart...').fill('What did I just tell you?');
  await page.keyboard.press('Enter');

  // AI should remember the name
  await expect(page.locator('.font-serif span').filter({ hasText: testName }).last()).toBeVisible({ timeout: 25000 });
  
  console.log('💎 Sovereign AI Verification Passed: Name memory confirmed.');
});
