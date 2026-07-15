
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
        console.log(`👻 Ghost ${idStr} gained ${xpAmount} XP. Total: ${inv[idStr].xp}/${inv[idStr].xpNext}`);
        
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
            console.log(`⭐ Ghost ${idStr} leveled up to ${inv[idStr].level}!`);
        }
        SavePlayerGhostInventory(inv);
    }
}

window.SpawnNativeGhosts = function(count) {
    console.log("Y' 2222 SCORE REACHED! Spawning " + count + " Ghosts!");
    // Randomly spawn from IDs 001 to 101.
    // Assuming engine.js handles bosses/enemies in g_bosses or similar.
    for (let i = 0; i < count; i++) {
        let ghostId = (Math.floor(Math.random() * 101) + 1).toString().padStart(3, '0');
        // If SpawnBossAtRandomLocation is available, use it or a similar wrapper
        if (typeof window.SpawnEpisode1Ghost === 'function') {
            window.SpawnEpisode1Ghost(ghostId);
        }
    }
}
