// web2/auth.js

// Achado #1 da auditoria de 27/08/2026 (mesmo fix do site — ver js/web2/auth.js lá pro
// histórico completo): as 7 mensagens de erro de login/cadastro abaixo apareciam como
// alert() nativo, quebrando a identidade visual. showLoginError() troca só o CONTAINER: mesma
// mensagem, mostrada dentro de #loginModalUI (index.html) em vez de um popup do navegador.
// alert(msg) fica como rede de segurança só pro caso (não esperado) de #loginErrorMsg não
// existir no DOM. hideLoginError() limpa o estado toda vez que o modal abre/fecha ou uma nova
// tentativa começa.
function showLoginError(msg) {
    var errEl = document.getElementById('loginErrorMsg');
    if (errEl) {
        errEl.textContent = msg;
        errEl.style.display = 'block';
    } else {
        alert(msg);
    }
}
window.showLoginError = showLoginError;

function hideLoginError() {
    var errEl = document.getElementById('loginErrorMsg');
    if (errEl) {
        errEl.style.display = 'none';
        errEl.textContent = '';
    }
}
window.hideLoginError = hideLoginError;

// Fonte de verdade pra "o jogador autenticou de verdade NESTA visita à página" (23/08/2026,
// achado numa auditoria forense de paridade site<->mobile — mesmo mecanismo que o site já usa
// há mais tempo em SPACE/P/PlayAsGhost/forge/play/StartGameFromMenu, nunca espelhado aqui). Em
// memória, não localStorage: começa false a cada carregamento real de página e só vira true
// dentro de completeCloudLogin(), no momento em que um login/cadastro/sessão é confirmado pelo
// servidor NESTA visita. Diferente de dg_cloud_email (localStorage), que persiste indefinidamente
// entre recarregamentos e continua sendo usado em todo o resto do jogo pra decidir SE sincroniza
// com o banco — não decide mais se uma ação sensível (forjar, jogar, etc.) pode acontecer.
// Mobile tem uma segunda linha de defesa que o site não tem (#mobileAuthGateScreen, sempre
// mostrada primeiro no boot do app — ver index.html), mas os checkpoints individuais abaixo
// continuam existindo como rede de segurança pro caso de algum botão futuro alcançar essas
// funções sem passar pela tela de auth, exatamente como no site.
window.g_hasAuthenticatedThisPageLoad = false;

// handleGoogleLogin() removida em 27/08/2026 (auditoria ao vivo pedida pelo usuário, mesma
// limpeza já feita no site em 23/08/2026 — ver LoginGoogle() abaixo). Chamava
// google.accounts.id.initialize() de verdade no carregamento da página com um client_id
// placeholder nunca preenchido ("SEU_CLIENT_ID_DO_GOOGLE...") — não era explorável (o servidor
// rejeitaria por falta de client_id real), mas era código morto perigoso esquecido: se algum dia
// alguém preenchesse o client_id sem revisar o resto, reativaria um caminho de login que nunca
// teve verificação real do lado do cliente. window.LoginGoogle continua existindo como alias de
// segurança pra OpenLoginModal() — ver logo abaixo.

// O botão "LOGIN" do HTML chama esta função.
// NOTA (20/08/2026, atualizada 27/08/2026 quando o fluxo do Google foi removido de vez — ver
// comentário acima): vai direto pro e-mail/senha porque o Google nunca teve client_id real
// configurado. Antes disso, tentar o caminho do Google causava o jogador tocar em LOGIN, nada
// acontecer na hora, e a tela de e-mail/senha só aparecer alguns segundos depois (quando o
// Google falhava de forma assíncrona) — parecendo, pra quem estava jogando, que a tela abria
// sozinha ao selecionar um fantasma na Ghostdex.
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
    // Marca que o login/cadastro/sessão foi REALMENTE confirmado pelo servidor nesta visita à
    // página (23/08/2026, ver declaração de g_hasAuthenticatedThisPageLoad no topo deste
    // arquivo) — precisa vir cedo, antes de qualquer checkpoint que dependa dele mais abaixo no
    // fluxo de login.
    window.g_hasAuthenticatedThisPageLoad = true;
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

    // Transição da tela exclusiva de auth pro menu principal (22/08/2026, pedido do usuário) —
    // esse é o gatilho real: sucesso de login/cadastro confirmado pelo servidor, não um clique
    // de botão específico. Só mexe se #mobileAuthGateScreen estiver de fato visível agora (ex.:
    // não faz nada se completeCloudLogin() for chamado de novo com o jogador já dentro do menu
    // principal, como um re-login manual pelo botão LOGIN do Google).
    var mobileAuthGate = document.getElementById("mobileAuthGateScreen");
    if (mobileAuthGate && mobileAuthGate.style.display !== "none") {
        mobileAuthGate.style.display = "none";
        var mobileMainMenu = document.getElementById("mobileMainMenu");
        if (mobileMainMenu) mobileMainMenu.style.display = "flex";
    }

    if (window.GhostRPG && window.GhostRPG.applyCloudSave) {
        try { window.GhostRPG.applyCloudSave(safeData); } catch (e) {}
    } else {
        window.cloudSave = safeData;
    }

    // O banco manda, sempre (30/08/2026, mesmo padrão do site: sem "adotar" progresso local —
    // login virou obrigatório pra jogar, não existe mais um cenário legítimo de progresso real
    // só no localStorage antes de logar).
    var cloudCharacters = Array.isArray(safeData.characters) ? safeData.characters : [];
    try {
        localStorage.setItem("dg_local_characters", JSON.stringify(cloudCharacters));
        window.g_ownedCharacters = cloudCharacters;
        localStorage.setItem("ghostdex_progress", JSON.stringify(safeData.ghostdexProgress || {}));
        localStorage.setItem("DangerGhost_Favorites", JSON.stringify(safeData.favorites || []));
    } catch (e) { console.error("[CloudSave] Falha ao aplicar dados do banco:", e); }

    // Recarrega a tela de seleção de personagem com a lista atualizada — esse chamada faltava
    // no mobile (só o site tinha, achado ao investigar hoje), então depois de logar no app
    // nada atualizava window.g_ownedCharacters automaticamente até esse fix.
    // forceShowOverlay = false (22/08/2026, mesmo fix do site — pedido do usuário: login/
    // cadastro deve ir DIRETO pro jogo, sem tela intermediária). Antes era true (30/08/2026);
    // revertido a pedido explícito de hoje. Com false, LoadRPGStateFromDeSo auto-seleciona
    // (dentro do seu setTimeout de 400ms) o personagem salvo em 'dg_deso_character_id' e chama
    // SelectCharacterToPlay(), que dispara StartCutscene()/ResetGame() — começa a jogar de
    // verdade. O bloco síncrono logo abaixo já grava o personagem de updatedAt mais recente
    // nesse localStorage ANTES do setTimeout disparar, então o auto-select pega o certo (ver
    // comentário equivalente e mais detalhado em js/web2/auth.js do site).
    if (typeof window.LoadRPGStateFromDeSo === 'function') {
        window.LoadRPGStateFromDeSo(null, false);
    }

    // Carrega os dados do fantasma com a atualização mais recente no banco (30/08/2026, mesmo
    // fix do site — ver o comentário lá para a explicação completa do bug: sem isso, o
    // nível/xp que ficava ativo logo após o login vinha só do resumo agregado da conta, que
    // qualquer aparelho sobrescrevia com o que quer que tivesse jogado por último, sem relação
    // com nenhum fantasma específico — daí "o progresso parecer diferente" entre aparelhos).
    // Comentário corrigido em 27/08/2026 (estava desatualizado/contraditório — só o texto
    // mudou, o comportamento sempre foi este; ver explicação completa em js/web2/auth.js do
    // site). Este bloco NÃO chama SelectCharacterToPlay/PlayAsGhost de propósito — essas funções
    // também disparam StartCutscene()/ResetGame(), e repetir isso aqui duplicaria o início de
    // jogo. Isso NÃO significa que login nunca inicia o jogo sozinho: com forceShowOverlay=false
    // (comentário acima), o LoadRPGStateFromDeSo(null, false) chamado antes deste bloco JÁ faz
    // esse auto-start quando o jogador tem personagem salvo — comportamento intencional.
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

    if (window.g_gameState === 0) {
        window.isCloudLoaded = true;
    }
}
window.completeCloudLogin = completeCloudLogin;

// Botão LOGOUT do menu mobile (23/08/2026, pedido do usuário) — o oposto exato de
// completeCloudLogin() acima: em vez de gravar a sessão, apaga tudo que ela gravou, pra deixar o
// aparelho limpo pra outra conta (resgatar uma diferente ou criar uma nova com outro e-mail).
// IMPORTANTE: esta lista de chaves precisa continuar sendo o espelho exato do que
// completeCloudLogin() grava (linhas ~101-135 e ~186 acima) — se aquela função passar a gravar
// mais alguma chave no futuro, esta precisa ser atualizada junto, senão sobra lixo da conta
// antiga pra próxima conta que logar neste mesmo aparelho.
function LogoutMobile() {
    try {
        localStorage.removeItem("dg_cloud_email");
        localStorage.removeItem("dg_session_token");
        localStorage.removeItem("dg_cloud_profile");
        localStorage.removeItem("dg_local_characters");
        localStorage.removeItem("ghostdex_progress");
        localStorage.removeItem("DangerGhost_Favorites");
        localStorage.removeItem("dg_deso_character_id");
        localStorage.removeItem("playerName");
    } catch (e) {}

    // Reload em vez de resetar manualmente cada pedacinho de estado em memória do RPG (que está
    // bastante espalhado pelo engine.js/rpg_system.js) — mais seguro, garante que nenhum resquício
    // visual da conta anterior sobrevive. O DOMContentLoaded em www/index.html já mostra
    // #mobileAuthGateScreen incondicionalmente quando o app roda dentro do Capacitor, então o
    // reload cai direto na tela de "Restore Progress"/"Create New Account" sozinho, sem precisar
    // de nenhuma lógica extra aqui.
    window.location.reload();
}
window.LogoutMobile = LogoutMobile;

function OpenLoginModal() {
    // Antes de mostrar o formulário, tenta o token de sessão salvo (se ainda for válido, o
    // jogador já está logado e resgata o save sem digitar senha de novo; se não, cai pro
    // formulário normal). Continua sendo o toque no botão LOGIN/Restore Progress que dispara
    // isso. NÃO use esta função pro botão "Create New Account" — ver OpenSignupModal() abaixo.
    if (typeof TryAutoLoginFromSession === 'function') {
        TryAutoLoginFromSession(function(loggedIn) {
            if (!loggedIn) showLoginForm();
        });
    } else {
        showLoginForm();
    }
}
window.OpenLoginModal = OpenLoginModal;

// Bug corrigido em 27/08/2026 (auditoria ao vivo, mesmo fix do site — ver js/web2/auth.js lá
// pro histórico completo): "Create New Account" (mobileAuthGateCreateBtn) chamava
// OpenLoginModal() igual "Restore Progress", que tenta TryAutoLoginFromSession() antes de
// mostrar qualquer formulário — com sessão salva, o app relogava sozinho na conta antiga em vez
// de abrir o cadastro. OpenSignupModal() mostra o formulário direto, sem tentar retomar sessão.
function OpenSignupModal() {
    showLoginForm();
}
window.OpenSignupModal = OpenSignupModal;

function showLoginForm() {
    var modal = document.getElementById('loginModalUI');
    if (modal) {
        modal.style.display = 'flex';
    }
    hideLoginError();
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
    hideLoginError();
}
window.CloseLoginModal = CloseLoginModal;

// Base compartilhada por LOGIN e CRIAR CONTA (30/08/2026, mesmo padrão do site: separados por
// pedido explícito do usuário — cada e-mail só pode ter uma conta; login recupera uma conta
// existente, criar conta cadastra uma nova). Listeners amarrados a ESTA chamada específica, com
// timeout de 15s — ver histórico do bug de spinner travado no commit de 20/08/2026.
function submitCloudSaveAuth(eventName, payload, loadingText, submitBtn) {
    hideLoginError();
    var loadingModal = document.getElementById("loadingModal");
    if (loadingModal) {
        var h2 = loadingModal.querySelector("h2");
        if (h2) h2.innerText = loadingText;
        loadingModal.style.display = "flex";
    }

    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket) {
        showLoginError("Error: Could not connect to the server.");
        if (loadingModal) loadingModal.style.display = "none";
        return;
    }

    // Bug corrigido em 27/08/2026 (auditoria ao vivo, mesmo fix do site — ver js/web2/auth.js
    // lá pro histórico completo): duplo toque rápido nesta função registrava dois pares de
    // listeners socket.on("cloud_save_success"/"cloud_save_error", ...) sem id de correlação; o
    // socket.off() da chamada que terminasse primeiro removia o listener da outra, ainda
    // esperando resposta, que era descartada em silêncio. Corrigido na origem: desabilita o
    // botão assim que o envio começa, só reabilita quando a resposta voltar.
    if (submitBtn) submitBtn.disabled = true;

    var finished = false;
    function cleanup() {
        finished = true;
        clearTimeout(timeoutId);
        socket.off("cloud_save_success", handleSuccess);
        socket.off("cloud_save_error", handleError);
        if (submitBtn) submitBtn.disabled = false;
    }
    var timeoutId = setTimeout(function() {
        if (finished) return;
        cleanup();
        if (loadingModal) loadingModal.style.display = "none";
        showLoginError("The server took too long to respond. Check your internet connection and try again.");
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
        showLoginError((data && data.message) || "Failed to access Cloud Save.");
        if (loadingModal) loadingModal.style.display = "none";
    }
    socket.on("cloud_save_success", handleSuccess);
    socket.on("cloud_save_error", handleError);
    socket.emit(eventName, payload);
}

function CloudSaveLogin(btn) {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        showLoginError("Please enter your account email.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        showLoginError("Password must be between 6 and 12 characters.");
        return;
    }

    submitCloudSaveAuth("cloud_save_login", { email: email, password: password }, "Verifying password and restoring progress...", btn);
}
window.CloudSaveLogin = CloudSaveLogin;
window.LoginDeveloperFallback = CloudSaveLogin;

function CloudSaveSignup(btn) {
    var email = document.getElementById('loginInputEmail') ? document.getElementById('loginInputEmail').value.trim() : "";
    var name = document.getElementById('loginInputName') ? document.getElementById('loginInputName').value.trim() : "";
    var password = document.getElementById('loginInputPassword') ? document.getElementById('loginInputPassword').value.trim() : "";

    if (!email) {
        showLoginError("Please enter an email for your new account.");
        return;
    }
    if (!password || password.length < 6 || password.length > 12) {
        showLoginError("Password must be between 6 and 12 characters to protect your Cloud Save.");
        return;
    }

    submitCloudSaveAuth("cloud_save_signup", { email: email, name: name || 'Ghost', password: password }, "Creating your account...", btn);
}
window.CloudSaveSignup = CloudSaveSignup;

// Login por token de sessão (30/08/2026; ajustado no mesmo dia por pedido explícito do usuário,
// mesmo padrão do site: SEM disparar sozinho no carregamento da página). Só roda quando alguém
// chama de propósito: OpenLoginModal() (botão LOGIN) e o SPACE da tela inicial
// (www/js/game/engine.js) chamam isso antes de decidir se mostram o formulário de e-mail/senha
// ou se já entram direto. onDone(true|false) avisa quem chamou se conseguiu logar ou não.
// Trava simples contra chamadas concorrentes (27/08/2026, mesmo fix do site — ver
// js/web2/auth.js lá pro histórico completo): TryAutoLoginFromSession() é chamada por vários
// pontos de entrada diferentes (Restore Progress, os vários botões LOGIN via LoginGoogle(), o
// SPACE/toque da tela inicial), nenhum deles desabilitando nada visualmente. Duplo toque rápido
// em qualquer um registrava dois pares de listeners socket.on("session_login_success"/
// "session_login_error", ...) sem id de correlação, e a resposta de um deles era descartada em
// silêncio — a mesma corrida de submitCloudSaveAuth(). Uma trava única aqui cobre todos os
// pontos de entrada de uma vez.
var g_autoLoginInFlight = false;

function TryAutoLoginFromSession(onDone) {
    var token = null;
    try { token = localStorage.getItem("dg_session_token"); } catch (e) {}
    if (!token) { if (onDone) onDone(false); return; }

    if (g_autoLoginInFlight) { if (onDone) onDone(false); return; }
    g_autoLoginInFlight = true;
    function done(result) {
        g_autoLoginInFlight = false;
        if (onDone) onDone(result);
    }

    var attempts = 0;
    function waitForSocket() {
        var socket = window.NetworkState && window.NetworkState.socket;
        if (socket) {
            attemptLogin(socket);
            return;
        }
        attempts++;
        if (attempts > 15) { done(false); return; } // ~3s tentando; desiste
        setTimeout(waitForSocket, 200);
    }

    function attemptLogin(socket) {
        var finished = false;
        var timeoutId = setTimeout(function() {
            if (finished) return;
            finished = true;
            cleanup();
            done(false);
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
            if (!data) { done(false); return; }
            console.log("[CloudSave] Login por sessão OK para:", data.email);
            completeCloudLogin(data.email, data.playerData && data.playerData.name, data.playerData, data.token);
            if (window.g_gameState === 0) window.isCloudLoaded = true;
            done(true);
        }
        function onError(data) {
            if (finished) return;
            finished = true;
            cleanup();
            console.log("[CloudSave] Sessão salva não é mais válida:", data && data.message);
            try { localStorage.removeItem("dg_session_token"); } catch (e) {}
            done(false);
        }

        socket.on("session_login_success", onSuccess);
        socket.on("session_login_error", onError);
        socket.emit("session_login", { token: token });
    }

    waitForSocket();
}
window.TryAutoLoginFromSession = TryAutoLoginFromSession;
