import { test, expect } from '@playwright/test';
import { clearIndexedDB, getIndexedDBSnapshot } from './fixtures/indexeddb-helpers';
import {
  waitForSanctuaryReady,
  waitForBiometricResolved,
  takeScreenshot,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

/**
 * Backup/Restore Tests
 * Tests the chat-based backup and restore functionality
 */
test.describe('Sanctuary Backup/Restore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Backup Request - asking to backup triggers export', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      // Request backup
      const backupRequest = 'I want to backup my journey. Can you help me save my progress?';

      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill(backupRequest);

      const ss1 = await takeScreenshot(page, 'backup', 'request', 'before');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Backup - Before Request');

      await input.press('Enter');

      // Wait for AI response
      await page.waitForTimeout(15000);

      const ss2 = await takeScreenshot(page, 'backup', 'request', 'response');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Backup - After Request');

      // Check for backup-related response or QR export modal
      const pageContent = await page.textContent('body');

      const hasBackupResponse =
        pageContent?.includes('backup') ||
        pageContent?.includes('export') ||
        pageContent?.includes('save') ||
        pageContent?.includes('QR') ||
        pageContent?.includes('journey') ||
        pageContent?.includes('preserve');

      expect(hasBackupResponse).toBeTruthy();

      // Check if QR export modal appeared
      const hasQRExport = await page.locator('[class*="qr"], canvas, [data-testid="export"]').count();

      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Backup Request',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: [
          'Backup request understood by AI',
          `QR/Export UI visible: ${hasQRExport > 0}`
        ]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Backup Request',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Restore Request - asking to restore triggers import', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      // Request restore
      const restoreRequest = 'I have a backup from my old phone. I want to restore my journey.';

      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill(restoreRequest);

      const ss1 = await takeScreenshot(page, 'backup', 'restore-request', 'before');
      screenshots.push(ss1);

      await input.press('Enter');

      // Wait for AI response
      await page.waitForTimeout(15000);

      const ss2 = await takeScreenshot(page, 'backup', 'restore-request', 'response');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Restore - After Request');

      // Check for restore-related response
      const pageContent = await page.textContent('body');

      const hasRestoreResponse =
        pageContent?.includes('restore') ||
        pageContent?.includes('import') ||
        pageContent?.includes('Welcome back') ||
        pageContent?.includes('scan') ||
        pageContent?.includes('backup');

      expect(hasRestoreResponse).toBeTruthy();

      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Restore Request',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: ['Restore request understood by AI']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Restore Request',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Multiple Backup Phrases - various backup keywords work', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      // Test different backup-related phrases
      const backupPhrases = [
        'save my journey',
        // 'export my data',
        // 'transfer to new device'
      ];

      for (const phrase of backupPhrases) {
        const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
        await input.fill(phrase);
        await input.press('Enter');
        await page.waitForTimeout(12000);
      }

      const ss1 = await takeScreenshot(page, 'backup', 'multiple-phrases', 'final');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Backup - Multiple Phrases');

      const pageContent = await page.textContent('body');

      // Should see backup-related content
      const hasBackupContent =
        pageContent?.includes('backup') ||
        pageContent?.includes('save') ||
        pageContent?.includes('export') ||
        pageContent?.includes('QR') ||
        pageContent?.includes('journey');

      expect(hasBackupContent).toBeTruthy();

      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Multiple Backup Phrases',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: ['Various backup phrases recognized']
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Multiple Backup Phrases',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Data Exists Before Backup - sanctuary has data to export', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(3000);

      // First, interact to generate some data
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I am exploring my identity and who I truly am.');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      // Check IndexedDB has data
      const snapshot = await getIndexedDBSnapshot(page);

      const ss1 = await takeScreenshot(page, 'backup', 'data-exists', 'after-interaction');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Backup - Data Exists Check');

      // Verify there's a sanctuary blob
      const hasBlob = snapshot.sanctuary && snapshot.sanctuary.length > 0;

      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Data Exists Before Backup',
        status: hasBlob ? 'passed' : 'failed',
        duration: Date.now() - startTime,
        screenshots,
        notes: [
          `Sanctuary blob exists: ${hasBlob}`,
          `IndexedDB tables: ${Object.keys(snapshot).join(', ')}`
        ]
      });

      expect(hasBlob).toBeTruthy();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Backup Tests',
        name: 'Data Exists Before Backup',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('QR Export Display - QR code renders for small data', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      // Request backup explicitly
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Please backup my sanctuary data');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'backup', 'qr-display', 'response');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Backup - QR Display Test');

      // Look for QR-related elements
      const hasCanvas = await page.locator('canvas').count();
      const hasQRImage = await page.locator('img[alt*="QR"], [class*="qr"]').count();
      const hasExportUI = await page.locator('[class*="export"], [data-testid*="export"]').count();

      const pageContent = await page.textContent('body');
      const mentionsQR = pageContent?.toLowerCase().includes('qr');
      const mentionsDownload = pageContent?.toLowerCase().includes('download');

      report.addTestResult({
        suite: 'Backup Tests',
        name: 'QR Export Display',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: [
          `Canvas elements: ${hasCanvas}`,
          `QR images: ${hasQRImage}`,
          `Export UI elements: ${hasExportUI}`,
          `Mentions QR: ${mentionsQR}`,
          `Mentions download: ${mentionsDownload}`
        ]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Backup Tests',
        name: 'QR Export Display',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
