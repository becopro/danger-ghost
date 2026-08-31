// web2/friends.js
// ============================================================================
// Sistema de amizades (31/08/2026): busca de jogadores, pedido de amizade,
// pedidos pendentes e lista de amigos — nova seção "AMIGOS" dentro do modal de
// perfil já existente (#myProfileModal, ver index.html). Este arquivo depende
// de profile.js já ter carregado antes (reaproveita emitProfileRequest(),
// ShowProfileError()/ShowProfileSuccess()/HideProfileMessages(),
// IsPlayerAuthenticated() e GetCurrentPlayerEmail() de lá em vez de duplicar —
// todos são funções globais clássicas, mesmo escopo <script> do resto do
// projeto, então funcionam sem import nenhum).
//
// CONTRATO COM O BACKEND (server/index.js + server/db.js) — CONFIRMADO contra o
// código real do servidor em 31/08/2026 (o outro agente já tinha terminado a
// implementação quando este arquivo foi revisado; a primeira versão deste
// comentário foi escrita ANTES disso existir e listava tudo sob
// 'friend_request_error' por suposição — corrigido depois de ler
// server/index.js linha a linha):
//   socket.emit('search_players', { query })
//     -> 'players_found' ({ results: [{email, name, avatarUrl}] }) / 'friend_search_error' ({ message })
//     ATENÇÃO: esta é a ÚNICA chamada com evento de erro PRÓPRIO
//     ('friend_search_error', não 'friend_request_error') — divergência real
//     encontrada no código do servidor (server/index.js linha ~501/505/514).
//     Rate-limited (20 buscas/min por IP); mínimo 2 caracteres, valendo tanto
//     no cliente (FRIENDS_SEARCH_MIN_LENGTH abaixo) quanto no servidor
//     (db.js FRIEND_SEARCH_MIN_QUERY_LENGTH) — os dois já concordam.
//   socket.emit('send_friend_request', { toEmail })
//     -> 'friend_request_sent' ({ toEmail, autoAccepted }) / 'friend_request_error' ({ message })
//   socket.emit('get_friend_requests', {})
//     -> 'friend_requests_loaded' ({ requests: [{fromEmail, fromName, fromAvatarUrl, createdAt}] }) / 'friend_request_error'
//   socket.emit('respond_friend_request', { fromEmail, accept })
//     -> 'friend_request_responded' ({ fromEmail, accepted }) / 'friend_request_error'
//   socket.emit('get_friends', {})
//     -> 'friends_loaded' ({ friends: [{email, name, avatarUrl}], count }) / 'friend_request_error'
// ============================================================================

var g_myFriendsState = {
    friends: [],
    friendCount: 0,
    pendingRequests: [],
    searchResults: [],
    searchLoading: false,
    // email -> true: marcado localmente assim que 'friend_request_sent' volta
    // nesta sessão. A busca (players_found) não informa se já existe um pedido
    // pendente, então é a única forma de a UI saber disso sem re-perguntar ao
    // servidor a cada resultado renderizado.
    sentRequestEmails: {},
    searchDebounceTimer: null
};

var FRIENDS_SEARCH_DEBOUNCE_MS = 400; // pausa de digitação antes de buscar sozinho
var FRIENDS_SEARCH_MIN_LENGTH = 2;    // menos que isso não dispara busca (nem automática nem manual)

// ----------------------------------------------------------------------------
// Avatar pequeno reaproveitado nas 3 listas (busca, pedidos, amigos) — mesmo
// fallback visual (👻) do avatar grande do cabeçalho do perfil.
// ----------------------------------------------------------------------------
function BuildFriendAvatarNode(avatarUrl, altText) {
    if (avatarUrl) {
        var img = document.createElement('img');
        img.className = 'my-friend-item-avatar';
        img.src = avatarUrl;
        img.alt = altText || 'Avatar';
        return img;
    }
    var placeholder = document.createElement('div');
    placeholder.className = 'my-friend-item-avatar my-friend-item-avatar-placeholder';
    placeholder.textContent = '\u{1F47B}'; // 👻
    return placeholder;
}

// ----------------------------------------------------------------------------
// Contador de amigos — proeminente no cabeçalho do perfil, perto do nome.
// ----------------------------------------------------------------------------
function UpdateFriendsCounter(count) {
    g_myFriendsState.friendCount = count || 0;
    var el = document.getElementById('myFriendsCounterValue');
    if (el) el.textContent = String(g_myFriendsState.friendCount);
}
window.UpdateFriendsCounter = UpdateFriendsCounter;

function ScrollToFriendsSection() {
    var section = document.getElementById('myFriendsSection');
    if (section && section.scrollIntoView) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.ScrollToFriendsSection = ScrollToFriendsSection;

// ----------------------------------------------------------------------------
// Lista de amigos confirmados — carregada via get_friends ao abrir o perfil
// (chamada em profile.js/OpenProfileModal(), não aqui, pra manter a orquestração
// de "o que carrega quando o modal abre" num único lugar, igual já acontece com
// LoadDiaryEntries()).
// ----------------------------------------------------------------------------
function LoadFriends() {
    if (!IsPlayerAuthenticated()) return;
    emitProfileRequest('get_friends', {}, 'friends_loaded', 'friend_request_error',
        function (data) {
            var friends = (data && Array.isArray(data.friends)) ? data.friends : [];
            var count = (data && typeof data.count === 'number') ? data.count : friends.length;
            g_myFriendsState.friends = friends;
            RenderFriendsList(friends);
            UpdateFriendsCounter(count);
            // Resultados de busca já na tela podem precisar trocar "ADICIONAR" por
            // "JÁ SÃO AMIGOS" agora que a lista de amigos foi (re)carregada.
            if (g_myFriendsState.searchResults.length > 0) RenderSearchResults(g_myFriendsState.searchResults);
        },
        function (err) {
            ShowProfileError((err && err.message) || 'Erro ao carregar lista de amigos.');
        }
    );
}
window.LoadFriends = LoadFriends;

function RenderFriendsList(friends) {
    var list = document.getElementById('myFriendsList');
    var emptyState = document.getElementById('myFriendsListEmptyState');
    if (!list) return;
    list.innerHTML = '';

    if (!friends || friends.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    friends.forEach(function (friend) {
        var item = document.createElement('div');
        item.className = 'my-friend-item';
        item.appendChild(BuildFriendAvatarNode(friend.avatarUrl, friend.name));

        var nameEl = document.createElement('div');
        nameEl.className = 'my-friend-item-name';
        nameEl.textContent = friend.name || friend.email || 'Jogador';
        item.appendChild(nameEl);

        list.appendChild(item);
    });
}
window.RenderFriendsList = RenderFriendsList;

// ----------------------------------------------------------------------------
// Pedidos recebidos pendentes — carregada via get_friend_requests ao abrir a
// seção/aba de amigos. Como este modal não tem abas de verdade (é uma coluna
// única rolável — ver comentário em index.html), "abrir a aba de amigos"
// acontece no mesmo momento que "abrir o perfil": ambos disparam junto em
// OpenProfileModal() (profile.js).
// ----------------------------------------------------------------------------
function LoadFriendRequests() {
    if (!IsPlayerAuthenticated()) return;
    emitProfileRequest('get_friend_requests', {}, 'friend_requests_loaded', 'friend_request_error',
        function (data) {
            var requests = (data && Array.isArray(data.requests)) ? data.requests : [];
            g_myFriendsState.pendingRequests = requests;
            RenderFriendRequests(requests);
        },
        function (err) {
            ShowProfileError((err && err.message) || 'Erro ao carregar pedidos de amizade.');
        }
    );
}
window.LoadFriendRequests = LoadFriendRequests;

function RenderFriendRequests(requests) {
    var list = document.getElementById('myFriendsRequestsList');
    var emptyState = document.getElementById('myFriendsRequestsEmptyState');
    if (!list) return;
    list.innerHTML = '';

    if (!requests || requests.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    requests.forEach(function (req) {
        var item = document.createElement('div');
        item.className = 'my-friend-item';
        item.appendChild(BuildFriendAvatarNode(req.fromAvatarUrl, req.fromName));

        var nameEl = document.createElement('div');
        nameEl.className = 'my-friend-item-name';
        nameEl.textContent = req.fromName || req.fromEmail || 'Jogador';
        item.appendChild(nameEl);

        var actions = document.createElement('div');
        actions.className = 'my-friend-item-actions';

        // Aceitar/Recusar SEMPRE visíveis (nunca atrás de :hover) — lista idêntica
        // no app mobile, 100% touch.
        var acceptBtn = document.createElement('button');
        acceptBtn.type = 'button';
        acceptBtn.className = 'my-profile-btn-primary my-friends-action-btn';
        acceptBtn.textContent = 'ACEITAR';
        acceptBtn.onclick = function () { RespondToFriendRequest(req.fromEmail, true, acceptBtn, declineBtn); };
        actions.appendChild(acceptBtn);

        var declineBtn = document.createElement('button');
        declineBtn.type = 'button';
        declineBtn.className = 'my-profile-btn my-friends-decline-btn my-friends-action-btn';
        declineBtn.textContent = 'RECUSAR';
        declineBtn.onclick = function () { RespondToFriendRequest(req.fromEmail, false, acceptBtn, declineBtn); };
        actions.appendChild(declineBtn);

        item.appendChild(actions);
        list.appendChild(item);
    });
}
window.RenderFriendRequests = RenderFriendRequests;

function RespondToFriendRequest(fromEmail, accept, acceptBtnEl, declineBtnEl) {
    HideProfileMessages();
    if (acceptBtnEl) acceptBtnEl.disabled = true;
    if (declineBtnEl) declineBtnEl.disabled = true;

    emitProfileRequest('respond_friend_request', { fromEmail: fromEmail, accept: accept }, 'friend_request_responded', 'friend_request_error',
        function (data) {
            var accepted = data ? !!data.accepted : accept;
            // Remove o pedido respondido da lista local sem esperar um novo
            // get_friend_requests — resposta imediata na UI.
            g_myFriendsState.pendingRequests = g_myFriendsState.pendingRequests.filter(function (r) {
                return r.fromEmail !== fromEmail;
            });
            RenderFriendRequests(g_myFriendsState.pendingRequests);

            if (accepted) {
                ShowProfileSuccess('Pedido aceito! Vocês agora são amigos.');
                LoadFriends(); // recarrega lista + contador com o novo amigo
            } else {
                ShowProfileSuccess('Pedido recusado.');
            }
        },
        function (err) {
            if (acceptBtnEl) acceptBtnEl.disabled = false;
            if (declineBtnEl) declineBtnEl.disabled = false;
            ShowProfileError((err && err.message) || 'Erro ao responder o pedido de amizade.');
        }
    );
}
window.RespondToFriendRequest = RespondToFriendRequest;

// ----------------------------------------------------------------------------
// Busca de jogadores — debounce de 400ms enquanto digita, ou Enter/botão
// BUSCAR pra disparar na hora (as duas formas convivem: digitar e parar por
// 400ms busca sozinho; confirmar antes disso com Enter/clique busca na hora e
// cancela o debounce pendente pra não duplicar a request).
// ----------------------------------------------------------------------------
function OnFriendsSearchInput() {
    clearTimeout(g_myFriendsState.searchDebounceTimer);
    var input = document.getElementById('myFriendsSearchInput');
    var query = input ? input.value.trim() : '';

    if (query.length < FRIENDS_SEARCH_MIN_LENGTH) {
        // Campo vazio/curto demais: limpa resultados sem bater no servidor.
        g_myFriendsState.searchResults = [];
        RenderSearchResults([]);
        var statusEl = document.getElementById('myFriendsSearchStatus');
        if (statusEl) statusEl.style.display = 'none';
        return;
    }
    g_myFriendsState.searchDebounceTimer = setTimeout(SearchPlayers, FRIENDS_SEARCH_DEBOUNCE_MS);
}
window.OnFriendsSearchInput = OnFriendsSearchInput;

function OnFriendsSearchKeydown(event) {
    if (event && event.key === 'Enter') {
        event.preventDefault();
        clearTimeout(g_myFriendsState.searchDebounceTimer);
        SearchPlayers();
    }
}
window.OnFriendsSearchKeydown = OnFriendsSearchKeydown;

function SearchPlayers() {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para buscar jogadores.'); return; }

    var input = document.getElementById('myFriendsSearchInput');
    var query = input ? input.value.trim() : '';
    var statusEl = document.getElementById('myFriendsSearchStatus');

    if (query.length < FRIENDS_SEARCH_MIN_LENGTH) {
        if (statusEl) { statusEl.textContent = 'Digite pelo menos ' + FRIENDS_SEARCH_MIN_LENGTH + ' caracteres.'; statusEl.style.display = 'block'; }
        return;
    }
    if (g_myFriendsState.searchLoading) return;

    g_myFriendsState.searchLoading = true;
    if (statusEl) { statusEl.textContent = 'Buscando...'; statusEl.style.display = 'block'; }

    // 'friend_search_error' (não 'friend_request_error') — única chamada desta lista
    // com evento de erro próprio, ver comentário de contrato no topo do arquivo.
    emitProfileRequest('search_players', { query: query }, 'players_found', 'friend_search_error',
        function (data) {
            g_myFriendsState.searchLoading = false;
            var results = (data && Array.isArray(data.results)) ? data.results : [];

            // Nunca mostra o próprio jogador nos resultados (defensivo — o servidor
            // pode ou não já filtrar isso).
            var myEmail = GetCurrentPlayerEmail();
            results = results.filter(function (r) { return r.email !== myEmail; });

            g_myFriendsState.searchResults = results;
            if (statusEl) {
                if (results.length === 0) { statusEl.textContent = 'Nenhum jogador encontrado.'; statusEl.style.display = 'block'; }
                else { statusEl.style.display = 'none'; }
            }
            RenderSearchResults(results);
        },
        function (err) {
            g_myFriendsState.searchLoading = false;
            if (statusEl) { statusEl.textContent = (err && err.message) || 'Erro ao buscar jogadores.'; statusEl.style.display = 'block'; }
            RenderSearchResults([]);
        }
    );
}
window.SearchPlayers = SearchPlayers;

function IsAlreadyFriend(email) {
    return g_myFriendsState.friends.some(function (f) { return f.email === email; });
}

function RenderSearchResults(results) {
    var list = document.getElementById('myFriendsSearchResults');
    if (!list) return;
    list.innerHTML = '';

    results.forEach(function (player) {
        var item = document.createElement('div');
        item.className = 'my-friend-item';
        item.appendChild(BuildFriendAvatarNode(player.avatarUrl, player.name));

        var nameEl = document.createElement('div');
        nameEl.className = 'my-friend-item-name';
        nameEl.textContent = player.name || player.email || 'Jogador';
        item.appendChild(nameEl);

        var actions = document.createElement('div');
        actions.className = 'my-friend-item-actions';

        if (IsAlreadyFriend(player.email)) {
            var friendTag = document.createElement('span');
            friendTag.className = 'my-friends-status-tag';
            friendTag.textContent = 'JÁ SÃO AMIGOS';
            actions.appendChild(friendTag);
        } else if (g_myFriendsState.sentRequestEmails[player.email]) {
            var sentTag = document.createElement('span');
            sentTag.className = 'my-friends-status-tag';
            sentTag.textContent = 'PEDIDO ENVIADO';
            actions.appendChild(sentTag);
        } else {
            // Botão "ADICIONAR" SEMPRE visível (não depende de :hover) — resultado de
            // busca roda idêntico no app mobile, que é 100% touch (mesma lição já
            // aplicada na galeria de fotos, ver profile.js/RenderGallerySlot()).
            var addBtn = document.createElement('button');
            addBtn.type = 'button';
            addBtn.className = 'my-profile-btn-primary my-friends-action-btn';
            addBtn.textContent = 'ADICIONAR';
            addBtn.onclick = function () { SendFriendRequest(player.email, addBtn); };
            actions.appendChild(addBtn);
        }

        item.appendChild(actions);
        list.appendChild(item);
    });
}
window.RenderSearchResults = RenderSearchResults;

function SendFriendRequest(toEmail, sourceBtn) {
    HideProfileMessages();
    if (sourceBtn) sourceBtn.disabled = true;

    emitProfileRequest('send_friend_request', { toEmail: toEmail }, 'friend_request_sent', 'friend_request_error',
        function (data) {
            g_myFriendsState.sentRequestEmails[toEmail] = true;
            var autoAccepted = !!(data && data.autoAccepted);
            if (autoAccepted) {
                // autoAccepted: o outro jogador já tinha mandado um pedido pra você antes
                // — mandar o seu de volta fecha o par na hora, sem esperar aceite manual.
                ShowProfileSuccess('Vocês já eram amigos um do outro — pedido aceito automaticamente!');
                LoadFriends();
            } else {
                ShowProfileSuccess('Pedido de amizade enviado!');
            }
            // Re-renderiza os resultados já carregados pra trocar o botão pela tag de
            // status (ADICIONAR -> PEDIDO ENVIADO/JÁ SÃO AMIGOS) sem precisar buscar de novo.
            RenderSearchResults(g_myFriendsState.searchResults);
        },
        function (err) {
            if (sourceBtn) sourceBtn.disabled = false;
            // Mensagens específicas (já são amigos / pedido já pendente / jogador não
            // encontrado etc.) vêm prontas do servidor em err.message — mostradas como
            // vieram, sem genérico "erro" escondendo o motivo real.
            ShowProfileError((err && err.message) || 'Erro ao enviar pedido de amizade.');
        }
    );
}
window.SendFriendRequest = SendFriendRequest;

// ----------------------------------------------------------------------------
// Reset da UI de amigos — chamado por profile.js em dois pontos: quando o
// modal abre sem o jogador estar logado (nada pra carregar) e quando o modal
// fecha (evita o debounce de busca pendente disparar SearchPlayers() depois
// que a seção já não está mais visível, e evita mostrar resultado da sessão
// anterior na próxima abertura).
// ----------------------------------------------------------------------------
function ResetFriendsUI() {
    clearTimeout(g_myFriendsState.searchDebounceTimer);
    g_myFriendsState.friends = [];
    g_myFriendsState.friendCount = 0;
    g_myFriendsState.pendingRequests = [];
    g_myFriendsState.searchResults = [];
    g_myFriendsState.searchLoading = false;
    g_myFriendsState.sentRequestEmails = {};

    var input = document.getElementById('myFriendsSearchInput');
    if (input) input.value = '';
    var statusEl = document.getElementById('myFriendsSearchStatus');
    if (statusEl) statusEl.style.display = 'none';

    UpdateFriendsCounter(0);
    RenderSearchResults([]);
    RenderFriendRequests([]);
    RenderFriendsList([]);
}
window.ResetFriendsUI = ResetFriendsUI;
