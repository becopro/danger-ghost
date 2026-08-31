// web2/profile.js
// ============================================================================
// Perfil de jogador customizável (29/08/2026): nome de exibição, avatar, galeria
// de até 9 fotos e diário/blog cronológico (renomeado "Time Capsule" na UI em
// 31/08/2026 — só o texto mudou, os nomes internos de evento/campo/ID continuam
// "diary"/"myDiary*" de propósito, contrato com o backend inalterado). Modal em
// index.html (#myProfileModal), estilos em css/style.css (seção "MY PROFILE
// MODAL"). Toda a UI dentro do modal está em inglês (tradução de 31/08/2026) —
// comentários deste arquivo continuam em português, seguindo o resto do projeto.
//
// MODO DE VISUALIZAÇÃO DE OUTRO JOGADOR (31/08/2026): além do modo "próprio"
// de sempre, este modal agora também abre em modo somente-leitura pra ver o
// perfil de QUALQUER outro jogador — acionado por clique num resultado de busca
// ou item da lista de amigos (ver friends.js), via OpenPlayerProfileModal(email)
// abaixo. g_myProfileState.viewMode ('self' | 'other') controla tudo: quais
// controles de edição aparecem (ApplyProfileModalMode()), de onde vêm os dados
// (get_player_profile em vez de localStorage) e o botão "← BACK TO MY PROFILE"
// (só visível em 'other'). Fechar e reabrir o modal (CloseProfileModal() +
// OpenProfileModal()) também reseta pro modo próprio — o botão Back só existe
// pra não obrigar isso enquanto se navega por vários perfis em sequência.
//
// CONTRATO COM O BACKEND (server/index.js + server/db.js, implementado por outro
// agente em paralelo — nomes de evento/payload conferidos lendo o código real em
// 29/08/2026, não só a descrição da tarefa):
//   socket.emit('update_profile', { displayName?, avatarUrl?, galleryUrls? })
//     -> 'profile_updated' ({ name, avatarUrl, galleryUrls }) / 'profile_error' ({ message })
//     Cada campo é OPCIONAL e independente (COALESCE no servidor) — só manda o(s)
//     campo(s) que realmente mudou, os outros ficam como estavam. EXCEÇÃO:
//     galleryUrls é atômico (o array INTEIRO substitui o anterior, o servidor
//     rejeita o campo inteiro se qualquer item for inválido) — sempre manda a
//     lista completa de URLs válidas, nunca um item isolado. galleryUrls também
//     não aceita null/vazio no meio do array (server/db.js sanitizeProfilePayload:
//     `galleryUrls.every(isValidProfileUrl)`, cada item precisa começar com
//     "https://") — por isso a galeria aqui é tratada como lista compacta
//     (0..N-1 preenchidos, resto "+ adicionar"), nunca like um array esparso com
//     buracos.
//   socket.emit('post_diary_entry', { content })
//     -> 'diary_entry_posted' ({ id, content, createdAt }) / 'diary_error' ({ message })
//   socket.emit('get_diary_entries', { limit, beforeId?, email? })
//     -> 'diary_entries_loaded' ({ entries: [{id, content, createdAt}], hasMore }) / 'diary_error'
//     `email` (31/08/2026): OPCIONAL. Omitido = diário da conta autenticada
//     (comportamento de sempre). Presente = lê o diário PÚBLICO de outro jogador
//     (modo de visualização). Nomes/payload combinados com o outro agente — o
//     código real de server/index.js é a fonte de verdade se divergir; em
//     31/08/2026 o handler de get_diary_entries em server/index.js ainda só lia
//     playerSession.email (sem suportar o campo `email` do payload) — se o modo
//     "outro jogador" não trouxer o diário certo, confira se esse suporte já
//     foi mesclado no servidor antes de desconfiar deste arquivo.
//   socket.emit('get_player_profile', { email })
//     -> 'player_profile_loaded' ({ email, name, avatarUrl, galleryUrls, createdAt,
//        friendCount }) / 'player_profile_error' ({ message })
//     Usado só pelo modo "outro jogador" (OpenPlayerProfileModal() abaixo) — o
//     próprio perfil nunca chama isto, continua lendo de
//     localStorage['dg_cloud_profile'] (GetStoredProfileData()) sem rede extra,
//     como sempre. Em 31/08/2026 este evento AINDA NÃO existia em
//     server/index.js (não encontrado ao ler o código real) — implementação
//     paralela do outro agente ainda não tinha chegado nesse ponto; o cliente
//     aqui já está pronto pro contrato combinado, mas o modo "outro jogador" só
//     funciona de fato depois que esse handler existir no servidor.
//
// Upload de imagem (avatar/galeria) NÃO usa socket.io — é HTTP puro, ver
// UploadProfileImage() mais abaixo: POST multipart/form-data pra
// {GetBackendUrl()}/api/upload-profile-image, campos "file" + "type"
// ("avatar"|"gallery"), header Authorization: Bearer <mesmo JWT de
// localStorage['dg_session_token']>, resposta esperada { url: "https://..." }.
//
// ATENÇÃO — divergência achada em 29/08/2026 lendo server/db.js: o campo de data
// devolvido é "createdAt" (camelCase), não "created_at" como o briefing original
// desta tarefa descrevia. FormatDiaryDate() abaixo aceita os dois nomes por
// segurança (created_at como fallback), mas o real hoje é createdAt.
//
// O objeto de jogador que já vem no login (completeCloudLogin, js/web2/auth.js)
// inclui avatarUrl/galleryUrls (confirmado em server/db.js: loginPlayer/
// loadOrCreatePlayer/loadPlayerByEmail já selecionam avatar_url/gallery_urls).
// completeCloudLogin grava esse objeto inteiro em localStorage['dg_cloud_profile']
// — GetStoredProfileData() abaixo lê exatamente dali pra popular o perfil ao
// abrir o modal, sem nenhuma chamada de rede extra.
// ============================================================================

var g_myProfileState = {
    displayName: '',
    avatarUrl: null,
    galleryUrls: [],
    diaryEntries: [],
    diaryLoading: false,
    diaryHasMore: false,
    oldestDiaryId: null,
    pendingGallerySlotIndex: null,
    // Modo de visualização (31/08/2026): 'self' = próprio perfil (padrão, editável
    // se autenticado); 'other' = perfil de outro jogador (sempre somente-leitura).
    viewMode: 'self',
    viewingEmail: null,
    viewingCreatedAt: null
};

var DISPLAY_NAME_MAX_LENGTH = 30;   // espelha server/db.js DISPLAY_NAME_MAX_LENGTH
var DIARY_CONTENT_MAX_LENGTH = 5000; // espelha server/db.js DIARY_CONTENT_MAX_LENGTH
var MAX_GALLERY_SIZE = 9;            // espelha server/db.js MAX_GALLERY_SIZE

// ----------------------------------------------------------------------------
// Leitura do estado de login já existente (auth.js) — nunca inventa uma fonte
// nova de verdade, só lê o que completeCloudLogin() já grava.
// ----------------------------------------------------------------------------
function GetStoredProfileData() {
    try {
        var raw = localStorage.getItem('dg_cloud_profile');
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return window.cloudSave || null;
}

function GetCurrentPlayerEmail() {
    var data = GetStoredProfileData();
    if (data && data.email) return data.email;
    try { return localStorage.getItem('dg_cloud_email'); } catch (e) { return null; }
}

function IsPlayerAuthenticated() {
    // Mesmo estado que auth.js/UpdateLoginButtonsVisibility() já usa: fica true só
    // depois de completeCloudLogin() rodar de verdade nesta visita (login manual OU
    // sessão salva) — nunca assume login só porque existe algo em localStorage.
    return !!window.g_hasAuthenticatedThisPageLoad;
}

// Grava de volta em localStorage['dg_cloud_profile'] os campos que acabaram de ser
// confirmados pelo servidor, pra sobreviver a um F5 sem esperar o próximo login.
// Só mescla os campos passados — nunca reescreve o objeto inteiro.
function PersistProfileFieldsLocally(partial) {
    try {
        var raw = localStorage.getItem('dg_cloud_profile');
        var data = raw ? JSON.parse(raw) : {};
        Object.keys(partial).forEach(function (k) { data[k] = partial[k]; });
        localStorage.setItem('dg_cloud_profile', JSON.stringify(data));
        if (partial.name) localStorage.setItem('playerName', partial.name);
    } catch (e) { console.warn('[Profile] Falha ao persistir localmente:', e); }
}

// ----------------------------------------------------------------------------
// Mensagens inline (mesmo padrão de showLoginError/hideLoginError em auth.js:
// container real na UI, alert() só como rede de segurança se o container sumir).
// ----------------------------------------------------------------------------
function ShowProfileError(msg) {
    var okEl = document.getElementById('myProfileSuccessMsg');
    if (okEl) okEl.style.display = 'none';
    var el = document.getElementById('myProfileErrorMsg');
    if (el) { el.textContent = msg; el.style.display = 'block'; } else { alert(msg); }
}
window.ShowProfileError = ShowProfileError;

function ShowProfileSuccess(msg) {
    var errEl = document.getElementById('myProfileErrorMsg');
    if (errEl) errEl.style.display = 'none';
    var el = document.getElementById('myProfileSuccessMsg');
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        clearTimeout(window.g_profileSuccessMsgTimeout);
        window.g_profileSuccessMsgTimeout = setTimeout(function () { el.style.display = 'none'; }, 3500);
    }
}
window.ShowProfileSuccess = ShowProfileSuccess;

// Alias semântico: "Enviando imagem..." é uma mensagem de status transitória, não
// um erro nem exatamente uma confirmação, mas reaproveita o mesmo container visual
// verde de sucesso (sem precisar de um terceiro elemento/estilo só pra isso).
function ShowProfileStatus(msg) { ShowProfileSuccess(msg); }
window.ShowProfileStatus = ShowProfileStatus;

function HideProfileMessages() {
    var errEl = document.getElementById('myProfileErrorMsg');
    var okEl = document.getElementById('myProfileSuccessMsg');
    if (errEl) errEl.style.display = 'none';
    if (okEl) okEl.style.display = 'none';
}
window.HideProfileMessages = HideProfileMessages;

function ShowProfileAuthWarning() {
    var el = document.getElementById('myProfileAuthWarning');
    if (el) el.style.display = 'block';
}
function HideProfileAuthWarning() {
    var el = document.getElementById('myProfileAuthWarning');
    if (el) el.style.display = 'none';
}

// Habilita/desabilita os controles de edição. Usado nos dois sentidos:
//  - modo próprio, sem login: enabled=false (nada pra editar sem estar autenticado).
//  - modo próprio, autenticado: enabled=true.
//  - modo "outro jogador": SEMPRE enabled=false, mesmo autenticado — visualização é
//    sempre somente-leitura, mas isso NÃO é "não autenticado", então o aviso de
//    login (myProfileAuthWarning) é responsabilidade de quem chama esta função, não
//    dela — ver OpenProfileModal()/OpenPlayerProfileModal() abaixo. O grid da
//    galeria também não é mexido aqui: pointer-events dele é responsabilidade de
//    ApplyProfileModalMode(), porque no modo "outro jogador" o grid PRECISA
//    continuar clicável (botão de ampliar foto funciona nos dois modos).
function SetProfileEditingEnabled(enabled) {
    var nameEditBtn = document.getElementById('myProfileNameEditBtn');
    var avatarEditBtn = document.getElementById('myProfileAvatarEditBtn');
    var diaryTextarea = document.getElementById('myDiaryTextarea');
    var diaryPublishBtn = document.getElementById('myDiaryPublishBtn');
    if (nameEditBtn) nameEditBtn.style.display = enabled ? 'inline-block' : 'none';
    if (avatarEditBtn) avatarEditBtn.style.display = enabled ? 'flex' : 'none';
    if (diaryTextarea) diaryTextarea.disabled = !enabled;
    if (diaryPublishBtn) diaryPublishBtn.disabled = !enabled;

    // Amigos: busca de jogadores também exige login (o servidor precisa saber
    // quem está pedindo pra checar pedidos/amizades existentes). Redundante no
    // modo "outro jogador" (a seção inteira fica escondida por
    // ApplyProfileModalMode()), mas inofensivo manter aqui também.
    var friendsSearchInput = document.getElementById('myFriendsSearchInput');
    var friendsSearchBtn = document.getElementById('myFriendsSearchBtn');
    if (friendsSearchInput) friendsSearchInput.disabled = !enabled;
    if (friendsSearchBtn) friendsSearchBtn.disabled = !enabled;
}

// Aplica as diferenças visuais do modo "outro jogador" (31/08/2026) por cima do
// que SetProfileEditingEnabled() já fez: esconde (não só desabilita) tudo que é
// exclusivo de edição — caixa de escrever no time capsule e a seção AMIGOS
// inteira (é sobre o grafo social de quem está OLHANDO, não do perfil aberto) —
// mostra/esconde o botão "← Back" e a linha "Member since", e garante que o
// grid da galeria continua clicável nos dois modos (o botão de ampliar foto
// precisa funcionar tanto no próprio perfil quanto no de outro jogador).
function ApplyProfileModalMode() {
    var isOther = g_myProfileState.viewMode === 'other';

    var diaryCompose = document.querySelector('.my-profile-diary-compose');
    if (diaryCompose) diaryCompose.style.display = isOther ? 'none' : 'flex';

    var friendsSection = document.getElementById('myFriendsSection');
    if (friendsSection) friendsSection.style.display = isOther ? 'none' : 'block';
    // O <h3>FRIENDS</h3> é irmão de #myFriendsSection, não filho — escondido à parte
    // pra não sobrar um título solto sem conteúdo embaixo no modo "outro jogador"
    // (achado no teste manual de 31/08/2026: o contador já mostra "FRIENDS (N)" lá
    // em cima, então um segundo cabeçalho "FRIENDS" vazio no fim do modal é só ruído).
    var friendsSectionTitle = document.getElementById('myFriendsSectionTitle');
    if (friendsSectionTitle) friendsSectionTitle.style.display = isOther ? 'none' : 'block';

    var backBtn = document.getElementById('myProfileBackBtn');
    if (backBtn) backBtn.style.display = isOther ? 'inline-block' : 'none';

    var memberSinceEl = document.getElementById('myProfileMemberSince');
    if (memberSinceEl) memberSinceEl.style.display = isOther ? 'block' : 'none';

    var counterRow = document.getElementById('myFriendsCounterRow');
    if (counterRow) counterRow.style.cursor = isOther ? 'default' : 'pointer';

    var grid = document.getElementById('myProfileGalleryGrid');
    if (grid) grid.style.pointerEvents = isOther ? 'auto' : (IsPlayerAuthenticated() ? 'auto' : 'none');
}

// ----------------------------------------------------------------------------
// Helper genérico de request/response via socket.io, com o mesmo cuidado contra
// listeners duplicados que auth.js/submitCloudSaveAuth() e
// TryAutoLoginFromSession() já documentam (achado 27/08/2026: dois cliques
// rápidos registravam dois pares de listener sem correlação, e o socket.off() do
// primeiro que terminasse cancelava a escuta do outro em silêncio). Cada chamada
// registra seus próprios listeners de sucesso/erro, sempre limpos (cleanup) antes
// de chamar o callback — só uma vez, seja por resposta real ou por timeout.
function emitProfileRequest(eventName, payload, successEvent, errorEvent, onSuccess, onError, timeoutMs) {
    var socket = window.NetworkState && window.NetworkState.socket;
    if (!socket) {
        onError({ message: 'Could not connect to the server.' });
        return;
    }

    var finished = false;
    var timeoutId = setTimeout(function () {
        if (finished) return;
        cleanup();
        onError({ message: 'The server took too long to respond. Check your connection and try again.' });
    }, timeoutMs || 15000);

    function cleanup() {
        finished = true;
        clearTimeout(timeoutId);
        socket.off(successEvent, handleSuccess);
        socket.off(errorEvent, handleError);
    }
    function handleSuccess(data) { if (finished) return; cleanup(); onSuccess(data); }
    function handleError(data) { if (finished) return; cleanup(); onError(data || {}); }

    socket.on(successEvent, handleSuccess);
    socket.on(errorEvent, handleError);
    socket.emit(eventName, payload);
}

// ----------------------------------------------------------------------------
// Abrir / Fechar o modal (modo PRÓPRIO)
// ----------------------------------------------------------------------------
function OpenProfileModal() {
    var modal = document.getElementById('myProfileModal');
    if (!modal) return;
    HideProfileMessages();
    CancelEditDisplayName();

    // Sempre volta pro modo próprio ao abrir por aqui — é o reset "fechar/reabrir"
    // documentado no comentário do topo do arquivo (a outra forma de sair do modo
    // "outro jogador" além do botão "← Back", ver GoBackToOwnProfile()).
    g_myProfileState.viewMode = 'self';
    g_myProfileState.viewingEmail = null;
    g_myProfileState.viewingCreatedAt = null;

    if (!IsPlayerAuthenticated()) {
        SetProfileEditingEnabled(false);
        ShowProfileAuthWarning();
        ApplyProfileModalMode();
        RenderProfileHeader();
        RenderGallery();
        RenderDiaryList();
        // Sem login não há "meu" e-mail pra buscar/pedir amizade — zera a seção
        // AMIGOS em vez de deixar dados de uma sessão anterior visíveis (ver
        // ResetFriendsUI() em friends.js).
        if (typeof ResetFriendsUI === 'function') ResetFriendsUI();
        modal.style.display = 'flex';
        return;
    }

    SetProfileEditingEnabled(true);
    HideProfileAuthWarning();
    ApplyProfileModalMode();
    var stored = GetStoredProfileData() || {};
    g_myProfileState.displayName = stored.name || localStorage.getItem('playerName') || 'Ghost';
    g_myProfileState.avatarUrl = stored.avatarUrl || null;
    g_myProfileState.galleryUrls = Array.isArray(stored.galleryUrls) ? stored.galleryUrls.slice(0, MAX_GALLERY_SIZE) : [];

    RenderProfileHeader();
    RenderGallery();
    modal.style.display = 'flex';

    LoadDiaryEntries(true);
    // Amigos (31/08/2026): contador + lista carregam via get_friends, pedidos
    // pendentes via get_friend_requests — ambos disparados aqui junto com o
    // diário, ao abrir o perfil (ver LoadFriends()/LoadFriendRequests() em
    // friends.js; este modal não tem abas separadas, então "abrir a aba de
    // amigos" e "abrir o perfil" acontecem no mesmo instante).
    if (typeof LoadFriends === 'function') LoadFriends();
    if (typeof LoadFriendRequests === 'function') LoadFriendRequests();
}
window.OpenProfileModal = OpenProfileModal;

// ----------------------------------------------------------------------------
// Abrir o modal em modo "OUTRO JOGADOR" (31/08/2026) — somente-leitura, chamado
// a partir de um clique num resultado de busca ou item da lista de amigos (ver
// friends.js). Exige estar autenticado (mesma regra de sempre: sem "quem está
// vendo", o servidor não tem pra quem responder no socket) — mas note que isso
// é diferente de "sem permissão pra editar o perfil visto": aqui o VIEWER está
// logado, só o PERFIL ABERTO é que nunca é editável neste modo.
function OpenPlayerProfileModal(email) {
    if (!email) return;
    var modal = document.getElementById('myProfileModal');
    if (!modal) return;
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to view other players’ profiles.'); return; }

    HideProfileMessages();
    CancelEditDisplayName();

    g_myProfileState.viewMode = 'other';
    g_myProfileState.viewingEmail = email;
    g_myProfileState.viewingCreatedAt = null;
    g_myProfileState.displayName = '';
    g_myProfileState.avatarUrl = null;
    g_myProfileState.galleryUrls = [];
    g_myProfileState.diaryEntries = [];
    g_myProfileState.oldestDiaryId = null;
    g_myProfileState.diaryHasMore = false;

    SetProfileEditingEnabled(false);
    HideProfileAuthWarning(); // quem está vendo ESTÁ autenticado — esconde o aviso de login
    ApplyProfileModalMode();
    RenderProfileHeader();
    RenderGallery();
    RenderDiaryList();
    UpdateFriendsCounter(0);
    RenderMemberSince(null);
    modal.style.display = 'flex';

    ShowProfileStatus('Loading profile...');
    emitProfileRequest('get_player_profile', { email: email }, 'player_profile_loaded', 'player_profile_error',
        function (data) {
            // Confere se o modal ainda está mostrando ESTE jogador — se o jogador
            // clicou em outro perfil (ou voltou pro próprio) antes desta resposta
            // chegar, a resposta antiga não deve mais pisar no estado atual.
            if (g_myProfileState.viewMode !== 'other' || g_myProfileState.viewingEmail !== email) return;

            HideProfileMessages();
            g_myProfileState.displayName = (data && data.name) || 'Ghost';
            g_myProfileState.avatarUrl = (data && data.avatarUrl) || null;
            g_myProfileState.galleryUrls = (data && Array.isArray(data.galleryUrls)) ? data.galleryUrls.slice(0, MAX_GALLERY_SIZE) : [];
            g_myProfileState.viewingCreatedAt = data && data.createdAt;

            RenderProfileHeader();
            RenderGallery();
            UpdateFriendsCounter((data && typeof data.friendCount === 'number') ? data.friendCount : 0);
            RenderMemberSince(g_myProfileState.viewingCreatedAt);
            LoadDiaryEntries(true);
        },
        function (err) {
            if (g_myProfileState.viewMode !== 'other' || g_myProfileState.viewingEmail !== email) return;
            ShowProfileError((err && err.message) || 'Error loading this profile.');
        }
    );
}
window.OpenPlayerProfileModal = OpenPlayerProfileModal;

// Botão "← BACK TO MY PROFILE" (só visível no modo "outro jogador"): reabre o
// modal em modo próprio sem precisar fechar — reaproveita OpenProfileModal(),
// que já reseta viewMode pra 'self' no início.
function GoBackToOwnProfile() {
    OpenProfileModal();
}
window.GoBackToOwnProfile = GoBackToOwnProfile;

function CloseProfileModal() {
    var modal = document.getElementById('myProfileModal');
    if (modal) modal.style.display = 'none';
    CancelEditDisplayName();
    HideProfileMessages();
    // Limpa só a BUSCA de amigos (não amigos/pedidos/contador — ver comentário de
    // ClearFriendsSearchOnClose() em friends.js, achado em QA 31/08/2026): cancela
    // debounce pendente (senão SearchPlayers() dispara depois do modal já fechado)
    // e evita mostrar resultado de busca de uma sessão anterior ao reabrir.
    if (typeof ClearFriendsSearchOnClose === 'function') ClearFriendsSearchOnClose();
}
window.CloseProfileModal = CloseProfileModal;

// ----------------------------------------------------------------------------
// Cabeçalho: avatar + nome de exibição
// ----------------------------------------------------------------------------
function RenderProfileHeader() {
    var nameEl = document.getElementById('myProfileNameDisplay');
    if (nameEl) nameEl.textContent = g_myProfileState.displayName || 'Ghost';

    var img = document.getElementById('myProfileAvatarImg');
    var placeholder = document.getElementById('myProfileAvatarPlaceholder');
    if (g_myProfileState.avatarUrl) {
        if (img) { img.src = g_myProfileState.avatarUrl; img.style.display = 'block'; }
        if (placeholder) placeholder.style.display = 'none';
    } else {
        if (img) img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
    }
}

// "Member since <Mês> <Ano>" (ex: "Member since March 2026") — só usado no modo
// "outro jogador", a partir de player_profile_loaded.createdAt. Formato decidido
// nesta tarefa: mês por extenso + ano, sempre em inglês (independente do idioma
// do navegador), sem dia/hora — é uma marca de "há quanto tempo" a conta existe,
// não um timestamp preciso como as entradas do time capsule (FormatDiaryDate()).
function FormatMemberSince(createdAt) {
    if (!createdAt) return '';
    var d = new Date(createdAt);
    if (isNaN(d.getTime())) return '';
    try {
        return 'Member since ' + d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
        return 'Member since ' + d.getFullYear();
    }
}
window.FormatMemberSince = FormatMemberSince;

function RenderMemberSince(createdAt) {
    var el = document.getElementById('myProfileMemberSince');
    if (!el) return;
    el.textContent = FormatMemberSince(createdAt);
}

function EnableEditDisplayName() {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to edit your name.'); return; }
    var displayRow = document.getElementById('myProfileNameDisplayRow');
    var editRow = document.getElementById('myProfileNameEditRow');
    var input = document.getElementById('myProfileNameInput');
    if (displayRow) displayRow.classList.add('hidden');
    if (editRow) editRow.classList.add('active');
    if (input) { input.value = g_myProfileState.displayName || ''; input.focus(); }
}
window.EnableEditDisplayName = EnableEditDisplayName;

function CancelEditDisplayName() {
    var displayRow = document.getElementById('myProfileNameDisplayRow');
    var editRow = document.getElementById('myProfileNameEditRow');
    if (displayRow) displayRow.classList.remove('hidden');
    if (editRow) editRow.classList.remove('active');
}
window.CancelEditDisplayName = CancelEditDisplayName;

function SaveDisplayName() {
    HideProfileMessages();
    var input = document.getElementById('myProfileNameInput');
    var name = input ? input.value.trim() : '';
    if (!name) { ShowProfileError('Enter a display name.'); return; }
    if (name.length > DISPLAY_NAME_MAX_LENGTH) {
        ShowProfileError('Display name can be at most ' + DISPLAY_NAME_MAX_LENGTH + ' characters.');
        return;
    }

    var btn = document.getElementById('myProfileNameSaveBtn');
    if (btn) btn.disabled = true;

    emitProfileRequest('update_profile', { displayName: name }, 'profile_updated', 'profile_error',
        function (data) {
            if (btn) btn.disabled = false;
            g_myProfileState.displayName = (data && data.name) || name;
            PersistProfileFieldsLocally({ name: g_myProfileState.displayName });
            RenderProfileHeader();
            CancelEditDisplayName();
            ShowProfileSuccess('Name updated!');
        },
        function (err) {
            if (btn) btn.disabled = false;
            ShowProfileError((err && err.message) || 'Error saving name.');
        }
    );
}
window.SaveDisplayName = SaveDisplayName;

// ----------------------------------------------------------------------------
// Upload de imagem — POST multipart pro próprio backend do jogo
// ----------------------------------------------------------------------------
// Mudança de arquitetura (29/08/2026, decisão do usuário): a primeira versão
// desta função tentava subir o arquivo direto navegador -> Supabase Storage com
// o SDK JS (window.SUPABASE_URL/SUPABASE_ANON_KEY, nunca configurados de
// propósito — a função sempre rejeitava com um erro claro até este ponto).
// Descartada porque este projeto não usa Supabase Auth (login é JWT custom, ver
// js/web2/auth.js) — não tinha como restringir quem sobe arquivo sem abrir a
// anon key geral pra qualquer visitante do site.
// Desenho novo: o navegador manda o arquivo pro backend Node do próprio jogo
// (POST /api/upload-profile-image, multipart/form-data, campos "file" + "type"
// = "avatar"|"gallery"), autenticado com o mesmo token JWT de sessão que
// auth.js já salva em localStorage['dg_session_token'] (TryAutoLoginFromSession)
// — só o servidor fala com o Supabase Storage, com a service_role key, que nunca
// chega no cliente. A URL do backend é a mesma que o socket.io já usa
// (GetBackendUrl(), js/game/network.js) — nunca hardcoda outro host aqui.
// Rota implementada por outro agente em server/index.js em paralelo a esta
// mudança; nome do campo de resposta ("url") é o combinado na tarefa — confira
// contra o código real do servidor se o upload passar a falhar silenciosamente
// no .then() abaixo.
function UploadProfileImage(file, type) {
    return new Promise(function (resolve, reject) {
        if (!file) { reject(new Error('No file selected.')); return; }

        var token = null;
        try { token = localStorage.getItem('dg_session_token'); } catch (e) {}
        if (!token) {
            reject(new Error('Log in to upload an image.'));
            return;
        }

        var formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        var backendUrl = (typeof window.GetBackendUrl === 'function') ? window.GetBackendUrl() : window.location.origin;

        fetch(backendUrl + '/api/upload-profile-image', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        })
            .then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (data) {
                    if (!res.ok) {
                        var msg = (data && data.message) || ('Image upload failed (HTTP ' + res.status + ').');
                        throw new Error(msg);
                    }
                    return data;
                });
            })
            .then(function (data) {
                var publicUrl = data && data.url;
                if (!publicUrl) {
                    reject(new Error('Upload finished, but the server did not return the image URL.'));
                    return;
                }
                resolve(publicUrl);
            })
            .catch(function (err) {
                reject(new Error((err && err.message) || 'Unexpected error uploading the image.'));
            });
    });
}
window.UploadProfileImage = UploadProfileImage;

// ----------------------------------------------------------------------------
// Avatar
// ----------------------------------------------------------------------------
function TriggerAvatarFileSelect() {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to change your avatar.'); return; }
    var input = document.getElementById('myProfileAvatarFileInput');
    if (input) { input.value = ''; input.click(); }
}
window.TriggerAvatarFileSelect = TriggerAvatarFileSelect;

function HandleAvatarFileSelected(inputEl) {
    HideProfileMessages();
    var file = inputEl.files && inputEl.files[0];
    if (!file) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
        ShowProfileError('Select an image file.');
        return;
    }

    var previousUrl = g_myProfileState.avatarUrl;

    // Preview local imediato (antes do upload terminar) — pedido explícito da tarefa.
    var previewUrl = URL.createObjectURL(file);
    g_myProfileState.avatarUrl = previewUrl;
    RenderProfileHeader();
    ShowProfileStatus('Uploading image...');

    UploadProfileImage(file, 'avatar')
        .then(function (publicUrl) {
            g_myProfileState.avatarUrl = publicUrl;
            RenderProfileHeader();
            emitProfileRequest('update_profile', { avatarUrl: publicUrl }, 'profile_updated', 'profile_error',
                function (data) {
                    var finalUrl = (data && data.avatarUrl) || publicUrl;
                    g_myProfileState.avatarUrl = finalUrl;
                    RenderProfileHeader();
                    PersistProfileFieldsLocally({ avatarUrl: finalUrl });
                    ShowProfileSuccess('Avatar updated!');
                },
                function (err) {
                    ShowProfileError((err && err.message) || 'The image was uploaded, but there was an error saving it to your profile.');
                }
            );
        })
        .catch(function (err) {
            g_myProfileState.avatarUrl = previousUrl;
            RenderProfileHeader();
            ShowProfileError(err.message || 'Failed to upload the image.');
        });
}
window.HandleAvatarFileSelected = HandleAvatarFileSelected;

// ----------------------------------------------------------------------------
// Galeria (grid 3x3 = 9 slots no modo próprio). A galeria é tratada como uma
// lista COMPACTA (índices 0..N-1 preenchidos, o resto "+ adicionar") porque o
// servidor exige um array só de URLs válidas, sem buracos no meio (ver
// comentário no topo do arquivo) — remover uma foto do meio desloca as
// seguintes, como uma lista normal, não como "slots" fixos e independentes.
//
// Modo "outro jogador" (31/08/2026): só as fotos que realmente existem, sem
// slots vazios "+ ADD PHOTO" (não faz sentido oferecer adicionar foto de quem
// não é você). Botão de AMPLIAR sempre presente em toda foto preenchida, nos
// dois modos — mesma RenderGallerySlot() desenha os dois casos, só o parâmetro
// allowEdit muda (controla se o overlay de trocar/remover é desenhado).
// ----------------------------------------------------------------------------
function RenderGallery() {
    var grid = document.getElementById('myProfileGalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (g_myProfileState.viewMode === 'other') {
        if (g_myProfileState.galleryUrls.length === 0) {
            var emptyMsg = document.createElement('div');
            emptyMsg.className = 'my-gallery-empty-view-msg';
            emptyMsg.textContent = 'No photos yet.';
            grid.appendChild(emptyMsg);
            return;
        }
        g_myProfileState.galleryUrls.forEach(function (url, i) {
            grid.appendChild(RenderGallerySlot(i, url, false));
        });
        return;
    }

    for (var i = 0; i < MAX_GALLERY_SIZE; i++) {
        grid.appendChild(RenderGallerySlot(i, g_myProfileState.galleryUrls[i] || null, true));
    }
}

function RenderGallerySlot(index, url, allowEdit) {
    var slot = document.createElement('div');
    slot.className = 'my-profile-gallery-slot' + (url ? '' : ' empty');

    var media = document.createElement('div');
    media.className = 'my-gallery-slot-media';

    if (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Gallery photo ' + (index + 1);
        media.appendChild(img);

        if (allowEdit) {
            var overlay = document.createElement('div');
            overlay.className = 'my-profile-gallery-overlay';

            var changeBtn = document.createElement('button');
            changeBtn.type = 'button';
            changeBtn.title = 'Change photo';
            changeBtn.setAttribute('aria-label', 'Change photo');
            changeBtn.textContent = '✏️'; // lapis (trocar)
            changeBtn.onclick = function (e) { e.stopPropagation(); TriggerGallerySlotFileSelect(index); };
            overlay.appendChild(changeBtn);

            var removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-btn';
            removeBtn.title = 'Remove photo';
            removeBtn.setAttribute('aria-label', 'Remove photo');
            removeBtn.textContent = '✖'; // X (remover)
            removeBtn.onclick = function (e) { e.stopPropagation(); RemoveGalleryPhoto(index); };
            overlay.appendChild(removeBtn);

            media.appendChild(overlay);
            // Em touch (sem :hover) o overlay não aparece sozinho — a própria foto
            // também é clicável e abre direto a troca, então o toque continua funcionando.
            media.onclick = function () { TriggerGallerySlotFileSelect(index); };
        }
    } else {
        var plus = document.createElement('div');
        plus.className = 'plus-icon';
        plus.textContent = '+';
        media.appendChild(plus);

        var label = document.createElement('div');
        label.textContent = 'ADD PHOTO';
        media.appendChild(label);

        media.onclick = function () { TriggerGallerySlotFileSelect(index); };
    }
    slot.appendChild(media);

    // Faixa fixa embaixo de CADA foto (31/08/2026): botão de ampliar, sempre
    // visível (nunca atrás de :hover — ver css/style.css), idêntico nos modos
    // próprio e "outro jogador". Slots vazios ganham a mesma faixa, só que como
    // espaçador invisível, unicamente pra manter as 9 células do grid com a
    // mesma altura total (ver comentário em css/style.css).
    var footer = document.createElement('div');
    footer.className = 'my-gallery-slot-footer';
    if (url) {
        var zoomBtn = document.createElement('button');
        zoomBtn.type = 'button';
        zoomBtn.className = 'my-gallery-zoom-btn';
        zoomBtn.title = 'Enlarge photo';
        zoomBtn.setAttribute('aria-label', 'Enlarge photo');
        zoomBtn.textContent = '\u{1F50D} ENLARGE';
        zoomBtn.onclick = function (e) { e.stopPropagation(); OpenGalleryLightbox(url); };
        footer.appendChild(zoomBtn);
    } else {
        footer.className += ' my-gallery-slot-footer-spacer';
    }
    slot.appendChild(footer);

    return slot;
}
window.RenderGallerySlot = RenderGallerySlot;

function TriggerGallerySlotFileSelect(index) {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to edit your gallery.'); return; }
    g_myProfileState.pendingGallerySlotIndex = index;
    var input = document.getElementById('myProfileGalleryFileInput');
    if (input) { input.value = ''; input.click(); }
}
window.TriggerGallerySlotFileSelect = TriggerGallerySlotFileSelect;

function HandleGalleryFileSelected(inputEl) {
    HideProfileMessages();
    var file = inputEl.files && inputEl.files[0];
    var index = g_myProfileState.pendingGallerySlotIndex;
    if (!file || index === null || index === undefined) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
        ShowProfileError('Select an image file.');
        return;
    }

    var previousUrls = g_myProfileState.galleryUrls.slice();

    // Preview local imediato (blob: URL) só na UI — nunca é enviado ao servidor,
    // é sempre trocado pela URL real do Supabase (ou revertido) quando o upload
    // termina, em SaveGalleryUrls()/no .catch() abaixo.
    var previewUrl = URL.createObjectURL(file);
    var previewUrls = previousUrls.slice();
    previewUrls[index] = previewUrl;
    g_myProfileState.galleryUrls = previewUrls;
    RenderGallery();
    ShowProfileStatus('Uploading photo...');

    UploadProfileImage(file, 'gallery')
        .then(function (publicUrl) {
            var finalUrls = previousUrls.slice();
            finalUrls[index] = publicUrl;
            // Compacta: descarta qualquer buraco/URL local antes de mandar pro servidor
            // (ele exige every() válido — ver comentário no topo do arquivo).
            finalUrls = finalUrls.filter(function (u) { return typeof u === 'string' && u.indexOf('https://') === 0; });
            SaveGalleryUrls(finalUrls, previousUrls);
        })
        .catch(function (err) {
            g_myProfileState.galleryUrls = previousUrls;
            RenderGallery();
            ShowProfileError(err.message || 'Failed to upload the photo.');
        });
}
window.HandleGalleryFileSelected = HandleGalleryFileSelected;

function RemoveGalleryPhoto(index) {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to edit your gallery.'); return; }
    var previousUrls = g_myProfileState.galleryUrls.slice();
    var newUrls = previousUrls.slice();
    newUrls.splice(index, 1);
    g_myProfileState.galleryUrls = newUrls;
    RenderGallery();
    SaveGalleryUrls(newUrls, previousUrls);
}
window.RemoveGalleryPhoto = RemoveGalleryPhoto;

function SaveGalleryUrls(newUrls, rollbackUrls) {
    HideProfileMessages();
    emitProfileRequest('update_profile', { galleryUrls: newUrls }, 'profile_updated', 'profile_error',
        function (data) {
            g_myProfileState.galleryUrls = (data && Array.isArray(data.galleryUrls)) ? data.galleryUrls : newUrls;
            RenderGallery();
            PersistProfileFieldsLocally({ galleryUrls: g_myProfileState.galleryUrls });
            ShowProfileSuccess('Gallery updated!');
        },
        function (err) {
            if (rollbackUrls) { g_myProfileState.galleryUrls = rollbackUrls; RenderGallery(); }
            ShowProfileError((err && err.message) || 'Error saving the gallery.');
        }
    );
}

// ----------------------------------------------------------------------------
// Gallery Photo Lightbox (31/08/2026): amplia uma foto da galeria em overlay
// por cima de tudo — mesmo comportamento pro perfil próprio e pro de outro
// jogador (chamado por RenderGallerySlot() acima, nos dois modos). z-index bem
// acima de 10000 (ver css/style.css) pra sempre ficar por cima do
// #myProfileModal já aberto por baixo. Fecha clicando fora da imagem (ver
// onclick inline em index.html), no botão X, ou tecla Esc (listener abaixo).
// ----------------------------------------------------------------------------
function OpenGalleryLightbox(url) {
    if (!url) return;
    var overlay = document.getElementById('galleryLightbox');
    var img = document.getElementById('galleryLightboxImg');
    if (!overlay || !img) return;
    img.src = url;
    overlay.style.display = 'flex';
}
window.OpenGalleryLightbox = OpenGalleryLightbox;

function CloseGalleryLightbox() {
    var overlay = document.getElementById('galleryLightbox');
    var img = document.getElementById('galleryLightboxImg');
    if (overlay) overlay.style.display = 'none';
    if (img) img.src = '';
}
window.CloseGalleryLightbox = CloseGalleryLightbox;

document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.key !== 'Esc') return;
    var overlay = document.getElementById('galleryLightbox');
    if (overlay && overlay.style.display !== 'none') CloseGalleryLightbox();
});

// ----------------------------------------------------------------------------
// Time Capsule (antigo "Diário"/blog cronológico — renomeado na UI em
// 31/08/2026, ver comentário no topo do arquivo). IDs/eventos continuam
// "diary"/"myDiary*" de propósito.
// ----------------------------------------------------------------------------
function FormatDiaryDate(entry) {
    var raw = entry && (entry.createdAt !== undefined ? entry.createdAt : entry.created_at);
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    try {
        return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return d.toLocaleString();
    }
}
window.FormatDiaryDate = FormatDiaryDate;

function RenderDiaryEntryNode(entry) {
    var el = document.createElement('div');
    el.className = 'diary-entry';

    var dateEl = document.createElement('div');
    dateEl.className = 'diary-entry-date';
    dateEl.textContent = FormatDiaryDate(entry);
    el.appendChild(dateEl);

    var contentEl = document.createElement('div');
    contentEl.className = 'diary-entry-content';
    contentEl.textContent = entry.content || ''; // textContent (não innerHTML) — nunca interpreta o texto do jogador como HTML
    el.appendChild(contentEl);

    return el;
}

function RenderDiaryList() {
    var list = document.getElementById('myDiaryList');
    var emptyState = document.getElementById('myDiaryEmptyState');
    if (!list) return;
    list.innerHTML = '';

    if (g_myProfileState.diaryEntries.length === 0) {
        if (emptyState) {
            // Texto diferente no modo "outro jogador" — não faz sentido convidar quem
            // está vendo a "escrever a primeira" no time capsule alheio.
            emptyState.textContent = (g_myProfileState.viewMode === 'other')
                ? 'This player hasn’t added any time capsule entries yet.'
                : 'No entries yet — write the first one!';
            emptyState.style.display = g_myProfileState.diaryLoading ? 'none' : 'block';
        }
        return;
    }
    if (emptyState) emptyState.style.display = 'none';
    g_myProfileState.diaryEntries.forEach(function (entry) {
        list.appendChild(RenderDiaryEntryNode(entry));
    });
}

function SetDiaryLoadingUI(isLoading) {
    var loadingEl = document.getElementById('myDiaryLoadingState');
    if (loadingEl) loadingEl.style.display = isLoading ? 'block' : 'none';
    var moreBtn = document.getElementById('myDiaryLoadMoreBtn');
    if (moreBtn) moreBtn.disabled = isLoading;
}

// reset=true: recarrega a primeira página do zero (ex: ao abrir o modal).
// reset=false: pede a próxima página (beforeId = id da última entrada já carregada).
// Modo "outro jogador" (31/08/2026): manda `email` no payload (leitura pública do
// diário de outro jogador — ver contrato no topo do arquivo); modo próprio nunca
// manda `email`, comportamento idêntico a antes.
function LoadDiaryEntries(reset) {
    if (!IsPlayerAuthenticated()) return;
    if (g_myProfileState.diaryLoading) return;

    if (reset) {
        g_myProfileState.diaryEntries = [];
        g_myProfileState.oldestDiaryId = null;
        g_myProfileState.diaryHasMore = false;
        RenderDiaryList();
        var moreBtnReset = document.getElementById('myDiaryLoadMoreBtn');
        if (moreBtnReset) moreBtnReset.style.display = 'none';
    }

    g_myProfileState.diaryLoading = true;
    SetDiaryLoadingUI(true);
    var emptyState = document.getElementById('myDiaryEmptyState');
    if (emptyState) emptyState.style.display = 'none';

    var payload = { limit: 20 };
    if (g_myProfileState.viewMode === 'other' && g_myProfileState.viewingEmail) {
        payload.email = g_myProfileState.viewingEmail;
    }
    if (!reset && g_myProfileState.oldestDiaryId !== null) payload.beforeId = g_myProfileState.oldestDiaryId;

    var requestedEmail = g_myProfileState.viewingEmail;
    var requestedMode = g_myProfileState.viewMode;

    emitProfileRequest('get_diary_entries', payload, 'diary_entries_loaded', 'diary_error',
        function (data) {
            g_myProfileState.diaryLoading = false;
            SetDiaryLoadingUI(false);
            // Mesma proteção contra resposta atrasada de um perfil que não é mais o
            // que está aberto (ver OpenPlayerProfileModal()).
            if (g_myProfileState.viewMode !== requestedMode || g_myProfileState.viewingEmail !== requestedEmail) return;

            var entries = (data && Array.isArray(data.entries)) ? data.entries : [];
            g_myProfileState.diaryEntries = g_myProfileState.diaryEntries.concat(entries);
            if (entries.length > 0) {
                g_myProfileState.oldestDiaryId = entries[entries.length - 1].id;
            }
            // hasMore vem pronto do servidor (server/db.js getDiaryEntries busca limit+1 pra
            // saber se existe próxima página) — usa direto; o length>=limit é só um fallback
            // pro caso (não esperado) do campo não vir.
            g_myProfileState.diaryHasMore = (data && typeof data.hasMore === 'boolean') ? data.hasMore : (entries.length >= 20);

            RenderDiaryList();
            var moreBtn = document.getElementById('myDiaryLoadMoreBtn');
            if (moreBtn) moreBtn.style.display = g_myProfileState.diaryHasMore ? 'block' : 'none';
        },
        function (err) {
            g_myProfileState.diaryLoading = false;
            SetDiaryLoadingUI(false);
            if (g_myProfileState.viewMode !== requestedMode || g_myProfileState.viewingEmail !== requestedEmail) return;
            RenderDiaryList();
            ShowProfileError((err && err.message) || 'Error loading the time capsule.');
        }
    );
}
window.LoadDiaryEntries = LoadDiaryEntries;

function LoadMoreDiaryEntries() { LoadDiaryEntries(false); }
window.LoadMoreDiaryEntries = LoadMoreDiaryEntries;

function UpdateDiaryCharCount() {
    var textarea = document.getElementById('myDiaryTextarea');
    var counter = document.getElementById('myDiaryCharCount');
    if (!textarea || !counter) return;
    counter.textContent = textarea.value.length + ' / ' + DIARY_CONTENT_MAX_LENGTH;
}
window.UpdateDiaryCharCount = UpdateDiaryCharCount;

function SubmitDiaryEntry() {
    HideProfileMessages();
    if (!IsPlayerAuthenticated()) { ShowProfileError('Log in to add a time capsule entry.'); return; }
    // Defensivo: a caixa de escrever fica escondida no modo "outro jogador" (ver
    // ApplyProfileModalMode()), mas esta função é global — nunca confia só no
    // CSS pra impedir publicar na conta errada.
    if (g_myProfileState.viewMode === 'other') { ShowProfileError('You can only add entries to your own time capsule.'); return; }

    var textarea = document.getElementById('myDiaryTextarea');
    var content = textarea ? textarea.value.trim() : '';
    if (!content) { ShowProfileError('Write something before publishing.'); return; }
    if (content.length > DIARY_CONTENT_MAX_LENGTH) {
        ShowProfileError('Time capsule entries can be at most ' + DIARY_CONTENT_MAX_LENGTH + ' characters.');
        return;
    }

    var btn = document.getElementById('myDiaryPublishBtn');
    if (btn) btn.disabled = true;

    emitProfileRequest('post_diary_entry', { content: content }, 'diary_entry_posted', 'diary_error',
        function (entry) {
            if (btn) btn.disabled = false;
            if (textarea) textarea.value = '';
            UpdateDiaryCharCount();
            // Adiciona no topo (mais recente primeiro) sem recarregar a lista inteira.
            g_myProfileState.diaryEntries.unshift(entry);
            RenderDiaryList();
            ShowProfileSuccess('Published!');
        },
        function (err) {
            if (btn) btn.disabled = false;
            ShowProfileError((err && err.message) || 'Error publishing the entry.');
        }
    );
}
window.SubmitDiaryEntry = SubmitDiaryEntry;
