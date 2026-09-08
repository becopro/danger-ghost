window.NetworkState = {
    socket: null,
    connected: false,
    playerId: null,
    otherPlayers: {},
    playerNames: {},
    serverTick: 0,
    authTimeout: null
};

// 05/09/2026 (paridade com danger ghost/js/game/network.js — auditoria forense de multiplayer,
// achado que também se aplica aqui: qualquer reconexão de socket, muito mais comum no app mobile
// por causa de troca de rede/fundo do app, recriava players[socket.id] no servidor sem e-mail,
// quebrando save_game_state/update_profile/amigos/diário em silêncio até um login manual novo.
// Ver comentário completo dentro de socket.on('connect') abaixo). false por carregamento de
// página/abertura do app (nunca persiste de propósito).
var g_hasConnectedOnceThisPageLoad = false;

// Mesma ideia do site (js/game/network.js): host único do backend, reusado pelo
// socket.io e pelo upload de imagem de perfil via fetch() em js/web2/profile.js.
// Sem detecção local/prod aqui — o app mobile sempre fala com produção; pra testar
// contra um servidor local, troque esta constante temporariamente e reverta antes
// de commitar (ver skill crossplatform-deploy).
function GetBackendUrl() {
    return "https://ghostgames.club";
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
        var nameToSend = window.g_currentPlayerGhost ? (baseName + ' (#' + window.g_currentPlayerGhost + ')') : baseName;
        socket.emit('join_game', { playerName: nameToSend });

        // Overworld (08/09/2026, paridade com danger ghost/js/game/network.js linha ~70,
        // achado de auditoria forense de 05/09/2026 no site): join_game recria
        // players[socket.id] do zero no servidor a cada conexão/reconexão (novo socket.id).
        // Sem isto, um jogador que reconecta PARADO no mesmo tile do overworld (WiFi/dados
        // móveis trocando, app voltando de segundo plano — bem mais comum aqui que no site,
        // ver comentário grande abaixo) nunca reemite overworld_move — o loop de emissão
        // (mais abaixo neste arquivo) só manda quando o tile muda — e fica invisível pros
        // outros jogadores até se mexer de novo. Zera a chave de dedup pra forçar um
        // overworld_move novo no próximo tick do poll, se o overworld ainda estiver ativo.
        g_lastOverworldEmitKey = null;

        // 05/09/2026 (paridade com danger ghost/js/game/network.js — auditoria forense de
        // multiplayer, mesmo achado, aplicado aqui porque o app mobile é ainda MAIS sujeito a
        // reconexão que o site: trocar WiFi/dados móveis, o SO suspender o app em segundo plano,
        // um túnel de rede instável, tudo isso dispara reconnection:true (linha ~35) sem nunca
        // recarregar a "página" (o WebView do app não recarrega sozinho). join_game acima recria
        // players[socket.id] do zero no servidor (novo socket.id a cada reconexão) SEM e-mail —
        // g_hasAuthenticatedThisPageLoad (memória da sessão do app) continua true de antes, e
        // GetCurrentPlayerEmail() continua lendo o e-mail certo do localStorage, então o app
        // segue parecendo logado enquanto save_game_state/update_profile/diário/amigos (todos
        // gated em playerSession.email, ver server/index.js) passam a ser rejeitados em silêncio
        // pra sempre nesta conexão — sem nenhum aviso, o jogador podia jogar a sessão inteira
        // pós-reconexão sem NADA sendo salvo de verdade. Mesmo fix do site: se esta sessão do
        // app já tinha completado um login de verdade (g_hasAuthenticatedThisPageLoad) e isto
        // não é a primeira vez que 'connect' dispara, re-autentica o socket novo sozinho via
        // TryAutoLoginFromSession() (mesmo dg_session_token já salvo). Não reintroduz auto-login
        // na abertura do app (g_hasAuthenticatedThisPageLoad começa false sempre, então a
        // primeira conexão nunca cai aqui) — só resincroniza uma sessão que o jogador já tinha
        // autenticado de verdade nesta mesma execução do app. Se o token não for mais válido,
        // volta honestamente pro estado "não logado" (reexibe os botões de login) em vez de
        // continuar fingindo estar logado.
        if (g_hasConnectedOnceThisPageLoad && window.g_hasAuthenticatedThisPageLoad) {
            console.log('[Network] Reconexão detectada com sessão já autenticada — re-sincronizando login com o servidor...');
            if (typeof TryAutoLoginFromSession === 'function') {
                TryAutoLoginFromSession(function (loggedIn) {
                    if (!loggedIn) {
                        console.warn('[Network] Falha ao re-sincronizar sessão após reconexão — token de sessão inválido/expirado. Voltando ao estado "não logado".');
                        window.g_hasAuthenticatedThisPageLoad = false;
                        if (typeof UpdateLoginButtonsVisibility === 'function') UpdateLoginButtonsVisibility();
                    } else {
                        console.log('[Network] Sessão re-sincronizada com sucesso após reconexão.');
                        // Overworld (08/09/2026, paridade com o site, linha ~134): o loop de
                        // overworld_move (150ms, mais abaixo) já zerou g_lastOverworldEmitKey
                        // no 'connect' acima e pode disparar um overworld_move ANTES desta
                        // re-sincronização de sessão terminar (round-trip assíncrono) — esse
                        // envio prematuro chega sem e-mail de sessão, é rejeitado em silêncio
                        // pelo servidor, e como o dedup é por posição (não por sucesso de
                        // envio), a chave já ficaria marcada com aquele grid — o jogador
                        // continuaria invisível até se MEXER de novo. Zera de novo aqui, DEPOIS
                        // da confirmação real de sessão, pra garantir pelo menos um
                        // overworld_move válido no próximo tick do loop.
                        g_lastOverworldEmitKey = null;
                    }
                });
            }
        }
        g_hasConnectedOnceThisPageLoad = true;

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

    // Achado numa auditoria forense pedida pelo usuário (23/08/2026, mesmo fix do site): o
    // servidor sempre emitiu save_error quando um save falhava de verdade, mas nenhum lugar do
    // cliente escutava esse evento — silêncio total, sem alert() bloqueante porque a maioria dos
    // saves é automática em segundo plano.
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

    // Overworld isométrico (08/09/2026, Estágio 4 — paridade verbatim com
    // danger ghost/js/game/network.js linha ~209): recebe o broadcast periódico do
    // servidor (server/index.js, setInterval a OVERWORLD_TICK_RATE) e preenche
    // window.OverworldOtherPlayers, o único ponto de contrato que js/game/overworld.js
    // (já portado verbatim no Estágio 1) lê pra desenhar outros jogadores (render() ->
    // "var others = window.OverworldOtherPlayers"). Filtra o próprio jogador pelo e-mail
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

// Overworld isométrico (08/09/2026, Estágio 4 — paridade verbatim com
// danger ghost/js/game/network.js linha ~276-301): metade que faltava do lado do
// emissor: envia overworld_move só quando o tile realmente muda (dedup por
// "gridX_gridY", mesmo espírito do loop de emitPlayerMove acima), e overworld_leave
// exatamente na transição isActive true->false (Deactivate/EnterEpisode1FromOverworld
// em js/game/engine.js — já portado no Estágio 2), sem exigir que overworld.js saiba
// nada de socket.io — ele só expõe window.OverworldState (contrato já existente),
// este loop é que observa. 150ms casa com o próprio stepIntervalMs de movimento em
// tiles do overworld.js (já portado verbatim no Estágio 1) — não precisa ser mais
// rápido, o jogador nunca anda mais que 1 tile nesse intervalo.
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
