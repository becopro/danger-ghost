const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log("====================================================");
console.log("🔥 TESTING FIREBALL INSTANT KILL, PHYSICS & STAT RESILIENCE 🔥");
console.log("====================================================");

const dom = new JSDOM(html, {
    url: "file://" + indexPath,
    resources: "usable",
    runScripts: "dangerously",
    beforeParse(window) {
        // Mock LocalStorage
        window.localStorage = {
            getItem: () => null,
            setItem: () => null,
            removeItem: () => null,
            clear: () => null
        };
        // Mock Canvas Context
        window.HTMLCanvasElement.prototype.getContext = function() {
            return {
                fillRect: () => {},
                clearRect: () => {},
                fillText: () => {},
                drawImage: () => {},
                beginPath: () => {},
                arc: () => {},
                fill: () => {},
                stroke: () => {},
                createLinearGradient: () => ({ addColorStop: () => {} }),
                measureText: () => ({ width: 100 }),
                save: () => {},
                restore: () => {},
                translate: () => {}
            };
        };
        // Mock Audio elements
        window.Audio = class {
            play() {}
            pause() {}
        };
        // Capture global window errors
        window.addEventListener('error', function(event) {
            console.error(`❌ Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
        });
    }
});

setTimeout(() => {
    const { window } = dom;
    const { GhostRPG, DeSoGhost, g_projectiles } = window;

    if (!GhostRPG || !DeSoGhost || !g_projectiles) {
        console.error("❌ Error: Core modules not found in window context.");
        process.exit(1);
    }

    // ==========================================
    // 1. TEST PERSISTENCE OF BAG AND EQUIPMENT
    // ==========================================
    console.log("\n--- [TEST 1] Inventory and Equipment Persistence ---");
    GhostRPG.resetStats();
    
    // Add items to bag and equip them
    window.AddInventoryItem("ghost_helmet", "Capacete de Teste", "🪖", "Um capacete de teste.", 1);
    window.AddInventoryItem("ghost_spell", "Bola de Fogo", "🔥", "Teste de magia.", 5);
    
    console.log("Bag before equipping:", GhostRPG.getStats().inventory);
    
    window.EquipInventoryItem("ghost_helmet");
    window.EquipInventoryItem("ghost_spell");
    
    const initialStats = JSON.parse(JSON.stringify(GhostRPG.getStats()));
    console.log("Equipment after equipping:", initialStats.equipment);
    console.log("Bag after equipping:", initialStats.inventory);

    if (!initialStats.equipment.helmet || !initialStats.equipment.spell) {
        console.error("❌ Error: Items could not be equipped.");
        process.exit(1);
    }

    // Call resetStats()
    console.log("Calling GhostRPG.resetStats()...");
    GhostRPG.resetStats();

    const postResetStats = GhostRPG.getStats();
    console.log("Equipment after resetStats():", postResetStats.equipment);
    console.log("Bag after resetStats():", postResetStats.inventory);

    if (!postResetStats.equipment.helmet || !postResetStats.equipment.spell) {
        console.error("❌ Error: Equipped items disappeared after resetStats()!");
        process.exit(1);
    }
    console.log("✅ PERSISTENCE TEST PASSED: Inventory and Equipment survived resetStats()!");

    // ==========================================
    // 2. TEST FIREBALL PHYSICS (PLASMA ORB EQUIV)
    // ==========================================
    console.log("\n--- [TEST 2] Fireball Physics (Plasma Orb Equivalent) ---");
    
    // Start game by sending Enter key event (keyCode 13) to transition to G_PLAY state
    window.addEventListener("keydown", (e) => {
        console.log(`[TEST DEBUG] keydown event: keyCode=${e.keyCode}, bubbles=${e.bubbles}`);
    });

    const origGetEq = window.GetEquipmentState;
    window.GetEquipmentState = function() {
        const eq = origGetEq();
        console.log(`[TEST DEBUG] GetEquipmentState called. Result:`, eq);
        return eq;
    };

    console.log("[TEST DEBUG] Bypassing with password 'maximo' to start Level 33...");
    window.alert = () => {};
    window.g_hasCreatorCoin = true;
    window.prompt = () => "maximo";
    const pEvent = new window.KeyboardEvent('keydown', { keyCode: 80, bubbles: true });
    window.dispatchEvent(pEvent);


    console.log("[TEST DEBUG] Boss loaded:", window.g_boss);

    if (!window.g_boss) {
        console.error("❌ Error: Boss was not spawned on Level 33!");
        process.exit(1);
    }

    DeSoGhost.dead = false;
    DeSoGhost.face = 1; // 1 means facing right
    DeSoGhost.xPos = 100;
    DeSoGhost.yPos = 100;

    // Discard any existing projectiles
    g_projectiles.length = 0;

    console.log("[TEST DEBUG] Dispatching key 1 event...");
    const event = new window.KeyboardEvent('keydown', { keyCode: 49, bubbles: true });
    window.dispatchEvent(event);

    console.log(`Projectiles spawned: ${g_projectiles.length}`);
    if (g_projectiles.length !== 1) {
        console.error("❌ Error: Projectile was not spawned.");
        process.exit(1);
    }

    const p = g_projectiles[0];
    console.log("Projectile Properties:");
    console.log(`- type: ${p.type}`);
    console.log(`- vx: ${p.vx}`);
    console.log(`- width: ${p.width}`);
    console.log(`- height: ${p.height}`);
    console.log(`- life: ${p.life}`);
    console.log(`- penetrates: ${p.penetrates}`);

    if (p.type !== "spell_fireball") {
        console.error(`❌ Error: Projectile type is not spell_fireball. Got: ${p.type}`);
        process.exit(1);
    }
    if (p.vx !== 3.5) {
        console.error(`❌ Error: Projectile speed is not 3.5. Got: ${p.vx}`);
        process.exit(1);
    }
    if (p.width !== 20 || p.height !== 20) {
        console.error(`❌ Error: Projectile dimensions are not 20x20. Got: ${p.width}x${p.height}`);
        process.exit(1);
    }
    if (p.life !== 120) {
        console.error(`❌ Error: Projectile life is not 120 frames. Got: ${p.life}`);
        process.exit(1);
    }
    if (p.penetrates !== true) {
        console.error(`❌ Error: Projectile penetrates is not true.`);
        process.exit(1);
    }

    console.log("✅ PHYSICS TEST PASSED: Fireball projectile matches Plasma Orb properties!");

    // ==========================================
    // 3. TEST FIREBALL INSTANT BOSS KILL
    // ==========================================
    console.log("\n--- [TEST 3] Instant Boss Kill ---");

    console.log(`Initial Boss HP: ${window.g_boss.lives}`);

    // Position player next to boss to scroll map_offset so projectile is not deleted
    DeSoGhost.xPos = window.g_boss.xPos;
    DeSoGhost.yPos = window.g_boss.yPos;
    DeSoGhost.update = DeSoGhost.move;
    DeSoGhost.update();

    // Discard any existing projectiles and create a fresh fireball projectile right on the real boss
    g_projectiles.length = 0;
    const testProjectile = {
        x: window.g_boss.xPos + 5,
        y: window.g_boss.yPos + 5,
        vx: 3.5,
        vy: 0,
        type: "spell_fireball",
        runeId: 0,
        width: 20,
        height: 20,
        life: 120,
        damage: 35,
        penetrates: true,
        hits: {}
    };
    g_projectiles.push(testProjectile);

    // Run updateProjectiles synchronously
    window.updateProjectiles();

    console.log(`Boss status after collision (should be dead/null):`, window.g_boss);

    if (window.g_boss !== null && (window.g_boss.lives > 0 || window.g_boss.alive)) {
        console.error(`❌ Error: Boss survived the fireball!`);
        process.exit(1);
    }

    console.log("✅ INSTANT KILL TEST PASSED: Boss instantly eliminated by Fireball!");

    console.log("\n====================================================");
    console.log("🎉 ALL NEW FIREBALL AND INVENTORY TESTS PASSED! 🎉");
    console.log("====================================================");
    process.exit(0);
}, 3500);
