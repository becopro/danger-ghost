// ============================================================
// GHOSTDEX UI — renders inside navbarPanelContent
// Reads data from window.g_ghostdexDB (set by ghostdex_data.js)
// ============================================================

var typeColors = {
    "Espectro": "#E0E0E0", "Sombra": "#4F4F4F", "Neon": "#00FFFF",
    "Urbano": "#FF8C00", "Cibernético": "#00FF00", "Fogo-Fátuo": "#FF4500",
    "Sombrio": "#8B008B", "Cristal": "#00BFFF", "Tóxico": "#ADFF2F",
    "Sucata": "#A0522D", "Pixação": "#FF1493", "Holográfico": "#87CEFA",
    "Virtual": "#32CD32", "Caos": "#FF0000"
};

function GetPlayerGhostdexProgress() {
    var raw = localStorage.getItem('ghostdex_progress');
    if (!raw) {
        localStorage.setItem('ghostdex_progress', JSON.stringify({}));
        return {};
    }
    try { return JSON.parse(raw); } catch(e) { return {}; }
}

// Called by game engine: UpdateGhostdex("001", 1) = seen, UpdateGhostdex("001", 2) = captured
window.UpdateGhostdex = function(id, state) {
    var progress = GetPlayerGhostdexProgress();
    var currentState = progress[id] || 0;
    if (state > currentState) {
        progress[id] = state;
        localStorage.setItem('ghostdex_progress', JSON.stringify(progress));
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
    var seen = 0, caught = 0;

    db.forEach(function(ghost) {
        var st = progress[ghost.id] || 0;
        if (st >= 1) seen++;
        if (st === 2) caught++;
    });

    // Build full HTML
    var html = '';
    html += '<div style="text-align:center; margin-bottom:10px;">';
    html += '<h3 style="margin:0 0 4px 0; color:#9932CC; font-family:Orbitron,sans-serif; font-size:16px; text-shadow:0 0 8px #9932CC;">👻 GHOSTDEX</h3>';
    html += '<div style="color:#AAA; font-size:12px;">Seen: ' + seen + ' / ' + db.length + ' | Caught: ' + caught + ' / ' + db.length + '</div>';
    html += '</div>';

    html += '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; max-height:50vh; overflow-y:auto; padding:4px;">';

    db.forEach(function(ghost) {
        var st = progress[ghost.id] || 0;
        var bg, border, opacity;
        if (st < 2) {
            bg = '#111'; border = '#333'; opacity = '0.5';
        } else {
            bg = '#0a1a0a'; border = '#00FF00'; opacity = '1';
        }

        html += '<div onclick="ShowGhostdexDetail(\'' + ghost.id + '\')" style="cursor:pointer; background:' + bg + '; border:1px solid ' + border + '; border-radius:6px; padding:6px; text-align:center; opacity:' + opacity + ';">';
        html += '<div style="color:#666; font-size:10px;">#' + ghost.id + '</div>';
        if (st < 2) {
            html += '<div style="font-size:20px;">❓</div>';
            html += '<div style="color:#555; font-size:10px;">???</div>';
        } else {
            html += '<div style="margin:4px 0;"><img src="assets/sprites/ghost_' + ghost.id + '_r.webp" style="width:24px; height:24px; image-rendering:pixelated;" /></div>';
            html += '<div style="color:#00FF00; font-size:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + ghost.nome + '</div>';
        }
        html += '</div>';
    });

    html += '</div>';

    // Hidden detail modal
    html += '<div id="ghdx-detail-overlay" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:100; overflow-y:auto; padding:15px; box-sizing:border-box;">';
    html += '<div id="ghdx-detail-content"></div>';
    html += '<button onclick="document.getElementById(\'ghdx-detail-overlay\').style.display=\'none\';" style="display:block; margin:15px auto 0; padding:8px 30px; background:#9932CC; border:none; color:#FFF; font-weight:bold; border-radius:5px; cursor:pointer;">CLOSE</button>';
    html += '</div>';

    container.innerHTML = html;
}

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
        h += '<img src="assets/sprites/ghost_' + ghost.id + '_r.webp" style="width:48px; height:48px; image-rendering:pixelated; filter:brightness(0);" />';
    } else {
        h += '<img src="assets/sprites/ghost_' + ghost.id + '_r.webp" style="width:48px; height:48px; image-rendering:pixelated;" />';
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

    // Play Button
    if (st === 2) {
        h += '<button onclick="PlayAsGhost(\'' + ghost.id + '\')" style="display:block; width:100%; margin-top:15px; padding:10px; background:var(--green-neon); border:none; color:#000; font-weight:bold; font-family:Orbitron,sans-serif; border-radius:5px; cursor:pointer; box-shadow:0 0 10px var(--green-neon);">PLAY AS THIS GHOST</button>';
    }

    content.innerHTML = h;
    overlay.style.display = 'block';
};

window.PlayAsGhost = function(ghostId) {
    window.g_currentPlayerGhost = ghostId;
    console.log("Player is now playing as Ghost ID:", ghostId);
    
    if (typeof GhostRPG !== 'undefined' && GhostRPG.SwitchActiveGhost) {
        GhostRPG.SwitchActiveGhost(ghostId);
    }
    
    // Cache the images so the engine can use them
    window.g_customPlayerGhostRight = new Image();
    window.g_customPlayerGhostRight.src = 'assets/sprites/ghost_' + ghostId + '_r.webp';
    
    window.g_customPlayerGhostLeft = new Image();
    window.g_customPlayerGhostLeft.src = 'assets/sprites/ghost_' + ghostId + '_l.webp';
    
    var overlay = document.getElementById('ghdx-detail-overlay');
    if (overlay) overlay.style.display = 'none';
    
    if (typeof window.ToggleNavbarTab === "function") {
        window.ToggleNavbarTab('ghostdex'); // This toggles it off
    }
};

window.CloseGhostdexModal = function() {
    var overlay = document.getElementById('ghdx-detail-overlay');
    if (overlay) overlay.style.display = 'none';
};

