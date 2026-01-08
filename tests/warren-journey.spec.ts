
import { test, expect } from '@playwright/test';

test.describe('Warren Moore - Personal Journey Simulation', () => {
  
  test('Warren Login & Spiral Check', async ({ page }) => {
    // 1. Navigate to Landing
    await page.goto('/');
    
    // 2. Click Enter
    const enterBtn = page.locator('button').filter({ hasText: /Enter|Sanctuary/i }).first();
    await enterBtn.waitFor({ state: 'visible', timeout: 15000 });
    await enterBtn.click({ force: true });

    // 3. Login Flow
    const input = page.locator('textarea').first();
    await expect(input).toBeVisible();
    
    console.log('Logging in as Warren...');
    await input.fill('wmoore@securesentrypro.com');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(2000); // Wait for transition
    
    await input.fill('000000'); // Local Skeleton Key
    await page.keyboard.press('Enter');

    // 4. Verify Sanctuary Entry
    await page.waitForURL(/.*reflect/, { timeout: 30000 });
    console.log('✅ Warren is in the Sanctuary.');

    // 5. Ask: "Where am I?"
    await page.waitForTimeout(3000);
    console.log('Asking about Spiral location...');
    await input.fill('Where am I in the Spiral right now?');
    await page.keyboard.press('Enter');

    // 6. Verify Mentor Response
    console.log('Waiting for Mentor response...');
    const mentorText = page.locator('[data-testid="ai-response"]');
    // Wait for text to actually populate (streaming takes time)
    await expect(mentorText).toBeVisible({ timeout: 20000 });
    await expect(mentorText).not.toBeEmpty();
    
    await page.waitForTimeout(2000); // Let it finish streaming
    const textContent = await mentorText.textContent();
    console.log(`🕊️ Mentor Said: "${textContent}"`);
    
    // Simple check to ensure it mentioned a domain or pillar
    // (Since you are new locally, it should say Identity or Origin)
    expect(textContent).toMatch(/Identity|Origin|Purpose|Pillar/i);
  });

  test('Warren Purpose Challenge', async ({ page }) => {
    // Note: Assuming session persistence or re-login handled by global setup or rapid re-entry
    // Ideally we'd use 'storageState', but for simplicity we'll just re-login quickly.
    await page.goto('/');
    const enterBtn = page.locator('button').filter({ hasText: /Enter|Sanctuary/i }).first();
    if (await enterBtn.isVisible()) {
        await enterBtn.click();
        const input = page.locator('textarea').first();
        await input.fill('wmoore@securesentrypro.com');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        await input.fill('000000');
        await page.keyboard.press('Enter');
        await page.waitForURL(/.*reflect/);
    }

    const input = page.locator('textarea').first();
    console.log('Asking about Purpose...');
    await input.fill('I feel stuck on my purpose. I want to build something huge but I am tired.');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(10000);
    const mentorText = page.locator('.font-serif').last();
    await expect(mentorText).toBeVisible();
    const response = await mentorText.textContent();
    console.log(`🕊️ Mentor Said: "${response}"`);
  });

});
