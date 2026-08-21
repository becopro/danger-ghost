// web2/auth.js

// Google Auth Callback
function handleGoogleLogin(response) {
    console.log("[Auth] Google Token Received!");

    // Mostra o Modal "Buscando progresso..."
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        loadingModal.style.display = "flex";
    }

    // Envia o token para o backend via socket
    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket || !socket.connected) {
        alert("Erro: Não foi possível conectar ao servidor para validar o login. O servidor pode estar offline (Render suspenso).");
        if (loadingModal) loadingModal.style.display = "none";
        return;
    }

    // Listener amarrado a esta chamada específica (não mais um listener global registrado uma
    // vez no carregamento da página) — mesma correção aplicada em CloudSaveLogin() logo abaixo,
    // ver o comentário lá para o motivo completo. Corrigido em 20/08/2026.
    var finished = false;
    function cleanup() {
        finished = true;
        clearTimeout(timeoutId);
        socket.off("auth_google_success", handleSuccess);
        socket.off("auth_google_error", handleError);
    }
    var timeoutId = setTimeout(function() {
        if (finished) return;
        cleanup();
        if (loadingModal) loadingModal.style.display = "none";
        alert("O servidor demorou demais para responder. Verifique sua internet e tente novamente.");
    }, 15000);
    function handleSuccess(data) {
        if (finished) return;
        cleanup();
        if (!data) return;
        completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData, data.token);
        if (window.g_gameState === 0) window.isCloudLoaded = true;
    }
    function handleError(data) {
        if (finished) return;
        cleanup();
        alert("Erro no Login: " + ((data && data.message) || "Falha ao acessar o Cloud Save."));
        if (loadingModal) loadingModal.style.display = "none";
    }
    socket.on("auth_google_success", handleSuccess);
    socket.on("auth_google_error", handleError);
    socket.emit("auth_google_token", { token: response.credential });
}
window.handleGoogleLogin = handleGoogleLogin;

// O botão "LOGIN" do HTML chama esta função.
// NOTA (20/08/2026): o fluxo do Google (abaixo, ainda no código pra quando um client_id de
// verdade for configurado) fica pulado por enquanto — o client_id em DOMContentLoaded é
// literalmente o texto "SEU_CLIENT_ID_DO_GOOGLE...", nunca preenchido, então esse caminho
// nunca funcionou. Tentar mesmo assim causava o jogador tocar em LOGIN, nada acontecer na
// hora, e a tela de e-mail/senha só aparecer alguns segundos depois (quando o Google falhava
// de forma assíncrona) — parecendo, pra quem estava jogando, que a tela abria sozinha ao
// selecionar um fantasma na Ghostdex. Ir direto pro e-mail/senha evita essa confusão.
function LoginGoogle() {
    OpenLoginModal();
}
window.LoginGoogle = LoginGoogle;

// Existem vários botões de "LOGIN" espalhados pela página (menu principal mobile, navbar
// in-game, etc. — nenhum deles tinha um id em comum). Atualiza todos de uma vez em vez de só
// um, pra nenhum ficar escrito "LOGIN" depois de logar de verdade.
function updateAllLoginButtons(name) {
    var buttons = document.querySelectorAll('[onclick*="LoginGoogle"]');
    buttons.forEach(function(btn) {
        btn.innerText = name || "Ghost";
        btn.onclick = null;
        btn.removeAttribute('onclick');
        btn.style.color = "#00FF00";
        btn.style.borderColor = "#00FF00";
        btn.style.textShadow = "0 0 5px #00FF00";
    });
}

// --- Login por e-mail/senha (Cloud Save) — adicionado 20/08/2026, mesmo padrão do site ---
function completeCloudLogin(email, name, playerData, token) {
    console.log("[CloudSave] Completing login session for:", email, name);
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.style.display = "none";
    var loginModalUI = document.getElementById("loginModalUI");
    if (loginModalUI) loginModalUI.style.display = "none";

    updateAllLoginButtons(name);

    var safeData = playerData || {
        email: email,
        name: name || "Ghost",
        level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 0, 0, 0]
    };

    try {
        localStorage.setItem("dg_cloud_email", email);
        localStorage.setItem("playerName", safeData.name || name || "Ghost");
        localStorage.setItem("dg_cloud_profile", JSON.stringify(safeData));
        // Token de sessão (30/08/2026, mesmo padrão do site): guarda pra próxima vez que o app
        // abrir poder logar sozinho, sem pedir a senha de novo — ver TryAutoLoginFromSession().
        if (token) localStorage.setItem("dg_session_token", token);
    } catch (e) {}

    if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
        try { window.GhostRPG.applyCloudSave(safeData); } catch (e) {}
    } else {
        window.cloudSave = safeData;
    }

    // Sincroniza a lista completa de fantasmas com o banco (20/08/2026, mesmo padrão do site em
    // js/web2/auth.js): o banco manda se já tiver personagens; se estiver vazio mas já existir
    // progresso local (jogou como convidado antes de logar), adota o local e manda pro servidor.
    try {
        var cloudCharacters = Array.isArray(safeData.characters) ? safeData.characters : [];
        if (cloudCharacters.length > 0) {
            localStorage.setItem("dg_local_characters", JSON.stringify(cloudCharacters));
            window.g_ownedCharacters = cloudCharacters;
        } else {
            var rawLocalChars = localStorage.getItem("dg_local_characters");
            var localChars = rawLocalChars ? JSON.parse(rawLocalChars) : [];
            if (localChars.length > 0) {
                var socketForAdopt = window.NetworkState && window.NetworkState.socket;
                if (socketForAdopt && socketForAdopt.connected) {
                    socketForAdopt.emit('save_game_state', {
                        name: safeData.name, level: safeData.level, xp: safeData.xp,
                        mana: safeData.mana, maxMana: safeData.maxMana, lives: safeData.lives,
                        equippedSkills: safeData.equippedSkills, characters: localChars
                    });
                }
            }
        }
    } catch (e) { console.error("[CloudSave] Falha ao reconciliar lista de personagens:", e); }

    // Recarrega a tela de seleção de personagem com a lista atualizada — esse chamada faltava
    // no mobile (só o site tinha, achado ao investigar hoje), então depois de logar no app
    // nada atualizava window.g_ownedCharacters automaticamente até esse fix.
    if (typeof window.LoadRPGStateFromDeSo === 'function') {
        window.LoadRPGStateFromDeSo(null, false);
    }

    if (window.g_gameState === 0) {
        window.isCloudLoaded = true;
    }
}
window.completeCloudLogin = completeCloudLogin;

function OpenLoginModal() {
    // Antes de mostrar o formulário, tenta o token de sessão salvo (se ainda for válido, o
    // jogador já está logado e resgata o save sem digitar senha de novo; se não, cai pro
    // formulário normal). Continua sendo o toque no botão LOGIN que dispara isso.
    if (typeof TryAutoLoginFromSession === 'function') {
        TryAutoLoginFromSession(function(loggedIn) {
            if (!loggedIn) showLoginForm();
        });
    } else {
        showLoginForm();
    }
}
window.OpenLoginModal = OpenLoginModal;

function showLoginForm() {
    var modal = document.getElementById('loginModalUI');
    if (modal) {
        modal.style.display = 'flex';
    }
    var emailInput = document.getElementById('loginInputEmail');
    var nameInput = document.getElementById('loginInputName');
    var savedEmail = localStorage.getItem('dg_cloud_email');
    var savedName = localStorage.getItem('playerName');
    if (emailInput && savedEmail) emailInput.value = savedEmail;
    if (nameInput && savedName) nameInput.value = savedName;
}

function CloseLoginModal() {
    var modal = document.getElementById('loginModalUI');
    if (modal) modal.style.display = 'none';
}
window.CloseLoginModal = CloseLoginModal;

// Base compartilhada por LOGIN e CRIAR CONTA (30/08/2026, mesmo padrão do site: separados por
// pedido explícito do usuário — cada e-mail só pode ter uma conta; login recupera uma conta
// existente, criar conta cadastra uma nova). Listeners amarrados a ESTA chamada específica, com
// timeout de 15s — ver histórico do bug de spinner travado no commit de 20/08/2026.
function submitCloudSaveAuth(eventName, payload, loadingText) {
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        var h2 = loadingModal.querySelector("h2");
        if (h2) h2.innerText = loadingText;
        loadingModal.style.display = "flex";
    }

    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket) {
        alert("Erro: Não foi possível conectar ao servidor.");
        if (loadingModal) loadingModal.style.display = "none";
        return;
    }

    var finished = false;
    function cleanup() {
        finished = true;
        clearTimeout(timeoutId);
        socket.off("cloud_save_success", handleSuccess);
        socket.off("cloud_save_error", handleError);
    }
    var timeoutId = setTimeout(function() {
        if (finished) return;
        cleanup();
        if (loadingModal) loadingModal.style.display = "none";
        alert("O servidor demorou demais para responder. Verifique sua internet e tente novamente.");
    }, 15000);
    function handleSuccess(data) {
        if (finished) return;
        cleanup();
        console.log("[CloudSave] Sucesso! Carregando perfil para:", data && data.email);
        if (!data) return;
        completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData, data.token);
        if (window.g_gameState === 0) window.isCloudLoaded = true;
    }
    function handleError(data) {
        if (finished) return;
        cleanup();
        console.warn("[CloudSave] Erro recebido do servidor:", data && data.message);
        alert((data && data.message) || "Falha ao acessar o Cloud Save.");
        if (loadingModal) loadingModal.style.display = "none";
    }
    socket.on("cloud_save_success", handleSuccess);
    socket.on("cloud_save_error", handleError);
    socket.emit(eventName, payload);
}

function CloudSaveLogin() {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        alert("Por favor, digite o e-mail da sua conta.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        alert("A senha deve ter entre 6 e 12 caracteres.");
        return;
    }

    submitCloudSaveAuth("cloud_save_login", { email: email, password: password }, "Verificando senha e resgatando progresso...");
}
window.CloudSaveLogin = CloudSaveLogin;
window.LoginDeveloperFallback = CloudSaveLogin;

function CloudSaveSignup() {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var name = document.getElementById('loginInputName') ? document.getElementById('loginInputName').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        alert("Por favor, digite um e-mail para a sua conta nova.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        alert("A senha deve ter entre 6 e 12 caracteres para proteger o seu Cloud Save.");
        return;
    }

    submitCloudSaveAuth("cloud_save_signup", { email: email, name: name || 'Ghost', password: password }, "Criando sua conta...");
}
window.CloudSaveSignup = CloudSaveSignup;

window.addEventListener('DOMContentLoaded', () => {
    // Inicializa a biblioteca do Google assim que a página carregar
    // Substitua "SEU_CLIENT_ID_DO_GOOGLE" pelo seu Client ID real depois
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "SEU_CLIENT_ID_DO_GOOGLE.apps.googleusercontent.com",
            callback: handleGoogleLogin,
            cancel_on_tap_outside: false
        });
    }
});

// Login por token de sessão (30/08/2026; ajustado no mesmo dia por pedido explícito do usuário,
// mesmo padrão do site: SEM disparar sozinho no carregamento da página). Só roda quando alguém
// chama de propósito: OpenLoginModal() (botão LOGIN) e o SPACE da tela inicial
// (www/js/game/engine.js) chamam isso antes de decidir se mostram o formulário de e-mail/senha
// ou se já entram direto. onDone(true|false) avisa quem chamou se conseguiu logar ou não.
function TryAutoLoginFromSession(onDone) {
    var token = null;
    try { token = localStorage.getItem("dg_session_token"); } catch (e) {}
    if (!token) { if (onDone) onDone(false); return; }

    var attempts = 0;
    function waitForSocket() {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            attemptLogin(socket);
            return;
        }
        attempts++;
        if (attempts > 15) { if (onDone) onDone(false); return; } // ~3s tentando; desiste
        setTimeout(waitForSocket, 200);
    }

    function attemptLogin(socket) {
        var finished = false;
        var timeoutId = setTimeout(function() {
            if (finished) return;
            finished = true;
            cleanup();
            if (onDone) onDone(false);
        }, 8000);

        function cleanup() {
            clearTimeout(timeoutId);
            socket.off("session_login_success", onSuccess);
            socket.off("session_login_error", onError);
        }
        function onSuccess(data) {
            if (finished) return;
            finished = true;
            cleanup();
            if (!data) { if (onDone) onDone(false); return; }
            console.log("[CloudSave] Login por sessão OK para:", data.email);
            completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData, data.token);
            if (window.g_gameState === 0) window.isCloudLoaded = true;
            if (onDone) onDone(true);
        }
        function onError(data) {
            if (finished) return;
            finished = true;
            cleanup();
            console.log("[CloudSave] Sessão salva não é mais válida:", data && data.message);
            try { localStorage.removeItem("dg_session_token"); } catch (e) {}
            if (onDone) onDone(false);
        }

        socket.on("session_login_success", onSuccess);
        socket.on("session_login_error", onError);
        socket.emit("session_login", { token: token });
    }

    waitForSocket();
}
window.TryAutoLoginFromSession = TryAutoLoginFromSession;
