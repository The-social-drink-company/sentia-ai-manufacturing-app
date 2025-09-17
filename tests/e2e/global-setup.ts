import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Perform any global setup like authentication
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  console.log(`[Test Setup] Initializing with base URL: ${baseUrl}`);

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    console.log('[Test Setup] Successfully connected to application');

    // Check if app is running
    const title = await page.title();
    console.log(`[Test Setup] Page title: ${title}`);

    // Store any global state if needed
    process.env.TEST_SETUP_COMPLETE = 'true';

  } catch (error) {
    console.error('[Test Setup] Failed to connect to application:', error.message);
    // Continue anyway to allow tests to run
  } finally {
    await browser.close();
  }

  return async () => {
    // Global teardown code if needed
    console.log('[Test Teardown] Cleaning up...');
  };
}

export default globalSetup;