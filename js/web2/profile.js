// web2/profile.js
// ============================================================================
// Perfil de jogador customizável (29/08/2026): nome de exibição, avatar, galeria
// de até 9 fotos e diário/blog cronológico. Modal em index.html (#myProfileModal),
// estilos em css/style.css (seção "MY PROFILE MODAL").
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
//   socket.emit('get_diary_entries', { limit, beforeId? })
//     -> 'diary_entries_loaded' ({ entries: [{id, content, createdAt}], hasMore }) / 'diary_error'
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
    pendingGallerySlotIndex: null
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

// Habilita/desabilita os controles de edição conforme o jogador está logado ou
// não nesta visita — evita disparar socket.emit condenado a voltar "Não
// autenticado." e deixa isso visualmente óbvio (achado de UX, mesmo espírito do
// resto do projeto: nunca falhar em silêncio).
function SetProfileEditingEnabled(enabled) {
    var nameEditBtn = document.getElementById('myProfileNameEditBtn');
    var avatarEditBtn = document.getElementById('myProfileAvatarEditBtn');
    var diaryTextarea = document.getElementById('myDiaryTextarea');
    var diaryPublishBtn = document.getElementById('myDiaryPublishBtn');
    var grid = document.getElementById('myProfileGalleryGrid');
    if (nameEditBtn) nameEditBtn.style.display = enabled ? 'inline-block' : 'none';
    if (avatarEditBtn) avatarEditBtn.style.display = enabled ? 'flex' : 'none';
    if (diaryTextarea) diaryTextarea.disabled = !enabled;
    if (diaryPublishBtn) diaryPublishBtn.disabled = !enabled;
    if (grid) grid.style.pointerEvents = enabled ? 'auto' : 'none';
    if (enabled) { HideProfileAuthWarning(); } else { ShowProfileAuthWarning(); }
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
        onError({ message: 'Não foi possível conectar ao servidor.' });
        return;
    }

    var finished = false;
    var timeoutId = setTimeout(function () {
        if (finished) return;
        cleanup();
        onError({ message: 'O servidor demorou demais para responder. Verifique sua internet e tente novamente.' });
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
// Abrir / Fechar o modal
// ----------------------------------------------------------------------------
function OpenProfileModal() {
    var modal = document.getElementById('myProfileModal');
    if (!modal) return;
    HideProfileMessages();

    if (!IsPlayerAuthenticated()) {
        SetProfileEditingEnabled(false);
        RenderProfileHeader();
        RenderGallery();
        RenderDiaryList();
        modal.style.display = 'flex';
        return;
    }

    SetProfileEditingEnabled(true);
    var stored = GetStoredProfileData() || {};
    g_myProfileState.displayName = stored.name || localStorage.getItem('playerName') || 'Ghost';
    g_myProfileState.avatarUrl = stored.avatarUrl || null;
    g_myProfileState.galleryUrls = Array.isArray(stored.galleryUrls) ? stored.galleryUrls.slice(0, MAX_GALLERY_SIZE) : [];

    RenderProfileHeader();
    RenderGallery();
    modal.style.display = 'flex';

    LoadDiaryEntries(true);
}
window.OpenProfileModal = OpenProfileModal;

function CloseProfileModal() {
    var modal = document.getElementById('myProfileModal');
    if (modal) modal.style.display = 'none';
    CancelEditDisplayName();
    HideProfileMessages();
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

function EnableEditDisplayName() {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para editar o nome.'); return; }
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
    if (!name) { ShowProfileError('Digite um nome de exibição.'); return; }
    if (name.length > DISPLAY_NAME_MAX_LENGTH) {
        ShowProfileError('O nome de exibição pode ter no máximo ' + DISPLAY_NAME_MAX_LENGTH + ' caracteres.');
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
            ShowProfileSuccess('Nome atualizado!');
        },
        function (err) {
            if (btn) btn.disabled = false;
            ShowProfileError((err && err.message) || 'Erro ao salvar o nome.');
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
        if (!file) { reject(new Error('Nenhum arquivo selecionado.')); return; }

        var token = null;
        try { token = localStorage.getItem('dg_session_token'); } catch (e) {}
        if (!token) {
            reject(new Error('Faça login para enviar uma imagem.'));
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
                        var msg = (data && data.message) || ('Falha no upload da imagem (HTTP ' + res.status + ').');
                        throw new Error(msg);
                    }
                    return data;
                });
            })
            .then(function (data) {
                var publicUrl = data && data.url;
                if (!publicUrl) {
                    reject(new Error('Upload concluído, mas o servidor não retornou a URL da imagem.'));
                    return;
                }
                resolve(publicUrl);
            })
            .catch(function (err) {
                reject(new Error((err && err.message) || 'Erro inesperado no upload da imagem.'));
            });
    });
}
window.UploadProfileImage = UploadProfileImage;

// ----------------------------------------------------------------------------
// Avatar
// ----------------------------------------------------------------------------
function TriggerAvatarFileSelect() {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para trocar o avatar.'); return; }
    var input = document.getElementById('myProfileAvatarFileInput');
    if (input) { input.value = ''; input.click(); }
}
window.TriggerAvatarFileSelect = TriggerAvatarFileSelect;

function HandleAvatarFileSelected(inputEl) {
    HideProfileMessages();
    var file = inputEl.files && inputEl.files[0];
    if (!file) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
        ShowProfileError('Selecione um arquivo de imagem.');
        return;
    }

    var previousUrl = g_myProfileState.avatarUrl;

    // Preview local imediato (antes do upload terminar) — pedido explícito da tarefa.
    var previewUrl = URL.createObjectURL(file);
    g_myProfileState.avatarUrl = previewUrl;
    RenderProfileHeader();
    ShowProfileStatus('Enviando imagem...');

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
                    ShowProfileSuccess('Avatar atualizado!');
                },
                function (err) {
                    ShowProfileError((err && err.message) || 'A imagem foi enviada, mas houve um erro ao salvar no perfil.');
                }
            );
        })
        .catch(function (err) {
            g_myProfileState.avatarUrl = previousUrl;
            RenderProfileHeader();
            ShowProfileError(err.message || 'Falha ao enviar a imagem.');
        });
}
window.HandleAvatarFileSelected = HandleAvatarFileSelected;

// ----------------------------------------------------------------------------
// Galeria (grid 3x3 = 9 slots). A galeria é tratada como uma lista COMPACTA
// (índices 0..N-1 preenchidos, o resto "+ adicionar") porque o servidor exige
// um array só de URLs válidas, sem buracos no meio (ver comentário no topo do
// arquivo) — remover uma foto do meio desloca as seguintes, como uma lista
// normal, não como "slots" fixos e independentes.
// ----------------------------------------------------------------------------
function RenderGallery() {
    var grid = document.getElementById('myProfileGalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < MAX_GALLERY_SIZE; i++) {
        grid.appendChild(RenderGallerySlot(i, g_myProfileState.galleryUrls[i] || null));
    }
}

function RenderGallerySlot(index, url) {
    var slot = document.createElement('div');
    slot.className = 'my-profile-gallery-slot' + (url ? '' : ' empty');

    if (url) {
        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto ' + (index + 1) + ' da galeria';
        slot.appendChild(img);

        var overlay = document.createElement('div');
        overlay.className = 'my-profile-gallery-overlay';

        var changeBtn = document.createElement('button');
        changeBtn.type = 'button';
        changeBtn.title = 'Trocar foto';
        changeBtn.textContent = '✏️'; // lapis (trocar)
        changeBtn.onclick = function (e) { e.stopPropagation(); TriggerGallerySlotFileSelect(index); };
        overlay.appendChild(changeBtn);

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-btn';
        removeBtn.title = 'Remover foto';
        removeBtn.textContent = '✖'; // X (remover)
        removeBtn.onclick = function (e) { e.stopPropagation(); RemoveGalleryPhoto(index); };
        overlay.appendChild(removeBtn);

        slot.appendChild(overlay);
        // Em touch (sem :hover) o overlay não aparece sozinho — o slot inteiro também
        // é clicável e abre direto a troca, então o toque continua funcionando.
        slot.onclick = function () { TriggerGallerySlotFileSelect(index); };
    } else {
        var plus = document.createElement('div');
        plus.className = 'plus-icon';
        plus.textContent = '+';
        slot.appendChild(plus);

        var label = document.createElement('div');
        label.textContent = 'ADICIONAR FOTO';
        slot.appendChild(label);

        slot.onclick = function () { TriggerGallerySlotFileSelect(index); };
    }
    return slot;
}
window.RenderGallerySlot = RenderGallerySlot;

function TriggerGallerySlotFileSelect(index) {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para editar a galeria.'); return; }
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
        ShowProfileError('Selecione um arquivo de imagem.');
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
    ShowProfileStatus('Enviando foto...');

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
            ShowProfileError(err.message || 'Falha ao enviar a foto.');
        });
}
window.HandleGalleryFileSelected = HandleGalleryFileSelected;

function RemoveGalleryPhoto(index) {
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para editar a galeria.'); return; }
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
            ShowProfileSuccess('Galeria atualizada!');
        },
        function (err) {
            if (rollbackUrls) { g_myProfileState.galleryUrls = rollbackUrls; RenderGallery(); }
            ShowProfileError((err && err.message) || 'Erro ao salvar a galeria.');
        }
    );
}

// ----------------------------------------------------------------------------
// Diário / Blog
// ----------------------------------------------------------------------------
function FormatDiaryDate(entry) {
    var raw = entry && (entry.createdAt !== undefined ? entry.createdAt : entry.created_at);
    if (!raw) return '';
    var d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    try {
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
        if (emptyState) emptyState.style.display = g_myProfileState.diaryLoading ? 'none' : 'block';
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
    if (!reset && g_myProfileState.oldestDiaryId !== null) payload.beforeId = g_myProfileState.oldestDiaryId;

    emitProfileRequest('get_diary_entries', payload, 'diary_entries_loaded', 'diary_error',
        function (data) {
            g_myProfileState.diaryLoading = false;
            SetDiaryLoadingUI(false);

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
            RenderDiaryList();
            ShowProfileError((err && err.message) || 'Erro ao carregar o diário.');
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
    if (!IsPlayerAuthenticated()) { ShowProfileError('Faça login para publicar no diário.'); return; }

    var textarea = document.getElementById('myDiaryTextarea');
    var content = textarea ? textarea.value.trim() : '';
    if (!content) { ShowProfileError('Escreva algo antes de publicar.'); return; }
    if (content.length > DIARY_CONTENT_MAX_LENGTH) {
        ShowProfileError('O texto do diário pode ter no máximo ' + DIARY_CONTENT_MAX_LENGTH + ' caracteres.');
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
            ShowProfileSuccess('Publicado!');
        },
        function (err) {
            if (btn) btn.disabled = false;
            ShowProfileError((err && err.message) || 'Erro ao publicar a entrada.');
        }
    );
}
window.SubmitDiaryEntry = SubmitDiaryEntry;
