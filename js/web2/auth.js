// web2/auth.js

// Visibilidade de #loginButtonsContainer ("RESGATAR PROGRESSO" / "CRIAR CONTA NOVA")
// (22/08/2026, pedido do usuário: NUNCA auto-login — mesmo que o navegador já tenha uma sessão
// salva de uma visita anterior, os botões têm que aparecer TODA VEZ que a página carrega, e o
// jogo só pode começar depois que o jogador clicar de verdade em um dos dois e completar o
// fluxo). Fonte de verdade: g_hasAuthenticatedThisPageLoad, um estado EM MEMÓRIA (não
// localStorage) que começa false a cada carregamento real de página e só vira true dentro de
// completeCloudLogin(), no exato momento em que um login/cadastro é confirmado pelo servidor
// NESTA visita. Importante: isso é diferente de dg_cloud_email no localStorage, que persiste
// indefinidamente entre recarregamentos — dg_cloud_email continua existindo e sendo usado por
// todo o resto do jogo pra decidir se sincroniza com o banco, mas não decide mais se o jogo
// pode começar (esse foi o bug: PERSISTÊNCIA no localStorage estava sendo tratada como
// "autenticado nesta visita"). SetGameState() (js/game/engine.js) e completeCloudLogin()
// chamam esta função em vez de decidir a visibilidade cada um à sua maneira.
window.g_hasAuthenticatedThisPageLoad = false;

function UpdateLoginButtonsVisibility() {
    var container = document.getElementById("loginButtonsContainer");
    if (!container) return;
    var isAuthenticated = !!window.g_hasAuthenticatedThisPageLoad;
    container.style.display = isAuthenticated ? "none" : "flex";
}
window.UpdateLoginButtonsVisibility = UpdateLoginButtonsVisibility;
// Roda uma vez já ao carregar o script: g_hasAuthenticatedThisPageLoad é sempre false aqui (foi
// declarado duas linhas acima), então isso só confirma explicitamente o default "flex" já usado
// inline no HTML — mantido por clareza e como rede de segurança caso o default do HTML mude.
UpdateLoginButtonsVisibility();

function completeCloudLogin(email, name, playerData, token) {
    console.log("[CloudSave] Completing login session for:", email, name);
    // Marca que o login/cadastro foi REALMENTE completado nesta visita à página — esse é o
    // único jeito de g_hasAuthenticatedThisPageLoad virar true (ver declaração no topo deste
    // arquivo). Precisa vir cedo aqui porque UpdateLoginButtonsVisibility(), chamada logo
    // abaixo, depende dele.
    window.g_hasAuthenticatedThisPageLoad = true;
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
        // Token de sessão (30/08/2026): guarda pra próxima vez que o jogo abrir poder logar
        // sozinho, sem pedir a senha de novo — ver TryAutoLoginFromSession() logo abaixo.
        if (token) localStorage.setItem("dg_session_token", token);
    } catch(e) {}

    // dg_cloud_email já está gravado agora: esse é o exato momento em que o login/cadastro
    // é confirmado, então é aqui que os botões "RESGATAR PROGRESSO" / "CRIAR CONTA NOVA" somem.
    UpdateLoginButtonsVisibility();

    if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
        try { window.GhostRPG.applyCloudSave(safeData); } catch(e) {}
    } else {
        window.cloudSave = safeData;
    }

    // O banco manda, sempre (30/08/2026: sem "adotar" progresso local — login virou obrigatório
    // pra jogar, não existe mais um cenário legítimo de progresso real só no localStorage antes
    // de logar, então não tem o que adotar). A lista de personagens, o progresso da Ghostdex e
    // os favoritos vindos do servidor sempre substituem o que estava local, ponto.
    var cloudCharacters = Array.isArray(safeData.characters) ? safeData.characters : [];
    try {
        localStorage.setItem("dg_local_characters", JSON.stringify(cloudCharacters));
        window.g_ownedCharacters = cloudCharacters;
        localStorage.setItem("ghostdex_progress", JSON.stringify(safeData.ghostdexProgress || {}));
        localStorage.setItem("DangerGhost_Favorites", JSON.stringify(safeData.favorites || []));
    } catch (e) { console.error("[CloudSave] Falha ao aplicar dados do banco:", e); }

    // forceShowOverlay = false (22/08/2026, pedido do usuário: login/cadastro deve ir DIRETO
    // pro jogo, sem tela intermediária). Antes era true (30/08/2026) por uma regra de outra
    // sessão ("nada acontece sem ação direta do jogador") — revertido a pedido explícito de
    // hoje. Com false, LoadRPGStateFromDeSo (dentro do seu setTimeout de 400ms) lê
    // 'dg_deso_character_id' do localStorage e, se houver personagem local, chama
    // SelectCharacterToPlay() automaticamente, que dispara StartCutscene()/ResetGame() — ou
    // seja, começa a jogar de verdade. O bloco síncrono logo abaixo já grava em
    // 'dg_deso_character_id' o personagem de updatedAt mais recente ANTES desse setTimeout
    // disparar, então o auto-select pega o personagem certo (testado em 22/08/2026 com 2+
    // personagens e updatedAt genuinamente diferentes — ver e2e-db-verification). Conta nova
    // (zero personagens) cai na tela de seleção/forja vazia, que é o esperado.
    if (typeof window.LoadRPGStateFromDeSo === 'function') {
        window.LoadRPGStateFromDeSo(null, false);
    }

    // Carrega os dados do fantasma com a atualização mais recente no banco (30/08/2026, pedido
    // do usuário: "o login deve resgatar o último save feito"). Antes disso, o nível/xp que
    // ficava ativo logo após o login vinha só do resumo agregado da conta (players.level/xp,
    // setado por applyCloudSave acima) — um campo único que qualquer aparelho sobrescrevia com o
    // que quer que tivesse jogado por último, sem relação com nenhum fantasma específico. Isso
    // fazia "o progresso parecer diferente" dependendo de qual aparelho tinha salvo por último.
    // Carregando explicitamente os dados do fantasma de updatedAt mais recente, os dois
    // aparelhos — consultando o mesmo banco — sempre chegam no mesmo resultado.
    //
    // Importante: NÃO chama SelectCharacterToPlay() aqui — essa função também dispara
    // StartCutscene()/ResetGame() quando chamada (é o que acontece quando o jogador clica num
    // fantasma da Ghostdex), e login sozinho não deve começar a jogar sozinho, só carregar o
    // dado certo em memória pra quando o jogador apertar PLAY ou SPACE (pedido do usuário: nada
    // acontece sem ação direta dele). Por isso chama GhostRPG.loadBlockchainState() direto, que
    // só atualiza os dados, sem nenhum efeito de UI/estado de jogo.
    try {
        if (cloudCharacters.length > 0 && window.GhostRPG && window.GhostRPG.loadBlockchainState) {
            var mostRecentChar = cloudCharacters.reduce(function(latest, c) {
                var cTime = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
                var latestTime = latest ? new Date(latest.updatedAt || 0).getTime() : -1;
                return cTime > latestTime ? c : latest;
            }, null);
            if (mostRecentChar) {
                window.GhostRPG.loadBlockchainState(
                    parseInt(mostRecentChar.level, 10),
                    parseInt(mostRecentChar.vit, 10),
                    parseInt(mostRecentChar.agi, 10),
                    parseInt(mostRecentChar.int, 10),
                    parseInt(mostRecentChar.pow, 10),
                    mostRecentChar.characterId,
                    parseInt(mostRecentChar.xp, 10) || 0,
                    parseInt(mostRecentChar.pointsToDistribute, 10) || 0,
                    parseInt(mostRecentChar.mag, 10) || 1,
                    mostRecentChar.equippedSkills,
                    mostRecentChar.equippedRunes,
                    mostRecentChar.equippedPassives,
                    mostRecentChar.weapon,
                    mostRecentChar.inventory,
                    mostRecentChar.equipment,
                    mostRecentChar.name
                );
                try { localStorage.setItem('dg_deso_character_id', mostRecentChar.characterId); } catch(e) {}
                window.g_currentPlayerGhost = mostRecentChar.characterId;
            }
        }
    } catch (e) { console.error("[CloudSave] Falha ao carregar o personagem mais recente:", e); }
}
window.completeCloudLogin = completeCloudLogin;

function OpenLoginModal() {
    // Antes de mostrar o formulário, tenta o token de sessão salvo (se existir e ainda for
    // válido, o jogador já está logado e resgata o save sem digitar senha de novo; se não, cai
    // pro formulário normal). Continua sendo o clique no botão LOGIN que dispara isso — nunca
    // roda sozinho.
    if (typeof TryAutoLoginFromSession === 'function') {
        TryAutoLoginFromSession(function(loggedIn) {
            if (!loggedIn) showLoginForm();
        });
    } else {
        showLoginForm();
    }
}
window.OpenLoginModal = OpenLoginModal;
// Alias de segurança (23/08/2026, auditoria de login pedida pelo usuário): js/web2/game_core.js
// tinha uma função LoginGoogle() com Firebase Auth direto + fallback de MOCK LOGIN que fingia um
// login sem servidor nenhum validando (token falso "mock_<nome>", escondia
// #loginButtonsContainer sem g_hasAuthenticatedThisPageLoad) — removida por completo por ser
// código morto perigoso (nunca chamada por nenhum botão do site ao vivo, Firebase nunca
// configurado, window.JoinGameServer nem existe). Esse alias é só uma rede de segurança: se
// algum código futuro ainda chamar LoginGoogle() por hábito (ex: um botão copiado da cópia
// mobile morta www/index.html, que tinha onclick="LoginGoogle()"), cai no fluxo de login real
// em vez de lançar ReferenceError ou, pior, reintroduzir um fake login.
window.LoginGoogle = OpenLoginModal;

function showLoginForm() {
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

function CloseLoginModal() {
    var modal = document.getElementById('loginModalUI');
    if (modal) {
        modal.style.display = 'none';
    }
}
window.CloseLoginModal = CloseLoginModal;

// Base compartilhada por LOGIN e CRIAR CONTA (30/08/2026: separados por pedido explícito do
// usuário — cada e-mail só pode ter uma conta; login recupera uma conta existente, criar conta
// cadastra uma nova, e usar o botão errado pro que já existe/não existe dá um erro claro em vez
// de ambiguidade). Os listeners de resposta são amarrados a ESTA chamada específica (não um
// setTimeout(1000) global — ver histórico de bug no commit de 20/08/2026), com timeout de 15s.
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
        if (window.g_gameState === 0) { // Tela inicial
            window.isCloudLoaded = true;
        }
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

// Login por token de sessão (30/08/2026; ajustado no mesmo dia por pedido explícito do usuário:
// SEM disparar sozinho no carregamento da página — o jogo não deve logar ninguém sem uma ação
// direta dele). Só roda quando alguém chama de propósito: OpenLoginModal() (botão LOGIN) e o
// SPACE da tela inicial (js/game/engine.js) chamam isso ANTES de decidir se mostram o formulário
// de e-mail/senha ou se já entram direto — se o token salvo ainda for válido, o jogador nem vê a
// tela de login; se não for (ou não existir), cai pro fluxo manual normal, sem alerta.
// onDone(true|false) avisa quem chamou se conseguiu logar ou não.
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
