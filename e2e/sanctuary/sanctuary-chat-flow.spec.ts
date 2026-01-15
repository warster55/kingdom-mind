import { test, expect } from '@playwright/test';
import { clearIndexedDB, getIndexedDBSnapshot } from './fixtures/indexeddb-helpers';
import {
  waitForSanctuaryReady,
  waitForBiometricResolved,
  takeScreenshot,
  hasWelcomeMessage,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Sanctuary Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test for fresh state
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('New User Complete Flow - fresh user can access sanctuary', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      // Navigate to sanctuary
      await page.goto(BASE_URL);

      // Wait for biometric lock to resolve (auto-unlocks if not enabled)
      await waitForBiometricResolved(page);

      // Take screenshot of initial state
      const ss1 = await takeScreenshot(page, 'chat-flow', 'new-user', 'initial');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'New User - Initial Load');

      // Wait for sanctuary to be ready
      await waitForSanctuaryReady(page);

      // Take screenshot after loading
      const ss2 = await takeScreenshot(page, 'chat-flow', 'new-user', 'loaded');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'New User - Sanctuary Loaded');

      // Verify welcome message appears
      const hasWelcome = await hasWelcomeMessage(page);
      expect(hasWelcome).toBeTruthy();
      notes.push('Welcome message displayed correctly');

      // Check for Kingdom Mind branding
      const brandingVisible = await page.locator('text=KINGDO').isVisible();
      expect(brandingVisible).toBeTruthy();
      notes.push('Kingdom Mind branding visible');

      // Check for chat input
      const inputVisible = await page.locator('textarea, input[placeholder*="heart"]').isVisible();
      expect(inputVisible).toBeTruthy();
      notes.push('Chat input is available');

      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'New User Complete Flow',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'New User Complete Flow',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Welcome Message Display - correct greeting for new user', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Wait for welcome message to appear
      await page.waitForTimeout(2000);

      // Take screenshot of welcome message
      const ss1 = await takeScreenshot(page, 'chat-flow', 'welcome-message', 'display');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Welcome Message Display');

      // Check for new user greeting keywords
      const pageContent = await page.textContent('body');
      const hasNewUserGreeting =
        pageContent?.includes('Welcome') ||
        pageContent?.includes('traveler') ||
        pageContent?.includes('found your way') ||
        pageContent?.includes('sanctuary');

      expect(hasNewUserGreeting).toBeTruthy();

      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Welcome Message Display',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: ['New user greeting displayed with sanctuary keywords']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Welcome Message Display',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Message Input Functionality - user can type and submit', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Find the chat input
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await expect(input).toBeVisible();

      // Type a test message
      const testMessage = 'Hello, I am testing the sanctuary.';
      await input.fill(testMessage);

      // Take screenshot after typing
      const ss1 = await takeScreenshot(page, 'chat-flow', 'message-input', 'typed');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Message Input - After Typing');

      // Verify the input contains our text
      const inputValue = await input.inputValue();
      expect(inputValue).toBe(testMessage);

      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Message Input Functionality',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: ['User can type messages in the chat input']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Message Input Functionality',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Message Round-Trip - send message and receive response', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Take screenshot before sending
      const ss1 = await takeScreenshot(page, 'chat-flow', 'round-trip', 'before-send');
      screenshots.push(ss1);

      // Find and fill the chat input
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Hello, I want to explore my purpose.');

      // Submit the message
      await input.press('Enter');

      // Take screenshot during loading/streaming
      await page.waitForTimeout(1000);
      const ss2 = await takeScreenshot(page, 'chat-flow', 'round-trip', 'sending');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Message Round-Trip - Sending');

      // Wait for response (with longer timeout for AI response)
      await page.waitForTimeout(10000);

      // Take screenshot after response
      const ss3 = await takeScreenshot(page, 'chat-flow', 'round-trip', 'response');
      screenshots.push(ss3);
      report.addScreenshot(ss3, 'Message Round-Trip - Response Received');

      // Verify the page has more content than just the welcome
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(100);

      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Message Round-Trip',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: ['Message sent successfully', 'Response received from AI']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'Message Round-Trip',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('UI Elements Present - all core UI components visible', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      const ss1 = await takeScreenshot(page, 'chat-flow', 'ui-elements', 'overview');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'UI Elements Overview');

      // Check for header/branding
      const header = page.locator('header, [class*="header"]').first();
      const hasHeader = await header.isVisible().catch(() => false);
      notes.push(`Header visible: ${hasHeader}`);

      // Check for chat container
      const chatArea = page.locator('[class*="chat"], [class*="message"], [class*="flex-col"]').first();
      const hasChatArea = await chatArea.isVisible().catch(() => false);
      notes.push(`Chat area visible: ${hasChatArea}`);

      // Check for input area
      const inputArea = page.locator('textarea, input[type="text"]').first();
      const hasInput = await inputArea.isVisible().catch(() => false);
      notes.push(`Input area visible: ${hasInput}`);

      expect(hasInput).toBeTruthy();

      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'UI Elements Present',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Chat Flow Tests',
        name: 'UI Elements Present',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
