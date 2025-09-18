import { chromium } from '@playwright/test';

(async () => {
  console.log('Testing deployment at https://sentia-manufacturing-development.onrender.com');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Navigating to deployment URL...');
    const response = await page.goto('https://sentia-manufacturing-development.onrender.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('Response status:', response.status());
    console.log('Response URL:', response.url());

    // Check if React app loaded
    const title = await page.title();
    console.log('Page title:', title);

    // Check for React root element
    const rootElement = await page.$('#root');
    if (rootElement) {
      console.log('SUCCESS: React root element found');
    } else {
      console.log('ERROR: React root element not found');
    }

    // Take screenshot
    await page.screenshot({ path: 'deployment-test.png' });
    console.log('Screenshot saved as deployment-test.png');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('Test completed');
  }
})();