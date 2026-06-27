const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser in headed mode...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1024, height: 768 });

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT ERROR] ${err.message || err.stack || err}`);
  });

  try {
    console.log('Navigating to http://localhost:3000/index.html...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for mainMenuOverlay to be visible...');
    await page.waitForSelector('#mainMenuOverlay', { state: 'visible' });

    // Assert that the subtitle v2.0 is removed
    const subtitleCount = await page.locator('.menu-subtitle').count();
    if (subtitleCount > 0) {
      const text = await page.locator('.menu-subtitle').innerText();
      if (text.includes('NOWHERE IMMERSION')) {
        throw new Error('Subtitle "v2.0 // NOWHERE IMMERSION" was not removed!');
      }
    }
    console.log('✔ Subtitle "v2.0 // NOWHERE IMMERSION" is confirmed removed.');

    // Assert that Play Now convidado. button is visible inside main menu overlay
    const guestBtn = page.locator('#mainMenuOverlay button:has-text("Play Now as Guest")');
    await guestBtn.waitFor({ state: 'visible' });
    console.log('✔ "Play Now as Guest" button is confirmed visible.');

    // Programmatically open tutorial to test it since tutorial button is removed from menu
    console.log('Opening tutorial programmatically for testing...');
    await page.evaluate(() => {
      if (typeof window.OpenInteractiveTutorial === "function") {
        window.OpenInteractiveTutorial();
      }
    });

    // Wait for tutorial modal
    await page.waitForSelector('#interactiveTutorialModal', { state: 'visible' });
    console.log('✔ Tutorial Modal opened successfully.');

    // Assert localized tutorial text is present in the Sandbox tab
    const sandboxText = await page.locator('#paneSandbox').innerText();
    if (!sandboxText.includes('Welcome') && !sandboxText.includes('interactive tutorial') && !sandboxText.includes('Ghost Mode')) {
      throw new Error('English welcome text was not found in sandbox tab!');
    }
    console.log('✔ Localized tutorial text verified.');

    // Close tutorial
    console.log('Closing tutorial...');
    const closeBtn = page.locator('.tutorial-close-btn');
    await closeBtn.click();
    await page.waitForSelector('#interactiveTutorialModal', { state: 'hidden' });
    console.log('✔ Tutorial closed successfully.');

    // Click Play Now convidado. and start guest run
    console.log('Clicking Play Now as Guest to start guest run...');
    await guestBtn.click();

    // Wait for cutscene
    console.log('Waiting for cutscene gif...');
    await page.waitForSelector('#cutsceneGif', { state: 'visible', timeout: 15000 });
    console.log('✔ Cutscene initialized.');

    // Exit fullscreen programmatically to allow clicking the external navbar in the test
    console.log('Exiting fullscreen programmatically for test clicks...');
    await page.evaluate(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Verify classic header elements
    console.log('Checking for classic layout header and navigation buttons...');
    await page.waitForSelector('.site-header', { timeout: 5000 });
    await page.waitForSelector('#gameNavbar', { timeout: 5000 });
    await page.waitForSelector('#btnNavRPG', { timeout: 5000 });
    await page.waitForSelector('#btnNavChat', { timeout: 5000 });
    await page.waitForSelector('#btnNavSave', { timeout: 5000 });
    console.log('✔ Classic header and navigation buttons loaded successfully.');

    // Toggle RPG panel and verify it pops out flanking the canvas
    console.log('Toggling RPG Panel...');
    await page.click('#btnNavRPG');
    await page.waitForSelector('#rpgPanel', { state: 'visible' });
    console.log('✔ RPG Panel is visible flanking the canvas.');

    console.log('Feature verification test completed successfully!');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
