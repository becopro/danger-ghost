const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log("====================================================");
console.log("🔥 TESTING FIREBALL PICKUP & SPRITE INTEGRATION 🔥");
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
        // Captura erros no escopo global do window
        window.addEventListener('error', function(event) {
            console.error(`❌ Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
        });
    }
});

// Wait for scripts to evaluate
setTimeout(() => {
    const { window } = dom;
    const { map, DeSoGhost, GhostRPG } = window;

    if (!map || !DeSoGhost || !GhostRPG) {
        console.error("❌ Error: Core modules not found in window context.");
        process.exit(1);
    }

    console.log("Checking image instantiation:");
    const fr = window.document.querySelector('script') ? window.fireballRightImg : null;
    const fl = window.document.querySelector('script') ? window.fireballLeftImg : null;
    console.log(`- fireballRightImg defined: ${!!window.fireballRightImg}`);
    console.log(`- fireballLeftImg defined: ${!!window.fireballLeftImg}`);

    if (!window.fireballRightImg || !window.fireballLeftImg) {
        console.error("❌ Error: Fireball sprites not loaded.");
        process.exit(1);
    }

    const testLevels = [3, 6, 9, 13, 32];
    testLevels.forEach(lvl => {
        map.loadLevel(lvl);
        let foundTile24 = false;
        let doorPos = null;
        let tile24Pos = null;

        for (let r = 0; r < map.bitmap.length; r++) {
            for (let c = 0; c < map.bitmap[r].length; c++) {
                if (map.bitmap[r][c] === 4) {
                    doorPos = { r, c };
                }
                if (map.bitmap[r][c] === 24) {
                    foundTile24 = true;
                    tile24Pos = { r, c };
                }
            }
        }

        console.log(`Level ${lvl}: Door at ${doorPos ? `r${doorPos.r}c${doorPos.c}` : 'NOT FOUND'}, Tile 24 at ${tile24Pos ? `r${tile24Pos.r}c${tile24Pos.c}` : 'NOT FOUND'}`);
        if (!foundTile24) {
            console.error(`❌ Error: Tile 24 (Fireball Spell) not found on level ${lvl}.`);
            process.exit(1);
        }
    });

    console.log("✅ Fireball Spell successfully placed on all requested levels.");

    // Test collision collection
    console.log("\nSimulating pick-up collision on Level 3...");
    map.loadLevel(3);
    
    // Find where tile 24 is
    let tileRow = -1, tileCol = -1;
    for (let r = 0; r < map.bitmap.length; r++) {
        for (let c = 0; c < map.bitmap[r].length; c++) {
            if (map.bitmap[r][c] === 24) {
                tileRow = r;
                tileCol = c;
                break;
            }
        }
        if (tileRow !== -1) break;
    }

    // Reset inventory and stats
    GhostRPG.resetStats();

    console.log(`Initial Score: ${window.GetScore()}`);
    console.log(`Has ghost_spell item in BAG: ${window.HasInventoryItem("ghost_spell")}`);

    // Place character coordinates to overlap the tile
    // Each tile is 24x24 pixels. Let's trigger the collection logic by setting character positions.
    // The player's collision check is in DeSoGhost.move():
    // var col = Math.floor((this.xPos + 12) / 24);
    // var row = Math.floor((this.yPos + 12) / 24);
    // We can simulate collision by running a fake movement cycle or calling the check directly,
    // or we can simply trigger DeSoGhost.move() with player positioned on it.
    DeSoGhost.xPos = tileCol * 24;
    DeSoGhost.yPos = tileRow * 24;
    DeSoGhost.alive = true;
    DeSoGhost.ghostMode = false;
    
    // Simulate one move step
    DeSoGhost.move();

    console.log(`Score after overlap: ${window.GetScore()}`);
    console.log(`Tile value after overlap: ${map.bitmap[tileRow][tileCol]}`);
    console.log(`Has ghost_spell item in BAG: ${window.HasInventoryItem("ghost_spell")}`);

    const stats = GhostRPG.getStats();
    const spellItem = stats.inventory.find(i => i.id === "ghost_spell");
    console.log(`ghost_spell in inventory details:`, spellItem);

    if (window.GetScore() !== 300) {
        console.error(`❌ Error: Score did not increase to 300. Got: ${window.GetScore()}`);
        process.exit(1);
    }
    if (map.bitmap[tileRow][tileCol] !== 0) {
        console.error(`❌ Error: Tile 24 was not cleared from map.`);
        process.exit(1);
    }
    if (!spellItem || spellItem.count !== 3 || spellItem.name !== "Bola de Fogo") {
        console.error(`❌ Error: Spell item was not added correctly to the bag. Got:`, spellItem);
        process.exit(1);
    }

    console.log("\n====================================================");
    console.log("🎉 ALL FIREBALL SPELL TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("====================================================");
    process.exit(0);
}, 3500);
