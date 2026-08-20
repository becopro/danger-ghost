// web2/auth.js

function completeCloudLogin(email, name, playerData) {
    console.log("[CloudSave] Completing login session for:", email, name);
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.style.display = "none";
    var loginModalUI = document.getElementById("loginModalUI");
    if (loginModalUI) loginModalUI.style.display = "none";

    var btnLogin = document.getElementById("btnNavLogin");
    if (btnLogin) {
        btnLogin.innerText = name || "Ghost";
        btnLogin.onclick = null;
        btnLogin.style.color = "#00FF00";
        btnLogin.style.borderColor = "#00FF00";
        btnLogin.style.textShadow = "0 0 5px #00FF00";
    }

    var safeData = playerData || {
        email: email,
        name: name || "Ghost",
        level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0,0,0,0]
    };

    try {
        localStorage.setItem("dg_cloud_email", email);
        localStorage.setItem("playerName", safeData.name || name || "Ghost");
        localStorage.setItem("dg_cloud_profile", JSON.stringify(safeData));
    } catch(e) {}

    if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
        try { window.GhostRPG.applyCloudSave(safeData); } catch(e) {}
    } else {
        window.cloudSave = safeData;
    }

    // Sincroniza a lista completa de fantasmas com o que veio do banco (20/08/2026) — o banco
    // manda. Se a conta já tem personagens salvos na nuvem, eles substituem o que estava só
    // localmente (é assim que "jogar em qualquer aparelho" funciona: o mesmo login em outro
    // PC/celular baixa a mesma lista). Se a nuvem ainda está vazia mas já existe progresso
    // local (alguém que jogou como convidado antes de criar login), adota o que já existe local
    // como ponto de partida e envia pro servidor uma vez, em vez de apagar.
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

    // Auto-load characters after cloud login
    if (typeof window.LoadRPGStateFromDeSo === 'function') {
        window.LoadRPGStateFromDeSo(null, false);
    }
}
window.completeCloudLogin = completeCloudLogin;

function OpenLoginModal() {
    var modal = document.getElementById('loginModalUI');
    if (modal) {
        modal.style.display = 'flex';
    }
    var emailInput = document.getElementById('loginInputEmail');
    var nameInput = document.getElementById('loginInputName');
    var savedEmail = localStorage.getItem('dg_cloud_email');
    var savedName = localStorage.getItem('playerName');
    if (emailInput && savedEmail) {
        emailInput.value = savedEmail;
    }
    if (nameInput && savedName) {
        nameInput.value = savedName;
    }
}
window.OpenLoginModal = OpenLoginModal;

function CloseLoginModal() {
    var modal = document.getElementById('loginModalUI');
    if (modal) {
        modal.style.display = 'none';
    }
}
window.CloseLoginModal = CloseLoginModal;

function CloudSaveLogin() {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var name = document.getElementById('loginInputName') ? document.getElementById('loginInputName').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        alert("Por favor, digite um e-mail válido para vincular seu Cloud Save.");
        return;
    }

    if (!password || password.length < 6 || password.length > 12) {
        alert("A senha deve ter entre 6 e 12 caracteres para proteger o seu Cloud Save.");
        return;
    }

    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        var h2 = loadingModal.querySelector("h2");
        if (h2) h2.innerText = "Verificando senha e resgatando progresso...";
        loadingModal.style.display = "flex";
    }

    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket) {
        alert("Erro: Não foi possível conectar ao servidor para validar o login.");
        if (loadingModal) loadingModal.style.display = "none";
        return;
    }

    // Os listeners de resposta são amarrados a ESTE clique específico (não mais a um
    // setTimeout(1000) disparado uma vez no carregamento da página) — antes disso, se o socket
    // demorasse mais que 1s pra existir/conectar (comum em rede de celular), os listeners nunca
    // eram registrados e a tela de "Verificando senha..." travava pra sempre mesmo quando o
    // servidor respondia certinho. Também adiciona um timeout de 15s: se nada voltar do servidor
    // nesse prazo (rede caiu, WebSocket bloqueado pela operadora, etc.), avisa o jogador em vez de
    // deixar a tela girando pra sempre sem explicação. Corrigido em 20/08/2026.
    var finished = false;
    function cleanup() {
        finished = true;
        clearTimeout(timeoutId);
        socket.off("cloud_save_success", handleSuccess);
        socket.off("auth_google_success", handleSuccess);
        socket.off("cloud_save_error", handleError);
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
        console.log("[CloudSave] Login Success! Loading profile for:", data && data.email);
        if (!data) return;

        completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData);

        if (window.g_gameState === 0) { // Tela inicial
            window.isCloudLoaded = true;
        }
    }

    function handleError(data) {
        if (finished) return;
        cleanup();
        console.warn("[CloudSave] Server error received:", data && data.message);
        alert("Erro no Login: " + ((data && data.message) || "Falha ao resgatar progresso."));
        if (loadingModal) loadingModal.style.display = "none";
    }

    socket.on("cloud_save_success", handleSuccess);
    socket.on("auth_google_success", handleSuccess);
    socket.on("cloud_save_error", handleError);
    socket.on("auth_google_error", handleError);

    socket.emit("cloud_save_login", { email: email, name: name || 'Ghost', password: password });
    socket.emit("auth_google_token", { email: email, name: name || 'Ghost', password: password, isFallback: true });
}
window.CloudSaveLogin = CloudSaveLogin;
window.LoginDeveloperFallback = CloudSaveLogin;
