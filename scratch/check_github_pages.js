const { chromium } = require('playwright');

(async () => {
  console.log('Starting check on GitHub Pages...');
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
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    await page.goto('https://becopro.github.io/danger-ghost/index.html', { waitUntil: 'networkidle' });
    console.log('Page loaded on GitHub Pages. Simulating play flow...');
    
    // Check if mainMenuOverlay is visible and click Guest play button
    const guestBtn = page.locator('button:has-text("Play Now as Guest")');
    if (await guestBtn.isVisible()) {
      await guestBtn.click();
      await page.waitForTimeout(2000);
    }
    
    console.log('--- FAILED REQUESTS ---');
    console.log(JSON.stringify(failedRequests, null, 2));

  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    await browser.close();
  }
})();
