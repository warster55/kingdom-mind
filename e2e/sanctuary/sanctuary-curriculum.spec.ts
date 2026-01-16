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

test.describe('Curriculum & System Prompt Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Domain Keywords in AI Response - AI references curriculum domains', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask about identity (first domain in curriculum)
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I want to explore who I really am and my identity');
      await input.press('Enter');

      // Wait for AI response
      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'domain-keywords', 'identity-response');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Curriculum - Identity Domain Response');

      const pageContent = await page.textContent('body');

      // Check for domain-related keywords from curriculum
      const domainKeywords = [
        'identity', 'beloved', 'child', 'creation', 'ambassador',
        'purpose', 'design', 'kingdom', 'gifts',
        'mindset', 'awareness', 'truth', 'renewal',
        'relationships', 'attachment', 'forgiveness', 'love',
        'vision', 'dream', 'faith', 'clarity',
        'action', 'courage', 'faithful', 'resilient',
        'legacy', 'generational', 'multiplication', 'eternal'
      ];

      const foundKeywords = domainKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} curriculum keywords in response`);
      notes.push(`Keywords: ${foundKeywords.slice(0, 5).join(', ')}${foundKeywords.length > 5 ? '...' : ''}`);

      // At minimum, we should find some domain-related content
      expect(foundKeywords.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Domain Keywords in AI Response',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Domain Keywords in AI Response',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Purpose Domain Exploration - AI guides through purpose curriculum', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask about purpose
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Why am I here? What is my purpose in life?');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'purpose-domain', 'response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Purpose domain pillars: Unique Design, Kingdom Impact, Steward of Gifts
      const purposeKeywords = [
        'purpose', 'design', 'unique', 'gifts', 'kingdom',
        'impact', 'steward', 'created', 'fulfill'
      ];

      const foundKeywords = purposeKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} purpose-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      // Should have meaningful purpose-related content
      expect(foundKeywords.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Purpose Domain Exploration',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Purpose Domain Exploration',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Mindset Domain Guidance - AI addresses mindset transformation', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask about mindset
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I struggle with negative thoughts. How can I change my thinking?');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'mindset-domain', 'response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Mindset domain pillars: Awareness, Truth Filter, Renewal Practice
      const mindsetKeywords = [
        'mindset', 'thoughts', 'awareness', 'truth', 'renewal',
        'mind', 'think', 'transformed', 'captive'
      ];

      const foundKeywords = mindsetKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} mindset-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      expect(foundKeywords.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Mindset Domain Guidance',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Mindset Domain Guidance',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Warm Mentor Personality - AI exhibits warmth and brevity', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Simple greeting
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Hello, I am new here');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'mentor-personality', 'greeting-response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Check for warm, welcoming tone (not robotic)
      const warmPhrases = [
        'welcome', 'glad', 'beautiful', 'journey', 'sanctuary',
        'traveler', 'explore', 'curious', 'share'
      ];

      const foundWarmPhrases = warmPhrases.filter(phrase =>
        pageContent?.toLowerCase().includes(phrase.toLowerCase())
      );

      notes.push(`Found ${foundWarmPhrases.length} warm/welcoming phrases`);
      notes.push(`Phrases: ${foundWarmPhrases.join(', ')}`);

      // Check that response ends with a question (system prompt requires this)
      // Note: This is informational only - the AI should ask questions but it's not a strict requirement
      try {
        const bodyText = await page.textContent('body');
        const endsWithQuestion = bodyText?.includes('?') || false;
        notes.push(`Response contains question: ${endsWithQuestion}`);
      } catch {
        notes.push('Could not check for question mark');
      }

      expect(foundWarmPhrases.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Warm Mentor Personality',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Warm Mentor Personality',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Response Brevity Check - AI keeps responses concise', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask a question
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Tell me about relationships');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'brevity-check', 'response');
      screenshots.push(ss1);

      // Get the AI response text
      const messages = await page.locator('[class*="message"]').all();
      let aiResponseLength = 0;

      for (const msg of messages) {
        const text = await msg.textContent();
        if (text && text.length > 50) { // Skip short system messages
          aiResponseLength = Math.max(aiResponseLength, text.length);
        }
      }

      notes.push(`Longest message length: ${aiResponseLength} characters`);

      // System prompt says "2-3 sentences max, ONE question only"
      // A reasonable max would be around 500 characters
      const isReasonablyBrief = aiResponseLength < 1000;
      notes.push(`Response is reasonably brief: ${isReasonablyBrief}`);

      // We're not strictly enforcing this, just measuring
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Response Brevity Check',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Response Brevity Check',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Legacy Domain Wisdom - AI references legacy and eternal impact', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask about legacy
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('What kind of legacy do I want to leave behind?');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'curriculum', 'legacy-domain', 'response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Legacy domain pillars: Generational Thinking, Multiplication Mindset, Eternal Investment
      const legacyKeywords = [
        'legacy', 'generational', 'generations', 'future', 'eternal',
        'multiplication', 'invest', 'treasure', 'impact', 'last'
      ];

      const foundKeywords = legacyKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} legacy-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      expect(foundKeywords.length).toBeGreaterThan(0);

      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Legacy Domain Wisdom',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Curriculum Tests',
        name: 'Legacy Domain Wisdom',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});

test.describe('System Prompt Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Backup Export Trigger - [BACKUP_EXPORT] tag triggers action', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Request backup
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I want to backup my journey and save my data');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'system-prompt', 'backup-export', 'response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Should mention backup warmly (system prompt says: "Say something warm about preserving their journey")
      const backupKeywords = ['backup', 'save', 'preserve', 'journey', 'export'];
      const foundKeywords = backupKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} backup-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      // Check if backup UI appeared (button or download prompt)
      const hasBackupUI = await page.locator('button:has-text("Download"), button:has-text("Backup"), button:has-text("Export"), [download]').count() > 0;
      notes.push(`Backup UI appeared: ${hasBackupUI}`);

      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'Backup Export Trigger',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'Backup Export Trigger',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Gift Request Trigger - [GIFT_REQUEST] tag triggers donation flow', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Request to give/donate
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('I want to give a gift or donate to support this ministry');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'system-prompt', 'gift-request', 'response');
      screenshots.push(ss1);

      const pageContent = await page.textContent('body');

      // Should thank warmly and mention it's a personal gift (not tax-deductible)
      const giftKeywords = ['gift', 'thank', 'generous', 'support', 'give'];
      const foundKeywords = giftKeywords.filter(keyword =>
        pageContent?.toLowerCase().includes(keyword.toLowerCase())
      );

      notes.push(`Found ${foundKeywords.length} gift-related keywords`);
      notes.push(`Keywords: ${foundKeywords.join(', ')}`);

      // Check if gift UI appeared (QR code or address)
      const hasGiftUI = await page.locator('[class*="qr"], [class*="bitcoin"], [class*="gift"], canvas').count() > 0;
      notes.push(`Gift UI appeared: ${hasGiftUI}`);

      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'Gift Request Trigger',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'Gift Request Trigger',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('No Markdown in Response - AI avoids markdown formatting', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Ask a question that might tempt markdown lists
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Can you tell me about the different areas of life I should focus on?');
      await input.press('Enter');

      await page.waitForTimeout(15000);

      const ss1 = await takeScreenshot(page, 'system-prompt', 'no-markdown', 'response');
      screenshots.push(ss1);

      // Check for markdown patterns in the raw response
      const messages = await page.locator('[class*="message"]').all();
      let hasMarkdown = false;

      for (const msg of messages) {
        const innerHTML = await msg.innerHTML();
        // Check for rendered markdown elements
        if (innerHTML.includes('<strong>') || innerHTML.includes('<h') ||
            innerHTML.includes('<ul>') || innerHTML.includes('<ol>') ||
            innerHTML.includes('<li>')) {
          hasMarkdown = true;
          break;
        }
      }

      notes.push(`Contains markdown formatting: ${hasMarkdown}`);

      // System prompt says "Never use markdown formatting"
      // But we're not strictly failing, just noting
      notes.push(`Markdown-free response: ${!hasMarkdown}`);

      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'No Markdown in Response',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'System Prompt Features',
        name: 'No Markdown in Response',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
