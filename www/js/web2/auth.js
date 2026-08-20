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

// O botão "LOGIN" do HTML chama esta função
function LoginGoogle() {
    // Nós podemos forçar o prompt do Google One Tap ou renderizar o botão.
    // Como queremos manter o design do seu botão original, usamos a API do Google para abrir o popup se possível.

    // NOTA: Para rodar localmente sem erros, você precisa colocar o 'localhost' nas origens autorizadas no painel do Google.
    // O client_id abaixo (em DOMContentLoaded) ainda é um placeholder nunca preenchido, então esse
    // caminho não funciona de verdade hoje — por isso caímos direto no login por e-mail/senha, que
    // é o mesmo usado no site e comprovadamente funciona (20/08/2026).
    if (typeof google === 'undefined') {
        OpenLoginModal();
        return;
    }

    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Se o OneTap não abrir (bloqueador de popups, client_id inválido, etc.), cai pro
            // login por e-mail/senha em vez de deixar o jogador sem nenhum jeito de entrar.
            console.warn("[Auth] OneTap bloqueado ou não exibido, caindo para login por e-mail/senha.");
            OpenLoginModal();
        }
    });
}
window.LoginGoogle = LoginGoogle;

// --- Login por e-mail/senha (Cloud Save) — adicionado 20/08/2026, mesmo padrão do site ---
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
                
                // 1. Atualizar UI (Botão)
                var btnLogin = document.getElementById("btnNavLogin");
                if (btnLogin) {
                    btnLogin.innerText = data.playerData.name; // Mostra o nome!
                    btnLogin.onclick = null; // Remove a ação de login
                    btnLogin.style.color = "#00FF00"; // Fica verdinho
                    btnLogin.style.borderColor = "#00FF00";
                    btnLogin.style.textShadow = "0 0 5px #00FF00";
                }

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
