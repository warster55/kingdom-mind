import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Assuming tests are in an 'e2e' directory
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]], // Use 'list' reporter to prevent opening browser
  use: {
    trace: 'on-first-retry',
    headless: true, // Run tests in headless mode
    baseURL: 'http://localhost:4000', // Base URL of our application
  },
  timeout: 60000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

});
