const { chromium } = require('playwright');

(async () => {
  console.log('Starting broken resources check...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const failedRequests = [];
  const consoleErrors = [];

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure().errorText
    });
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle' });
    console.log('Page loaded. Simulating play flow to trigger dynamic assets loading...');
    
    // Check if mainMenuOverlay is visible and click Guest play button
    const guestBtn = page.locator('button:has-text("Play Now as Guest")');
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
      await page.waitForTimeout(2000);
    }
    
    console.log('--- FAILED REQUESTS ---');
    console.log(JSON.stringify(failedRequests, null, 2));

    console.log('--- CONSOLE ERRORS ---');
    console.log(JSON.stringify(consoleErrors, null, 2));

  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    await browser.close();
  }
})();
