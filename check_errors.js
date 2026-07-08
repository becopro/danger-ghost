const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning' || msg.type() === 'log') {
        console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[UNCAUGHT EXCEPTION] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  console.log(`Loading: ${fileUrl}`);
  
  try {
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      console.log('Page loaded successfully. Waiting a bit for scripts to run...');
      await page.waitForTimeout(2000);
  } catch (e) {
      console.error('Error navigating:', e);
  }

  await browser.close();
})();
