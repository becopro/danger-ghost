const { chromium } = require('playwright');
const path = require('path');

async function safeScreenshot(page, filepath) {
  try {
    console.log(`Taking screenshot: ${filepath}`);
    await page.screenshot({ path: filepath, timeout: 5000 });
  } catch (err) {
    console.warn(`[WARNING] Failed to take screenshot ${filepath}: ${err.message}`);
  }
}

(async () => {
  console.log('Launching browser in headed mode...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1024, height: 768 });

  // Captura mensagens normais do console
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  // Captura erros não tratados da página
  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT ERROR] ${err.message || err.stack || err}`);
  });

  // Captura falhas de requisição de rede
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - Error: ${request.failure().errorText}`);
  });

  // Captura respostas HTTP de erro
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[HTTP ERROR] ${response.url()} - Status: ${response.status()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:3000/index.html...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for mainMenuOverlay to be visible...');
    await page.waitForSelector('#mainMenuOverlay', { state: 'visible' });
    await page.waitForTimeout(1000);

    await safeScreenshot(page, 'menu_principal.png');

    console.log('Clicking Play Now convidado. button...');
    const guestBtn = page.locator('button:has-text("Play Now as Guest")');
    await guestBtn.click();

    console.log('Waiting for cutscene gif to be visible...');
    await page.waitForSelector('#cutsceneGif', { state: 'visible', timeout: 15000 });
    
    await page.waitForTimeout(2000);

    await safeScreenshot(page, 'gameplay_start.png');

    console.log('Smoke test finished successfully!');
    await page.waitForTimeout(2000);
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();

