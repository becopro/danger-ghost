try {
    require('dotenv').config();
} catch (err) {
    // dotenv é opcional se as variáveis de ambiente já vierem injetadas pelo PM2/OS
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const { loginPlayer, createPlayer, loadOrCreatePlayer, loadPlayerByEmail, savePlayerProgress, saveCharacters, deleteCharacter, updateProfile, postDiaryEntry, getDiaryEntries } = require('./db');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Token de sessão (30/08/2026): permite o jogo logar sozinho na próxima vez que abrir, sem pedir
// e-mail/senha de novo — ver socket.on('session_login') mais abaixo. Mesmo padrão de segredo já
// usado neste projeto (docs/SECURITY_AUDIT.md, achado #2, 18/08/2026): se "jwtsecret" não estiver
// definido no ambiente, gera um aleatório nesta execução em vez de usar um valor fixo no código —
// sessões emitidas antes de um restart do servidor deixam de validar, mas nunca existe um segredo
// previsível. Nome da env var em minúsculo e sem "_" de propósito, mesmo padrão de dbhost/dbpass/
// etc (server/db.js) — o console remoto usado pra configurar produção tem um teclado que derruba
// o Shift, então maiúsculas e "_" viram fonte de erro de digitação.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const JWT_SECRET = process.env.jwtsecret || (() => {
    console.warn('[SECURITY] jwtsecret não definido no ambiente — usando um segredo aleatório gerado nesta execução. Sessões salvas vão pedir login de novo a cada restart do servidor até isso ser definido.');
    return crypto.randomBytes(48).toString('hex');
})();
const SESSION_TOKEN_TTL = '30d';

function signSessionToken(email) {
    return jwt.sign({ email: email }, JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL });
}

function buildAuthSuccessPayload(email, playerData) {
    return { email: email, playerData: playerData, token: signSessionToken(email) };
}

const players = {};
const TICK_RATE = 30;

// Garante que players[socketId] existe antes de gravar a identidade autenticada nele (achado
// 23/08/2026, análise profunda do login pedida pelo usuário, reproduzido de verdade): os quatro
// handlers de login (cloud_save_login, cloud_save_signup, session_login, auth_google_token) só
// gravavam email/name em players[socket.id] SE esse registro já existisse — criado por join_game,
// um evento completamente independente que o cliente emite por conta própria assim que conecta.
// Nada garante que join_game termina de processar antes de um login chegar no servidor (só o
// tempo de reação humana torna isso raro na prática — testei forçando a ordem inversa com um
// socket bruto, sem nunca emitir join_game: o login "funcionava" do lado do cliente, token e
// tudo, mas o save seguinte era rejeitado em silêncio, "Player not authenticated", porque o email
// nunca tinha sido gravado em lugar nenhum). Mesma mitigação que player_move já usa pra esse
// mesmo tipo de corrida: cria o registro com valores padrão se ainda não existir, em vez de
// assumir que outro evento já rodou primeiro.
function ensurePlayerRecord(socketId) {
    if (!players[socketId]) {
        players[socketId] = { id: socketId, name: 'Ghost', x: 48, y: 150, isFacingRight: true, level: '1', hp: 100 };
    }
    return players[socketId];
}

// Fila de save por socket (achado 22/08/2026, auditoria "tudo na Ghostdex deve ser salvo no
// banco"): save_game_state é async e cada emit disparava sua própria pool.query() independente,
// sem nenhuma ordem garantida de CONCLUSÃO — só de recebimento. A Ghostdex dispara vários emits
// em sequência rápida sem esperar o anterior responder (um save só de personagem, seguido de um
// save só de ghostdexProgress, repetido a cada captura), e ghostdex_progress/favorites são
// gravados como substituição total da coluna JSONB (não merge). Resultado: se o emit MAIS ANTIGO
// (com snapshot desatualizado) terminasse sua query DEPOIS do emit mais recente, ele sobrescrevia
// silenciosamente o progresso completo com um estado velho — reproduzido de verdade capturando 2
// fantasmas em sequência (ver e2e-db-verification): o banco ficava só com o primeiro. Serializar
// o processamento por socket (encadear numa Promise por conexão) garante que os saves terminam na
// mesma ordem em que foram emitidos, já que o socket.io entrega na ordem de envio — elimina a
// corrida sem mudar o formato de nenhum payload.
const saveQueues = {};

// Rate limiting de login/cadastro (27/08/2026, auditoria de segurança pedida pelo usuário, achado
// ALTO confirmado por ausência total): nenhum handler de autenticação tinha qualquer proteção
// contra tentativas repetidas — um script externo com socket.io-client puro podia testar centenas
// de senhas por segundo contra o mesmo e-mail. Contador em memória por IP (socket.handshake.address)
// com janela deslizante; não precisa de limpeza por setInterval porque cada checagem já descarta
// os timestamps mais velhos que a janela antes de decidir. Login (cloud_save_login/session_login)
// fica mais restrito (5/min) porque é o alvo real de brute-force; cadastro (cloud_save_signup) é
// mais generoso (8/min) porque tentar 2-3 e-mails até achar um livre é uso legítimo.
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const SIGNUP_MAX_ATTEMPTS = 8;
// post_diary_entry não fazia parte da auditoria de 27/08/2026 (não existia ainda), mas é o mesmo
// tipo de escrita repetível e barata (insert de até 5000 caracteres) que um script poderia abusar
// pra encher a tabela — reusa o mesmo mecanismo de isRateLimited() já existente, com uma janela
// bem mais generosa que login/signup porque escrever várias entradas de diário em sequência é uso
// legítimo (29/08/2026, feature de perfil de jogador). Calibrado em 30/min (não 20) depois de um
// teste real contra o Supabase (e2e-db-verification) travar no próprio limite: o roteiro de teste
// pedido pelo usuário posta 25 entradas em sequência rápida pra validar a paginação, e um jogador
// migrando/importando entradas antigas de uma vez é um uso legítimo parecido — 30/min ainda barra
// um script disparando centenas de posts por segundo, sem penalizar esse uso normal.
const DIARY_POST_MAX_ATTEMPTS = 30;
const RATE_LIMIT_MESSAGE = 'Muitas tentativas, aguarde um momento.';
const rateLimitBuckets = new Map(); // chave "evento:ip" -> array de timestamps (ms) das tentativas recentes

function isRateLimited(bucketKey, maxAttempts, windowMs) {
    const now = Date.now();
    const timestamps = (rateLimitBuckets.get(bucketKey) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxAttempts) {
        rateLimitBuckets.set(bucketKey, timestamps); // ainda descarta as expiradas, mesmo bloqueando
        return true;
    }
    timestamps.push(now);
    rateLimitBuckets.set(bucketKey, timestamps);
    return false;
}

io.on('connection', (socket) => {
    console.log('[Socket] Player connected: ' + socket.id);

    socket.on('join_game', (data) => {
        const playerName = data.playerName || 'Ghost';

        // Preserva a sessão autenticada (email) e a posição/vida atuais em vez de recriar o
        // objeto do zero — o Ghostdex reemite join_game toda vez que o jogador troca de
        // fantasma (PlayAsGhost, pra atualizar o nome exibido "(#XXX)"), e um overwrite total
        // aqui apagava silenciosamente o login: todo save_game_state seguinte era rejeitado
        // com "Player not authenticated" sem nenhum aviso pro jogador (achado 22/08/2026,
        // auditoria "salvar tudo no banco de dados").
        const existing = players[socket.id] || {};
        players[socket.id] = {
            ...existing,
            id: socket.id,
            name: playerName,
            x: existing.x !== undefined ? existing.x : 48,
            y: existing.y !== undefined ? existing.y : 150,
            isFacingRight: existing.isFacingRight !== undefined ? existing.isFacingRight : true,
            level: existing.level || '1',
            hp: existing.hp !== undefined ? existing.hp : 100
        };

        console.log('[Socket] Player joined: ' + playerName + ' (' + socket.id + ')');
        socket.emit('auth_success', { id: socket.id });
        io.emit('player_joined', { id: socket.id, name: playerName });
    });

    socket.on('player_move', (data) => {
        if (!players[socket.id]) {
            players[socket.id] = { id: socket.id, name: 'Ghost', x: data.x, y: data.y, isFacingRight: data.isFacingRight, level: data.level, hp: data.hp || 100, ghostLevel: data.ghostLevel || 1 };
        }
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].isFacingRight = data.isFacingRight;
            players[socket.id].level = data.level;
            if (data.hp !== undefined) players[socket.id].hp = data.hp;
            if (data.ghostLevel !== undefined) players[socket.id].ghostLevel = data.ghostLevel;
        }
    });

    socket.on('player_attack', (data) => {
        socket.broadcast.emit('player_attacked', {
            id: socket.id,
            bossId: data.bossId,
            damage: data.damage,
            type: data.type
        });
    });

    socket.on('kill_boss', (data) => {
        io.emit('boss_killed', { by: socket.id });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Player disconnected: ' + socket.id);
        if (players[socket.id]) {
            const name = players[socket.id].name;
            delete players[socket.id];
            io.emit('player_left', socket.id);
        }
        delete saveQueues[socket.id];
    });

    // --- Google Auth (login OAuth real — desativado no cliente hoje, ver comentário em
    // db.js/loadOrCreatePlayer) ---
    socket.on('auth_google_token', async (data) => {
        try {
            if (!data || !data.token || typeof data.token !== 'string') {
                socket.emit('auth_google_error', { message: 'Token do Google ausente ou inválido.' });
                return;
            }

            // Verificar a assinatura do token junto ao Google — NUNCA confiar no payload
            // decodificado sem verificação (era exatamente essa a falha corrigida aqui: antes o
            // servidor só fazia atob() do payload e acreditava no e-mail).
            const ticket = await googleClient.verifyIdToken({
                idToken: data.token,
                audience: GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            const email = payload && payload.email ? String(payload.email).trim().toLowerCase() : null;
            if (!email) {
                throw new Error('Email missing from verified Google token');
            }
            const name = (payload.name || payload.given_name || 'Ghost');

            console.log(`[Auth] Google Login request for: ${email}`);
            const result = await loadOrCreatePlayer(email, name, data.password);
            console.log(`[DB] Player ${email} ${result.status}. Level: ${result.data.level}`);

            ensurePlayerRecord(socket.id).email = email;
            players[socket.id].name = result.data.name;
            socket.emit('auth_google_success', buildAuthSuccessPayload(email, result.data));
        } catch (error) {
            console.error('[Auth] Error processing Google Token:', error);
            socket.emit('auth_google_error', { message: error.message || 'Falha ao verificar login do Google.' });
        }
    });

    // LOGIN por e-mail/senha (30/08/2026: separado de criação de conta por pedido do usuário —
    // cada e-mail só pode ter uma conta; login recupera uma conta que já existe, nunca cria uma
    // nova). Se o e-mail não estiver cadastrado, loginPlayer() lança um erro claro pedindo pra
    // criar uma conta primeiro, em vez de criar silenciosamente como o código antigo fazia.
    socket.on('cloud_save_login', async (data) => {
        try {
            if (isRateLimited('cloud_save_login:' + socket.handshake.address, LOGIN_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
                socket.emit('cloud_save_error', { message: RATE_LIMIT_MESSAGE });
                return;
            }
            if (!data || !data.email) {
                socket.emit('cloud_save_error', { message: 'E-mail inválido para o Cloud Save.' });
                return;
            }
            const email = String(data.email).trim().toLowerCase();
            console.log(`[CloudSave] Login request for: ${email}`);
            const playerData = await loginPlayer(email, data.password);
            console.log(`[DB] Player ${email} loaded. Level: ${playerData.level}`);
            ensurePlayerRecord(socket.id).email = email;
            players[socket.id].name = playerData.name;
            socket.emit('cloud_save_success', buildAuthSuccessPayload(email, playerData));
        } catch (error) {
            console.error('[CloudSave] Error processing login:', error);
            socket.emit('cloud_save_error', { message: error.message || 'Falha ao acessar o Cloud Save.' });
        }
    });

    // CRIAR CONTA (30/08/2026, novo). Cadastra um e-mail que ainda não existe; se já existir,
    // createPlayer() lança um erro pedindo pra usar LOGIN em vez de criar de novo — é essa a
    // "notificação de e-mail já cadastrado" pedida pelo usuário.
    socket.on('cloud_save_signup', async (data) => {
        try {
            if (isRateLimited('cloud_save_signup:' + socket.handshake.address, SIGNUP_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
                socket.emit('cloud_save_error', { message: RATE_LIMIT_MESSAGE });
                return;
            }
            if (!data || !data.email) {
                socket.emit('cloud_save_error', { message: 'E-mail inválido para criar conta.' });
                return;
            }
            const email = String(data.email).trim().toLowerCase();
            const name = data.name || 'Ghost';
            console.log(`[CloudSave] Signup request for: ${email} (${name})`);
            const playerData = await createPlayer(email, name, data.password);
            console.log(`[DB] Player ${email} created. Level: ${playerData.level}`);
            ensurePlayerRecord(socket.id).email = email;
            players[socket.id].name = playerData.name;
            socket.emit('cloud_save_success', buildAuthSuccessPayload(email, playerData));
        } catch (error) {
            console.error('[CloudSave] Error processing signup:', error);
            socket.emit('cloud_save_error', { message: error.message || 'Falha ao criar conta.' });
        }
    });

    // Login automático por token de sessão (30/08/2026) — permite o cliente reentrar sem pedir
    // e-mail/senha de novo a cada abertura do jogo. loadPlayerByEmail() não valida senha porque a
    // assinatura do JWT já prova a identidade; só recusa se a conta não existir mais (ex: apagada).
    socket.on('session_login', async (data) => {
        try {
            if (isRateLimited('session_login:' + socket.handshake.address, LOGIN_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
                socket.emit('session_login_error', { message: RATE_LIMIT_MESSAGE });
                return;
            }
            if (!data || !data.token) {
                socket.emit('session_login_error', { message: 'Token ausente.' });
                return;
            }
            let payload;
            try {
                payload = jwt.verify(data.token, JWT_SECRET);
            } catch (jwtErr) {
                socket.emit('session_login_error', { message: 'Sessão expirada, faça login novamente.' });
                return;
            }
            const email = payload.email;
            const playerData = await loadPlayerByEmail(email);
            if (!playerData) {
                socket.emit('session_login_error', { message: 'Conta não encontrada.' });
                return;
            }
            console.log(`[Auth] Login automático por sessão para: ${email}`);
            ensurePlayerRecord(socket.id).email = email;
            players[socket.id].name = playerData.name;
            socket.emit('session_login_success', buildAuthSuccessPayload(email, playerData));
        } catch (error) {
            console.error('[Auth] Erro no login por sessão:', error);
            socket.emit('session_login_error', { message: 'Falha ao validar sessão.' });
        }
    });

    socket.on('save_game_state', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Save] Rejected: Player not authenticated.');
            return;
        }

        // Encadeia na fila desse socket em vez de disparar direto (ver comentário na declaração
        // de saveQueues acima) — cada save só começa depois que o anterior terminou de verdade,
        // preservando a ordem de emissão em vez de deixar a ordem de CONCLUSÃO da query decidir.
        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                await savePlayerProgress(playerSession.email, data);
                // A lista completa de fantasmas (atributos, inventário, equipamento — tudo) vem
                // junto nesse mesmo evento quando presente, em vez de precisar de um evento novo
                // (ver docs/HANDOVER.md 20/08/2026: sync de personagens entre aparelhos).
                if (Array.isArray(data.characters) && data.characters.length > 0) {
                    await saveCharacters(playerSession.email, data.characters);
                }
                console.log(`[DB] Progress saved for ${playerSession.email}`);
                socket.emit('save_success', { message: 'Progresso salvo na nuvem!' });
            } catch (error) {
                console.error('[DB] Save error:', error);
                socket.emit('save_error', { message: 'Erro ao salvar progresso.' });
            }
        });
        // Nunca deixa uma rejeição não tratada quebrar a fila pra sempre — o catch acima já
        // resolve o erro, isso aqui é só rede de segurança caso algo escape dele.
        saveQueues[socket.id] = current.catch(() => {});
    });

    // Apaga um fantasma forjado (30/08/2026) — antes disso, descartar um fantasma só tirava do
    // localStorage do aparelho; sem isso ele reaparecia no banco no próximo login.
    //
    // Encadeado na MESMA fila (saveQueues) usada por save_game_state (achado 23/08/2026,
    // forensic-analyst — irmão do bug já corrigido do saveQueues original): antes desta correção,
    // delete_character rodava FORA da fila, com um único DELETE (round-trip rápido) competindo
    // contra a transação de save_game_state (BEGIN + N UPSERTs + COMMIT, mais lenta). Cenário
    // real: jogador clica "SAVE GAME" (manda a lista completa de fantasmas, incluindo o que está
    // prestes a apagar) e, logo em seguida, apaga um fantasma pela tela de seleção — o DELETE
    // terminava primeiro, e o UPSERT do save (que ainda carregava o fantasma no array, porque foi
    // montado ANTES do apagar) terminava depois e reinseria o fantasma "apagado" de volta no
    // banco. Reproduzido ao vivo contra o Supabase real (não hipótese): emitir
    // save_game_state({characters:[A,B]}) imediatamente seguido de delete_character(B) no mesmo
    // socket deixava B de volta na tabela characters com updated_at igual ao de A, e o log do
    // servidor mostrava "[DB] Character ... deleted" ANTES de "[DB] Progress saved" — a resposta
    // "saved" chegando depois é o que reinseria B (ver skill e2e-db-verification). Encadear delete
    // aqui, na mesma fila de saveQueues, garante que a ordem de CONCLUSÃO das queries segue a
    // ordem de RECEBIMENTO dos eventos (que o socket.io já preserva) em vez de deixar a duração
    // de cada query decidir — a mesma garantia que saveQueues já dava entre saves agora vale
    // também entre save e delete, sem mudar o formato de nenhum payload.
    socket.on('delete_character', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Delete] Rejected: Player not authenticated.');
            return;
        }
        if (!data || !data.characterId) {
            socket.emit('delete_character_error', { message: 'ID do personagem ausente.' });
            return;
        }

        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                await deleteCharacter(playerSession.email, data.characterId);
                console.log(`[DB] Character ${data.characterId} deleted for ${playerSession.email}`);
                socket.emit('delete_character_success', { characterId: data.characterId });
            } catch (error) {
                console.error('[DB] Delete character error:', error);
                socket.emit('delete_character_error', { message: 'Erro ao apagar personagem.' });
            }
        });
        saveQueues[socket.id] = current.catch(() => {});
    });

    // Perfil de jogador customizável (29/08/2026): nome de exibição (reusa players.name),
    // avatar e galeria de 9 fotos. O upload do binário acontece direto navegador -> Supabase
    // Storage (SDK JS do cliente) — este servidor nunca recebe a imagem, só a URL final já
    // hospedada, validada em db.js/sanitizeProfilePayload (prefixo https://, teto de tamanho).
    //
    // Encadeado na MESMA fila (saveQueues) de save_game_state/delete_character: update_profile
    // grava na mesma linha de players que savePlayerProgress (colunas diferentes, mas mesma
    // linha). Cada campo aqui já é independente via COALESCE — não depende de um snapshot
    // completo do cliente como o bug original de saveCharacters (achado #1, 27/08/2026) — então
    // não existe risco de um save "esquecer" um campo e apagar dado. O risco residual, menor, é
    // dois update_profile do mesmo socket completando fora de ordem (ex: jogador troca o avatar
    // duas vezes rápido) e o campo ficar com o valor do mais ANTIGO em vez do mais recente
    // emitido; encadear na fila elimina esse risco também, pelo mesmo mecanismo já comprovado
    // pros outros dois eventos.
    socket.on('update_profile', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Profile] Rejected: Player not authenticated.');
            socket.emit('profile_error', { message: 'Não autenticado.' });
            return;
        }

        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                const updated = await updateProfile(playerSession.email, data);
                if (updated && updated.name) players[socket.id].name = updated.name;
                console.log(`[DB] Profile updated for ${playerSession.email}`);
                socket.emit('profile_updated', updated);
            } catch (error) {
                console.error('[DB] Profile update error:', error);
                socket.emit('profile_error', { message: 'Erro ao atualizar perfil.' });
            }
        });
        saveQueues[socket.id] = current.catch(() => {});
    });

    // Diário/blog do jogador (29/08/2026): posts cronológicos, tabela própria (diary_entries),
    // sem relação de sobrescrita com players/characters — por isso NÃO entra na fila saveQueues
    // (cada post é um INSERT novo, nunca um UPDATE que possa perder dado por ordem de conclusão;
    // a classe de bug que saveQueues existe pra evitar não se aplica aqui).
    socket.on('post_diary_entry', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Diary] Rejected: Player not authenticated.');
            socket.emit('diary_error', { message: 'Não autenticado.' });
            return;
        }
        if (isRateLimited('post_diary_entry:' + socket.handshake.address, DIARY_POST_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            socket.emit('diary_error', { message: RATE_LIMIT_MESSAGE });
            return;
        }

        const content = data && data.content;
        postDiaryEntry(playerSession.email, content).then((entry) => {
            console.log(`[DB] Diary entry posted for ${playerSession.email} (id ${entry.id})`);
            socket.emit('diary_entry_posted', entry);
        }).catch((error) => {
            console.error('[DB] Diary post error:', error);
            // error.message aqui é sempre a mensagem de validação de postDiaryEntry (ex: "precisa
            // ter entre 1 e 5000 caracteres") — segura de expor, mesmo padrão de loginPlayer/
            // createPlayer (server/db.js) que já devolvem erro de validação direto pro jogador.
            socket.emit('diary_error', { message: error.message || 'Erro ao publicar no diário.' });
        });
    });

    // Lista o diário da conta autenticada, paginado. Somente leitura — não toca players/
    // characters, não precisa de saveQueues nem de rate limit dedicado (já limitado por limit
    // máximo de 50 em db.js/getDiaryEntries).
    socket.on('get_diary_entries', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Diary] Rejected: Player not authenticated.');
            socket.emit('diary_error', { message: 'Não autenticado.' });
            return;
        }

        getDiaryEntries(playerSession.email, data || {}).then((result) => {
            socket.emit('diary_entries_loaded', result);
        }).catch((error) => {
            console.error('[DB] Diary load error:', error);
            socket.emit('diary_error', { message: error.message || 'Erro ao carregar diário.' });
        });
    });
    // ---------------------------------
});

setInterval(() => {
    if (Object.keys(players).length > 0) {
        const totalVisitors = io.engine.clientsCount || Object.keys(players).length;
        io.emit('sync_state', {
            tick: Date.now(),
            players: players,
            totalOnline: totalVisitors
        });
    }
}, 1000 / TICK_RATE);

// Serve os arquivos estáticos do jogo (Front-end) — só os diretórios/arquivos que o jogo de fato
// usa (conferido em index.html, codex.html e lore_reader.html), nunca a árvore inteira do
// repositório. Corrigido em 27/08/2026 (auditoria de segurança pedida pelo usuário, achado
// CRÍTICO confirmado ao vivo): antes, express.static(path.join(__dirname, '../')) servia TODO o
// diretório pai de server/ como estático público — incluindo a própria pasta server/, como se
// fosse um arquivo do jogo. Isso deixava server/package.json e server/game_data.db (SQLite antigo,
// com senhas de contas reais em texto puro, listado no .gitignore mas fisicamente presente)
// publicamente baixáveis por qualquer um sem login — confirmado com curl real contra produção
// (https://ghostgames.club/server/game_data.db -> HTTP 200, 12288 bytes). Esta correção NÃO move
// nem apaga game_data.db (ação separada, na VPS, a ser autorizada à parte pelo usuário) — só
// impede que o servidor sirva qualquer coisa fora da lista abaixo. Qualquer caminho fora dela
// (incluindo tudo sob /server/...) cai no 404 padrão do Express, porque nenhuma rota casa com ele.
const FRONTEND_ROOT = path.join(__dirname, '../');

const PUBLIC_FRONTEND_DIRS = ['js', 'css', 'assets', 'assets2', 'UI', 'Ghosts'];
PUBLIC_FRONTEND_DIRS.forEach((dir) => {
    app.use('/' + dir, express.static(path.join(FRONTEND_ROOT, dir)));
});

// Arquivos individuais servidos direto da raiz do jogo (HTML de verdade referenciado a partir de
// index.html/codex.html, ícone, apk pra download, e o rpg_system.js que vive fora de js/) — nunca
// um curinga que abrangeria a pasta inteira.
const PUBLIC_FRONTEND_FILES = ['index.html', 'codex.html', 'lore_reader.html', 'favicon.png', 'rpg_system.js', 'DangerGhostMobile.apk', 'Bg1.jpg', 'Bg2.jpg', 'Bg5.jpg', 'Bg6.jpg', 'logoGG-pixel.webp'];
PUBLIC_FRONTEND_FILES.forEach((file) => {
    app.get('/' + file, (req, res) => {
        res.sendFile(path.join(FRONTEND_ROOT, file));
    });
});

// Fallback para garantir que qualquer rota devolva o index.html (SPA/Game)
app.get('/', (req, res) => {
    res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('[Server] Running on port ' + PORT);
});
