// web2/auth.js

function completeCloudLogin(email, nickname, playerData) {
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) loadingModal.style.display = "none";
    var loginModalUI = document.getElementById("loginModalUI");
    if (loginModalUI) loginModalUI.style.display = "none";

    var btnLogin = document.getElementById("btnNavLogin");
    if (btnLogin) {
        btnLogin.innerText = nickname || "Ghost";
        btnLogin.onclick = null;
        btnLogin.style.color = "#00FF00";
        btnLogin.style.borderColor = "#00FF00";
        btnLogin.style.textShadow = "0 0 5px #00FF00";
    }

    try {
        localStorage.setItem("dg_cloud_email", email);
        localStorage.setItem("playerName", nickname || "Ghost");
        localStorage.setItem("dg_cloud_profile", JSON.stringify(playerData || {}));
    } catch(e) {}

    if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
        try { window.GhostRPG.applyCloudSave(playerData); } catch(e) {}
    }

    if (playerData) {
        localStorage.setItem('player_ghosts_inventory', JSON.stringify(playerData.ghost_inventory || {}));
        localStorage.setItem('DangerGhost_Favorites', JSON.stringify(playerData.ghost_favorites || []));
        localStorage.setItem('dg_local_characters', JSON.stringify(playerData.characters || []));
        localStorage.setItem('dg_soul_essence', String(playerData.soul_essence || 0));
        localStorage.setItem('dg_saved_level', String(playerData.saved_level || 1));
    }

    if (typeof window.g_gameState !== 'undefined' && window.g_gameState === 0) {
        window.isCloudLoaded = true;
    } else {
        window.cloudSave = playerData;
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
    if (modal) {
        modal.style.display = 'none';
    }
}
window.CloseLoginModal = CloseLoginModal;

function CloudSaveLogin() {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        alert("Por favor, digite um e-mail válido para vincular seu Cloud Save.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        alert("A senha deve ter entre 6 e 12 caracteres para proteger o seu Cloud Save.");
        return;
    }

    var socket = window.NetworkState && window.NetworkState.socket;
    if (socket) {
        var loadingModal = document.getElementById("loadingModal");
        if (loadingModal) {
            var h2 = loadingModal.querySelector("h2");
            if (h2) h2.innerText = "Verificando senha e resgatando progresso...";
            loadingModal.style.display = "flex";
        }
        socket.emit("login", { email: email, password: password });
    } else {
        alert("Erro: Não foi possível conectar ao servidor para validar o login.");
    }
}
window.CloudSaveLogin = CloudSaveLogin;

function CloudSaveRegister() {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var nickname = document.getElementById('loginInputName') ? document.getElementById('loginInputName').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!nickname || nickname.length < 2 || nickname.length > 20) {
        alert("O apelido deve ter entre 2 e 20 caracteres.");
        return;
    }
    if (!email) {
        alert("Por favor, digite um e-mail válido.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        alert("A senha deve ter entre 6 e 12 caracteres.");
        return;
    }

    var socket = window.NetworkState && window.NetworkState.socket;
    if (socket) {
        var loadingModal = document.getElementById("loadingModal");
        if (loadingModal) {
            var h2 = loadingModal.querySelector("h2");
            if (h2) h2.innerText = "Criando conta e salvando progresso...";
            loadingModal.style.display = "flex";
        }
        socket.emit("register", { nickname: nickname, email: email, password: password });
    } else {
        alert("Erro: Não foi possível conectar ao servidor.");
    }
}
window.CloudSaveRegister = CloudSaveRegister;

window.addEventListener('DOMContentLoaded', () => {
    // Auto-restore
    var cachedEmail = localStorage.getItem('dg_cloud_email');
    var cachedProfile = localStorage.getItem('dg_cloud_profile');
    var cachedName = localStorage.getItem('playerName');
    
    if (cachedEmail && cachedProfile) {
        try {
            completeCloudLogin(cachedEmail, cachedName, JSON.parse(cachedProfile));
        } catch(e) {}
    }

    setTimeout(() => {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            socket.on("login_success", (data) => {
                completeCloudLogin(data.email, data.playerData && data.playerData.nickname, data.playerData);
            });
            socket.on("register_success", (data) => {
                completeCloudLogin(data.email, data.playerData && data.playerData.nickname, data.playerData);
            });
            
            var handleError = (data) => {
                alert("Erro: " + (data.message || "Unknown error"));
                var loadingModal = document.getElementById("loadingModal");
                if (loadingModal) loadingModal.style.display = "none";
            };
            
            socket.on("login_error", handleError);
            socket.on("register_error", handleError);

            // Backward compat
            socket.on("cloud_save_success", (data) => {
                completeCloudLogin(data.email, data.playerData && data.playerData.nickname, data.playerData);
            });
            socket.on("auth_google_success", (data) => {
                completeCloudLogin(data.email, data.playerData && data.playerData.nickname, data.playerData);
            });
            socket.on("cloud_save_error", handleError);
            socket.on("auth_google_error", handleError);
        }
    }, 1000);
});
