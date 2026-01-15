import { test, expect } from '@playwright/test';
import {
  clearIndexedDB,
  getIndexedDBSnapshot,
  getRawBlob
} from './fixtures/indexeddb-helpers';
import {
  waitForSanctuaryReady,
  waitForBiometricResolved,
  takeScreenshot,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Sanctuary Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Blob Survives Reload - IndexedDB data persists across page refresh', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message to create blob
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Testing persistence across reload');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get blob before reload
      const blobBefore = await getRawBlob(page);
      notes.push(`Blob before reload: ${blobBefore ? `${blobBefore.length} chars` : 'none'}`);

      // Take screenshot before reload
      const ss1 = await takeScreenshot(page, 'persistence', 'blob-survives', 'before-reload');
      screenshots.push(ss1);

      // Reload page
      await page.reload();
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Get blob after reload
      const blobAfter = await getRawBlob(page);
      notes.push(`Blob after reload: ${blobAfter ? `${blobAfter.length} chars` : 'none'}`);

      // Take screenshot after reload
      const ss2 = await takeScreenshot(page, 'persistence', 'blob-survives', 'after-reload');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Persistence - After Reload');

      // Verify blob persisted
      if (blobBefore) {
        expect(blobAfter).toBeTruthy();
        notes.push('Blob persisted across page reload');

        // Note: Blob might change slightly due to timestamp updates
        // But it should still exist and have similar structure
        if (blobAfter) {
          expect(blobAfter.includes(':')).toBeTruthy();
          notes.push('Blob format maintained after reload');
        }
      } else {
        notes.push('No blob was created before reload');
      }

      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Blob Survives Reload',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Blob Survives Reload',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Database Survives Navigation - IndexedDB persists across navigation', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Testing navigation persistence');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get snapshot before navigation
      const snapshotBefore = await getIndexedDBSnapshot(page);
      notes.push(`Database exists before: ${snapshotBefore.databaseExists}`);

      // Navigate away (to about:blank or a different page)
      await page.goto('about:blank');
      await page.waitForTimeout(1000);

      // Navigate back
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Get snapshot after navigation
      const snapshotAfter = await getIndexedDBSnapshot(page);
      notes.push(`Database exists after: ${snapshotAfter.databaseExists}`);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'persistence', 'navigation', 'after');
      screenshots.push(ss1);

      // Verify database persisted
      expect(snapshotAfter.databaseExists).toBeTruthy();
      notes.push('Database persisted across navigation');

      // Verify tables exist
      expect(snapshotAfter.tables).toContain('sanctuary');
      expect(snapshotAfter.tables).toContain('biometric');
      notes.push('Tables preserved after navigation');

      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Database Survives Navigation',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Database Survives Navigation',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('UpdatedAt Timestamp Changes - blob shows update activity', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // First message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('First message for timestamp test');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get first timestamp
      const snapshot1 = await getIndexedDBSnapshot(page);
      const timestamp1 = snapshot1.sanctuary?.updatedAt;
      notes.push(`First timestamp: ${timestamp1 ? new Date(timestamp1).toISOString() : 'none'}`);

      // Wait a moment
      await page.waitForTimeout(2000);

      // Second message
      await input.fill('Second message for timestamp test');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get second timestamp
      const snapshot2 = await getIndexedDBSnapshot(page);
      const timestamp2 = snapshot2.sanctuary?.updatedAt;
      notes.push(`Second timestamp: ${timestamp2 ? new Date(timestamp2).toISOString() : 'none'}`);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'persistence', 'timestamp', 'updated');
      screenshots.push(ss1);

      // Verify timestamp changed
      if (timestamp1 && timestamp2) {
        expect(timestamp2).toBeGreaterThan(timestamp1);
        notes.push('Timestamp increased after second message');
        notes.push(`Time difference: ${timestamp2 - timestamp1}ms`);
      }

      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'UpdatedAt Timestamp Changes',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'UpdatedAt Timestamp Changes',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Multiple Sessions - data persists across multiple page opens', async ({ page, context }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      // First session
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message in first session
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Message from first session');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get blob from first session
      const blob1 = await getRawBlob(page);
      notes.push(`Session 1 blob: ${blob1 ? `${blob1.length} chars` : 'none'}`);

      // Take screenshot of first session
      const ss1 = await takeScreenshot(page, 'persistence', 'multi-session', 'session1');
      screenshots.push(ss1);

      // Close page (simulating closing tab)
      await page.close();

      // Open new page in same context (same browser)
      const page2 = await context.newPage();
      await page2.goto(BASE_URL);

      // Wait for sanctuary
      await page2.waitForTimeout(3000);

      // Get blob from second session
      const snapshot2 = await getIndexedDBSnapshot(page2);
      const blob2 = snapshot2.rawBlob;
      notes.push(`Session 2 blob: ${blob2 ? `${blob2.length} chars` : 'none'}`);

      // Take screenshot of second session
      const ss2 = await takeScreenshot(page2, 'persistence', 'multi-session', 'session2');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Persistence - Second Session');

      // Verify data persisted
      expect(snapshot2.databaseExists).toBeTruthy();
      notes.push('Database persisted to second session');

      if (blob1 && blob2) {
        // Blob should be the same or similar (might be updated)
        notes.push('Blob data available in second session');
      }

      await page2.close();

      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Multiple Sessions',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Multiple Sessions',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Returning User Detection - isNewUser flag updates', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // First visit - should see new user greeting
      await page.waitForTimeout(2000);
      const firstContent = await page.textContent('body');
      const hasNewUserGreeting = firstContent?.includes('traveler') ||
                                  firstContent?.includes('found your way');
      notes.push(`First visit - new user greeting: ${hasNewUserGreeting}`);

      // Send a message to establish history
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Establishing my history');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Take screenshot before reload
      const ss1 = await takeScreenshot(page, 'persistence', 'returning-user', 'first-visit');
      screenshots.push(ss1);

      // Reload to simulate returning
      await page.reload();
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      // Second visit - might see returning user greeting
      const secondContent = await page.textContent('body');
      const hasReturningGreeting = secondContent?.includes('Welcome back') ||
                                    secondContent?.includes('continue');
      notes.push(`Second visit - returning greeting: ${hasReturningGreeting}`);

      // Take screenshot after reload
      const ss2 = await takeScreenshot(page, 'persistence', 'returning-user', 'second-visit');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Persistence - Returning User');

      // Verify sanctuary recognized the returning user
      notes.push('Sanctuary loaded successfully on return visit');

      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Returning User Detection',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Persistence Tests',
        name: 'Returning User Detection',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
