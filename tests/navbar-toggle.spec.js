const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser in headed mode...');
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
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

    console.log('Clicking Play Now convidado. button...');
    const guestBtn = page.locator('#mainMenuOverlay button:has-text("Play Now as Guest")');
    await guestBtn.click();

    console.log('Waiting for cutscene gif to be visible...');
    await page.waitForSelector('#cutsceneGif', { state: 'visible', timeout: 15000 });
    console.log('✔ Cutscene initialized.');

    // Exit fullscreen programmatically to allow clicking the external navbar in the test
    console.log('Exiting fullscreen programmatically for test clicks...');
    await page.evaluate(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Wait for the UI navbar to settle
    await page.waitForSelector('#btnNavBag', { state: 'visible' });

    console.log('Clicking #btnNavBag (Bag)...');
    await page.click('#btnNavBag');

    // Wait for cooldown
    await page.waitForTimeout(200);

    console.log('Verifying that #navbarPanel is open...');
    const activeTabAfterBag = await page.evaluate(() => window.g_activeTab);
    if (activeTabAfterBag !== 'bag') {
      throw new Error(`g_activeTab is ${activeTabAfterBag}, expected 'bag'`);
    }

    console.log('Verifying that #navbarPanel contains text "GHOST BAG"...');
    if (!(await page.locator('#navbarPanel').isVisible())) {
      throw new Error('navbarPanel is hidden when it should be visible');
    }
    let panelText = await page.locator('#navbarPanel').innerText();
    if (!panelText.includes('GHOST BAG')) {
      throw new Error('navbarPanel does not contain "GHOST BAG"');
    }
    console.log('✔ GHOST BAG is visible.');

    console.log('Clicking #btnNavEquip (Equip)...');
    await page.click('#btnNavEquip');

    // Wait for the tab click cooldown guard (50ms) to pass and content to load
    await page.waitForTimeout(200);

    console.log('Verifying that Bag contents are replaced/closed and it contains "EQUIPMENT"...');
    if (!(await page.locator('#navbarPanel').isVisible())) {
      throw new Error('navbarPanel is hidden when it should be visible');
    }
    panelText = await page.locator('#navbarPanel').innerText();
    if (panelText.includes('GHOST BAG')) {
      throw new Error('Bag contents were not replaced/closed after clicking Equip!');
    }
    if (!panelText.includes('EQUIPMENT')) {
      throw new Error('navbarPanel does not contain "EQUIPMENT"');
    }
    console.log('✔ Bag contents replaced by EQUIPMENT.');

    console.log('Verifying that no other panel is open...');
    const activeTab = await page.evaluate(() => window.g_activeTab);
    if (activeTab !== 'equip') {
      throw new Error(`g_activeTab is ${activeTab}, expected 'equip'`);
    }

    if (await page.locator('#rpgPanel').isVisible()) {
      throw new Error('rpgPanel is visible when it should be hidden');
    }

    if (await page.locator('#chatPanel').isVisible()) {
      throw new Error('chatPanel is visible when it should be hidden');
    }
    console.log('✔ No other panels are open.');

    console.log('Clicking #btnNavEquip again...');
    await page.click('#btnNavEquip');

    // Wait for cooldown
    await page.waitForTimeout(200);

    console.log('Verifying that #navbarPanel becomes hidden...');
    const activeTabAfterClose = await page.evaluate(() => window.g_activeTab);
    if (activeTabAfterClose !== null) {
      throw new Error(`g_activeTab is ${activeTabAfterClose}, expected null`);
    }

    if (await page.locator('#navbarPanel').isVisible()) {
      throw new Error('navbarPanel is visible when it should be hidden');
    }
    console.log('✔ navbarPanel became hidden.');

    console.log('Clicking #btnNavSpells (Spells)...');
    await page.click('#btnNavSpells');
    await page.waitForTimeout(200);

    console.log('Verifying that #navbarPanel is open and contains "ACTIVE SKILLS & RUNES" and "RPG MANUAL"...');
    if (!(await page.locator('#navbarPanel').isVisible())) {
      throw new Error('navbarPanel is hidden when it should be visible');
    }
    panelText = await page.locator('#navbarPanel').innerText();
    if (!panelText.includes('ACTIVE SKILLS & RUNES')) {
      throw new Error('navbarPanel does not contain "ACTIVE SKILLS & RUNES"');
    }
    if (!panelText.includes('RPG MANUAL')) {
      throw new Error('navbarPanel does not contain "RPG MANUAL"');
    }
    console.log('✔ Spells tab is visible.');

    console.log('Clicking #btnNavBag (Bag)...');
    await page.click('#btnNavBag');
    await page.waitForTimeout(200);

    console.log('Verifying that Bag contents are displayed and spells manual is closed/replaced...');
    if (!(await page.locator('#navbarPanel').isVisible())) {
      throw new Error('navbarPanel is hidden when it should be visible');
    }
    panelText = await page.locator('#navbarPanel').innerText();
    if (panelText.includes('ACTIVE SKILLS & RUNES')) {
      throw new Error('Spells tab was not replaced/closed after clicking Bag!');
    }
    if (!panelText.includes('GHOST BAG')) {
      throw new Error('navbarPanel does not contain "GHOST BAG"');
    }
    console.log('✔ Bag contents displayed.');

    console.log('Clicking #btnNavSpells (Spells) again...');
    await page.click('#btnNavSpells');
    await page.waitForTimeout(200);

    console.log('Verifying that Spells displays and Bag panel is closed...');
    if (!(await page.locator('#navbarPanel').isVisible())) {
      throw new Error('navbarPanel is hidden when it should be visible');
    }
    panelText = await page.locator('#navbarPanel').innerText();
    if (panelText.includes('GHOST BAG')) {
      throw new Error('Bag tab was not replaced/closed after clicking Spells!');
    }
    if (!panelText.includes('ACTIVE SKILLS & RUNES')) {
      throw new Error('navbarPanel does not contain "ACTIVE SKILLS & RUNES"');
    }
    console.log('✔ Spells tab is visible again.');

    console.log('Clicking #btnNavSpells again...');
    await page.click('#btnNavSpells');
    await page.waitForTimeout(200);

    console.log('Verifying that #navbarPanel becomes hidden...');
    const activeTabAfterSpellsClose = await page.evaluate(() => window.g_activeTab);
    if (activeTabAfterSpellsClose !== null) {
      throw new Error(`g_activeTab is ${activeTabAfterSpellsClose}, expected null`);
    }

    if (await page.locator('#navbarPanel').isVisible()) {
      throw new Error('navbarPanel is visible when it should be hidden after closing Spells');
    }
    console.log('✔ navbarPanel became hidden after closing Spells.');

    console.log('All assertions passed successfully!');
    await page.waitForTimeout(1000);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
