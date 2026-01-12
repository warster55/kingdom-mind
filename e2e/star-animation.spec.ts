import { test, expect } from '@playwright/test';

test.use({ 
  viewport: { width: 1280, height: 720 },
  video: 'on' 
});

test('capture star birth animation video', async ({ page }) => {
  // 1. Go to the Sandbox
  await page.goto('http://localhost:4000/test-stars');
  
  console.log('Sandbox Loaded.');
  await page.waitForTimeout(1000);

  // 2. Click the Trigger Button
  console.log('Clicking Breakthrough Trigger...');
  await page.click('#trigger-star');

  // 3. Wait for animation to finish
  await page.waitForTimeout(4000); 

  console.log('Video captured.');
});