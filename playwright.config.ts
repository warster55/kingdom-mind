import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'local-setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'local-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['local-setup'],
    },
    {
      name: 'production',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://kingdomind.com',
      },
    },
  ],
});
