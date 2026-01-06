
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Kingdom Mind - Golden Path', () => {
  const testEmail = 'test@kingdommind.app';

  test.setTimeout(60000);

  test.beforeAll(async () => {
    // Ensure test user exists in DB
    execSync(`npm run test:factory -- create-user ${testEmail}`);
  });

  test('Reflect Space: Message and AI Response', async ({ page }) => {
    // Capture browser logs for debugging
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log('Navigating straight to /reflect (Authenticated)');
    await page.goto('/reflect');
    
    // 1. Verify we are in the Sanctuary
    await expect(page).toHaveURL(/.*reflect/);
    await expect(page.getByText(/Peace be with you/i)).toBeVisible({ timeout: 15000 });

    // 2. Send a message
    console.log('Sending message to Mentor...');
    const chatInput = page.locator('textarea[placeholder*="heart"]');
    await chatInput.fill('I am ready to begin my transformation.');
    
    // Layer 2: Intercept and add test header for AI mocking
    await page.route('**/api/mentoring/chat', async route => {
      const headers = { ...route.request().headers(), 'x-test-mode': 'true' };
      await route.continue({ headers });
    });

    await page.keyboard.press('Enter');

    // 3. Verify Mocked AI Response
    console.log('Waiting for AI response...');
    // We defined the mock in the API to contain "mocked AI response"
    await expect(page.getByText(/mocked AI response/i)).toBeVisible({ timeout: 15000 });
    
    // 4. Verify Command System
    console.log('Verifying commands...');
    await chatInput.fill('/');
    await expect(page.getByText('My Status')).toBeVisible();
    await expect(page.getByText('Toggle Theme')).toBeVisible();
    
    console.log('✅ Journey Verified.');
  });
});
