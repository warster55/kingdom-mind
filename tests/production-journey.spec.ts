import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Production Security & Journey', () => {
  
  test('Admin Access: test@kingdommind.app should enter instantly', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('https://kingdomind.com');
    
    // 2. Click "Enter the Sanctuary"
    await page.waitForSelector('[data-testid="enter-sanctuary-btn"]');
    await page.click('[data-testid="enter-sanctuary-btn"]', { force: true });

    // 3. Wait for Gatekeeper Greeting
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    // 4. Submit Admin Email
    console.log('Submitting Admin email...');
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    await chatInput.fill('test@kingdommind.app');
    await page.keyboard.press('Enter');

    // 5. Verify Transition to Sanctuary (/reflect)
    console.log('Waiting for Sanctuary redirect...');
    await page.waitForURL(/.*reflect/, { timeout: 15000 });
    
    // 6. Verify Sanctuary UI
    await expect(page.locator('h1:has-text("Kingdom Mind")')).toBeVisible();
    console.log('✅ Admin Access Verified');
  });

  test('Guest Access: Random email should be blocked/waitlisted', async ({ page }) => {
    const randomEmail = `soul-${Date.now()}@example.com`;
    
    await page.goto('https://kingdomind.com');
    await page.waitForSelector('[data-testid="enter-sanctuary-btn"]');
    await page.click('[data-testid="enter-sanctuary-btn"]');

    // Submit Random Email
    console.log(`Submitting random email: ${randomEmail}`);
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    await chatInput.fill(randomEmail);
    await page.keyboard.press('Enter');

    // Should NOT redirect to /reflect
    // Instead, the AI should respond with the waitlist message
    await page.waitForTimeout(5000); 
    expect(page.url()).not.toContain('/reflect');
    
    // Check for waitlist-style content in the chat
    const waitlistText = page.locator('text=capacity').or(page.locator('text=interest'));
    await expect(waitlistText.first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Guest Waitlist Verified');
  });

  test('Security: Direct /reflect access should redirect to Home', async ({ page }) => {
    await page.goto('https://kingdomind.com/reflect');
    await page.waitForURL('https://kingdomind.com/');
    expect(page.url()).toBe('https://kingdomind.com/');
    console.log('✅ Direct Access Protection Verified');
  });
});