// js/game/network.js

window.NetworkState = {
    socket: null,
    connected: false,
    playerId: null,
    otherPlayers: {},
    playerNames: {},
    serverEntities: [],
    serverTick: 0,
    frameBuffer: []
};

function initNetwork() {
    if (typeof io === 'undefined') {
        console.warn("[Network] Socket.io not loaded");
        return;
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const BACKEND_URL = isLocal ? "http://localhost:3000" : "https://danger-ghost.onrender.com";
    const socket = io(BACKEND_URL);
    window.NetworkState.socket = socket;

    socket.on('connect', () => {
        console.log("[Network] Connected to Server");
        window.NetworkState.connected = true;
    });

    socket.on('connect_error', (err) => {
        console.warn("[Network] Connection Error (backend may be sleeping):", err.message);
        var btn = document.getElementById("btnNavLogin");
        if (btn && btn.innerText === "CONNECTING...") {
            btn.innerText = "🔑 LOGIN";
            btn.disabled = false;
            alert("Backend offline ou acordando. Tente novamente em alguns segundos.");
        }
    });

    window.JoinGameServer = function(token) {
        const playerName = localStorage.getItem('playerName') || 'Ghost';
        
        if (!window.NetworkState.connected) {
            console.log("[Network] Socket not connected yet, emitting join_game will be queued.");
            var btn = document.getElementById("btnNavLogin");
            if (btn) btn.innerText = "CONNECTING (WAKING UP SERVER)...";
        }
        
        socket.emit('join_game', { playerName: playerName, token: token });
        
        // Timeout to release the button if no auth_success or auth_failed is received
        window.NetworkState.authTimeout = setTimeout(() => {
            var btn = document.getElementById("btnNavLogin");
            if (btn && (btn.innerText === "CONNECTING..." || btn.innerText === "CONNECTING (WAKING UP SERVER)...")) {
                btn.innerText = "🔑 LOGIN";
                btn.disabled = false;
                alert("Tempo limite esgotado ao tentar logar. O servidor pode estar dormindo (Render). Tente novamente.");
            }
        }, 15000);
    };

    socket.on('auth_success', (data) => {
        if (window.NetworkState.authTimeout) clearTimeout(window.NetworkState.authTimeout);
        console.log("[Network] Auth Success! Game State:", data.gameState);
        if (window.GhostRPG && window.GhostRPG.loadServerState) {
            window.GhostRPG.loadServerState(data.gameState);
        }
        
        var btn = document.getElementById("desoBtn");
        if (btn) {
            btn.innerText = "LOGGED IN";
            btn.disabled = false;
        }
        
        var authOverlay = document.getElementById("authOverlay");
        if (authOverlay) authOverlay.style.display = "none";
        
        var gameArea = document.getElementById("fullscreenGameArea");
        if (gameArea) gameArea.style.display = "block";
        
        var loginBtn = document.getElementById("btnNavLogin");
        if (loginBtn) loginBtn.style.display = "none";
        
        // Emulate starting the game flow like LoadRPGStateFromDeSo did
        if (typeof StartGame === "function") {
            // Se necessário pode iniciar aqui, mas no design original o jogo já começa
            // Mas caso a lógica exija:
        }
    });

    socket.on('auth_failed', (data) => {
        if (window.NetworkState.authTimeout) clearTimeout(window.NetworkState.authTimeout);
        console.error("[Network] Auth Failed:", data.message);
        alert("Login failed: " + data.message);
        var btn = document.getElementById("btnNavLogin");
        if (btn) {
            btn.innerText = "🔑 LOGIN";
            btn.disabled = false;
        }
    });

    socket.on('room_roster', (roster) => {
        window.NetworkState.playerNames = {};
        if (Array.isArray(roster)) {
            roster.forEach(p => {
                window.NetworkState.playerNames[p.id] = p.name || 'Ghost';
                if (p.id !== window.NetworkState.playerId) {
                    window.NetworkState.otherPlayers[p.id] = p.position || { x: 100, y: 100, level: 'level 1' };
                }
            });
        }
    });

    socket.on('player_joined', (data) => {
        if (data && data.id) {
            window.NetworkState.playerNames[data.id] = data.playerName || data.name || 'Ghost';
            window.NetworkState.otherPlayers[data.id] = data.position || { x: 100, y: 100, level: 'level 1' };
        }
    });

    socket.on('init_player', (state) => {
        console.log("[Network] Player initialized", state);
        window.NetworkState.playerId = socket.id;
    });

    socket.on('player_moved', (data) => {
        if (data.id !== window.NetworkState.playerId) {
            window.NetworkState.otherPlayers[data.id] = data.position;
        }
    });

    socket.on('player_left', (id) => {
        delete window.NetworkState.otherPlayers[id];
        delete window.NetworkState.playerNames[id];
    });

    socket.on('sync_state', (data) => {
        window.NetworkState.serverTick = data.tick;
        window.NetworkState.serverEntities = data.entities;
        
        // Update fallback for non-interpolated rendering
        if (data.players) {
            for (let pid in data.players) {
                if (pid !== window.NetworkState.playerId) {
                    window.NetworkState.otherPlayers[pid] = data.players[pid].position;
                }
            }
        }
        
        data.timestamp = Date.now();
        window.NetworkState.frameBuffer.push(data);
        if (window.NetworkState.frameBuffer.length > 10) {
            window.NetworkState.frameBuffer.shift();
        }
    });

    socket.on('attack_effect', (data) => {
        // We will define a global function to handle this visually in engine.js
        if (window.SpawnNetworkVisualEffect) {
            window.SpawnNetworkVisualEffect(data);
        }
    });

    socket.on('update_hp', (hp) => {
        if (typeof window.g_lives !== 'undefined') {
            window.g_lives = hp;
        }
    });

    socket.on('player_died', () => {
        if (typeof window.SetGameState === 'function') {
            window.SetGameState(3); // G_GAMEOVER
        }
    });

    socket.on('update_stats', (stats) => {
        if (typeof window.g_score !== 'undefined') {
            window.g_score = stats.score;
        }
        if (window.GhostRPG && window.GhostRPG.stats) {
            window.GhostRPG.stats.xp = stats.xp;
            window.GhostRPG.stats.level = stats.level;
        }
    });

    socket.on('loot_dropped', (drops) => {
        console.log("[Network] Loot dropped", drops);
        if (window.SpawnNetworkLoot) {
            window.SpawnNetworkLoot(drops);
        }
    });

    socket.on('disconnect', () => {
        console.log("[Network] Disconnected");
        window.NetworkState.connected = false;
        
        // Show auth overlay if disconnected
        var authOverlay = document.getElementById("authOverlay");
        if (authOverlay) authOverlay.style.display = "flex";
        var gameArea = document.getElementById("fullscreenGameArea");
        if (gameArea) gameArea.style.display = "none";
        
        var btn = document.getElementById("desoBtn");
        if (btn) {
            btn.innerText = "ENTRAR COM GOOGLE";
            btn.disabled = false;
        }
    });

    socket.on('player_profile_data', (data) => {
        const modal = document.getElementById('playerProfileModal');
        if (modal) {
            document.getElementById('profileModalName').innerText = data.name;
            document.getElementById('profileModalLevel').innerText = data.level;
            document.getElementById('profileModalXP').innerText = data.xp;
            
            const hours = Math.floor(data.playtimeMinutes / 60);
            const mins = data.playtimeMinutes % 60;
            document.getElementById('profileModalPlaytime').innerText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            
            document.getElementById('profileModalVit').innerText = data.stats.vit;
            document.getElementById('profileModalAgi').innerText = data.stats.agi;
            document.getElementById('profileModalInt').innerText = data.stats.int;
            document.getElementById('profileModalPow').innerText = data.stats.pow;
            
            modal.style.display = 'flex';
        }
    });

    socket.on('player_profile_error', (data) => {
        alert("Erro ao buscar perfil: " + data.message);
    });
}

window.OpenPlayerProfile = function(playerName) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        window.NetworkState.socket.emit('get_player_profile', playerName);
    } else {
        alert("Você precisa estar online para inspecionar perfis.");
    }
};

window.emitPlayerMove = function(x, y, isFacingRight, state, level) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        var currentLevel = level || (typeof g_currentLevel !== 'undefined' ? g_currentLevel : 'level 1');
        window.NetworkState.socket.emit('player_move', { x, y, isFacingRight, state, level: currentLevel });
    }
};

window.emitPlayerAttack = function(attackData) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        window.NetworkState.socket.emit('player_attack', attackData);
    }
};

window.emitBossCollision = function() {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        window.NetworkState.socket.emit('boss_collision');
    }
};

window.emitKillBoss = function(bossId) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        window.NetworkState.socket.emit('kill_boss', { bossId });
    }
};

// Fallback interval logic incase the engine doesn't emit often enough
setInterval(function() {
    if (window.NetworkState && window.NetworkState.connected && typeof DeSoGhost !== 'undefined') {
        var currentLevel = typeof g_currentLevel !== 'undefined' ? g_currentLevel : 'level 1';
        var state = {
            id: window.NetworkState.playerId,
            x: Math.round(DeSoGhost.xPos),
            y: Math.round(DeSoGhost.yPos),
            isFacingRight: (DeSoGhost.face == 1),
            level: currentLevel
        };
        // Only send if moved
        var last = window.NetworkState.lastSentState;
        if (!last || last.x !== state.x || last.y !== state.y || last.isFacingRight !== state.isFacingRight || last.level !== state.level) {
            window.NetworkState.socket.emit('player_move', state);
            window.NetworkState.lastSentState = state;
        }
    }
}, 33);

document.addEventListener("DOMContentLoaded", function() {
    initNetwork();
});
