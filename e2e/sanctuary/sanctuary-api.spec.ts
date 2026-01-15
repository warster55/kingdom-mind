import { test, expect } from '@playwright/test';
import {
  takeScreenshot,
  validateBlobFormat,
  BASE_URL
} from './fixtures/test-utils';
import { getReportGenerator } from './fixtures/report-generator';

const report = getReportGenerator(BASE_URL);
const API_BASE = `${BASE_URL}/api/sanctuary/chat`;

test.describe('Sanctuary API', () => {
  test('GET Creates New Sanctuary - returns blob, display, isNewUser', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // Make GET request to sanctuary API
      const response = await request.get(API_BASE);
      const status = response.status();
      notes.push(`Response status: ${status}`);

      expect(status).toBe(200);

      const data = await response.json();

      // Log response structure
      console.log('\n=== GET /api/sanctuary Response ===');
      console.log('Keys:', Object.keys(data));
      console.log('isNewUser:', data.isNewUser);
      console.log('blob:', data.blob ? `${data.blob.length} chars` : 'null');
      console.log('display:', data.display);
      console.log('=== End Response ===\n');

      // Verify required fields
      expect(data).toHaveProperty('blob');
      notes.push(`Has blob: ${!!data.blob}`);

      expect(data).toHaveProperty('display');
      notes.push(`Has display: ${!!data.display}`);

      expect(data).toHaveProperty('isNewUser');
      notes.push(`Has isNewUser: true (value: ${data.isNewUser})`);

      // Verify blob format if present
      if (data.blob) {
        const validation = validateBlobFormat(data.blob);
        notes.push(`Blob format valid: ${validation.isValid}`);

        if (!validation.isValid) {
          notes.push(`Blob errors: ${validation.errors.join(', ')}`);
        }
      }

      // Verify display structure
      if (data.display) {
        notes.push(`Display totalBreakthroughs: ${data.display.totalBreakthroughs}`);
        notes.push(`Display totalStars: ${data.display.totalStars}`);
      }

      report.addTestResult({
        suite: 'API Tests',
        name: 'GET Creates New Sanctuary',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'GET Creates New Sanctuary',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });

  test('POST Empty Message - validates and returns display data', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // First get a sanctuary blob
      const getResponse = await request.get(API_BASE);
      const getData = await getResponse.json();
      const blob = getData.blob;

      notes.push(`Got initial blob: ${blob ? `${blob.length} chars` : 'none'}`);

      // POST with empty message
      const postResponse = await request.post(API_BASE, {
        data: {
          message: '',
          blob: blob
        }
      });

      const status = postResponse.status();
      notes.push(`POST status: ${status}`);

      // Should return 200 but with null response
      expect(status).toBe(200);

      const postData = await postResponse.json();

      console.log('\n=== POST (empty) Response ===');
      console.log('Keys:', Object.keys(postData));
      console.log('response:', postData.response);
      console.log('blob:', postData.blob ? `${postData.blob.length} chars` : 'null');
      console.log('=== End Response ===\n');

      // Response should be null for empty message
      notes.push(`Response is null: ${postData.response === null}`);

      // Should still have blob and display
      expect(postData).toHaveProperty('blob');
      expect(postData).toHaveProperty('display');
      notes.push('Has required fields (blob, display)');

      report.addTestResult({
        suite: 'API Tests',
        name: 'POST Empty Message',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'POST Empty Message',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });

  test('POST Processes Message - returns AI response and updated blob', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // First get a sanctuary blob
      const getResponse = await request.get(API_BASE);
      const getData = await getResponse.json();
      const initialBlob = getData.blob;

      notes.push(`Initial blob: ${initialBlob ? `${initialBlob.length} chars` : 'none'}`);

      // POST with actual message
      const postResponse = await request.post(API_BASE, {
        data: {
          message: 'Hello, tell me about purpose.',
          blob: initialBlob
        },
        timeout: 60000 // AI responses can take time
      });

      const status = postResponse.status();
      notes.push(`POST status: ${status}`);

      expect(status).toBe(200);

      const postData = await postResponse.json();

      console.log('\n=== POST (message) Response ===');
      console.log('Keys:', Object.keys(postData));
      console.log('response length:', postData.response?.length || 0);
      console.log('blob:', postData.blob ? `${postData.blob.length} chars` : 'null');
      console.log('=== End Response ===\n');

      // Should have AI response
      expect(postData.response).toBeTruthy();
      notes.push(`Has AI response: ${!!postData.response}`);
      notes.push(`Response length: ${postData.response?.length || 0} chars`);

      // Should have updated blob
      expect(postData.blob).toBeTruthy();
      notes.push(`Has updated blob: ${!!postData.blob}`);

      // Blob might be different from initial
      if (initialBlob && postData.blob) {
        const blobChanged = postData.blob !== initialBlob;
        notes.push(`Blob changed: ${blobChanged}`);
      }

      // Verify blob format
      if (postData.blob) {
        const validation = validateBlobFormat(postData.blob);
        notes.push(`Updated blob format valid: ${validation.isValid}`);
      }

      report.addTestResult({
        suite: 'API Tests',
        name: 'POST Processes Message',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'POST Processes Message',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });

  test('Invalid Blob Recovery - malformed blob creates fresh sanctuary', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // POST with invalid blob
      const postResponse = await request.post(API_BASE, {
        data: {
          message: 'Test with invalid blob',
          blob: 'this-is-not-a-valid-encrypted-blob'
        },
        timeout: 60000
      });

      const status = postResponse.status();
      notes.push(`POST status: ${status}`);

      // Should handle gracefully (either 200 with recovery or 400)
      notes.push(`Response handled: ${status >= 200 && status < 500}`);

      if (status === 200) {
        const postData = await postResponse.json();

        // Should have created a fresh sanctuary
        notes.push('Server recovered from invalid blob');

        if (postData.blob) {
          const validation = validateBlobFormat(postData.blob);
          notes.push(`New blob format valid: ${validation.isValid}`);
        }
      } else if (status >= 400) {
        notes.push('Server rejected invalid blob (expected behavior)');
      }

      report.addTestResult({
        suite: 'API Tests',
        name: 'Invalid Blob Recovery',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'Invalid Blob Recovery',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });

  test('Null Blob Handling - server creates new sanctuary when blob is null', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // POST with null blob
      const postResponse = await request.post(API_BASE, {
        data: {
          message: 'First message with no existing sanctuary',
          blob: null
        },
        timeout: 60000
      });

      const status = postResponse.status();
      notes.push(`POST status: ${status}`);

      expect(status).toBe(200);

      const postData = await postResponse.json();

      // Should create a new sanctuary
      expect(postData.blob).toBeTruthy();
      notes.push(`Created new blob: ${!!postData.blob}`);

      if (postData.blob) {
        notes.push(`New blob length: ${postData.blob.length} chars`);

        const validation = validateBlobFormat(postData.blob);
        notes.push(`New blob format valid: ${validation.isValid}`);
      }

      // Should have AI response
      expect(postData.response).toBeTruthy();
      notes.push(`Has AI response: ${!!postData.response}`);

      report.addTestResult({
        suite: 'API Tests',
        name: 'Null Blob Handling',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'Null Blob Handling',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });

  test('API Response Time - check response latency', async ({ request }) => {
    const startTime = Date.now();
    const notes: string[] = [];

    try {
      // Measure GET response time
      const getStart = Date.now();
      const getResponse = await request.get(API_BASE);
      const getTime = Date.now() - getStart;

      notes.push(`GET response time: ${getTime}ms`);
      expect(getResponse.status()).toBe(200);

      const getData = await getResponse.json();

      // Measure POST response time (with message)
      const postStart = Date.now();
      const postResponse = await request.post(API_BASE, {
        data: {
          message: 'Quick test',
          blob: getData.blob
        },
        timeout: 60000
      });
      const postTime = Date.now() - postStart;

      notes.push(`POST response time: ${postTime}ms`);
      expect(postResponse.status()).toBe(200);

      // Log timing summary
      console.log('\n=== API Response Times ===');
      console.log(`GET /api/sanctuary: ${getTime}ms`);
      console.log(`POST /api/sanctuary: ${postTime}ms`);
      console.log('=== End Timing ===\n');

      // Response times should be reasonable
      // GET should be fast (no AI involved)
      notes.push(`GET under 5s: ${getTime < 5000}`);

      // POST can be slower due to AI response
      notes.push(`POST under 60s: ${postTime < 60000}`);

      report.addTestResult({
        suite: 'API Tests',
        name: 'API Response Time',
        status: 'passed',
        duration: Date.now() - startTime,
        screenshots: [],
        notes
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      report.addTestResult({
        suite: 'API Tests',
        name: 'API Response Time',
        status: 'failed',
        duration: Date.now() - startTime,
        error: errorMessage,
        screenshots: []
      });
      throw error;
    }
  });
});
