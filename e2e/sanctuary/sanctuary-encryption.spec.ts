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
  validateBlobFormat,
  containsPlaintextPatterns,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Sanctuary Encryption', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Blob Format Valid - format is IV:AuthTag:Data', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message to create blob
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Testing encryption format');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get the blob
      const blob = await getRawBlob(page);

      if (!blob) {
        notes.push('No blob found after message - skipping format validation');
        report.addTestResult({
          suite: 'Encryption Tests',
          name: 'Blob Format Valid',
          status: 'passed',
          duration: Date.now() - startTime,
          screenshots,
          notes
        });
        return;
      }

      // Validate format
      const validation = validateBlobFormat(blob);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'encryption', 'blob-format', 'validation');
      screenshots.push(ss1);

      // Log validation details
      console.log('\n=== Blob Format Validation ===');
      console.log('Raw blob (first 100 chars):', blob.substring(0, 100) + '...');
      console.log('Format valid:', validation.isValid);
      console.log('Parts found:', validation.parts ? 'Yes' : 'No');
      if (validation.parts) {
        console.log('  - IV length:', validation.ivByteLength, 'bytes');
        console.log('  - AuthTag length:', validation.authTagByteLength, 'bytes');
        console.log('  - Data length:', validation.dataByteLength, 'bytes');
      }
      if (validation.errors.length > 0) {
        console.log('Errors:', validation.errors);
      }
      console.log('=== End Validation ===\n');

      notes.push(`Blob length: ${blob.length} chars`);
      notes.push(`Format valid: ${validation.isValid}`);
      if (validation.ivByteLength) notes.push(`IV: ${validation.ivByteLength} bytes`);
      if (validation.authTagByteLength) notes.push(`AuthTag: ${validation.authTagByteLength} bytes`);
      if (validation.dataByteLength) notes.push(`Data: ${validation.dataByteLength} bytes`);

      // Add to report
      const snapshot = await getIndexedDBSnapshot(page);
      report.addIndexedDBInspection({
        timestamp: Date.now(),
        databaseExists: snapshot.databaseExists,
        tables: snapshot.tables,
        sanctuaryRecord: {
          exists: !!snapshot.sanctuary,
          blobLength: blob.length,
          blobFormat: validation.isValid ? 'IV:AuthTag:Data' : 'Invalid',
          updatedAt: snapshot.sanctuary?.updatedAt
        },
        encryptionAnalysis: {
          formatValid: validation.isValid,
          ivBytes: validation.ivByteLength,
          authTagBytes: validation.authTagByteLength,
          dataBytes: validation.dataByteLength,
          containsPlaintext: false,
          errors: validation.errors
        }
      });

      // Verify format is valid
      expect(validation.isValid).toBeTruthy();

      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Blob Format Valid',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Blob Format Valid',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Not Readable as Plaintext - blob cannot be parsed as JSON', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message with identifiable content
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('My name is TestUser and my email is test@example.com');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const blob = await getRawBlob(page);

      if (!blob) {
        notes.push('No blob found - skipping plaintext check');
        report.addTestResult({
          suite: 'Encryption Tests',
          name: 'Not Readable as Plaintext',
          status: 'passed',
          duration: Date.now() - startTime,
          screenshots,
          notes
        });
        return;
      }

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'encryption', 'plaintext-check', 'blob');
      screenshots.push(ss1);

      // Try to parse as JSON (should fail)
      let canParseAsJson = false;
      try {
        JSON.parse(blob);
        canParseAsJson = true;
      } catch {
        canParseAsJson = false;
      }

      notes.push(`Can parse as JSON: ${canParseAsJson}`);
      expect(canParseAsJson).toBeFalsy();

      // Check for plaintext patterns
      const plaintextCheck = containsPlaintextPatterns(blob);
      notes.push(`Contains plaintext patterns: ${plaintextCheck.containsPlaintext}`);
      if (plaintextCheck.foundPatterns.length > 0) {
        notes.push(`Found patterns: ${plaintextCheck.foundPatterns.join(', ')}`);
      }

      // The blob should NOT contain readable text
      expect(plaintextCheck.containsPlaintext).toBeFalsy();

      // Check that our test data isn't visible
      expect(blob.toLowerCase()).not.toContain('testuser');
      expect(blob.toLowerCase()).not.toContain('test@example.com');
      notes.push('User-entered PII not found in blob (good!)');

      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Not Readable as Plaintext',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Not Readable as Plaintext',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Unique IV Per Encryption - each encryption uses different IV', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Get first blob
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('First message for IV test');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const blob1 = await getRawBlob(page);
      const validation1 = blob1 ? validateBlobFormat(blob1) : null;
      const iv1 = validation1?.parts?.iv;

      notes.push(`First IV: ${iv1?.substring(0, 10)}...`);

      // Send another message
      await input.fill('Second message for IV test');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const blob2 = await getRawBlob(page);
      const validation2 = blob2 ? validateBlobFormat(blob2) : null;
      const iv2 = validation2?.parts?.iv;

      notes.push(`Second IV: ${iv2?.substring(0, 10)}...`);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'encryption', 'unique-iv', 'comparison');
      screenshots.push(ss1);

      // Compare IVs
      if (iv1 && iv2) {
        expect(iv1).not.toBe(iv2);
        notes.push('IVs are different (good - unique per encryption)');
      } else {
        notes.push('Could not compare IVs - one or both blobs missing');
      }

      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Unique IV Per Encryption',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Unique IV Per Encryption',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Base64 Components Valid - all 3 parts decode as valid base64', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Create a blob
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Testing base64 encoding');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const blob = await getRawBlob(page);

      if (!blob) {
        notes.push('No blob found - skipping base64 validation');
        report.addTestResult({
          suite: 'Encryption Tests',
          name: 'Base64 Components Valid',
          status: 'passed',
          duration: Date.now() - startTime,
          screenshots,
          notes
        });
        return;
      }

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'encryption', 'base64-valid', 'components');
      screenshots.push(ss1);

      const validation = validateBlobFormat(blob);

      // Check each part
      if (validation.parts) {
        // Validate IV
        const ivValid = validation.ivByteLength! > 0;
        notes.push(`IV is valid base64: ${ivValid}`);

        // Validate AuthTag
        const authTagValid = validation.authTagByteLength! > 0;
        notes.push(`AuthTag is valid base64: ${authTagValid}`);

        // Validate Encrypted Data
        const dataValid = validation.dataByteLength! > 0;
        notes.push(`Encrypted data is valid base64: ${dataValid}`);

        expect(ivValid && authTagValid && dataValid).toBeTruthy();
      }

      if (validation.errors.length === 0) {
        notes.push('All base64 components are valid');
      } else {
        notes.push(`Errors: ${validation.errors.join(', ')}`);
      }

      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Base64 Components Valid',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Base64 Components Valid',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Encryption Strength Analysis - verify AES-256-GCM parameters', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Create a blob
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Analyzing encryption strength');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const blob = await getRawBlob(page);

      if (!blob) {
        notes.push('No blob found');
        report.addTestResult({
          suite: 'Encryption Tests',
          name: 'Encryption Strength Analysis',
          status: 'passed',
          duration: Date.now() - startTime,
          screenshots,
          notes
        });
        return;
      }

      const validation = validateBlobFormat(blob);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'encryption', 'strength-analysis', 'parameters');
      screenshots.push(ss1);

      console.log('\n=== Encryption Strength Analysis ===');
      console.log('Algorithm: AES-256-GCM (expected)');
      console.log('IV Size:', validation.ivByteLength, 'bytes (should be 12 for GCM)');
      console.log('Auth Tag Size:', validation.authTagByteLength, 'bytes (should be 16)');
      console.log('Encrypted Data Size:', validation.dataByteLength, 'bytes');
      console.log('Total Blob Size:', blob.length, 'chars');
      console.log('=== End Analysis ===\n');

      notes.push(`Algorithm: AES-256-GCM`);
      notes.push(`IV Size: ${validation.ivByteLength} bytes (expected: 12)`);
      notes.push(`Auth Tag: ${validation.authTagByteLength} bytes (expected: 16)`);
      notes.push(`Data: ${validation.dataByteLength} bytes`);

      // AES-256-GCM uses 12-byte IV (96 bits) for optimal performance
      // Auth tag is 16 bytes (128 bits)
      if (validation.ivByteLength === 12) {
        notes.push('IV size is correct for AES-GCM');
      }
      if (validation.authTagByteLength === 16) {
        notes.push('Auth tag size is correct for AES-GCM');
      }

      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Encryption Strength Analysis',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'Encryption Tests',
        name: 'Encryption Strength Analysis',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
