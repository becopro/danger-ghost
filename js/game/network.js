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
        
        const playerName = localStorage.getItem('playerName') || 'Ghost';
        socket.emit('join_game', { playerName: playerName });
    });

    socket.on('room_roster', (roster) => {
        window.NetworkState.playerNames = {};
        if (Array.isArray(roster)) {
            roster.forEach(p => {
                window.NetworkState.playerNames[p.id] = p.name || 'Ghost';
            });
        }
    });

    socket.on('player_joined', (data) => {
        if (data && data.id) {
            window.NetworkState.playerNames[data.id] = data.playerName || data.name || 'Ghost';
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
        if (window.NetworkState.frameBuffer.length > 3) {
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
    });
}

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
            window.NetworkState.socket.emit('player_moved', state);
            window.NetworkState.lastSentState = state;
        }
    }
}, 33);

document.addEventListener("DOMContentLoaded", function() {
    initNetwork();
});
