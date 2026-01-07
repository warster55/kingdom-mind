
import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Full Production Journey', () => {
  
  test('Complete Path: Landing -> Gatekeeper -> Login -> Sanctuary', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('https://kingdomind.com');
    await expect(page.getByRole('heading', { name: 'Kingdom Mind' })).toBeVisible();

    // 2. Click "Enter the Sanctuary"
    console.log('Clicking Enter...');
    await page.click('text=Enter the Sanctuary');

    // 3. Wait for Gatekeeper Greeting
    console.log('Waiting for Gatekeeper...');
    const gatekeeperMsg = page.locator('div:has-text("threshold of the sanctuary")').first();
    await expect(gatekeeperMsg).toBeVisible({ timeout: 10000 });
    
    // 4. Submit Test Email
    console.log('Submitting email...');
    const chatInput = page.getByPlaceholder('Type a message...');
    await chatInput.fill('test@kingdommind.app');
    await page.keyboard.press('Enter');

    // 5. Verify Transition to Sanctuary (/reflect)
    // Note: NextAuth might redirect to a callback URL. 
    // We expect to eventually land on /reflect or see a session-active state.
    console.log('Waiting for Sanctuary redirect...');
    await page.waitForURL(/.*reflect/, { timeout: 15000 });
    
    // 6. Verify Sanctuary UI
    await expect(page.locator('text=Mentoring Session')).toBeVisible();
    await expect(page.locator('text=Active Focus')).toBeVisible();
    
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
