const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log('Navigating to game...');
  await page.goto('http://localhost:3000');
  
  // Inject the user's public key (BC1YLHTW...) to trigger auto-login
  await page.evaluate(() => {
    localStorage.setItem('dg_deso_public_key', 'BC1YLHTW662tGfT3kZZ593c2U4UUSoR17m6L4y21K4LgV7JXXaJ1LpM'); // Just need a valid-looking prefix for it to try loading
  });

  console.log('Reloading to trigger auto-login...');
  await page.reload();

  console.log('Waiting 5 seconds for API calls to settle...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
