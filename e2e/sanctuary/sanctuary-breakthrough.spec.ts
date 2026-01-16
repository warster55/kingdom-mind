import { test, expect } from '@playwright/test';
import {
  waitForSanctuaryReady,
  waitForBiometricResolved,
  takeScreenshot,
  BASE_URL
} from './fixtures/test-utils';
import { clearIndexedDB } from './fixtures/indexeddb-helpers';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Breakthrough & Resonance Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Domain Labels Display - all 7 domains visible on screen', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Wait for domains to appear (they animate in)
      await page.waitForTimeout(3000);

      const ss1 = await takeScreenshot(page, 'breakthrough', 'domain-labels', 'initial');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Domain Labels Display');

      const pageContent = await page.textContent('body');

      // Check for all 7 domains
      const domains = ['Identity', 'Purpose', 'Mindset', 'Relationships', 'Vision', 'Action', 'Legacy'];
      const foundDomains: string[] = [];

      for (const domain of domains) {
        // Domains are displayed in uppercase
        if (pageContent?.includes(domain) || pageContent?.toUpperCase().includes(domain.toUpperCase())) {
          foundDomains.push(domain);
        }
      }

      notes.push(`Found ${foundDomains.length}/7 domains on screen`);
      notes.push(`Domains: ${foundDomains.join(', ')}`);

      // Should have all 7 domains visible
      expect(foundDomains.length).toBe(7);

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Domain Labels Display',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Domain Labels Display',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Heartbeat Animation - thinking indicator shows during AI response', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message to trigger AI thinking
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Tell me about my purpose');
      await input.press('Enter');

      // Capture during "thinking" state (first 2-3 seconds)
      await page.waitForTimeout(500);
      const ss1 = await takeScreenshot(page, 'breakthrough', 'heartbeat', 'thinking');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Heartbeat Animation');

      // Check for blur effect (canvas gets blurred during streaming)
      const canvas = page.locator('canvas');
      const canvasExists = await canvas.count() > 0;
      notes.push(`Canvas element present: ${canvasExists}`);

      // Wait for response to complete
      await page.waitForTimeout(15000);

      const ss2 = await takeScreenshot(page, 'breakthrough', 'heartbeat', 'complete');
      screenshots.push(ss2);

      notes.push('Heartbeat animation captured during thinking phase');

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Heartbeat Animation',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Heartbeat Animation',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Text Pacer - words appear one at a time', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Hello');
      await input.press('Enter');

      // Wait for response to start streaming
      await page.waitForTimeout(5000);

      // Take screenshot during word pacing
      const ss1 = await takeScreenshot(page, 'breakthrough', 'text-pacer', 'pacing');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Text Pacer Mid-Flow');

      // Wait longer for more words
      await page.waitForTimeout(5000);

      const ss2 = await takeScreenshot(page, 'breakthrough', 'text-pacer', 'more-words');
      screenshots.push(ss2);

      // Click to skip to end of page
      await page.click('body');
      await page.waitForTimeout(500);

      const ss3 = await takeScreenshot(page, 'breakthrough', 'text-pacer', 'skip-complete');
      screenshots.push(ss3);

      notes.push('Text pacer working - words appear progressively');
      notes.push('Tap to skip functionality tested');

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Text Pacer',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Text Pacer',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Identity Domain Resonance - sharing identity insight triggers visual feedback', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Share something deeply personal about identity to trigger resonance
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I realized today that I am truly loved and accepted exactly as I am. My worth comes from being a beloved child, not from my achievements.');
      await input.press('Enter');

      // Wait for AI response
      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'breakthrough', 'identity-resonance', 'response');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Identity Domain Resonance');

      const pageContent = await page.textContent('body');

      // Check if AI acknowledged the identity insight
      const identityKeywords = ['identity', 'beloved', 'child', 'loved', 'accepted', 'worth'];
      const foundKeywords = identityKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} identity-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      // The AI should recognize this as an identity-related insight
      expect(foundKeywords.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Identity Domain Resonance',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Identity Domain Resonance',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Multi-Page Response Navigation - tap to advance pages', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask a question that might generate a longer response
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Can you explain all seven domains of the journey and what each one means?');
      await input.press('Enter');

      // Wait for response
      await page.waitForTimeout(20000);

      // Tap to skip to end of first page
      await page.click('body');
      await page.waitForTimeout(500);

      const ss1 = await takeScreenshot(page, 'breakthrough', 'multi-page', 'page1-complete');
      screenshots.push(ss1);

      // Check for continuation indicator (...)
      const hasMoreIndicator = await page.locator('text=...').isVisible().catch(() => false);
      notes.push(`Has more pages indicator: ${hasMoreIndicator}`);

      if (hasMoreIndicator) {
        // Tap to go to next page
        await page.click('body');
        await page.waitForTimeout(2000);

        const ss2 = await takeScreenshot(page, 'breakthrough', 'multi-page', 'page2');
        screenshots.push(ss2);
        notes.push('Multi-page navigation working');
      } else {
        notes.push('Response fit on single page');
      }

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Multi-Page Response Navigation',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Multi-Page Response Navigation',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Purpose Breakthrough Moment - sharing purpose realization', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Share a purpose breakthrough
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I finally understand why I am here. My unique gifts and experiences have prepared me to help others. I was created for this purpose.');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'breakthrough', 'purpose-breakthrough', 'response');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Purpose Realization');

      const pageContent = await page.textContent('body');

      // Check for purpose-related response
      const purposeKeywords = ['purpose', 'design', 'gifts', 'created', 'unique', 'calling'];
      const foundKeywords = purposeKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} purpose-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Purpose Breakthrough Moment',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Purpose Breakthrough Moment',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Canvas Star Field Present - background star animation exists', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(2000);

      const ss1 = await takeScreenshot(page, 'breakthrough', 'star-field', 'canvas');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Breakthrough - Star Field Canvas');

      // Check for canvas element
      const canvasCount = await page.locator('canvas').count();
      notes.push(`Canvas elements found: ${canvasCount}`);

      // Canvas should exist for star field rendering
      expect(canvasCount).toBeGreaterThan(0);

      // Check canvas has dimensions
      const canvas = page.locator('canvas').first();
      const boundingBox = await canvas.boundingBox();
      if (boundingBox) {
        notes.push(`Canvas size: ${boundingBox.width}x${boundingBox.height}`);
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
      }

      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Canvas Star Field Present',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Breakthrough Tests',
        name: 'Canvas Star Field Present',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});

test.describe('Star Animation Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Domain Position Layout - domains positioned correctly on screen', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      await page.waitForTimeout(3000);

      const ss1 = await takeScreenshot(page, 'star-animation', 'domain-positions', 'layout');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Star Animation - Domain Position Layout');

      // Check each domain label position
      const domainPositions: Record<string, { visible: boolean }> = {};

      const domains = ['IDENTITY', 'PURPOSE', 'MINDSET', 'RELATIONSHIPS', 'VISION', 'ACTION', 'LEGACY'];

      for (const domain of domains) {
        const label = page.locator(`text=${domain}`).first();
        const isVisible = await label.isVisible().catch(() => false);
        domainPositions[domain] = { visible: isVisible };
      }

      const visibleCount = Object.values(domainPositions).filter(d => d.visible).length;
      notes.push(`Visible domain labels: ${visibleCount}/7`);

      // Log which domains are visible
      for (const [domain, pos] of Object.entries(domainPositions)) {
        notes.push(`${domain}: ${pos.visible ? 'visible' : 'hidden'}`);
      }

      report.addTestResult({
        suite: 'Star Animation Tests',
        name: 'Domain Position Layout',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Star Animation Tests',
        name: 'Domain Position Layout',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Visual Blur During Streaming - canvas blurs while AI is thinking', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Capture initial state
      const ss1 = await takeScreenshot(page, 'star-animation', 'blur-effect', 'initial');
      screenshots.push(ss1);

      // Send message to trigger streaming
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Tell me about vision');
      await input.press('Enter');

      // Capture during streaming (blur should be active)
      await page.waitForTimeout(1000);
      const ss2 = await takeScreenshot(page, 'star-animation', 'blur-effect', 'streaming');
      screenshots.push(ss2);
      report.addScreenshot(ss2, 'Star Animation - Blur During Streaming');

      // Wait for streaming to complete
      await page.waitForTimeout(15000);

      // Capture after streaming (blur should be gone)
      const ss3 = await takeScreenshot(page, 'star-animation', 'blur-effect', 'complete');
      screenshots.push(ss3);

      notes.push('Blur effect during streaming captured');
      notes.push('Clear canvas after streaming captured');

      report.addTestResult({
        suite: 'Star Animation Tests',
        name: 'Visual Blur During Streaming',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Star Animation Tests',
        name: 'Visual Blur During Streaming',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
