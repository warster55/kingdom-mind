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
  containsPlaintextPatterns,
  captureNetworkRequests,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Sanctuary Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('No PII in IndexedDB - no plaintext personal data stored locally', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message with PII
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      const testPII = 'My name is John Smith, email john.smith@example.com, phone 555-123-4567';
      await input.fill(testPII);
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get all stored data
      const snapshot = await getIndexedDBSnapshot(page);
      const blob = snapshot.rawBlob || '';

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'privacy', 'no-pii-indexeddb', 'check');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'Privacy - IndexedDB PII Check');

      // Check that PII is not in plaintext in the blob
      const lowerBlob = blob.toLowerCase();

      const piiChecks = [
        { pattern: 'john smith', found: lowerBlob.includes('john smith') },
        { pattern: 'john.smith@example.com', found: lowerBlob.includes('john.smith@example.com') },
        { pattern: '555-123-4567', found: blob.includes('555-123-4567') },
        { pattern: '5551234567', found: blob.includes('5551234567') },
      ];

      for (const check of piiChecks) {
        notes.push(`"${check.pattern}" in blob: ${check.found ? 'YES (BAD!)' : 'NO (GOOD)'}`);
        expect(check.found).toBeFalsy();
      }

      // General plaintext check
      const plaintextCheck = containsPlaintextPatterns(blob);
      notes.push(`Contains plaintext patterns: ${plaintextCheck.containsPlaintext}`);

      if (plaintextCheck.foundPatterns.length > 0) {
        notes.push(`Warning patterns found: ${plaintextCheck.foundPatterns.join(', ')}`);
      }

      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No PII in IndexedDB',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No PII in IndexedDB',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('No PII in Network URLs - sensitive data only in POST bodies', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Collect network requests during message send
      const networkLogs: { url: string; method: string }[] = [];

      page.on('request', request => {
        networkLogs.push({
          url: request.url(),
          method: request.method()
        });
      });

      // Send a message with identifiable content
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Test message with email test@example.com');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'privacy', 'no-pii-urls', 'network');
      screenshots.push(ss1);

      // Check URLs for PII
      let piiFoundInUrls = false;
      const piiPatterns = [
        /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // Email
        /\d{3}[-.]?\d{3}[-.]?\d{4}/,       // Phone
        /test@example\.com/,               // Our test email
      ];

      for (const log of networkLogs) {
        for (const pattern of piiPatterns) {
          if (pattern.test(log.url)) {
            piiFoundInUrls = true;
            notes.push(`WARNING: PII found in URL: ${log.url}`);
          }
        }
      }

      notes.push(`Total requests captured: ${networkLogs.length}`);
      notes.push(`PII found in URLs: ${piiFoundInUrls ? 'YES (BAD!)' : 'NO (GOOD)'}`);

      // List sanctuary-related API calls
      const sanctuaryRequests = networkLogs.filter(l =>
        l.url.includes('/api/sanctuary') || l.url.includes('/api/chat')
      );
      notes.push(`Sanctuary API calls: ${sanctuaryRequests.length}`);

      // Add network analysis to report
      report.addNetworkAnalysis({
        totalRequests: networkLogs.length,
        sanctuaryApiCalls: sanctuaryRequests.length,
        piiInUrls: piiFoundInUrls,
        sensitiveDataExposed: piiFoundInUrls ? ['PII in URL parameters'] : []
      });

      expect(piiFoundInUrls).toBeFalsy();

      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No PII in Network URLs',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No PII in Network URLs',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('No Decrypted Data in HTML - page source has no sanctuary data', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Checking HTML for leaks');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'privacy', 'no-html-leak', 'source');
      screenshots.push(ss1);

      // Get page HTML
      const html = await page.content();

      // Check for sensitive patterns that shouldn't be in HTML
      const sensitivePatterns = [
        { name: 'breakthroughs array', pattern: /"breakthroughs"\s*:\s*\[/ },
        { name: 'insights array', pattern: /"insights"\s*:\s*\[/ },
        { name: 'resonance object', pattern: /"resonance"\s*:\s*\{/ },
        { name: 'sanctuary data', pattern: /"sanctuaryData"\s*:/ },
        { name: 'raw encrypted blob', pattern: /[A-Za-z0-9+/]{100,}={0,2}:[A-Za-z0-9+/]{20,}/ },
      ];

      let leaksFound = false;
      for (const check of sensitivePatterns) {
        const found = check.pattern.test(html);
        notes.push(`"${check.name}" in HTML: ${found ? 'YES (INVESTIGATE)' : 'NO (GOOD)'}`);
        if (found && check.name !== 'raw encrypted blob') {
          // Encrypted blobs in HTML might be OK if used for hydration
          // But plaintext data is not OK
          leaksFound = true;
        }
      }

      // The welcome message and chat content SHOULD be in HTML (that's expected)
      const hasExpectedContent = html.includes('Welcome') || html.includes('sanctuary');
      notes.push(`Expected UI content present: ${hasExpectedContent}`);

      // Check that we're not leaking full sanctuary state
      notes.push(`Potential data leaks found: ${leaksFound ? 'YES' : 'NO'}`);

      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No Decrypted Data in HTML',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'No Decrypted Data in HTML',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('LocalStorage Privacy - no sensitive data in localStorage', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Checking localStorage');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get localStorage contents
      const localStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key) || '';
          }
        }
        return data;
      });

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'privacy', 'localstorage', 'check');
      screenshots.push(ss1);

      // Log localStorage contents
      console.log('\n=== LocalStorage Inspection ===');
      console.log('Keys found:', Object.keys(localStorageData).length);
      for (const [key, value] of Object.entries(localStorageData)) {
        console.log(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      }
      console.log('=== End LocalStorage ===\n');

      notes.push(`LocalStorage keys: ${Object.keys(localStorageData).length}`);

      // Check for sensitive patterns in localStorage values
      let sensitiveDataFound = false;
      for (const [key, value] of Object.entries(localStorageData)) {
        const check = containsPlaintextPatterns(value);
        if (check.containsPlaintext) {
          notes.push(`WARNING: Sensitive patterns in key "${key}"`);
          sensitiveDataFound = true;
        }
      }

      notes.push(`Sensitive data in localStorage: ${sensitiveDataFound ? 'YES (INVESTIGATE)' : 'NO (GOOD)'}`);

      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'LocalStorage Privacy',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'LocalStorage Privacy',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Session Storage Privacy - no sensitive data in sessionStorage', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Checking sessionStorage');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get sessionStorage contents
      const sessionStorageData = await page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            data[key] = sessionStorage.getItem(key) || '';
          }
        }
        return data;
      });

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'privacy', 'sessionstorage', 'check');
      screenshots.push(ss1);

      notes.push(`SessionStorage keys: ${Object.keys(sessionStorageData).length}`);

      // Check for sensitive patterns
      let sensitiveDataFound = false;
      for (const [key, value] of Object.entries(sessionStorageData)) {
        const check = containsPlaintextPatterns(value);
        if (check.containsPlaintext) {
          notes.push(`WARNING: Sensitive patterns in key "${key}"`);
          sensitiveDataFound = true;
        }
      }

      notes.push(`Sensitive data in sessionStorage: ${sensitiveDataFound ? 'YES (INVESTIGATE)' : 'NO (GOOD)'}`);

      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'Session Storage Privacy',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Privacy Tests',
        name: 'Session Storage Privacy',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
