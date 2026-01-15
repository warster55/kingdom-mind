import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sanctuary tests sequentially for IndexedDB consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sanctuary tests to avoid IndexedDB conflicts
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    trace: 'on-first-retry',
    headless: true,
    baseURL: 'http://localhost:3002',
    // Screenshot configuration
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  timeout: 120000, // 2 minutes for AI responses
  expect: {
    timeout: 30000, // 30 seconds for assertions
  },
  projects: [
    {
      name: 'sanctuary',
      testDir: './e2e/sanctuary',
      use: {
        ...devices['Desktop Chrome'],
        // Sanctuary-specific settings
        viewport: { width: 1280, height: 720 },
      },
      // Global setup for report generation
      teardown: 'generate-report',
    },
    {
      name: 'generate-report',
      testMatch: /global\.teardown\.ts/,
    },
    {
      name: 'chromium',
      testDir: './e2e',
      testIgnore: ['**/sanctuary/**', '**/global.teardown.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Output directory for test artifacts
  outputDir: './e2e/reports/test-results',
});
