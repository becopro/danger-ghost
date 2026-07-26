window.NetworkState = {
    socket: null,
    connected: false,
    playerId: null,
    otherPlayers: {},
    playerNames: {},
    serverTick: 0,
    authTimeout: null
};

window.ConnectToServer = function() {
    console.log("[Network] Connecting to simplified server...");
    
    // Clear any existing connection
    if (window.NetworkState.socket) {
        window.NetworkState.socket.disconnect();
    }

    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname === '' || window.location.protocol === 'file:';
    const BACKEND_URL = isLocal ? `http://${hostname || 'localhost'}:3000` : "https://danger-ghost.onrender.com";
    const socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'], // Fallback for unstable 4G/5G
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000
    });
    window.NetworkState.socket = socket;

    socket.on('connect', () => {
        console.log("[Network] Socket connected:", socket.id);
        window.NetworkState.connected = true;
        
        const playerName = localStorage.getItem('playerName') || 'Ghost';
        socket.emit('join_game', { playerName: playerName });
        
        var btn = document.getElementById("btnNavLogin");
        if (btn) btn.innerText = "ONLINE";
        
        var authOverlay = document.getElementById("authOverlay");
        if (authOverlay) authOverlay.style.display = "none";
        
        var gameArea = document.getElementById("fullscreenGameArea");
        if (gameArea) gameArea.style.display = "block";
    });

    socket.on('auth_success', (data) => {
        console.log("[Network] Auth success:", data.id);
        window.NetworkState.playerId = data.id;
    });

    socket.on('sync_state', (data) => {
        window.NetworkState.serverTick = data.tick;
        if (data.players) {
            for (let pid in data.players) {
                if (pid !== window.NetworkState.playerId) {
                    let p = data.players[pid];
                    if (!window.NetworkState.otherPlayers[pid]) {
                        window.NetworkState.otherPlayers[pid] = {
                            x: p.x, y: p.y, targetX: p.x, targetY: p.y,
                            isFacingRight: p.isFacingRight, level: p.level, name: window.NetworkState.playerNames[pid] || 'Ghost'
                        };
                    } else {
                        let op = window.NetworkState.otherPlayers[pid];
                        op.targetX = p.x;
                        op.targetY = p.y;
                        op.isFacingRight = p.isFacingRight;
                        op.level = p.level;
                    }
                }
            }
        }
    });

    socket.on('player_joined', (data) => {
        if (data && data.id) {
            window.NetworkState.playerNames[data.id] = data.name || 'Ghost';
        }
    });

    socket.on('player_left', (id) => {
        delete window.NetworkState.otherPlayers[id];
        delete window.NetworkState.playerNames[id];
    });

    socket.on('disconnect', (reason) => {
        console.log("[Network] Disconnected:", reason);
        window.NetworkState.connected = false;
        var btn = document.getElementById("btnNavLogin");
        if (btn) btn.innerText = "RECONNECTING...";
        
        // Manual reconnect fallback for severe drops
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });
}

window.emitPlayerMove = function(x, y, isFacingRight, state, level) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        var currentLevel = level || (typeof g_currentLevel !== 'undefined' ? g_currentLevel : 'level 1');
        var hp = typeof DeSoGhost !== 'undefined' ? DeSoGhost.lives : 100;
        window.NetworkState.socket.emit('player_move', { x, y, isFacingRight, state, level: currentLevel, hp: hp });
    }
};
var g_lastEmitState = null;
var g_lastEmitTime = 0;
setInterval(function() {
    if (window.NetworkState && window.NetworkState.connected && typeof DeSoGhost !== 'undefined') {
        var now = Date.now();
        var currentLevel = typeof g_currentLevel !== 'undefined' ? g_currentLevel : 'level 1';
        var x = Math.round(DeSoGhost.xPos);
        var y = Math.round(DeSoGhost.yPos);
        var faceRight = (DeSoGhost.face == 1);
        var hp = typeof DeSoGhost !== 'undefined' ? DeSoGhost.lives : 100;
        var stateStr = x + "_" + y + "_" + faceRight + "_" + currentLevel + "_" + hp;
        
        if (stateStr !== g_lastEmitState || (now - g_lastEmitTime > 2000)) {
            g_lastEmitState = stateStr;
            g_lastEmitTime = now;
            window.emitPlayerMove(x, y, faceRight, 'idle', currentLevel);
        }
    }
}, 100);

document.addEventListener("DOMContentLoaded", function() {
    window.ConnectToServer();
});
