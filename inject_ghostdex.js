const fs = require('fs');
const path = require('path');

// 1. Update index.html
let html = fs.readFileSync('www/index.html', 'utf8');

// Insert GHDX button
if (!html.includes('ToggleNavbarTab(\'ghostdex\')')) {
    html = html.replace(
        /<button onclick="ToggleNavbarTab\('bag'\);" style="[^"]*">🎒 BAG<\/button>/g,
        '<button onclick="ToggleNavbarTab(\'bag\');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎒 BAG</button>\n            <button onclick="ToggleNavbarTab(\'ghostdex\'); InitializeGhostdex();" style="padding: 8px; border: 1px solid #9932CC; background: #111; color: #9932CC; border-radius: 5px; font-weight: bold; text-shadow: 0 0 5px #9932CC; box-shadow: inset 0 0 5px #9932CC;">👻 GHDX</button>'
    );
}

// Insert Panel
const ghostdexPanelHtml = `
            <!-- GHOSTDEX PANEL -->
            <div id="panel-ghostdex" class="overlay-panel" style="display:none;">
                <div class="panel-header" style="color: #9932CC; text-shadow: 0 0 5px #9932CC; border-bottom: 1px solid #9932CC;">
                    <h2>GHOSTDEX</h2>
                    <button onclick="ToggleNavbarTab('ghostdex')" style="background: transparent; border: 1px solid #9932CC; color: #9932CC; font-weight: bold; padding: 5px 10px; border-radius: 3px;">X</button>
                </div>
                <div class="panel-content" style="padding: 10px; flex-direction: column;">
                    <div id="ghostdex-header-info" style="text-align: center; color: #00FFFF; font-size: 14px; margin-bottom: 10px; font-weight: bold;">
                        Encontrados: 0 / 101 | Capturados: 0 / 101
                    </div>
                    <div id="ghostdex-grid" class="ghostdex-grid">
                        <!-- Ghost items injected here via JS -->
                    </div>
                </div>
            </div>

            <!-- GHOSTDEX DETAILS MODAL -->
            <div id="ghostdex-details-modal" class="overlay-panel" style="display:none; z-index: 10001; position: fixed !important; top: 5% !important; left: 2.5% !important; height: 90vh !important; background: rgba(0,0,0,0.95); border: 2px solid #9932CC; box-shadow: 0 0 20px #9932CC;">
                <div class="panel-header" style="border-bottom: 1px solid #9932CC; justify-content: space-between;">
                    <h2 id="ghdx-modal-title" style="color: #FFF; text-shadow: 0 0 5px #9932CC;">#000 - ???</h2>
                    <button onclick="CloseGhostdexModal()" style="background: transparent; border: 1px solid #FF00FF; color: #FF00FF; font-weight: bold; padding: 5px 10px; border-radius: 3px;">X</button>
                </div>
                <div class="panel-content" style="padding: 10px; display: flex; flex-direction: column; overflow-y: auto;">
                    <div id="ghdx-modal-sprite" style="width: 100%; height: 120px; border: 1px dashed #555; display: flex; align-items: center; justify-content: center; font-size: 50px; margin-bottom: 10px;">👻</div>
                    <div id="ghdx-modal-types" style="display: flex; gap: 10px; justify-content: center; margin-bottom: 10px;">
                        <!-- Types -->
                    </div>
                    
                    <div id="ghdx-modal-info" style="display: flex; justify-content: space-around; margin-bottom: 15px; font-size: 14px; color: #AAA;">
                        <span id="ghdx-modal-height">Alt: ??? m</span>
                        <span id="ghdx-modal-weight">Peso: ??? kg</span>
                    </div>

                    <h3 style="color: #00FFFF; text-align: center; border-bottom: 1px solid #00FFFF; padding-bottom: 5px;">ATRIBUTOS</h3>
                    <div id="ghdx-modal-stats" style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px;">
                        <!-- Stats Bars injected here -->
                    </div>

                    <h3 style="color: #00FFFF; text-align: center; border-bottom: 1px solid #00FFFF; padding-bottom: 5px;">HABITAT</h3>
                    <div id="ghdx-modal-habitat" style="color: #FFF; text-align: center; font-size: 14px; margin-bottom: 15px;">
                        ???
                    </div>

                    <h3 style="color: #00FFFF; text-align: center; border-bottom: 1px solid #00FFFF; padding-bottom: 5px;">LORE</h3>
                    <div id="ghdx-modal-lore" style="color: #AAA; font-size: 13px; text-align: justify; font-style: italic; background: #111; padding: 10px; border: 1px solid #333;">
                        ???
                    </div>
                </div>
            </div>
`;

if (!html.includes('id="panel-ghostdex"')) {
    html = html.replace(
        /(<div id="panel-bag"[^>]*>[\s\S]*?<\/div>\s*<\/div>)/,
        `$1\n${ghostdexPanelHtml}`
    );
}

// Inject ghostdex_ui.js script
if (!html.includes('ghostdex_ui.js')) {
    html = html.replace(
        /<\/body>/,
        '    <script src="js/game/ghostdex_ui.js"></script>\n</body>'
    );
}

fs.writeFileSync('www/index.html', html, 'utf8');


// 2. Create ghostdex_ui.js
const uiScript = `
let g_ghostdexDB = null;

async function LoadGhostdexDB() {
    if (g_ghostdexDB) return;
    try {
        const response = await fetch('data/ghostdex_db.json');
        const data = await response.json();
        g_ghostdexDB = data.ghostdex_db;
        console.log("Ghostdex DB loaded, count:", g_ghostdexDB.length);
    } catch (e) {
        console.error("Failed to load ghostdex DB", e);
    }
}

function GetPlayerGhostdexProgress() {
    let progress = localStorage.getItem('ghostdex_progress');
    if (!progress) {
        progress = {};
        localStorage.setItem('ghostdex_progress', JSON.stringify(progress));
        return progress;
    }
    return JSON.parse(progress);
}

// Called by game engine (e.g. on battle start: UpdateGhostdex("001", 1); on capture: UpdateGhostdex("001", 2))
window.UpdateGhostdex = function(id, state) {
    let progress = GetPlayerGhostdexProgress();
    let currentState = progress[id] || 0;
    // Only upgrade state (0 -> 1 -> 2)
    if (state > currentState) {
        progress[id] = state;
        localStorage.setItem('ghostdex_progress', JSON.stringify(progress));
    }
}

// Debug: Give some dummy data for preview
function DebugPopulateGhostdex() {
    let progress = GetPlayerGhostdexProgress();
    if (Object.keys(progress).length === 0) {
        progress["001"] = 2; // Captured
        progress["002"] = 1; // Seen
        progress["003"] = 1; // Seen
        progress["020"] = 2; // Captured
        progress["099"] = 2; // Captured
        localStorage.setItem('ghostdex_progress', JSON.stringify(progress));
    }
}

window.InitializeGhostdex = async function() {
    await LoadGhostdexDB();
    DebugPopulateGhostdex(); // Remove in prod
    RenderGhostdex();
}

const typeColors = {
    "Espectro": "#E0E0E0", "Sombra": "#4F4F4F", "Neon": "#00FFFF",
    "Urbano": "#FF8C00", "Cibernético": "#00FF00", "Fogo-Fátuo": "#FF4500",
    "Sombrio": "#8B008B", "Cristal": "#00BFFF", "Tóxico": "#ADFF2F",
    "Sucata": "#A0522D", "Pixação": "#FF1493", "Holográfico": "#87CEFA",
    "Virtual": "#32CD32", "Caos": "#FF0000"
};

function RenderGhostdex() {
    if (!g_ghostdexDB) return;
    let progress = GetPlayerGhostdexProgress();
    let grid = document.getElementById('ghostdex-grid');
    grid.innerHTML = '';
    
    let seen = 0;
    let caught = 0;

    g_ghostdexDB.forEach(ghost => {
        let state = progress[ghost.id] || 0;
        if (state >= 1) seen++;
        if (state === 2) caught++;

        let card = document.createElement('div');
        card.className = 'ghdx-card state-' + state;
        
        let content = '';
        if (state === 0) {
            content = \`<div class="ghdx-id">#\${ghost.id}</div><div class="ghdx-name">???</div>\`;
        } else if (state === 1) {
            content = \`<div class="ghdx-id">#\${ghost.id}</div><div class="ghdx-name">\${ghost.nome}</div><div class="ghdx-type-hint">\${ghost.tipos[0]}</div>\`;
            card.onclick = () => OpenGhostdexModal(ghost, state);
        } else if (state === 2) {
            content = \`<div class="ghdx-id" style="color: #00FFFF;">#\${ghost.id}</div>
                       <div class="ghdx-icon">👻</div>
                       <div class="ghdx-name" style="color:#FFF;">\${ghost.nome}</div>\`;
            card.onclick = () => OpenGhostdexModal(ghost, state);
        }
        
        card.innerHTML = content;
        grid.appendChild(card);
    });

    document.getElementById('ghostdex-header-info').innerText = \`Vistos: \${seen} / 101 | Capturados: \${caught} / 101\`;
}

window.OpenGhostdexModal = function(ghost, state) {
    document.getElementById('ghostdex-details-modal').style.display = 'flex';
    document.getElementById('ghdx-modal-title').innerText = \`#\${ghost.id} - \${ghost.nome}\`;
    
    let typesHtml = '';
    if (state === 2) {
        ghost.tipos.forEach(t => {
            let color = typeColors[t] || "#FFF";
            typesHtml += \`<span style="background:\${color}; color:#000; padding:3px 8px; border-radius:12px; font-weight:bold; font-size:12px;">\${t}</span>\`;
        });
        document.getElementById('ghdx-modal-height').innerText = \`Alt: \${ghost.altura_m}m\`;
        document.getElementById('ghdx-modal-weight').innerText = \`Peso: \${ghost.peso_kg}kg\`;
        document.getElementById('ghdx-modal-habitat').innerText = ghost.habitat;
        document.getElementById('ghdx-modal-lore').innerText = ghost.lore;
    } else {
        typesHtml = \`<span style="background:#555; color:#AAA; padding:3px 8px; border-radius:12px; font-size:12px;">\${ghost.tipos[0]} (Dados Incompletos)</span>\`;
        document.getElementById('ghdx-modal-height').innerText = \`Alt: ???m\`;
        document.getElementById('ghdx-modal-weight').innerText = \`Peso: ???kg\`;
        document.getElementById('ghdx-modal-habitat').innerText = "???";
        document.getElementById('ghdx-modal-lore').innerText = "Capture este fantasma para desbloquear os detalhes.";
    }
    document.getElementById('ghdx-modal-types').innerHTML = typesHtml;

    // Render Stats
    let statsDiv = document.getElementById('ghdx-modal-stats');
    statsDiv.innerHTML = '';
    
    let statsList = [
        { key: 'hp', label: 'HP', val: ghost.stats_base.hp },
        { key: 'atk', label: 'ATQ', val: ghost.stats_base.ataque },
        { key: 'def', label: 'DEF', val: ghost.stats_base.defesa },
        { key: 'spa', label: 'ATQ SP', val: ghost.stats_base.atq_especial },
        { key: 'spd', label: 'DEF SP', val: ghost.stats_base.def_especial },
        { key: 'spe', label: 'VEL', val: ghost.stats_base.velocidade }
    ];

    statsList.forEach(s => {
        let percent = (s.val / 150) * 100; // max possible base stat roughly 150
        if (percent > 100) percent = 100;
        let color = state === 2 ? '#00FFFF' : '#555';
        let valText = state === 2 ? s.val : '???';
        
        statsDiv.innerHTML += \`
            <div style="display:flex; align-items:center; font-size:12px; color:#FFF;">
                <div style="width: 50px;">\${s.label}</div>
                <div style="width: 30px; text-align:right; margin-right:10px; color:\${color};">\${valText}</div>
                <div style="flex-grow: 1; background: #222; height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid #444;">
                    <div style="width: \${state === 2 ? percent : 0}%; background: \${color}; height: 100%;"></div>
                </div>
            </div>
        \`;
    });
}

window.CloseGhostdexModal = function() {
    document.getElementById('ghostdex-details-modal').style.display = 'none';
}
`;

fs.writeFileSync('www/js/game/ghostdex_ui.js', uiScript, 'utf8');

// 3. Update style.css
let css = fs.readFileSync('www/css/style.css', 'utf8');
if (!css.includes('.ghostdex-grid')) {
    css += `
/* Ghostdex Styles */
.ghostdex-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
    width: 100%;
    overflow-y: auto;
    max-height: 50vh;
    padding-bottom: 20px;
}

.ghdx-card {
    background: rgba(0,0,0,0.8);
    border: 1px solid #444;
    border-radius: 5px;
    padding: 10px 5px;
    text-align: center;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 80px;
}

.ghdx-card.state-0 {
    opacity: 0.5;
    cursor: not-allowed;
}
.ghdx-card.state-1 {
    border-color: #777;
}
.ghdx-card.state-1 .ghdx-name {
    color: #AAA;
}
.ghdx-card.state-2 {
    border-color: #9932CC;
    box-shadow: inset 0 0 5px #9932CC;
}

.ghdx-id {
    font-size: 10px;
    color: #666;
    margin-bottom: 5px;
}

.ghdx-name {
    font-size: 11px;
    font-weight: bold;
    color: #333; /* For state 0 */
}

.ghdx-type-hint {
    font-size: 9px;
    color: #666;
    margin-top: 5px;
}

.ghdx-icon {
    font-size: 24px;
    margin: 5px 0;
}
`;
    fs.writeFileSync('www/css/style.css', css, 'utf8');
}

console.log('UI Scripts and HTML/CSS injected successfully.');
