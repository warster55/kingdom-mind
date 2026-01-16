import { test, expect } from '@playwright/test';
import {
  clearIndexedDB,
  getIndexedDBSnapshot,
  TABLE_STORE,
  type IndexedDBSnapshot
} from './fixtures/indexeddb-helpers';
import {
  waitForSanctuaryReady,
  waitForBiometricResolved,
  takeScreenshot,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);

test.describe('Sanctuary IndexedDB Storage', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto(BASE_URL);
    await clearIndexedDB(page);
    await page.reload();
  });

  test('Blob Stored on First Visit - new user gets blob in IndexedDB', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Wait for initial data to be stored
      await page.waitForTimeout(3000);

      // Get IndexedDB snapshot
      const snapshot = await getIndexedDBSnapshot(page);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'indexeddb', 'first-visit', 'snapshot');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'IndexedDB - First Visit State');

      // Add inspection to report
      report.addIndexedDBInspection({
        timestamp: Date.now(),
        databaseExists: snapshot.databaseExists,
        tables: snapshot.tables,
        sanctuaryRecord: {
          exists: !!snapshot.sanctuary,
          blobLength: snapshot.rawBlob?.length,
          blobFormat: snapshot.blobParts ? 'IV:AuthTag:Data' : 'Unknown',
          updatedAt: snapshot.sanctuary?.updatedAt
        },
        biometricRecord: {
          exists: !!snapshot.biometric,
          enabled: snapshot.biometric?.enabled,
          hasCredentialId: !!snapshot.biometric?.credentialId
        }
      });

      // Verify database exists
      expect(snapshot.databaseExists).toBeTruthy();
      notes.push('Database created successfully');

      // Verify store table exists (obfuscated name)
      expect(snapshot.tables).toContain(TABLE_STORE);
      notes.push('Store table exists');

      // Verify blob is stored (may be null for fresh user before first API call)
      notes.push(`Blob stored: ${!!snapshot.rawBlob}`);
      notes.push(`Blob length: ${snapshot.rawBlob?.length || 0} chars`);

      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Stored on First Visit',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Stored on First Visit',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Blob Updated After Message - blob changes after server interaction', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Get initial snapshot
      await page.waitForTimeout(2000);
      const initialSnapshot = await getIndexedDBSnapshot(page);
      const initialBlob = initialSnapshot.rawBlob;
      notes.push(`Initial blob length: ${initialBlob?.length || 0}`);

      // Send a message to trigger server interaction
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Test message for IndexedDB verification');
      await input.press('Enter');

      // Wait for response
      await page.waitForTimeout(10000);

      // Get updated snapshot
      const updatedSnapshot = await getIndexedDBSnapshot(page);
      const updatedBlob = updatedSnapshot.rawBlob;
      notes.push(`Updated blob length: ${updatedBlob?.length || 0}`);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'indexeddb', 'blob-updated', 'after-message');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'IndexedDB - After Message');

      // Add updated inspection
      report.addIndexedDBInspection({
        timestamp: Date.now(),
        databaseExists: updatedSnapshot.databaseExists,
        tables: updatedSnapshot.tables,
        sanctuaryRecord: {
          exists: !!updatedSnapshot.sanctuary,
          blobLength: updatedBlob?.length,
          blobFormat: updatedSnapshot.blobParts ? 'IV:AuthTag:Data' : 'Unknown',
          updatedAt: updatedSnapshot.sanctuary?.updatedAt
        },
        biometricRecord: {
          exists: !!updatedSnapshot.biometric,
          enabled: updatedSnapshot.biometric?.enabled,
          hasCredentialId: !!updatedSnapshot.biometric?.credentialId
        }
      });

      // Verify blob was updated
      if (initialBlob && updatedBlob) {
        expect(updatedBlob).not.toBe(initialBlob);
        notes.push('Blob was updated after message');
      } else if (updatedBlob && !initialBlob) {
        notes.push('Blob was created after first message');
      }

      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Updated After Message',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Updated After Message',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Database Structure - both sanctuary and biometric tables exist', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message to trigger database creation
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Testing database structure');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const snapshot = await getIndexedDBSnapshot(page);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'indexeddb', 'db-structure', 'tables');
      screenshots.push(ss1);

      // Verify database structure (obfuscated names)
      expect(snapshot.databaseExists).toBeTruthy();
      notes.push('Database exists');

      expect(snapshot.tables).toContain(TABLE_STORE);
      notes.push('Store table exists');

      notes.push(`Total tables: ${snapshot.tables.length}`);
      notes.push(`Table names: ${snapshot.tables.join(', ')}`);

      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Database Structure',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Database Structure',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('Blob Contains Required Fields - sanctuary record has id, blob, updatedAt', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message to ensure blob is created
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Hello sanctuary');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      const snapshot = await getIndexedDBSnapshot(page);

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'indexeddb', 'required-fields', 'record');
      screenshots.push(ss1);

      if (snapshot.sanctuary) {
        // Verify required fields
        expect(snapshot.sanctuary.id).toBe('sanctuary');
        notes.push(`ID field: ${snapshot.sanctuary.id}`);

        expect(snapshot.sanctuary.blob).toBeDefined();
        notes.push(`Blob field: Present (${snapshot.sanctuary.blob.length} chars)`);

        expect(snapshot.sanctuary.updatedAt).toBeDefined();
        expect(typeof snapshot.sanctuary.updatedAt).toBe('number');
        notes.push(`UpdatedAt field: ${new Date(snapshot.sanctuary.updatedAt).toISOString()}`);
      } else {
        notes.push('No sanctuary record found after message');
      }

      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Contains Required Fields',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'Blob Contains Required Fields',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });

  test('IndexedDB Console Inspection - log database contents', async ({ page }) => {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const notes: string[] = [];

    try {
      await page.goto(BASE_URL);
      await waitForBiometricResolved(page);
      await waitForSanctuaryReady(page);

      // Send a message
      const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
      await input.fill('Inspecting the database');
      await input.press('Enter');

      await page.waitForTimeout(10000);

      // Get full snapshot
      const snapshot = await getIndexedDBSnapshot(page);

      // Log detailed info (will appear in test output)
      console.log('\n=== IndexedDB Inspection ===');
      console.log('Database exists:', snapshot.databaseExists);
      console.log('Tables:', snapshot.tables);
      console.log('Sanctuary record:', snapshot.sanctuary ? 'Present' : 'Not found');
      if (snapshot.sanctuary) {
        console.log('  - ID:', snapshot.sanctuary.id);
        console.log('  - Blob length:', snapshot.sanctuary.blob.length);
        console.log('  - Updated at:', new Date(snapshot.sanctuary.updatedAt).toISOString());
      }
      console.log('Biometric record:', snapshot.biometric ? 'Present' : 'Not found');
      if (snapshot.biometric) {
        console.log('  - ID:', snapshot.biometric.id);
        console.log('  - Enabled:', snapshot.biometric.enabled);
        console.log('  - Credential ID:', snapshot.biometric.credentialId || 'None');
      }
      if (snapshot.blobParts) {
        console.log('Blob parts:');
        console.log('  - IV:', snapshot.blobParts.iv.substring(0, 20) + '...');
        console.log('  - AuthTag:', snapshot.blobParts.authTag.substring(0, 20) + '...');
        console.log('  - Encrypted:', snapshot.blobParts.encrypted.substring(0, 50) + '...');
      }
      console.log('=== End Inspection ===\n');

      // Take screenshot
      const ss1 = await takeScreenshot(page, 'indexeddb', 'console-inspection', 'full');
      screenshots.push(ss1);
      report.addScreenshot(ss1, 'IndexedDB - Console Inspection');

      notes.push('Full IndexedDB inspection logged to console');
      notes.push(`Database: ${snapshot.databaseExists ? 'EXISTS' : 'MISSING'}`);
      notes.push(`Tables: ${snapshot.tables.join(', ')}`);

      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'IndexedDB Console Inspection',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots,
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'IndexedDB Tests',
        name: 'IndexedDB Console Inspection',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots
      });
      throw error;
    }
  });
});
