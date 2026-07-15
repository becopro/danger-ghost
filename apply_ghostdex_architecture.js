const fs = require('fs');

// 1. Create ghost_inventory.js
const inventoryScript = `
/* 
   GHOST INVENTORY & EVOLUTION SYSTEM
   Handles capturing ghosts and leveling them up.
*/

window.g_episode1SpawnTriggered = false;

window.GetPlayerGhostInventory = function() {
    let inv = localStorage.getItem('player_ghosts_inventory');
    if (!inv) {
        inv = {};
        localStorage.setItem('player_ghosts_inventory', JSON.stringify(inv));
        return inv;
    }
    return JSON.parse(inv);
}

window.SavePlayerGhostInventory = function(inv) {
    localStorage.setItem('player_ghosts_inventory', JSON.stringify(inv));
}

window.UnlockGhostForPlayer = function(ghostId) {
    if (!ghostId) return;
    
    // GhostId might be passed as int or string, ensure it's a 3-digit string for the DB
    let idStr = ghostId.toString().padStart(3, '0');
    
    let inv = GetPlayerGhostInventory();
    if (!inv[idStr]) {
        // First time capture! Load base stats from DB if available
        let baseStats = { hp: 50, ataque: 50, defesa: 50, atq_especial: 50, def_especial: 50, velocidade: 50 };
        if (window.g_ghostdexDB) {
            let dbGhost = window.g_ghostdexDB.find(g => g.id === idStr);
            if (dbGhost) baseStats = Object.assign({}, dbGhost.stats_base);
        }
        
        inv[idStr] = {
            level: 1,
            xp: 0,
            xpNext: 1000,
            currentStats: baseStats
        };
        SavePlayerGhostInventory(inv);
        console.log("👻 GHOST CAPTURED! Added to inventory:", idStr);
        
        // Update the Ghostdex UI visually
        if (typeof window.UpdateGhostdex === 'function') {
            window.UpdateGhostdex(idStr, 2);
        }
    }
}

window.AddXpToGhost = function(ghostId, xpAmount) {
    let idStr = ghostId.toString().padStart(3, '0');
    let inv = GetPlayerGhostInventory();
    
    if (inv[idStr]) {
        inv[idStr].xp += xpAmount;
        console.log(\`👻 Ghost \${idStr} gained \${xpAmount} XP. Total: \${inv[idStr].xp}/\${inv[idStr].xpNext}\`);
        
        // Level up logic
        while (inv[idStr].xp >= inv[idStr].xpNext) {
            inv[idStr].xp -= inv[idStr].xpNext;
            inv[idStr].level++;
            inv[idStr].xpNext = Math.floor(inv[idStr].xpNext * 1.5);
            
            // Stat Growth
            for (let stat in inv[idStr].currentStats) {
                if (stat !== 'total') {
                    inv[idStr].currentStats[stat] = Math.floor(inv[idStr].currentStats[stat] * 1.1); // 10% increase per level
                }
            }
            console.log(\`⭐ Ghost \${idStr} leveled up to \${inv[idStr].level}!\`);
        }
        SavePlayerGhostInventory(inv);
    }
}

window.SpawnNativeGhosts = function(count) {
    console.log("👻 1000 SCORE REACHED! Spawning " + count + " Episode 1 Ghosts!");
    // Randomly spawn 10 ghosts from IDs 001 to 010.
    // Assuming engine.js handles bosses/enemies in g_bosses or similar.
    for (let i = 0; i < count; i++) {
        let ghostId = (Math.floor(Math.random() * 10) + 1).toString().padStart(3, '0');
        // If SpawnBossAtRandomLocation is available, use it or a similar wrapper
        if (typeof SpawnBossAtRandomLocation === 'function') {
            // In a real scenario we'd pass the specific ghostId to build the sprite
            // For now, we simulate a spawn and tag the boss with the ghostId so it gets captured on death.
            // Using "skull" as placeholder enemy type.
            SpawnBossAtRandomLocation("skull"); 
            // The actual tagging needs to happen inside SpawnBossAtRandomLocation or we do a hack:
            setTimeout(() => {
                if (typeof g_bosses !== 'undefined' && g_bosses.length > 0) {
                    let lastBoss = g_bosses[g_bosses.length - 1];
                    if (!lastBoss.ghostId) {
                        lastBoss.ghostId = ghostId; 
                        lastBoss.isEpisode1Ghost = true;
                    }
                }
            }, 100);
        }
    }
}
`;
fs.writeFileSync('www/js/game/ghost_inventory.js', inventoryScript, 'utf8');

// 2. Inject into index.html
let html = fs.readFileSync('www/index.html', 'utf8');
if (!html.includes('ghost_inventory.js')) {
    html = html.replace(
        /<script src="js\/game\/ghostdex_ui.js"><\/script>/,
        '<script src="js/game/ghost_inventory.js"></script>\n    <script src="js/game/ghostdex_ui.js"></script>'
    );
    fs.writeFileSync('www/index.html', html, 'utf8');
}

// 3. Update style.css for opacity logic
let css = fs.readFileSync('www/css/style.css', 'utf8');
if (css.includes('.ghdx-card.state-0 {')) {
    css = css.replace(
        /\.ghdx-card\.state-0 {[^}]*}/,
        '.ghdx-card.state-0 {\n    opacity: 0.5;\n    cursor: not-allowed;\n    filter: grayscale(100%);\n}'
    );
    css = css.replace(
        /\.ghdx-card\.state-1 {[^}]*}/,
        '.ghdx-card.state-1 {\n    opacity: 0.5;\n    border-color: #777;\n}'
    );
    css = css.replace(
        /\.ghdx-card\.state-2 {[^}]*}/,
        '.ghdx-card.state-2 {\n    opacity: 1;\n    border-color: #9932CC;\n    box-shadow: inset 0 0 5px #9932CC;\n}'
    );
    fs.writeFileSync('www/css/style.css', css, 'utf8');
}


// 4. Update engine.js
let engine = fs.readFileSync('www/js/game/engine.js', 'utf8');

// Inject Score Listener
if (!engine.includes('g_episode1SpawnTriggered')) {
    engine = engine.replace(
        /g_score \+= points;/,
        'g_score += points;\n				if (!window.g_episode1SpawnTriggered && g_score >= 1000) {\n					window.g_episode1SpawnTriggered = true;\n					if (typeof window.SpawnNativeGhosts === "function") window.SpawnNativeGhosts(10);\n				}'
    );
}

// Inject Capture Logic
// The block is:
// if (this.lives <= 0) {
//     if (this.alive) {
//         this.alive = false;
if (!engine.includes('UnlockGhostForPlayer(this.ghostId)')) {
    engine = engine.replace(
        /if \(this\.alive\) {\n\s*this\.alive = false;/,
        'if (this.alive) {\n							this.alive = false;\n\n							// CAPTURE MECHANIC (ELIMINATION = CAPTURE)\n							if (this.ghostId && typeof window.UnlockGhostForPlayer === "function") {\n								window.UnlockGhostForPlayer(this.ghostId);\n							}\n							else if (this.type === "skull") {\n								// Fallback capture simulation for Episode 1 Native Ghosts\n								let randId = (Math.floor(Math.random() * 10) + 1).toString().padStart(3, "0");\n								if (typeof window.UnlockGhostForPlayer === "function") window.UnlockGhostForPlayer(randId);\n							}'
    );
}

fs.writeFileSync('www/js/game/engine.js', engine, 'utf8');

console.log("Ghostdex Architecture (Spawn, Capture, Inventory) injected successfully.");
