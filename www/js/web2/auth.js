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
    if (socket && socket.connected) {
        socket.emit("auth_google_token", { token: response.credential });
    } else {
        alert("Erro: Não foi possível conectar ao servidor para validar o login. O servidor pode estar offline (Render suspenso).");
        if(loadingModal) loadingModal.style.display = "none";
    }
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
function completeCloudLogin(email, name, playerData) {
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
window.OpenLoginModal = OpenLoginModal;

function CloseLoginModal() {
    var modal = document.getElementById('loginModalUI');
    if (modal) modal.style.display = 'none';
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
    if (socket) {
        socket.emit("cloud_save_login", { email: email, name: name || 'Ghost', password: password });
        socket.emit("auth_google_token", { email: email, name: name || 'Ghost', password: password, isFallback: true });
    } else {
        alert("Erro: Não foi possível conectar ao servidor para validar o login.");
        if (loadingModal) loadingModal.style.display = "none";
    }
}
window.CloudSaveLogin = CloudSaveLogin;
window.LoginDeveloperFallback = CloudSaveLogin;

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

    // Atrasar um pouco o listener do socket para garantir que ele foi criado em outro script
    setTimeout(() => {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            socket.on("auth_google_success", (data) => {
                console.log("[Auth] Login Success! Loading profile for:", data.email);
                
                // 1. Atualizar UI (todos os botões de login, não só um)
                updateAllLoginButtons(data.playerData.name);

                // 2. Load the stats into memory (assuming GhostRPG handles this)
                if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
                    window.GhostRPG.applyCloudSave(data.playerData);
                } else {
                    // Fallback
                    localStorage.setItem("playerName", data.playerData.name);
                    window.cloudSave = data.playerData;
                }

                // 3. Esconde modal de carregamento
                var loadingModal = document.getElementById("loadingModal");
                if(loadingModal) loadingModal.style.display = "none";
                
                // Muda o botão de "START" na start screen para "CONTINUE"
                // No engine.js ele verifica se precisa ser 'START' mas vamos tentar sobrescrever
                if (window.g_gameState === 0) { // Tela inicial
                    var ctx = window.g_ctx;
                    // Só sinaliza para desenhar diferente no próximo frame
                    window.isCloudLoaded = true;
                }
            });

            socket.on("auth_google_error", (data) => {
                alert("Erro no Login: " + data.message);
                var loadingModal = document.getElementById("loadingModal");
                if(loadingModal) loadingModal.style.display = "none";
            });

            // Login por e-mail/senha (CloudSaveLogin) — mesmos eventos que o site escuta.
            var handleCloudSaveSuccess = (data) => {
                console.log("[CloudSave] Login Success! Loading profile for:", data && data.email);
                if (!data) return;
                completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData);
                if (window.g_gameState === 0) window.isCloudLoaded = true;
            };
            var handleCloudSaveError = (data) => {
                console.warn("[CloudSave] Server error received:", data && data.message);
                alert("Erro no Login: " + ((data && data.message) || "Falha ao resgatar progresso."));
                var loadingModal = document.getElementById("loadingModal");
                if (loadingModal) loadingModal.style.display = "none";
            };
            socket.on("cloud_save_success", handleCloudSaveSuccess);
            socket.on("cloud_save_error", handleCloudSaveError);
        }
    }, 1000);
});
