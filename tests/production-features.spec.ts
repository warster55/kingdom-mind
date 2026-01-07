import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Full Feature Verification (Production)', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Secure Entry with Master Key
    await page.goto('https://kingdomind.com');
    await page.waitForSelector('[data-testid="enter-sanctuary-btn"]');
    await page.click('[data-testid="enter-sanctuary-btn"]', { force: true });
    
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    await chatInput.fill('arcane-guardian-9921@kingdomind.com');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('text=sign-in code')).toBeVisible({ timeout: 15000 });
    await chatInput.fill('992100');
    await page.keyboard.press('Enter');
    
    await page.waitForURL(/.*reflect/, { timeout: 15000 });
  });

  test('Intelligence: AI should know status and sync with Sidebar', async ({ page }) => {
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    
    console.log('Testing User Status sync...');
    await chatInput.fill('Where am I in my journey right now?');
    await page.keyboard.press('Enter');

    // Look at the LAST prose element (the AI response)
    const lastResponse = page.locator('.prose').last();
    await expect(lastResponse).toContainText(/Identity/i, { timeout: 30000 });
    
    const activeDomain = page.locator('.opacity-100.scale-105');
    await expect(activeDomain).toContainText('Identity');
  });

  test('Wisdom: AI should fetch contextually relevant scripture', async ({ page }) => {
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    
    console.log('Testing seekWisdom tool...');
    await chatInput.fill('Find me a Bible verse about my identity.');
    await page.keyboard.press('Enter');

    // AI should provide a scripture reference
    const lastResponse = page.locator('.prose').last();
    await expect(lastResponse).toContainText(/\d+:\d+|Genesis|Psalm|John|Romans/i, { timeout: 30000 });
    console.log('✅ AI Wisdom Search Verified');
  });

  test('Sovereignty: Admin should be able to peep the gates', async ({ page }) => {
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    
    console.log('Testing peepTheGates Admin tool...');
    await chatInput.fill('Who is currently waiting at the gates?');
    await page.keyboard.press('Enter');

    const lastResponse = page.locator('.prose').last();
    await expect(lastResponse).toContainText(/waitlist|pending|emails|capacity/i, { timeout: 30000 });
    console.log('✅ Admin Sovereignty Verified');
  });

  test('System: AI should be able to clear the sanctuary', async ({ page }) => {
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    
    console.log('Testing clearSanctuary tool...');
    await chatInput.fill('Please clear the sanctuary.');
    await page.keyboard.press('Enter');

    // Wait for the page to refresh/reload
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const messages = page.locator('.prose');
    // It should be back to the greeting message only
    expect(await messages.count()).toBeLessThan(3);
    console.log('✅ Sanctuary Reset Verified');
  });
});