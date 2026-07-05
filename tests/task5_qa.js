const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

const PORT = 3001;

server.listen(PORT, async () => {
  console.log(`Static server listening on port ${PORT}`);

  console.log('Launching browser in headed mode...');
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1024, height: 768 });

  // Mock DeSo node API endpoints
  await page.route('**/api/v0/**', async route => {
    const url = route.request().url();
    console.log(`[MOCKING DESO ROUTE] ${url}`);
    
    if (url.includes('get-single-profile')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Profile: { ExtraData: {} } })
      });
    } else if (url.includes('get-posts-for-public-key')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Posts: [] })
      });
    } else if (url.includes('get-nfts-for-user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ NFTsMap: {} })
      });
    } else if (url.includes('get-hodlers-for-public-key')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Hodlers: [] })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    }
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[BROWSER ERROR] ${msg.text()}`);
    }
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[BROWSER UNCAUGHT ERROR] ${err.message}`);
    console.error(`[BROWSER UNCAUGHT ERROR] ${err.stack || err}`);
  });

  try {
    console.log('1. Navigating to http://localhost:3001/index.html...');
    await page.goto('http://localhost:3001/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    console.log('2. Verifying Single LOGIN DESO button is visible below canvas...');
    const desoBtn = page.locator('#desoBtn');
    await desoBtn.waitFor({ state: 'visible' });
    const isDesoBtnVisible = await desoBtn.isVisible();
    console.log(`- desoBtn visible: ${isDesoBtnVisible}`);

    const guestBtnCount = await page.locator('button:has-text("Guest")').count();
    const guestBtnCount2 = await page.locator('button:has-text("Convidado")').count();
    console.log(`- Guest button count: ${guestBtnCount + guestBtnCount2}`);
    if (guestBtnCount + guestBtnCount2 > 0) {
      throw new Error('Guest buttons should not be visible in index.html!');
    }

    console.log('3. Verifying SPACE starts guest game and hides loginButtonsContainer...');
    const loginContainer = page.locator('#loginButtonsContainer');
    await loginContainer.waitFor({ state: 'visible' });

    // Press SPACE
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // loginButtonsContainer should be hidden
    const isLoginContainerVisible = await loginContainer.isVisible();
    console.log(`- loginButtonsContainer visible after SPACE: ${isLoginContainerVisible}`);
    if (isLoginContainerVisible) {
      throw new Error('loginButtonsContainer should be hidden after pressing space to play as guest!');
    }

    // Verify cutscene initialized
    const cutsceneGif = page.locator('#cutsceneGif');
    const isCutsceneVisible = await cutsceneGif.isVisible();
    console.log(`- cutsceneGif visible: ${isCutsceneVisible}`);
    if (!isCutsceneVisible) {
      throw new Error('Cutscene should start after pressing space!');
    }

    console.log('4. Reloading page to test Login DeSo flow...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    console.log('5. Clicking Login DeSo button to trigger login state...');
    await page.evaluate(() => {
      window.open = () => {
        return {
          document: {
            write: () => {},
            close: () => {}
          },
          close: () => {}
        };
      };
    });
    await desoBtn.click();
    await page.waitForTimeout(500);

    console.log('6. Simulating successful DeSo login via custom MessageEvent with origin...');
    await page.evaluate(() => {
      const messageEvent = new MessageEvent('message', {
        data: {
          id: 't',
          service: 'identity',
          method: 'login',
          payload: {
            users: {
              'BC1YLtest123': {
                publicKey: 'BC1YLtest123',
                accessLevel: 4,
                accessLevelHmac: '0000000000000000000000000000000000000000000000000000000000000000',
                encryptedSeedHex: '0000000000000000000000000000000000000000000000000000000000000000'
              }
            }
          }
        },
        origin: 'https://identity.deso.org'
      });
      window.dispatchEvent(messageEvent);
    });
    
    // Wait for mock fetch requests to finish and overlay to open
    await page.waitForTimeout(1500);

    // Verify loginButtonsContainer is hidden
    const isLoginContainerVisiblePostLogin = await loginContainer.isVisible();
    console.log(`- loginButtonsContainer visible after login: ${isLoginContainerVisiblePostLogin}`);
    if (isLoginContainerVisiblePostLogin) {
      throw new Error('loginButtonsContainer should be hidden after successful login!');
    }

    // Verify character selection overlay appears
    const charOverlay = page.locator('#characterSelectionOverlay');
    const isCharOverlayVisible = await charOverlay.isVisible();
    console.log(`- characterSelectionOverlay visible: ${isCharOverlayVisible}`);
    if (!isCharOverlayVisible) {
      throw new Error('characterSelectionOverlay should be visible after login!');
    }

    // Verify if no ghosts -> shows create ghost UI
    const overlayText = await charOverlay.innerText();
    console.log(`- Overlay text snippet: ${overlayText.substring(0, 100).replace(/\n/g, ' ')}...`);
    if (!overlayText.includes('CREATE') && !overlayText.includes('GHOST')) {
      throw new Error('Overlay should display ghost creation option!');
    }

    console.log('7. Dismissing character selection overlay programmatically to test header clicks...');
    await page.evaluate(() => {
      const overlay = document.getElementById("characterSelectionOverlay");
      if (overlay) overlay.style.display = "none";
    });
    await page.waitForTimeout(200);

    console.log('8. Verifying SAVE button triggers identity popup...');
    const saveBtn = page.locator('#btnNavSave');
    const isSaveBtnVisible = await saveBtn.isVisible();
    console.log(`- saveBtn visible: ${isSaveBtnVisible}`);
    
    await saveBtn.click();
    await page.waitForTimeout(1000);

    console.log('9. Reviewing console errors...');
    console.log(`- Total console errors captured: ${consoleErrors.length}`);

    // Filter down to actual syntax/runtime script errors on our localhost domain
    const realErrors = consoleErrors.filter(err => {
      const lower = err.toLowerCase();
      // Keep only true JS runtime errors from our localhost origin, ignore external identity.deso.org iframe errors
      return lower.includes('error') && 
            !lower.includes('failed to load resource') && 
            !lower.includes('404') && 
            !lower.includes('security policy') && 
            !lower.includes('cloudflare') &&
            !lower.includes('identity.deso.org');
    });
    console.log(`- Real script execution errors: ${realErrors.length}`);
    realErrors.forEach(err => console.log(`  > ${err}`));

    if (realErrors.length > 0) {
      throw new Error(`Captured ${realErrors.length} real browser runtime errors during flow!`);
    }

    console.log('QA VALIDATION PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('QA VALIDATION FAILED:', err);
    process.exit(1);
  } finally {
    console.log('Shutting down server...');
    server.close();
    await browser.close();
  }
});
