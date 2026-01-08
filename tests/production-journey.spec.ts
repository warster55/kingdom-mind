import { test, expect } from '@playwright/test';

test.describe('Kingdom Mind - Infinite Horizon OS Production Verification', () => {
  
  test('Sanctuary Access: Master Account should enter the Infinite Horizon', async ({ page }) => {
    // 1. Visit Landing Page
    console.log('Navigating to https://kingdomind.com');
    await page.goto('https://kingdomind.com');
    
    // 2. Click "Enter the Sanctuary" (Welcome Page)
    const enterBtn = page.locator('button').filter({ hasText: /Enter|Sanctuary/i }).first();
    await enterBtn.waitFor({ state: 'visible', timeout: 15000 });
    await enterBtn.click({ force: true });

    // 3. Wait for Gatekeeper Input (This was the bug, now fixed)
    console.log('Waiting for email input...');
    const gatekeeperInput = page.locator('textarea').first();
    await expect(gatekeeperInput).toBeVisible({ timeout: 15000 });
    
    // 4. Submit Master Email
    console.log('Submitting Master email...');
    await gatekeeperInput.fill('arcane-guardian-9921@kingdomind.com');
    await page.keyboard.press('Enter');

    // 5. Wait for Code Request UI
    console.log('Waiting for code request...');
    // We can check if the placeholder changed to "Enter the 6-digit code..."
    // or wait for the system to process.
    await page.waitForTimeout(4000);
    
    // 6. Submit Master Code
    console.log('Submitting Master code...');
    await gatekeeperInput.fill('992100');
    await page.keyboard.press('Enter');

    // 7. Verify Transition to Sanctuary (/reflect)
    console.log('Waiting for Sanctuary redirect...');
    await page.waitForURL(/.*reflect/, { timeout: 30000 });
    
    // 8. Verify Infinite Horizon UI
    console.log('Verifying Infinite Horizon elements...');
    
    // Check for the "Kingdom Mind" minimalist header
    await expect(page.locator('h1').filter({ hasText: 'Kingdom Mind' })).toBeVisible();
    
    // Check for the Persistent Input (The "Bridge") at the bottom
    const sanctuaryInput = page.locator('textarea').first();
    await expect(sanctuaryInput).toBeVisible();
    
    // Check for the Star Map Canvas (The "Universe")
    await expect(page.locator('canvas')).toBeVisible();

    console.log('✅ Access & UI Verified');
  });

  test('Fluid Reality: Conversation Flow', async ({ page }) => {
    // Re-login shortcut logic for isolated test context
    await page.goto('https://kingdomind.com');
    const enterBtn = page.locator('button').filter({ hasText: /Enter|Sanctuary/i }).first();
    // Fast-forward login if already possible or re-do
    if (await enterBtn.isVisible()) {
        await enterBtn.click();
        const gatekeeperInput = page.locator('textarea').first();
        await gatekeeperInput.fill('arcane-guardian-9921@kingdomind.com');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        await gatekeeperInput.fill('992100');
        await page.keyboard.press('Enter');
        await page.waitForURL(/.*reflect/, { timeout: 30000 });
    }

    // 2. Send a Message
    console.log('Testing "One-Way Launch"...');
    const input = page.locator('textarea').first();
    await input.fill('I am testing the horizon.');
    await page.keyboard.press('Enter');

    // 3. Verify Input Clears Immediately (One-Way Launch)
    await expect(input).toBeEmpty();
    
    // 4. Verify "Echo" appears (The temporary user text)
    // The echo is a div with specific styling, we look for the text content
    const echo = page.locator('text=I am testing the horizon');
    await expect(echo).toBeVisible();

    // 5. Wait for Mentor Response (The Condensation)
    console.log('Waiting for Mentor response...');
    // We give it time for the "Peaceful Streamer" to start rendering
    await page.waitForTimeout(8000); 
    
    // The AI text is usually in a div with font-serif class
    // We ensure something new appeared.
    const mentorText = page.locator('.font-serif').last(); 
    await expect(mentorText).toBeVisible();
    
    console.log('✅ Flow Verified');
  });
});