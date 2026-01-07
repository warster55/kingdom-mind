
import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Full Production Journey', () => {
  
  test('Complete Path: Landing -> Gatekeeper -> Login -> Sanctuary', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('https://kingdomind.com');
    await expect(page.getByRole('heading', { name: 'Kingdom Mind' })).toBeVisible();

    // 2. Click "Enter the Sanctuary"
    console.log('Clicking Enter...');
    await page.waitForSelector('[data-testid="enter-sanctuary-btn"]');
    // Small wait for hydration
    await page.waitForTimeout(1000);
    await page.click('[data-testid="enter-sanctuary-btn"]', { force: true });

    // 3. Wait for Gatekeeper Greeting
    console.log('Waiting for Gatekeeper...');
    // The first message from the AI should appear
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    // 4. Submit Test Email
    console.log('Submitting email...');
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    await chatInput.fill('test@kingdommind.app');
    await page.keyboard.press('Enter');

    // 5. Verify Transition to Sanctuary (/reflect)
    // Note: NextAuth might redirect to a callback URL. 
    // We expect to eventually land on /reflect or see a session-active state.
    console.log('Waiting for Sanctuary redirect...');
    await page.waitForURL(/.*reflect/, { timeout: 15000 });
    
    // 6. Verify Sanctuary UI
    await expect(page.locator('h1:has-text("Kingdom Mind")')).toBeVisible();
    await expect(page.getByPlaceholder("Share what's on your heart...")).toBeVisible();
    
    console.log('✅ Full Journey Verified on Production');
  });

  test('Error Check: Check for console errors on Landing', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('https://kingdomind.com');
    await page.waitForLoadState('networkidle');
    
    if (errors.length > 0) {
      console.log('Production Console Errors:', errors);
    }
    expect(errors.filter(e => !e.includes('chrome-extension')).length).toBe(0);
  });
});
