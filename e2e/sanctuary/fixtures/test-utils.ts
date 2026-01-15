import { Page, expect } from '@playwright/test';

/**
 * Sanctuary Test Utilities
 * Shared helpers for testing the sanctuary system
 */

// Base URL for tests
export const BASE_URL = 'http://localhost:3002';

/**
 * Wait for the sanctuary to be fully loaded and ready
 */
export async function waitForSanctuaryReady(page: Page): Promise<void> {
  // Wait for loading state to disappear
  await page.waitForFunction(() => {
    const loadingText = document.body.textContent;
    return !loadingText?.includes('Preparing your sanctuary') &&
           !loadingText?.includes('Loading...');
  }, { timeout: 15000 });

  // Wait for the main container
  await page.waitForSelector('[class*="bg-stone-950"]', { timeout: 10000 });
}

/**
 * Wait for biometric lock to resolve (unlock or skip)
 */
export async function waitForBiometricResolved(page: Page): Promise<void> {
  // Wait for either:
  // 1. Lock screen to disappear (unlocked/disabled)
  // 2. Chat input to appear (fully loaded)
  await page.waitForFunction(() => {
    const lockScreen = document.querySelector('[class*="z-[250]"]');
    const chatInput = document.querySelector('textarea, input[type="text"]');
    return !lockScreen || chatInput;
  }, { timeout: 10000 });
}

/**
 * Send a chat message and wait for response
 */
export async function sendChatMessage(page: Page, message: string): Promise<string> {
  // Find and fill the chat input
  const input = page.locator('textarea, input[placeholder*="heart"], input[placeholder*="message"]').first();
  await input.fill(message);

  // Click send button or press Enter
  const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
  if (await sendButton.isVisible()) {
    await sendButton.click();
  } else {
    await input.press('Enter');
  }

  // Wait for response (streaming to complete)
  await page.waitForFunction(() => {
    const messages = document.querySelectorAll('[class*="message"], [class*="chat"]');
    return messages.length >= 2; // At least welcome + user message
  }, { timeout: 30000 });

  // Wait a bit for streaming to complete
  await page.waitForTimeout(2000);

  // Get the last assistant message
  const assistantMessages = await page.locator('[class*="assistant"], [class*="ai-message"]').all();
  if (assistantMessages.length > 0) {
    return await assistantMessages[assistantMessages.length - 1].textContent() || '';
  }

  return '';
}

/**
 * Validate blob format: base64(IV):base64(AuthTag):base64(Data)
 */
export interface BlobValidation {
  isValid: boolean;
  parts: {
    iv: string;
    authTag: string;
    encrypted: string;
  } | null;
  errors: string[];
  ivByteLength?: number;
  authTagByteLength?: number;
  dataByteLength?: number;
}

export function validateBlobFormat(blob: string): BlobValidation {
  const errors: string[] = [];
  const parts = blob.split(':');

  if (parts.length !== 3) {
    return {
      isValid: false,
      parts: null,
      errors: [`Expected 3 parts separated by ':', got ${parts.length}`]
    };
  }

  const [iv, authTag, encrypted] = parts;

  // Validate base64 format for each part
  function isValidBase64(str: string): boolean {
    try {
      // Check if it's valid base64
      const decoded = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      return decoded.length > 0;
    } catch {
      return false;
    }
  }

  function getBase64ByteLength(str: string): number {
    try {
      const decoded = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      return decoded.length;
    } catch {
      return 0;
    }
  }

  if (!isValidBase64(iv)) {
    errors.push('IV is not valid base64');
  }
  if (!isValidBase64(authTag)) {
    errors.push('AuthTag is not valid base64');
  }
  if (!isValidBase64(encrypted)) {
    errors.push('Encrypted data is not valid base64');
  }

  const ivByteLength = getBase64ByteLength(iv);
  const authTagByteLength = getBase64ByteLength(authTag);
  const dataByteLength = getBase64ByteLength(encrypted);

  // AES-256-GCM uses 12-byte IV (96 bits) and 16-byte auth tag (128 bits)
  if (ivByteLength !== 12) {
    errors.push(`IV should be 12 bytes, got ${ivByteLength}`);
  }
  if (authTagByteLength !== 16) {
    errors.push(`AuthTag should be 16 bytes, got ${authTagByteLength}`);
  }

  return {
    isValid: errors.length === 0,
    parts: { iv, authTag, encrypted },
    errors,
    ivByteLength,
    authTagByteLength,
    dataByteLength
  };
}

/**
 * Check if a string contains plaintext patterns that shouldn't be there
 */
export interface PlaintextCheck {
  containsPlaintext: boolean;
  foundPatterns: string[];
}

export function containsPlaintextPatterns(data: string): PlaintextCheck {
  const patterns = [
    // JSON structure indicators
    /\{"[a-zA-Z]+"/,           // JSON object start
    /\[\{/,                     // Array of objects
    /"[a-zA-Z]+"\s*:/,          // JSON key

    // Common sanctuary data fields
    /breakthroughs?/i,
    /insights?/i,
    /resonance/i,
    /domain/i,
    /identity/i,
    /purpose/i,
    /mindset/i,
    /relationships?/i,
    /vision/i,
    /action/i,
    /legacy/i,
    /stars?/i,
    /userId/i,
    /sessionId/i,

    // PII patterns
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,                    // Phone
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/,                      // SSN pattern
  ];

  const foundPatterns: string[] = [];

  for (const pattern of patterns) {
    if (pattern.test(data)) {
      foundPatterns.push(pattern.source);
    }
  }

  return {
    containsPlaintext: foundPatterns.length > 0,
    foundPatterns
  };
}

/**
 * Take a screenshot with consistent naming
 */
export async function takeScreenshot(
  page: Page,
  testSuite: string,
  testName: string,
  step: string
): Promise<string> {
  const timestamp = Date.now();
  const filename = `${testSuite}-${testName}-${step}-${timestamp}.png`;
  const path = `e2e/reports/screenshots/${filename}`;

  await page.screenshot({
    path,
    fullPage: true
  });

  return path;
}

/**
 * Get network requests made during a test
 */
export interface NetworkLog {
  url: string;
  method: string;
  status?: number;
  requestBody?: string;
  responseBody?: string;
}

export async function captureNetworkRequests(
  page: Page,
  callback: () => Promise<void>
): Promise<NetworkLog[]> {
  const logs: NetworkLog[] = [];

  page.on('request', request => {
    const log: NetworkLog = {
      url: request.url(),
      method: request.method(),
      requestBody: request.postData() || undefined
    };
    logs.push(log);
  });

  page.on('response', response => {
    const matchingLog = logs.find(l => l.url === response.url() && !l.status);
    if (matchingLog) {
      matchingLog.status = response.status();
    }
  });

  await callback();

  return logs;
}

/**
 * Check if the welcome message is displayed
 */
export async function hasWelcomeMessage(page: Page): Promise<boolean> {
  const content = await page.textContent('body');
  return !!(
    content?.includes('Welcome') ||
    content?.includes('traveler') ||
    content?.includes('sanctuary')
  );
}

/**
 * Check if streaming is in progress
 */
export async function isStreaming(page: Page): Promise<boolean> {
  // Look for streaming indicators
  const hasSpinner = await page.locator('[class*="animate-spin"], [class*="loading"]').count() > 0;
  const hasStreamingClass = await page.locator('[class*="streaming"]').count() > 0;
  return hasSpinner || hasStreamingClass;
}

/**
 * Wait for streaming to complete
 */
export async function waitForStreamingComplete(page: Page, timeout = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (!(await isStreaming(page))) {
      // Give it a moment to finalize
      await page.waitForTimeout(500);
      if (!(await isStreaming(page))) {
        return;
      }
    }
    await page.waitForTimeout(100);
  }

  throw new Error('Streaming did not complete within timeout');
}

/**
 * Generate a unique test user identifier
 */
export function generateTestUserId(): string {
  return `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
