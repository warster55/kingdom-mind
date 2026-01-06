import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ request }) => {
  console.log('Authenticating via API...');
  
  // 1. Get CSRF token
  const csrfResponse = await request.get('/api/auth/csrf');
  const { csrfToken } = await csrfResponse.json();

  // 2. Perform Login
  const loginResponse = await request.post('/api/auth/callback/credentials', {
    form: {
      email: 'test@kingdommind.app',
      password: 'password',
      csrfToken,
      json: 'true'
    }
  });

  expect(loginResponse.status()).toBe(200);
  
  // 3. Save State
  await request.storageState({ path: authFile });
  console.log('Auth successful via API.');
});