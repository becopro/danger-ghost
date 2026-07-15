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
    if (typeof google === 'undefined') {
        alert("Script do Google não foi carregado. Verifique sua conexão.");
        return;
    }

    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Se o OneTap não abrir (bloqueador de popups, por exemplo), tentamos o fluxo explícito
            console.warn("[Auth] OneTap bloqueado ou não exibido, você pode precisar de um botão Google nativo de fallback.");
            alert("Acesse as configurações do seu navegador e permita popups/cookies para o login do Google funcionar.");
        }
    });
}
window.LoginGoogle = LoginGoogle;

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
        }
    }, 1000);
});
