const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();
  
  page1.on('console', msg => {
      if(msg.type() === 'error') console.error(`[C1 ERR] ${msg.text()}`);
      // else console.log(`[C1] ${msg.text()}`);
  });
  page2.on('console', msg => {
      if(msg.type() === 'error') console.error(`[C2 ERR] ${msg.text()}`);
  });
  
  page1.on('pageerror', err => console.error(`[C1 PAGE ERROR] ${err}`));
  page2.on('pageerror', err => console.error(`[C2 PAGE ERROR] ${err}`));

  console.log("Navigating...");
  await page1.goto('http://localhost:3000');
  await page2.goto('http://localhost:3000');
  
  await page1.waitForTimeout(1000);
  
  console.log("Logging in C1...");
  await page1.evaluate(() => {
    if(window.LoginGoogle) window.LoginGoogle();
  });
  
  console.log("Logging in C2...");
  await page2.evaluate(() => {
    if(window.LoginGoogle) window.LoginGoogle();
  });

  await page1.waitForTimeout(2000);

  // Move C1
  console.log("Moving C1...");
  await page1.evaluate(() => {
    if (window.DeSoGhost) {
       window.DeSoGhost.xPos = 500;
       window.DeSoGhost.yPos = 300;
    } else {
       // Mock DeSoGhost if it's undefined
       window.DeSoGhost = { xPos: 500, yPos: 300, face: 1 };
    }
    // The setInterval in network.js will pick this up and send it.
    // Or we can manually call emitPlayerMove
    if (window.emitPlayerMove) {
       window.emitPlayerMove(500, 300, true, 'idle', 'level 1');
    }
  });

  await page1.waitForTimeout(1000);

  // Check C2
  console.log("Checking C2 state...");
  const otherPlayers = await page2.evaluate(() => {
     return window.NetworkState ? window.NetworkState.otherPlayers : null;
  });
  
  console.log("C2 otherPlayers:", otherPlayers);

  await browser.close();
})();
