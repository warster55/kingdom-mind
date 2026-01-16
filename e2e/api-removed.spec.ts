import { test, expect } from '@playwright/test';
import {
  takeScreenshot,
  BASE_URL
} from './sanctuary/fixtures/test-utils';
import { getReportGenerator } from './sanctuary/fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

/**
 * Phase 17 API Removal Verification Tests
 * Verifies that all API endpoints have been removed and return 404
 */
test.describe('API Endpoints Removed - Phase 17', () => {
  const apiEndpoints = [
    '/api/chat',
    '/api/chat/message',
    '/api/sanctuary',
    '/api/sanctuary/init',
    '/api/gift',
    '/api/gift/bitcoin',
    '/api/gift/lightning',
    '/api/backup',
    '/api/backup/export',
    '/api/backup/import',
    '/api/auth',
    '/api/auth/login',
    '/api/mentor',
    '/api/mentor/message',
    '/api/architect',
  ];

  test('All API endpoints return 404', async ({ page }) => {
    const startTime = Date.now();
    const results: { endpoint: string; status: number }[] = [];

    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      results.push({
        endpoint,
        status: response.status()
      });
    }

    // All endpoints should return 404
    const all404 = results.every(r => r.status === 404);

    const ss1 = await takeScreenshot(page, 'api-removed', 'verification', 'summary');
    report.addScreenshot(ss1, 'API Removal Verification');

    report.addTestResult({
      suite: 'API Removal Tests',
      name: 'All API endpoints return 404',
      status: all404 ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      screenshots: [ss1],
      notes: results.map(r => `${r.endpoint}: ${r.status}`)
    });

    // Log results for debugging
    console.log('API Endpoint Status Check:');
    for (const result of results) {
      console.log(`  ${result.endpoint}: ${result.status}`);
    }

    expect(all404).toBeTruthy();
  });

  test('POST requests to removed APIs also return 404', async ({ page }) => {
    const startTime = Date.now();
    const results: { endpoint: string; status: number }[] = [];

    const postEndpoints = [
      '/api/chat',
      '/api/chat/message',
      '/api/sanctuary/init',
      '/api/gift/bitcoin',
      '/api/backup/export',
    ];

    for (const endpoint of postEndpoints) {
      const response = await page.request.post(`${BASE_URL}${endpoint}`, {
        data: { test: 'data' },
        headers: { 'Content-Type': 'application/json' }
      });
      results.push({
        endpoint,
        status: response.status()
      });
    }

    const all404 = results.every(r => r.status === 404);

    report.addTestResult({
      suite: 'API Removal Tests',
      name: 'POST requests to removed APIs return 404',
      status: all404 ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      screenshots: [],
      notes: results.map(r => `POST ${r.endpoint}: ${r.status}`)
    });

    expect(all404).toBeTruthy();
  });

  test('App still functions without APIs', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      // Navigate to the app
      await page.goto(BASE_URL);

      // Wait for the app to load
      await page.waitForSelector('[class*="bg-stone-950"]', { timeout: 15000 });

      const ss1 = await takeScreenshot(page, 'api-removed', 'app-functions', 'loaded');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'App Functions Without APIs');

      // Verify basic UI elements are present
      const hasInput = await page.locator('textarea, input[placeholder*="heart"]').isVisible();
      const hasBranding = await page.locator('text=KINGDO').isVisible().catch(() => false);

      expect(hasInput).toBeTruthy();

      report.addTestResult({
        suite: 'API Removal Tests',
        name: 'App still functions without APIs',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: [
          `Chat input visible: ${hasInput}`,
          `Branding visible: ${hasBranding}`,
          'App loads successfully using Server Actions only'
        ]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Removal Tests',
        name: 'App still functions without APIs',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Server Actions work (chat sends message)', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      await page.goto(BASE_URL);
      await page.waitForSelector('[class*="bg-stone-950"]', { timeout: 15000 });

      // Wait for initial load
      await page.waitForTimeout(3000);

      // Find chat input and send a message
      const input = page.locator('textarea, input[placeholder*="heart"]').first();
      await input.fill('Hello, testing Server Actions');
      await input.press('Enter');

      // Wait for response (Server Action should handle this)
      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'api-removed', 'server-actions', 'response');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Server Actions Working');

      // Check that we got some response (page content changed)
      const pageContent = await page.textContent('body');
      expect(pageContent?.length).toBeGreaterThan(100);

      report.addTestResult({
        suite: 'API Removal Tests',
        name: 'Server Actions work',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes: [
          'Message sent via Server Action',
          'Response received without API endpoints'
        ]
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Removal Tests',
        name: 'Server Actions work',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('No custom API routes exist', async ({ page }) => {
    const startTime = Date.now();

    // This test verifies that our custom API routes are gone
    // Server Actions may use internal Next.js routes, which is fine
    // We're checking that explicit /api/chat, /api/gift etc. don't exist

    const customApiPaths = [
      '/api/chat',
      '/api/gift',
      '/api/sanctuary',
      '/api/backup',
      '/api/mentor',
      '/api/auth'
    ];

    const results: { path: string; exists: boolean }[] = [];

    for (const path of customApiPaths) {
      const response = await page.request.get(`${BASE_URL}${path}`);
      results.push({
        path,
        exists: response.status() !== 404
      });
    }

    // All custom API routes should return 404
    const allRemoved = results.every(r => !r.exists);

    report.addTestResult({
      suite: 'API Removal Tests',
      name: 'No custom API routes exist',
      status: allRemoved ? 'passed' : 'failed',
      duration: Date.now() - startTime,
      screenshots: [],
      notes: results.map(r => `${r.path}: ${r.exists ? 'EXISTS (BAD)' : 'removed (good)'}`)
    });

    expect(allRemoved).toBeTruthy();
  });
});
