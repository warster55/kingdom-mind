
import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Production Master Security & Journey', () => {
  
  test('Master Bypass: arcane-guardian-9921 should enter with master code', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('https://kingdomind.com');
    
    // 2. Click "Enter the Sanctuary"
    await page.waitForSelector('[data-testid="enter-sanctuary-btn"]');
    await page.click('[data-testid="enter-sanctuary-btn"]', { force: true });

    // 3. Wait for Gatekeeper Greeting
    await expect(page.locator('.prose')).toBeVisible({ timeout: 15000 });
    
    // 4. Submit Master Email
    console.log('Submitting Master email...');
    const chatInput = page.getByPlaceholder("Share what's on your heart...");
    await chatInput.fill('arcane-guardian-9921@kingdomind.com');
    await page.keyboard.press('Enter');

    // 5. Wait for Code Request UI
    console.log('Waiting for code request...');
    await expect(page.locator('text=sign-in code')).toBeVisible({ timeout: 10000 });

    // 6. Submit Master Code
    console.log('Submitting Master code...');
    await chatInput.fill('992100');
    await page.keyboard.press('Enter');

    // 7. Verify Transition to Sanctuary (/reflect)
    console.log('Waiting for Sanctuary redirect...');
    await page.waitForURL(/.*reflect/, { timeout: 15000 });
    
    // 8. Verify Sanctuary UI (Journey Sidebar and Header)
    await expect(page.locator('h1:has-text("Kingdom Mind")')).toBeVisible();
    await expect(page.locator('text=The Journey')).toBeVisible();
    
    console.log('✅ Master Bypass Verified');
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
