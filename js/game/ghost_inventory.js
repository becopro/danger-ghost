/* 
   GHOST INVENTORY & EVOLUTION SYSTEM
   Handles capturing ghosts and leveling them up.
*/

window.g_episode1SpawnTriggered = false;

window.UnlockGhostForPlayer = function(ghostId) {
    if (!ghostId) return;

    // GhostId might be passed as int or string, ensure it's a 3-digit string for the DB
    let idStr = ghostId.toString().padStart(3, '0');
    let charId = "ghost_" + idStr;

    // "Já capturado antes?" agora é respondido por dg_local_characters (populado a partir
    // do banco no login / save_game_state), não por uma store local separada. O save é
    // exclusivamente no banco de dados — não existe mais uma segunda fonte de verdade local
    // pra "já capturei essa espécie" (ex-player_ghosts_inventory, removida).
    let localChars = localStorage.getItem("dg_local_characters");
    if (!localChars) localChars = "[]";
    localChars = JSON.parse(localChars);
    let existingChar = localChars.find(c => c.characterId === charId);

    if (!existingChar) {
        // First time capture! Load base stats from DB if available
        let baseStats = { hp: 50, ataque: 50, defesa: 50, atq_especial: 50, def_especial: 50, velocidade: 50 };
        let ghostName = "Unknown Ghost";
        if (window.g_ghostdexDB) {
            let dbGhost = window.g_ghostdexDB.find(g => g.id === idStr);
            if (dbGhost) {
                baseStats = Object.assign({}, dbGhost.stats_base);
                ghostName = dbGhost.nome;
            }
        }

        console.log("👻 GHOST CAPTURED! Added to inventory:", idStr);

        // Generate RPG Profile with UNIQUE BAG
        var newChar = {
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
        };
        localChars.push(newChar);
        localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
        console.log("👻 RPG Profile generated for ghost:", charId);

        // Manda o fantasma capturado em combate pro banco (30/08/2026) — antes só ficava
        // no localStorage e sumia ao trocar de aparelho, ou era apagado no login seguinte
        // (banco manda), igual o bug já corrigido em TriggerCreateNewGhost (forja). Login
        // já é garantido aqui: captura só acontece durante gameplay ativo, e todo ponto de
        // entrada de gameplay hoje exige login antes de começar (SPACE, cheat VIP, etc).
        //
        // ACHADO 27/08/2026 (continuação do crítico #1, sinalizado pelo agente que corrigiu
        // server/db.js): "!existingChar" só verifica o cache LOCAL deste aparelho
        // (dg_local_characters), não o banco — se essa espécie já foi capturada antes em OUTRO
        // aparelho da mesma conta (e esse aparelho ainda não resincronizou), esta função monta um
        // "newChar" do zero achando que é a primeira captura, com inventory/equipment vazios
        // PRESENTES no objeto. O COALESCE do servidor só preserva campo AUSENTE do payload — um
        // campo presente com valor vazio ainda sobrescreve o progresso real do outro aparelho. A
        // correção: manda pro servidor uma cópia sem inventory/equipment (omitidos, não vazios) —
        // se o personagem já existir no banco (capturado alhures), o COALESCE preserva o que já
        // tem; se for mesmo inédito, o INSERT already cobre esses dois campos com o default do
        // schema. O cache local (dg_local_characters, já gravado acima) continua com o objeto
        // completo — só o payload de rede muda.
        var captureSocket = window.NetworkState && window.NetworkState.socket;
        if (captureSocket && captureSocket.connected && localStorage.getItem('dg_cloud_email')) {
            var syncChar = Object.assign({}, newChar);
            delete syncChar.inventory;
            delete syncChar.equipment;
            captureSocket.emit('save_game_state', { characters: [syncChar] });
        }

        // Update the Ghostdex UI visually
        if (typeof window.UpdateGhostdex === 'function') {
            window.UpdateGhostdex(idStr, 2);
        }
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
