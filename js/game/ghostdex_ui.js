// ============================================================
// GHOSTDEX UI — renders inside navbarPanelContent
// Reads data from window.g_ghostdexDB (set by ghostdex_data.js)
// ============================================================

var typeColors = {
    "Specter": "#E0E0E0", "Shadow": "#4F4F4F", "Neon": "#00FFFF",
    "Urban": "#FF8C00", "Cybernetic": "#00FF00", "Wisp": "#FF4500",
    "Dark": "#8B008B", "Crystal": "#00BFFF", "Toxic": "#ADFF2F",
    "Scrap": "#A0522D", "Graffiti": "#FF1493", "Holographic": "#87CEFA",
    "Virtual": "#32CD32", "Chaos": "#FF0000"
};

function GetPlayerGhostdexProgress() {
    var raw = localStorage.getItem('ghostdex_progress');
    if (!raw) {
        localStorage.setItem('ghostdex_progress', JSON.stringify({}));
        return {};
    }
    try { return JSON.parse(raw); } catch(e) { return {}; }
}

// Manda o progresso da Ghostdex e a lista de favoritos pro banco (30/08/2026) — antes disso
// ficavam só no localStorage, nunca chegavam no servidor, então sumiam ao trocar de aparelho ou
// eram perdidos se o navegador limpasse os dados. Mesmo padrão de "cache local + emit se
// logado" já usado em GhostRPG.saveLocalStorage() (rpg_system.js).
function SyncGhostdexExtrasToCloud() {
    try {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket && socket.connected && localStorage.getItem('dg_cloud_email')) {
            socket.emit('save_game_state', {
                ghostdexProgress: GetPlayerGhostdexProgress(),
                favorites: window.GetFavoriteGhosts ? window.GetFavoriteGhosts() : []
            });
        }
    } catch (e) { console.error('[Ghostdex] Falha ao sincronizar com o banco:', e); }
}

// Called by game engine: UpdateGhostdex("001", 1) = seen, UpdateGhostdex("001", 2) = captured
window.UpdateGhostdex = function(id, state) {
    var progress = GetPlayerGhostdexProgress();
    var currentState = progress[id] || 0;
    if (state > currentState) {
        progress[id] = state;
        localStorage.setItem('ghostdex_progress', JSON.stringify(progress));
        SyncGhostdexExtrasToCloud();
    }
};

// Main entry point — called when GHDX button is clicked
window.InitializeGhostdex = function() {
    var db = window.g_ghostdexDB;
    if (!db || !Array.isArray(db)) {
        console.error("Ghostdex DB not loaded! window.g_ghostdexDB is:", typeof db);
        return;
    }
    console.log("InitializeGhostdex called, DB has " + db.length + " ghosts");
    RenderGhostdexInNavbar(db);
};

function RenderGhostdexInNavbar(db) {
    var container = document.getElementById('navbarPanelContent');
    if (!container) {
        console.error("navbarPanelContent not found");
        return;
    }

    var progress = GetPlayerGhostdexProgress();
    var favs = window.GetFavoriteGhosts ? window.GetFavoriteGhosts() : [];
    var seen = 0, caught = 0;

    db.forEach(function(ghost) {
        var st = progress[ghost.id] || 0;
        if (st >= 1) seen++;
        if (st === 2) caught++;
    });

    // Build full HTML
    var html = '';
    html += '<div class="ghdx-header" style="text-align:center; margin-bottom:10px; position:relative;">';
    html += '<h3 style="margin:0 0 4px 0; color:#9932CC; font-family:Orbitron,sans-serif; font-size:16px; text-shadow:0 0 8px #9932CC;">👻 GHOSTDEX</h3>';
    html += '<div style="color:#AAA; font-size:12px; margin-bottom:8px;">Seen: ' + seen + ' / ' + db.length + ' | Caught: ' + caught + ' / ' + db.length + '</div>';
    html += '<div style="width:100%; text-align:center; margin-top:10px;">';
    html += '<button onclick="window.ShowGlossary()" style="background:#333; color:#FFF; border:1px solid #555; padding:6px 16px; font-size:12px; font-family:Orbitron,sans-serif; cursor:pointer; border-radius:4px;">GLOSSARY</button>';
    html += '</div>';
    html += '</div>';

    html += '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; max-height:220px; overflow-y:auto; padding:4px;">';

    db.forEach(function(ghost) {
        var st = progress[ghost.id] || 0;
        var bg, border, opacity;
        if (st < 2) {
            bg = '#111'; border = '#333'; opacity = '0.5';
        } else {
            bg = '#0a1a0a'; border = '#00FF00'; opacity = '1';
        }

        var isFav = favs.indexOf(ghost.id) !== -1;
        html += '<div class="ghdx-card" onclick="ShowGhostdexDetail(\'' + ghost.id + '\')" style="position:relative; cursor:pointer; background:' + bg + '; border:1px solid ' + border + '; border-radius:6px; padding:6px; text-align:center; opacity:' + opacity + ';">';
        if (isFav) {
            html += '<div class="fav-badge" style="position:absolute; top:-4px; left:-4px; font-size:16px; text-shadow:0 0 6px #FFD700; color:#FFD700; z-index:5;">⭐</div>';
        }
        html += '<div style="color:#666; font-size:10px;">#' + ghost.id + '</div>';
        if (st < 2) {
            html += '<div style="font-size:20px;">❓</div>';
            html += '<div style="color:#555; font-size:10px;">???</div>';
        } else {
            // Using Ghosts/#xxx.png
            html += '<div style="margin:4px 0;"><img src="Ghosts/%23' + ghost.id + '.png" onerror="this.onerror=null;this.src=\'Ghosts/' + ghost.id + '.png\';this.onerror=function(){this.onerror=null;this.src=\'assets/sprites/ghost_' + ghost.id + '_r.webp\';};" style="width:24px; height:24px; image-rendering:pixelated; filter: drop-shadow(0 0 5px #00FFFF);" /></div>';
            html += '<div style="color:#00FF00; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + ghost.nome + '</div>';
        }
        html += '</div>';
    });

    html += '</div>';

    // Hidden detail modal
    if (!document.getElementById('ghdx-detail-overlay')) {
        var detailDiv = document.createElement('div');
        detailDiv.id = 'ghdx-detail-overlay';
        detailDiv.style.cssText = 'display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:100; overflow-y:auto; padding:15px; box-sizing:border-box;';
        detailDiv.innerHTML = '<div id="ghdx-detail-content"></div><button onclick="document.getElementById(\'ghdx-detail-overlay\').style.display=\'none\';" style="display:block; margin:15px auto 0; padding:8px 30px; background:#9932CC; border:none; color:#FFF; font-weight:bold; border-radius:5px; cursor:pointer;">CLOSE</button>';
        container.appendChild(detailDiv);
    }

    // Since we just set innerHTML on container, we need to append the detail layer inside navbar panel content or body
    container.innerHTML = html;
    
    // Add detail overlay after innerHTML to not lose it
    var overlayHtml = '<div id="ghdx-detail-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:100; overflow-y:auto; padding:15px; box-sizing:border-box;">';
    overlayHtml += '<div id="ghdx-detail-content"></div>';
    overlayHtml += '<button onclick="document.getElementById(\'ghdx-detail-overlay\').style.display=\'none\';" style="display:block; margin:15px auto 0; padding:8px 30px; background:#9932CC; border:none; color:#FFF; font-weight:bold; border-radius:5px; cursor:pointer;">CLOSE</button>';
    overlayHtml += '</div>';
    
    container.innerHTML += overlayHtml;
}

window.ShowGlossary = function() {
    var db = window.g_ghostdexDB;
    if (!db) return;

    var overlay = document.getElementById('ghdx-detail-overlay');
    var content = document.getElementById('ghdx-detail-content');
    if (!overlay || !content) return;

    var h = '';
    h += '<div style="text-align:center; margin-bottom:15px;">';
    h += '<h3 style="color:#9932CC; font-family:Orbitron,sans-serif;">📖 GLOSSARY</h3>';
    h += '<div style="color:#888; font-size:12px;">All 101 Ghosts</div>';
    h += '</div>';

    h += '<div style="display:flex; flex-direction:column; gap:8px; padding-bottom:30px;">';
    db.forEach(function(g) {
        h += '<div style="background:#111; border:1px solid #333; padding:8px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">';
        h += '<div style="color:#FFF; font-size:12px; font-family:Orbitron,sans-serif;">#' + g.id + ' - ' + g.nome + '</div>';
        h += '<div style="display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end;">';
        if (g.tipos) {
            g.tipos.forEach(function(t) {
                var color = typeColors[t] || '#FFF';
                h += '<span style="background:' + color + '; color:#000; padding:2px 6px; border-radius:8px; font-weight:bold; font-size:9px;">' + t + '</span>';
            });
        }
        h += '</div></div>';
    });
    h += '</div>';

    content.innerHTML = h;
    overlay.style.display = 'block';
};

window.ShowGhostdexDetail = function(ghostId) {
    var db = window.g_ghostdexDB;
    if (!db) return;

    var ghost = null;
    for (var i = 0; i < db.length; i++) {
        if (db[i].id === ghostId) { ghost = db[i]; break; }
    }
    if (!ghost) return;

    var progress = GetPlayerGhostdexProgress();
    var st = progress[ghostId] || 0;

    if (st < 2) return; // Can't view undiscovered or just seen

    var overlay = document.getElementById('ghdx-detail-overlay');
    var content = document.getElementById('ghdx-detail-content');
    if (!overlay || !content) return;

    var h = '';
    
    // Header with image
    h += '<div style="text-align:center; margin-bottom:10px;">';
    if (st === 1) {
        h += '<img src="Ghosts/%23' + ghost.id + '.png" onerror="this.onerror=null;this.src=\'Ghosts/' + ghost.id + '.png\';this.onerror=function(){this.onerror=null;this.src=\'assets/sprites/ghost_' + ghost.id + '_r.webp\';};" style="width:48px; height:48px; image-rendering:pixelated; filter:brightness(0);" />';
    } else {
        h += '<img src="Ghosts/%23' + ghost.id + '.png" onerror="this.onerror=null;this.src=\'Ghosts/' + ghost.id + '.png\';this.onerror=function(){this.onerror=null;this.src=\'assets/sprites/ghost_' + ghost.id + '_r.webp\';};" style="width:48px; height:48px; image-rendering:pixelated; filter: drop-shadow(0 0 10px #FF00FF);" />';
    }
    h += '<h3 style="color:#9932CC; margin:5px 0 10px 0; font-family:Orbitron,sans-serif;">#' + ghost.id + ' - ' + ghost.nome + '</h3>';
    h += '</div>';

    // Types
    h += '<div style="text-align:center; margin-bottom:10px;">';
    ghost.tipos.forEach(function(t) {
        var color = typeColors[t] || '#FFF';
        if (st === 2) {
            h += '<span style="background:' + color + '; color:#000; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:11px; margin:2px;">' + t + '</span>';
        } else {
            h += '<span style="background:#555; color:#AAA; padding:3px 8px; border-radius:12px; font-size:11px; margin:2px;">' + t + '</span>';
        }
    });
    h += '</div>';

    // Info
    h += '<div style="display:flex; justify-content:center; gap:15px; color:#AAA; font-size:12px; margin-bottom:10px;">';
    h += '<span>Height: ' + (st === 2 ? ghost.altura_m + 'm' : '???') + '</span>';
    h += '<span>Weight: ' + (st === 2 ? ghost.peso_kg + 'kg' : '???') + '</span>';
    h += '</div>';

    h += '<div style="color:#888; font-size:11px; text-align:center; margin-bottom:10px;">';
    h += st === 2 ? ghost.habitat : '???';
    h += '</div>';

    // Stats bars
    var stats = [
        { label: 'HP', val: ghost.stats_base.hp },
        { label: 'ATK', val: ghost.stats_base.ataque },
        { label: 'DEF', val: ghost.stats_base.defesa },
        { label: 'SP ATK', val: ghost.stats_base.atq_especial },
        { label: 'SP DEF', val: ghost.stats_base.def_especial },
        { label: 'SPD', val: ghost.stats_base.velocidade }
    ];

    stats.forEach(function(s) {
        var pct = Math.min((s.val / 150) * 100, 100);
        var barColor = st === 2 ? '#00FFFF' : '#555';
        var valText = st === 2 ? s.val : '???';

        h += '<div style="display:flex; align-items:center; font-size:11px; color:#FFF; margin-bottom:3px;">';
        h += '<div style="width:45px;">' + s.label + '</div>';
        h += '<div style="width:28px; text-align:right; margin-right:8px; color:' + barColor + ';">' + valText + '</div>';
        h += '<div style="flex-grow:1; background:#222; height:8px; border-radius:4px; overflow:hidden; border:1px solid #444;">';
        h += '<div style="width:' + (st === 2 ? pct : 0) + '%; background:' + barColor + '; height:100%;"></div>';
        h += '</div></div>';
    });

    // Lore
    h += '<div style="margin-top:10px; padding:8px; background:#111; border:1px solid #333; border-radius:5px; color:#CCC; font-size:11px; line-height:1.4;">';
    h += st === 2 ? ghost.lore : 'Capture this ghost to unlock details.';
    h += '</div>';

    // HERO STATUS
    if (st === 2) {
        // Read from dg_local_characters where ghost RPG profiles are stored
        var heroStats = { level: 1, xp: 0, xpRequired: 100, vit: 1, agi: 1, int: 1, pow: 1, mag: 1 };
        try {
            var rawChars = localStorage.getItem("dg_local_characters");
            if (rawChars) {
                var localChars = JSON.parse(rawChars);
                var charId = "ghost_" + ghost.id;
                var foundChar = localChars.find(function(c) { return c.characterId === charId; });
                if (foundChar) {
                    heroStats.level = foundChar.level || 1;
                    heroStats.xp = foundChar.xp || 0;
                    heroStats.xpRequired = foundChar.xpRequired || 100;
                    heroStats.vit = foundChar.vit || 1;
                    heroStats.agi = foundChar.agi || 1;
                    heroStats.int = foundChar.int || 1;
                    heroStats.pow = foundChar.pow || 1;
                    heroStats.mag = foundChar.mag || 1;
                }
            }
        } catch(e) { console.error("Error reading ghost RPG profile", e); }
        h += '<div style="margin-top:10px; padding:10px; background:rgba(255, 215, 0, 0.1); border:1px solid #FFD700; border-radius:5px;">';
        h += '<div style="color:#FFD700; font-weight:bold; font-size:14px; text-align:center; margin-bottom:8px;">🛡️ HERO STATUS</div>';
        h += '<div style="display:flex; justify-content:space-between; color:#FFF; font-size:12px; margin-bottom:4px;">';
        h += '<span>Level: <b style="color:#00FF00">' + heroStats.level + '</b></span>';
        h += '<span>XP: <b style="color:#00FFFF">' + heroStats.xp + '/' + heroStats.xpRequired + '</b></span>';
        h += '</div>';
        h += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:3px; font-size:11px; color:#FFF;">';
        h += '<span>❤️ VIT: <b style="color:#FF6B6B">' + heroStats.vit + '</b></span>';
        h += '<span>⚡ AGI: <b style="color:#FFFF00">' + heroStats.agi + '</b></span>';
        h += '<span>🔮 INT: <b style="color:#BB86FC">' + heroStats.int + '</b></span>';
        h += '<span>⚔️ POW: <b style="color:#FF4500">' + heroStats.pow + '</b></span>';
        h += '<span>🌀 MAG: <b style="color:#00BFFF">' + heroStats.mag + '</b></span>';
        h += '</div></div>';
    } else {
        h += '<div style="margin-top:10px; padding:10px; background:rgba(50, 50, 50, 0.5); border:1px solid #555; border-radius:5px;">';
        h += '<div style="color:#777; font-weight:bold; font-size:14px; text-align:center;">🛡️ HERO STATUS: Locked</div>';
        h += '</div>';
    }


    // Play Button & Favorite Button
    if (st === 2) {
        var favs = window.GetFavoriteGhosts ? window.GetFavoriteGhosts() : [];
        var isFav = favs.indexOf(ghost.id) !== -1;
        var favText = isFav ? "⭐ UNFAVORITE" : "⭐ FAVORITE";
        
        h += '<div style="display:flex; gap:10px; margin-top:15px;">';
        h += '<button onclick="PlayAsGhost(\'' + ghost.id + '\')" style="flex:1; padding:10px; background:var(--green-neon); border:none; color:#000; font-weight:bold; font-family:Orbitron,sans-serif; border-radius:5px; cursor:pointer; box-shadow:0 0 10px var(--green-neon);">PLAY</button>';
        h += '<button onclick="ToggleFavoriteGhost(\'' + ghost.id + '\')" style="flex:1; padding:10px; background:' + (isFav ? '#555' : '#FFD700') + '; border:none; color:#000; font-weight:bold; font-family:Orbitron,sans-serif; border-radius:5px; cursor:pointer; box-shadow:0 0 10px ' + (isFav ? '#333' : '#FFD700') + ';">' + favText + '</button>';
        h += '</div>';
    }

    content.innerHTML = h;
    overlay.style.display = 'block';
};

window.PlayAsGhost = function(ghostId) {
    // Login obrigatório pra jogar (30/08/2026, achado numa auditoria pedida pelo usuário):
    // clicar PLAY num fantasma da Ghostdex que o jogador nunca pegou gerava um personagem novo
    // e começava a jogar sem checar sessão nenhuma — um jeito real de pular o login inteiro.
    // 22/08/2026: checa g_hasAuthenticatedThisPageLoad (memória, js/web2/auth.js), não
    // dg_cloud_email (localStorage, persiste entre reloads e pularia o login sozinho).
    if (!window.g_hasAuthenticatedThisPageLoad) {
        if (typeof window.OpenLoginModal === "function") window.OpenLoginModal();
        return;
    }
    // 27/08/2026: trava contra reentrância, portada do mobile (www/js/game/ghostdex_ui.js,
    // corrigida lá em 20/08/2026) — mesma estrutura: PlayAsGhost() é agora o dono exclusivo da
    // lógica de "retomar jogo já em andamento" (ver bloco g_gameState no final desta função);
    // SelectCharacterToPlay() (game_core.js) não dispara mais essa lógica por conta própria,
    // fechando o double-start em que as duas funções disparavam ResetGame/PlayBGM na mesma
    // chamada de PLAY.
    if (window.__inPlayAsGhost) return;
    window.__inPlayAsGhost = true;
    try {
    window.g_currentPlayerGhost = ghostId;
    console.log("Player is now playing as Ghost ID:", ghostId);

    // Retroactive RPG Profile Generation
    let localChars = localStorage.getItem("dg_local_characters");
    if (!localChars) localChars = "[]";
    localChars = JSON.parse(localChars);
    
    // Checa o ID cru primeiro (pode já existir assim se veio de um fantasma forjado, ou de um save
    // feito por saveLocalStorage/TriggerRPGSaveToDeSo, que gravam sem prefixo "ghost_") antes de
    // assumir que precisa gerar um perfil novo — sem isso, criava uma entrada duplicada
    // "ghost_<id>" ao lado da já existente sem prefixo. Corrigido em 20/08/2026, mesmo bug já
    // corrigido no app mobile (www/js/game/ghostdex_ui.js) no mesmo dia.
    let legacyCharId = "ghost_" + ghostId;
    let existingChar = localChars.find(c => c.characterId === String(ghostId) || c.characterId === legacyCharId);
    let charId = existingChar ? existingChar.characterId : legacyCharId;
    if (!existingChar) {
        let ghostName = "Unknown Ghost";
        let dbGhost = window.g_ghostdexDB ? window.g_ghostdexDB.find(g => g.id === ghostId) : null;
        if (dbGhost) ghostName = dbGhost.nome;
        
        let hp = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.hp : 50;
        let atk = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.ataque : 50;
        let def = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.defesa : 50;
        let spAtk = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.atq_especial : 50;
        let spDef = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.def_especial : 50;
        let spd = dbGhost && dbGhost.stats_base ? dbGhost.stats_base.velocidade : 50;

        let retroChar = {
            characterId: charId,
            name: ghostName,
            level: 1,
            xp: 0,
            vit: Math.ceil(hp / 10) || 1,
            agi: Math.ceil(spd / 10) || 1,
            int: Math.ceil(spAtk / 10) || 1,
            pow: Math.ceil(atk / 10) || 1,
            mag: Math.ceil(spDef / 10) || 1,
            inventory: [],
            equipment: { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }
        };
        localChars.push(retroChar);
        localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
        console.log("👻 RPG Profile generated retroactively for ghost:", charId);

        // Sincroniza com o banco (auditoria 22/08/2026): este personagem gerado retroativamente
        // (jogador clicou PLAY numa espécie já capturada que nunca ganhou perfil de RPG) só
        // ficava salvo em dg_local_characters — nunca chegava no servidor.
        var playAsGhostSocket = window.NetworkState && window.NetworkState.socket;
        if (playAsGhostSocket && playAsGhostSocket.connected && localStorage.getItem('dg_cloud_email')) {
            playAsGhostSocket.emit('save_game_state', { characters: [retroChar] });
        }
    } else if (existingChar.level === 1 && existingChar.vit > 20) {
        let dbGhost = window.g_ghostdexDB ? window.g_ghostdexDB.find(g => g.id === ghostId) : null;
        if (dbGhost && dbGhost.stats_base) {
            existingChar.vit = Math.ceil(dbGhost.stats_base.hp / 10) || 1;
            existingChar.pow = Math.ceil(dbGhost.stats_base.ataque / 10) || 1;
            existingChar.agi = Math.ceil(dbGhost.stats_base.velocidade / 10) || 1;
            existingChar.int = Math.ceil(dbGhost.stats_base.atq_especial / 10) || 1;
            existingChar.mag = Math.ceil(dbGhost.stats_base.def_especial / 10) || 1;
            localStorage.setItem("dg_local_characters", JSON.stringify(localChars));
            console.log("👻 RPG Profile stats fixed retroactively for ghost:", charId);

            // Sincroniza com o banco (auditoria 22/08/2026): mesmo problema, a correção
            // retroativa de stats nunca chegava no servidor.
            var statsFixSocket = window.NetworkState && window.NetworkState.socket;
            if (statsFixSocket && statsFixSocket.connected && localStorage.getItem('dg_cloud_email')) {
                statsFixSocket.emit('save_game_state', { characters: [existingChar] });
            }
        }
    }
    
    // window.g_ownedCharacters é um cache em memória que só é atualizado em pontos específicos
    // (login, forja, tela de seleção) — capturar um fantasma em combate (UnlockGhostForPlayer)
    // ou a geração retroativa logo acima gravam em localStorage mas nunca atualizam esse cache.
    // Sem isso, SelectCharacterToPlay (que só busca em window.g_ownedCharacters, não em
    // localStorage) não encontrava o fantasma recém-capturado e não fazia nada — incluindo não
    // atualizar 'dg_deso_character_id' — enquanto GhostRPG.SwitchActiveGhost logo abaixo troca o
    // estado em memória mesmo assim, criando um estado dividido: a sessão atual mostra o
    // fantasma certo, mas o próximo login/recarregamento resumia o fantasma ERRADO porque o
    // ponteiro de "último personagem ativo" nunca foi atualizado (achado 22/08/2026, auditoria
    // "tudo na Ghostdex deve ser salvo no banco" — reproduzido de verdade capturando um fantasma
    // e clicando PLAY nele em seguida, ver e2e-db-verification). localChars já é a leitura fresca
    // de localStorage feita acima (com o retroativo/fix de stats já aplicado quando for o caso).
    window.g_ownedCharacters = localChars;

    if (typeof window.SelectCharacterToPlay === 'function') {
        window.SelectCharacterToPlay(charId);
    }

    if (typeof GhostRPG !== 'undefined' && GhostRPG.SwitchActiveGhost) {
        GhostRPG.SwitchActiveGhost(ghostId);
    }
    
    // Cache the images so the engine can use them
    function safeLoadGhostSprite(ghostId, callback) {
        var paths = [
            'Ghosts/%23' + ghostId + '.png',
            'Ghosts/' + ghostId + '.png',
            'assets/sprites/ghost_' + ghostId + '_r.webp'
        ];
        var idx = 0;
        function tryNext() {
            if (idx >= paths.length) return;
            var img = new Image();
            img.onload = function() {
                if (img.naturalWidth > 0) callback(img);
            };
            img.onerror = function() {
                idx++;
                tryNext();
            };
            img.src = paths[idx];
        }
        tryNext();
    }

    safeLoadGhostSprite(ghostId, function(loadedImg) {
        window.g_customPlayerGhostRight = loadedImg;
        window.g_customPlayerGhostLeft = loadedImg;
    });
    
    var overlay = document.getElementById('ghdx-detail-overlay');
    if (overlay) overlay.style.display = 'none';
    
    if (typeof window.ToggleNavbarTab === "function") {
        window.ToggleNavbarTab('ghostdex'); // This toggles it off
    }
    
    // --- FORCE DIRECT TRANSITION TO GAMEPLAY ---
    var charOverlay = document.getElementById('characterSelectionOverlay');
    if (charOverlay) charOverlay.style.display = 'none';
    
    var mobileMenu = document.getElementById('mobileMainMenu');
    if (mobileMenu) mobileMenu.style.display = 'none';
    
    var nameScreen = document.getElementById('mobileNameInputScreen');
    if (nameScreen) nameScreen.style.display = 'none';
    
    var inGameMenuBtn = document.getElementById('mobileInGameMenuBtn');
    if (inGameMenuBtn) inGameMenuBtn.style.display = 'flex';
    
    var controls = document.getElementById('mobileControlsContainer');
    if (controls) controls.style.visibility = 'visible';
    
    var startBtn = document.getElementById('touchStartBtn');
    if (startBtn) startBtn.style.display = 'none';
    
    var video = document.getElementById('openingCutsceneVideo');
    if (video) video.style.display = 'none';
    
    window.g_cutscenePlayed = true;

    var ep1Btn = document.getElementById('mobileEpisode1Btn');
    if (ep1Btn) ep1Btn.style.display = 'none';
    
    var resumeBtn = document.getElementById('mobileResumeBtn');
    if (resumeBtn) resumeBtn.style.display = 'flex';
    
    var saveBtn = document.getElementById('mobileSaveBtn');
    if (saveBtn) saveBtn.style.display = 'flex';
    
    var mainGameBtns = document.getElementById('mobileMainMenuGameBtns');
    if (mainGameBtns) mainGameBtns.style.display = 'flex';
    
    var modeBtn = document.getElementById("gameScreenModeBtn");
    if (modeBtn) modeBtn.style.display = "block";

    // 27/08/2026: PlayAsGhost() agora é o dono exclusivo de start/restart (trava
    // window.__inPlayAsGhost acima + SelectCharacterToPlay guardando os dois branches dela com
    // essa mesma trava, ver game_core.js) — testado ao vivo contra o double-start real (bug 6):
    // sem a trava aqui E lá, "jogo já em andamento" disparava ResetGame duas vezes na mesma
    // chamada de PLAY (uma em SelectCharacterToPlay, outra aqui). O branch G_START usava
    // dg_saved_level (chave POR-DISPOSITIVO, compartilhada entre TODOS os personagens do
    // navegador — bug 5, corrigido 27/08/2026); agora usa o worldLevel do PRÓPRIO personagem
    // (charId/localChars já carregados acima nesta função), consistente com o que
    // SelectCharacterToPlay usaria se estivesse chamando StartCutscene ela mesma.
    if (typeof window.g_gameState !== 'undefined') {
        if (window.g_gameState === 0) { // G_START
            if (typeof window.StartCutscene === "function") {
                var ownChar = localChars.find(function(c) { return c.characterId === charId; });
                var startLevel = (ownChar && ownChar.worldLevel) ? ownChar.worldLevel : 1;
                window.StartCutscene(startLevel, false);
            }
        } else if (window.g_gameState === 6 || window.g_gameState === 1) {
            // If already in game, we ensure the level resets to use the new ghost
            // (or if paused, unpause)
            if (typeof window.ResetGame === "function") window.ResetGame(window.g_currentLevel || 1, true);
            window.g_gamePaused = false;
            if (typeof window.PlayBGM === "function") window.PlayBGM();
        }
    }

    var baseName = localStorage.getItem('playerName') || 'Ghost';
    baseName = baseName.replace(/\s*\(#\w+\)\s*$/, '').trim();
    var taggedName = baseName + ' (#' + ghostId + ')';
    if (window.NetworkState && window.NetworkState.socket && window.NetworkState.connected) {
        window.NetworkState.socket.emit('join_game', { playerName: taggedName });
    }
    } finally {
        window.__inPlayAsGhost = false;
    }
};

window.CloseGhostdexModal = function() {
    var overlay = document.getElementById('ghdx-detail-overlay');
    if (overlay) overlay.style.display = 'none';
};

window.GetFavoriteGhosts = function() {
    try {
        var f = localStorage.getItem("DangerGhost_Favorites");
        return f ? JSON.parse(f) : [];
    } catch(e) { return []; }
};

window.ToggleFavoriteGhost = function(ghostId) {
    var favs = window.GetFavoriteGhosts();
    var idx = favs.indexOf(ghostId);
    if (idx !== -1) {
        favs.splice(idx, 1);
    } else {
        if (favs.length >= 3) {
            alert("You can only favorite up to 3 ghosts!");
            return;
        }
        favs.push(ghostId);
    }
    localStorage.setItem("DangerGhost_Favorites", JSON.stringify(favs));
    SyncGhostdexExtrasToCloud();

    // Re-render
    if (window.g_ghostdexDB) {
        RenderGhostdexInNavbar(window.g_ghostdexDB);
        ShowGhostdexDetail(ghostId);
    }
};
