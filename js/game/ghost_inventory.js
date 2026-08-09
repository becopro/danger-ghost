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

// NOTE: This saves to localStorage only (local cache).
// Cloud sync happens when the player presses the SAVE button (see game_core.js TriggerRPGSaveToDeSo).
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

        // Generate RPG Profile with UNIQUE BAG
        let localChars = localStorage.getItem("dg_local_characters");
        if (!localChars) localChars = "[]";
        localChars = JSON.parse(localChars);
        
        let charId = "ghost_" + idStr;
        let existingChar = localChars.find(c => c.characterId === charId);
        if (!existingChar) {
            let ghostName = "Unknown Ghost";
            if (window.g_ghostdexDB) {
                let dbGhost = window.g_ghostdexDB.find(g => g.id === idStr);
                if (dbGhost) ghostName = dbGhost.nome;
            }
            localChars.push({
                characterId: charId,
                name: ghostName,
                level: 1,
                xp: 0,
                vit: Math.ceil((baseStats.hp || 50) / 10),
                agi: Math.ceil((baseStats.velocidade || 50) / 10),
                int: Math.ceil((baseStats.atq_especial || 50) / 10),
                pow: Math.ceil((baseStats.ataque || 50) / 10),
                mag: Math.ceil((baseStats.def_especial || 50) / 10),
                inventory: [],
                equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
            });
            localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
            console.log("👻 RPG Profile generated for ghost:", charId);
        }
        
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
        let ghostSafeLoop = 0;
        while (inv[idStr].xp >= inv[idStr].xpNext && ghostSafeLoop++ < 1000) {
            if (!inv[idStr].xpNext || inv[idStr].xpNext <= 0) inv[idStr].xpNext = 1000;
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
    if (typeof g_bosses !== 'undefined' && g_bosses.length >= 5) {
        console.log("Maximum 5 ghosts active, skipping spawn.");
        return;
    }
    var availableSlots = 5 - (typeof g_bosses !== 'undefined' ? g_bosses.length : 0);
    count = Math.min(count, availableSlots);
    if (count <= 0) return;

    console.log("Y' 2222 SCORE REACHED! Spawning " + count + " Ghosts!");
    
    var validIds = [];
    var level = window.g_currentLevel || 1;
    
    // Pool 1: #001 to #030 (always valid on any level)
    for (var i = 1; i <= 30; i++) validIds.push(i);
    
    // Pool 2: #031 to #050 (Levels 20 to 30)
    if (level >= 20 && level <= 30) {
        for (var i = 31; i <= 50; i++) validIds.push(i);
    }
    
    // Pool 3: #051 to #080 (Levels 31, 32, and cave1)
    if (level == 31 || level == 32 || level == "cave1") {
        for (var i = 51; i <= 80; i++) validIds.push(i);
    }
    
    // Pool 4: #081 to #101 (Level 33)
    if (level == 33) {
        for (var i = 81; i <= 101; i++) validIds.push(i);
    }

    for (var i = 0; i < count; i++) {
        var picked = validIds[Math.floor(Math.random() * validIds.length)];
        var ghostId = picked.toString().padStart(3, '0');
        if (typeof window.SpawnEpisode1Ghost === 'function') {
            window.SpawnEpisode1Ghost(ghostId);
        }
    }
}
