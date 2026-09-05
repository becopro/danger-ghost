window.NetworkState = {
    socket: null,
    connected: false,
    playerId: null,
    otherPlayers: {},
    playerNames: {},
    serverTick: 0,
    authTimeout: null
};

// Calcula a URL do backend (site + apps webview) — usada aqui pro socket.io e
// também reusada por js/web2/profile.js (fetch do upload de imagem de perfil),
// pra nunca ter duas fontes de verdade sobre qual host é o servidor do jogo
// (achado 29/08/2026, ao trocar o upload de imagem de Supabase Storage direto do
// navegador pra um endpoint deste mesmo backend).
function GetBackendUrl() {
    const hostname = window.location.hostname;
    const isApp = typeof Capacitor !== 'undefined' || window.cordova || window.location.protocol === 'file:' || window.location.protocol === 'capacitor:';
    if (isApp) {
        return 'https://ghostgames.club';
    }
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname === '';
    return isLocal ? `http://${hostname || 'localhost'}:3000` : window.location.origin;
}
window.GetBackendUrl = GetBackendUrl;

window.ConnectToServer = function() {
    console.log("[Network] Connecting to simplified server...");

    // Clear any existing connection
    if (window.NetworkState.socket) {
        window.NetworkState.socket.disconnect();
        window.NetworkState.otherPlayers = {};
        window.NetworkState.playerNames = {};
    }

    const BACKEND_URL = GetBackendUrl();
    const socket = io(BACKEND_URL, {
        transports: ['websocket'],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    });
    window.NetworkState.socket = socket;

    socket.on('connect', () => {
        console.log("[Network] Socket connected:", socket.id);
        window.NetworkState.connected = true;

        var baseName = (localStorage.getItem('playerName') || 'Ghost').replace(/\s*\(#\w+\)\s*$/, '').trim();
        var ghostId = window.g_currentPlayerGhost;
        var nameToSend = ghostId ? (baseName + ' (#' + ghostId + ')') : baseName;
        socket.emit('join_game', { playerName: nameToSend });

        // Overworld (02/09/2026): join_game recria players[socket.id] do zero no
        // servidor (novo socket.id numa reconexão, ver comentário em server/index.js
        // sobre o reset defensivo). Sem isto, um jogador que reconecta PARADO no
        // overworld (tile igual ao de antes da queda) nunca reemite overworld_move
        // -- o loop de emissão abaixo só manda quando o tile muda -- e ficava
        // invisível pros outros até se mexer de novo. Zera a chave de dedup pra
        // forçar um overworld_move novo no próximo tick do poll, se ainda ativo.
        g_lastOverworldEmitKey = null;
        
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
        if (data.totalOnline !== undefined) {
            window.NetworkState.totalOnlineCount = data.totalOnline;
        }
        if (data.players) {
            for (let pid in data.players) {
                if (pid !== window.NetworkState.playerId) {
                    window.NetworkState.otherPlayers[pid] = data.players[pid];
                }
            }
            // Remove players no longer on server
            for (let localId in window.NetworkState.otherPlayers) {
                if (localId !== window.NetworkState.playerId && !data.players[localId]) {
                    delete window.NetworkState.otherPlayers[localId];
                    delete window.NetworkState.playerNames[localId];
                }
            }
        }
    });

    // Achado numa auditoria forense pedida pelo usuário (23/08/2026): o servidor sempre emitiu
    // save_error quando um save falhava de verdade (query malformada, etc.), mas nenhum lugar do
    // cliente escutava esse evento — o jogador nunca ficava sabendo que um save específico não
    // chegou no banco (nem o console mostrava nada). Não é uma mentira ("salvou!" falso), é
    // silêncio total. Registrado no console pra qualquer investigação futura (e visível ao
    // usuário) ter o dado; não usa alert() porque a maioria dos saves é automática em segundo
    // plano (subir de nível, capturar fantasma) e um alert bloqueante a cada falha isolada seria
    // mais disruptivo que o próprio problema.
    socket.on('save_error', (data) => {
        console.error('[Save] Falhou salvar no banco:', (data && data.message) || 'erro desconhecido');
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

    // Overworld isométrico (02/09/2026) — recebe o broadcast periódico do servidor
    // (server/index.js, setInterval a OVERWORLD_TICK_RATE) e preenche
    // window.OverworldOtherPlayers, o único ponto de contrato que js/game/overworld.js
    // já lê (render() -> "var others = window.OverworldOtherPlayers"). Faltava esta
    // ponta no cliente: o servidor emitia e o renderer já sabia ler, mas nada
    // conectava os dois — achado revisando o contrato de verdade nos dois lados, não
    // confiando nos relatos de cada agente. Filtra o próprio jogador pelo e-mail
    // (GetCurrentPlayerEmail(), js/web2/profile.js) porque o payload do servidor não
    // inclui socket id, só email/name/avatarUrl/gridX/gridY.
    socket.on('overworld_players_update', (data) => {
        var selfEmail = (typeof GetCurrentPlayerEmail === 'function') ? GetCurrentPlayerEmail() : null;
        var list = (data && Array.isArray(data.players)) ? data.players : [];
        window.OverworldOtherPlayers = selfEmail ? list.filter(function (p) { return p && p.email !== selfEmail; }) : list;
    });

    socket.on('disconnect', () => {
        console.log("[Network] Disconnected");
        window.NetworkState.connected = false;
        var btn = document.getElementById("btnNavLogin");
        if (btn) btn.innerText = "RECONNECTING...";
    });
}

window.normalizeLevelName = function(lvl) {
    if (!lvl) return '1';
    var s = String(lvl).toLowerCase();
    if (s === '1' || s === 'fase 1' || s === 'level 1') return '1';
    if (s === '2' || s === 'fase 2' || s === 'level 2' || s === 'cave1' || s === 'cave 1') return '2';
    if (s === '3' || s === 'fase 3' || s === 'level 3' || s === 'cave2' || s === 'cave 2') return '3';
    if (s === '4' || s === 'fase 4' || s === 'level 4' || s === 'cave3' || s === 'cave 3') return '4';
    
    var match = s.match(/\d+/);
    if (match) {
        return match[0];
    }
    return '1';
};

window.emitPlayerMove = function(x, y, isFacingRight, state, level) {
    if (window.NetworkState.socket && window.NetworkState.connected) {
        var currentLevel = level || (typeof g_currentLevel !== 'undefined' ? g_currentLevel : 'level 1');
        var hp = typeof DeSoGhost !== 'undefined' ? DeSoGhost.lives : 100;
        var ghostLvl = (window.GhostRPG && window.GhostRPG.getStats) ? (window.GhostRPG.getStats().level || 1) : 1;
        window.NetworkState.socket.emit('player_move', { x, y, isFacingRight, state, level: window.normalizeLevelName(currentLevel), hp: hp, ghostLevel: ghostLvl });
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
        var ghostLvl = (window.GhostRPG && window.GhostRPG.getStats) ? (window.GhostRPG.getStats().level || 1) : 1;
        var stateStr = x + "_" + y + "_" + faceRight + "_" + currentLevel + "_" + hp + "_" + ghostLvl;
        
        if (stateStr !== g_lastEmitState || (now - g_lastEmitTime > 2000)) {
            g_lastEmitState = stateStr;
            g_lastEmitTime = now;
            window.emitPlayerMove(x, y, faceRight, 'idle', currentLevel);
        }
    }
}, 100);

// Overworld isométrico (02/09/2026) — metade que faltava do lado do emissor: envia
// overworld_move só quando o tile realmente muda (mesmo espírito de dedup do loop de
// emitPlayerMove acima, "só manda se mudou"), e overworld_leave exatamente na
// transição isActive true->false (Deactivate/EnterEpisode1FromOverworld em
// js/game/engine.js), sem exigir que overworld.js saiba nada de socket.io — ele só
// expõe window.OverworldState (contrato já existente), este loop é que observa.
// 150ms casa com o próprio stepIntervalMs de movimento em tiles do overworld.js —
// não precisa ser mais rápido, o jogador nunca anda mais que 1 tile nesse intervalo.
var g_lastOverworldActive = false;
var g_lastOverworldEmitKey = null;
setInterval(function() {
    if (!window.NetworkState || !window.NetworkState.connected || !window.NetworkState.socket) return;
    var ow = window.OverworldState;
    if (!ow) return;
    if (ow.isActive) {
        var key = ow.playerGridX + '_' + ow.playerGridY;
        if (key !== g_lastOverworldEmitKey) {
            g_lastOverworldEmitKey = key;
            // facingRight (05/09/2026, achado #2 BAIXO): overworld_move nunca carregou direção —
            // só posição — então outros jogadores nunca viravam de lado na tela de quem olha
            // (overworld.js, drawGhostBillboard() sempre recebia `undefined` pro call site de
            // outro jogador). window.OverworldState.facingRight (ver overworld.js,
            // syncPublicState()) já muda exatamente nos mesmos instantes que playerGridX/Y (os
            // dois são escritos juntos em commitLogicalStepIfChanged()/syncPublicState()), então
            // reusar a MESMA dedup key (gridX_gridY) acima continua correto — não existe um
            // cenário onde a direção muda sem o grid também mudar nesse mesmo instante.
            window.NetworkState.socket.emit('overworld_move', { gridX: ow.playerGridX, gridY: ow.playerGridY, facingRight: ow.facingRight });
        }
    } else if (g_lastOverworldActive) {
        window.NetworkState.socket.emit('overworld_leave');
        g_lastOverworldEmitKey = null;
    }
    g_lastOverworldActive = ow.isActive;
}, 150);

document.addEventListener("DOMContentLoaded", function() {
    window.ConnectToServer();
});
