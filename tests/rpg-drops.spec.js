const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting RPG Drops and Spells integration test...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1024, height: 768 });

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER UNCAUGHT ERROR] ${err.message || err.stack || err}`);
    process.exit(1);
  });

  try {
    console.log('Navigating to http://localhost:3000/index.html...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for mainMenuOverlay to be visible...');
    await page.waitForSelector('#mainMenuOverlay', { state: 'visible' });
    
    // Entrar na partida Convidado
    const guestBtn = page.locator('button:has-text("Play Now as Guest")');
    await guestBtn.click();
    console.log('Clicked Play Now Guest.');

    console.log('Waiting for cutscene gif to load...');
    await page.waitForSelector('#cutsceneGif', { state: 'visible', timeout: 15000 });
    
    // Verificar se a seção de equipamentos no HTML existe
    console.log('Verifying if Section: RPG Equipment Showcase exists in index.html...');
    const showcase = page.locator('#equipment-showcase-section');
    await showcase.waitFor({ state: 'visible' });
    console.log('Showcase section is visible on index.html!');

    // Validar se os ícones dos equipamentos estão carregados na página
    const headImg = showcase.locator('img[alt="Head Armor"]');
    await headImg.waitFor({ state: 'visible' });
    const ringIceImg = showcase.locator('img[alt="Ice Ring"]');
    await ringIceImg.waitFor({ state: 'visible' });
    console.log('Equipment showcase slot images are loaded successfully!');

    // Executar testes lógicos internos do RPG via evaluate
    console.log('Evaluating RPG drops and equipment state in page context...');
    const rpgResult = await page.evaluate(() => {
      if (!window.GhostRPG) {
        return { success: false, reason: "GhostRPG not found" };
      }
      
      // Reseta os status para garantir consistência
      GhostRPG.resetStats();
      var statsBefore = GhostRPG.getStats();
      var initialVit = statsBefore.vit;
      var initialAgi = statsBefore.agi;

      // 1. Validar Roll de Drops de Inimigo
      var dropped = window.RollEnemyDrop("15");
      var statsAfterDrop = GhostRPG.getStats();
      
      // 2. Criar e adicionar anéis específicos
      var iceRing = LootGenerator.generate(1, 'ring1', 'Rare');
      var woodRing = LootGenerator.generate(1, 'ring2', 'Epic');
      
      GhostRPG.addItem(iceRing);
      GhostRPG.addItem(woodRing);

      // Mapear bônus iniciais dos anéis
      var expectedIntBonus = (iceRing.attributes.int || 0) + (woodRing.attributes.int || 0);
      var expectedMagBonus = (iceRing.attributes.mag || 0) + (woodRing.attributes.mag || 0);

      // 3. Equipar os anéis e testar bônus dinâmicos
      var equipIceSuccess = GhostRPG.equipItem(iceRing.id, 'ring1');
      var equipWoodSuccess = GhostRPG.equipItem(woodRing.id, 'ring2');
      
      var statsEquipped = GhostRPG.getStats();

      // Verificar se os atributos foram incrementados
      var vitBonus = statsEquipped.vit - statsEquipped.baseVit;
      var intBonus = statsEquipped.int - statsEquipped.baseInt;
      var magBonus = statsEquipped.mag - statsEquipped.baseMag;

      // Forçar estado de PLAY para permitir o cast
      var oldGameState = window.g_gameState;
      window.g_gameState = 1; // 1 represents G_PLAY inside IIFE
      DeSoGhost.dead = false;
      DeSoGhost.mana = 100;
      
      // Simula o keydown síncrono para tecla "2" (Gelo, keyCode = 50)
      var beforeMana2 = DeSoGhost.mana;
      var beforeProjCount2 = g_projectiles.length;
      
      var e2 = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(e2, 'keyCode', { value: 50, enumerable: true });
      Object.defineProperty(e2, 'which', { value: 50, enumerable: true });
      window.dispatchEvent(e2);
      
      var afterMana2 = DeSoGhost.mana;
      var afterProjCount2 = g_projectiles.length;
      
      // Simula o keydown síncrono para tecla "3" (Madeira, keyCode = 51)
      var beforeMana3 = DeSoGhost.mana;
      var beforeProjCount3 = g_projectiles.length;
      
      var e3 = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(e3, 'keyCode', { value: 51, enumerable: true });
      Object.defineProperty(e3, 'which', { value: 51, enumerable: true });
      window.dispatchEvent(e3);
      
      var afterMana3 = DeSoGhost.mana;
      var afterProjCount3 = g_projectiles.length;

      // Restaura o estado original
      window.g_gameState = oldGameState;

      return {
        success: true,
        initialVit: initialVit,
        initialAgi: initialAgi,
        droppedCount: dropped.length,
        inventorySize: statsAfterDrop.inventory.length,
        equipIceSuccess: equipIceSuccess,
        equipWoodSuccess: equipWoodSuccess,
        vitBonus: vitBonus,
        intBonus: intBonus,
        magBonus: magBonus,
        expectedIntBonus: expectedIntBonus,
        expectedMagBonus: expectedMagBonus,
        castIceSuccess: (afterMana2 === beforeMana2 - 15) && (afterProjCount2 === beforeProjCount2 + 1),
        castWoodSuccess: (afterMana3 === beforeMana3 - 15) && (afterProjCount3 === beforeProjCount3 + 1),
        projectileTypes: g_projectiles.map(p => p.type)
      };
    });

    console.log('RPG test results:', JSON.stringify(rpgResult, null, 2));

    if (!rpgResult.success) {
      throw new Error(`RPG Evaluation failed: ${rpgResult.reason}`);
    }

    // Asserções
    if (rpgResult.droppedCount < 0 || rpgResult.droppedCount > 2) {
      throw new Error(`Invalid drop count: ${rpgResult.droppedCount}`);
    }
    if (!rpgResult.equipIceSuccess || !rpgResult.equipWoodSuccess) {
      throw new Error('Failed to equip Ring 1 or Ring 2');
    }
    if (rpgResult.intBonus !== rpgResult.expectedIntBonus) {
      throw new Error(`Ring 1 INT bonus not applied correctly. Expected: ${rpgResult.expectedIntBonus}, Got: ${rpgResult.intBonus}`);
    }
    if (rpgResult.magBonus !== rpgResult.expectedMagBonus) {
      throw new Error(`Ring 2 MAG bonus not applied correctly. Expected: ${rpgResult.expectedMagBonus}, Got: ${rpgResult.magBonus}`);
    }
    if (!rpgResult.castIceSuccess) {
      throw new Error('Casting Ice Magic (Key 2) failed or did not consume mana/create projectile');
    }
    if (!rpgResult.castWoodSuccess) {
      throw new Error('Casting Wood Magic (Key 3) failed or did not consume mana/create projectile');
    }

    // 4. Testar o limite de 100 slots da Bag e rejeição do 101º item
    console.log('Testing Bag capacity limit of 100 slots...');
    await page.evaluate(() => {
      window.GhostRPG.resetStats();
      // Adicionar 100 itens
      for (let i = 0; i < 100; i++) {
        let item = window.LootGenerator.generate(1, 'head', 'Common');
        item.id = "item-" + i;
        window.GhostRPG.addItem(item);
      }
      const sizeBefore = window.GhostRPG.getStats().inventory.length;
      if (sizeBefore !== 100) {
        throw new Error(`Inventory size is ${sizeBefore}, expected 100`);
      }
      // Tentar adicionar o 101º item
      let extraItem = window.LootGenerator.generate(1, 'head', 'Common');
      extraItem.id = "item-101";
      // Silenciar o alert durante o teste
      const originalAlert = window.alert;
      window.alert = () => {};
      window.GhostRPG.addItem(extraItem);
      window.alert = originalAlert;

      const sizeAfter = window.GhostRPG.getStats().inventory.length;
      if (sizeAfter !== 100) {
        throw new Error(`Inventory size is ${sizeAfter}, expected 100 after rejection`);
      }
      if (window.GhostRPG.hasItem("item-101")) {
        throw new Error("Inventory contains item-101 but it should have been rejected!");
      }
    });
    console.log('✔ Bag limit of 100 slots validated successfully!');

    // 5. Testar descarte múltiplo via interface (Modo Seleção)
    console.log('Testing Multi-discard / Selection Mode via UI and DOM clicks...');
    
    // Abrir o painel da Bag
    const bagBtn = page.locator('#btnNavBag');
    await bagBtn.click();
    console.log('Clicked #btnNavBag.');
    await page.waitForTimeout(200);

    // Encontrar o botão de alternar modo de seleção (deve conter texto "SELEÇÃO:")
    const selectionToggleBtn = page.locator('button:has-text("SELEÇÃO:")');
    await selectionToggleBtn.waitFor({ state: 'visible' });
    let btnText = await selectionToggleBtn.innerText();
    console.log(`Initial selection button text: ${btnText}`);

    // Alternar para Modo Seleção ON
    await selectionToggleBtn.click();
    await page.waitForTimeout(200);
    btnText = await selectionToggleBtn.innerText();
    if (!btnText.includes("ON")) {
      throw new Error(`Expected selection button to show ON, got: ${btnText}`);
    }
    console.log('✔ Multi-discard selection mode turned ON.');

    // Selecionar os slots 0 e 1 no grid
    const slots = page.locator('.bag-grid-slot');
    const countSlots = await slots.count();
    console.log(`Found ${countSlots} slots in the grid.`);
    if (countSlots < 2) {
      throw new Error(`Expected at least 2 slot elements, found ${countSlots}`);
    }
    await slots.nth(0).click();
    await page.waitForTimeout(100);
    await slots.nth(1).click();
    await page.waitForTimeout(100);

    // Verificar se o painel de detalhes exibe a contagem de itens selecionados e o botão de descarte em lote
    const detailsBox = page.locator('#bagDetailsBox');
    await detailsBox.waitFor({ state: 'visible' });
    const detailsText = await detailsBox.innerText();
    if (!detailsText.includes("selecionados") || !detailsText.includes("2")) {
      throw new Error(`Details box does not show 2 items selected. Got: ${detailsText}`);
    }
    console.log('✔ Confirmed 2 items selected in UI.');

    // Mock do confirm para aprovar o descarte
    await page.evaluate(() => {
      window.confirm = () => true;
    });

    // Clicar no botão de jogar múltiplos itens fora
    const multiDiscardBtn = page.locator('button:has-text("JOGAR SELECIONADOS FORA")');
    await multiDiscardBtn.click();
    await page.waitForTimeout(200);

    // Validar se o tamanho do inventário reduziu para 98
    const sizeAfterMultiDiscard = await page.evaluate(() => {
      return window.GhostRPG.getStats().inventory.length;
    });
    if (sizeAfterMultiDiscard !== 98) {
      throw new Error(`Inventory size should be 98 after deleting 2 items, got ${sizeAfterMultiDiscard}`);
    }
    console.log('✔ Multi-discard successfully deleted 2 items, inventory size is now 98.');

    // 6. Testar exibição e uso do slot de Bola de Fogo
    console.log('Testing Fireball Hotkey HUD element...');
    await page.evaluate(() => {
      window.GhostRPG.resetStats();
      var spellItem = {
        id: "ghost_spell",
        name: "Bola de Fogo",
        icon: "🔥",
        description: "Magia ativa de bola de fogo.",
        count: 5,
        slot: "mainhand"
      };
      window.GhostRPG.addItem(spellItem);
      window.GhostRPG.equipItem(spellItem.id, "mainhand");
    });

    const isFireballEquipped = await page.evaluate(() => {
      const eq = window.GetEquipmentState();
      return eq.mainhand && eq.mainhand.id === "ghost_spell";
    });
    if (!isFireballEquipped) {
      throw new Error("Fireball spell was not equipped successfully!");
    }
    console.log('✔ Fireball spell equipped in mainhand.');

    // Simular disparo da Bola de Fogo pressionando a tecla "1"
    await page.evaluate(() => {
      var oldGameState = window.g_gameState;
      window.g_gameState = 1; // G_PLAY
      window.DeSoGhost.dead = false;

      var initialCount = window.GetEquipmentState().mainhand.count;
      
      var e1 = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(e1, 'keyCode', { value: 49 }); // Tecla "1"
      window.dispatchEvent(e1);

      var afterCount = window.GetEquipmentState().mainhand ? window.GetEquipmentState().mainhand.count : 0;
      if (afterCount !== initialCount - 1) {
        throw new Error(`Expected fireball count to decrement from ${initialCount} to ${initialCount - 1}, but got ${afterCount}`);
      }

      window.g_gameState = oldGameState;
    });
    console.log('✔ Fireball cast (Key 1) decremented count successfully.');

    // 7. Testar fluxo de Game Over e Reinício Exclusivo
    console.log('Testing Game Over and Restart Flow...');
    const gameOverState = await page.evaluate(() => {
      // Definir um nível de RPG específico (ex: 5) para verificar que ele é preservado
      window.GhostRPG.addXp(1000); // Isso vai subir o nível do jogador significativamente (acima de 1)
      var levelBeforeDeath = window.GhostRPG.getStats().level;
      if (levelBeforeDeath <= 1) {
        throw new Error("Failed to set RPG Level above 1 for test!");
      }
      
      window.g_gameState = 1; // G_PLAY
      window.DeSoGhost.lives = 0;
      window.DeSoGhost.respawn();
      return {
        state: window.g_gameState,
        rpgLevelBefore: levelBeforeDeath
      };
    });

    if (gameOverState.state !== 3) {
      throw new Error(`Expected game state to be G_GAMEOVER (3), got ${gameOverState.state}`);
    }
    console.log(`✔ Game state transitioned to G_GAMEOVER successfully. RPG Level before death was: ${gameOverState.rpgLevelBefore}`);

    // Pressionar SPACE para reiniciar o jogo
    console.log('Pressing SPACE key to restart...');
    await page.evaluate(() => {
      var eSpace = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
      Object.defineProperty(eSpace, 'keyCode', { value: 32 });
      window.dispatchEvent(eSpace);
    });
    await page.waitForTimeout(200);

    const restartStats = await page.evaluate(() => {
      return {
        state: window.g_gameState,
        level: window.g_currentLevel,
        lives: window.DeSoGhost.lives,
        score: window.g_score,
        rpgLevelAfter: window.GhostRPG.getStats().level
      };
    });

    console.log('Restarted state stats:', JSON.stringify(restartStats, null, 2));
    if (restartStats.state !== 1) { // G_PLAY
      throw new Error(`Expected state after restart to be G_PLAY (1), got ${restartStats.state}`);
    }
    if (restartStats.level !== 1) {
      throw new Error(`Expected current stage level after restart to be 1, got ${restartStats.level}`);
    }
    if (restartStats.lives !== 3) {
      throw new Error(`Expected lives after restart to be 3, got ${restartStats.lives}`);
    }
    if (restartStats.score !== 0) {
      throw new Error(`Expected score after restart to be 0, got ${restartStats.score}`);
    }
    if (restartStats.rpgLevelAfter !== gameOverState.rpgLevelBefore) {
      throw new Error(`Expected RPG Level to remain ${gameOverState.rpgLevelBefore}, but got ${restartStats.rpgLevelAfter}`);
    }
    console.log(`✔ Game restart flow verified successfully! (Stage Level 1, Score 0, Lives 3, RPG Level remained ${restartStats.rpgLevelAfter}).`);

    // 8. Verificar que o cronômetro está oculto
    console.log('Checking if timer element is hidden...');
    const isTimerVisible = await page.locator('#extTimer').isVisible();
    if (isTimerVisible) {
      throw new Error('Timer element is visible when it should be hidden!');
    }
    console.log('✔ Timer element is hidden.');

    console.log('All Expanded RPG Drop, Multi-discard, HUD, and Game Over tests passed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
