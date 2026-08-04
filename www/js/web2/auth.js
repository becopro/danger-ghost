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
    setTimeout(() => {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            var handleSuccess = (data) => {
                console.log("[CloudSave] Login Success! Loading profile for:", data && data.email);
                if (!data) return;

                completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData);

                if (window.g_gameState === 0) { // Tela inicial
                    window.isCloudLoaded = true;
                }
            };

            var handleError = (data) => {
                console.warn("[CloudSave] Server error received:", data && data.message);
                alert("Erro no Login: " + ((data && data.message) || "Falha ao resgatar progresso."));
                var loadingModal = document.getElementById("loadingModal");
                if (loadingModal) loadingModal.style.display = "none";
            };

            socket.on("cloud_save_success", handleSuccess);
            socket.on("auth_google_success", handleSuccess);
            socket.on("cloud_save_error", handleError);
            socket.on("auth_google_error", handleError);
        }
    }, 1000);
});
