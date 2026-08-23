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

const { loginPlayer, createPlayer, loadOrCreatePlayer, loadPlayerByEmail, savePlayerProgress, saveCharacters, deleteCharacter } = require('./db');
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

// Serve os arquivos estáticos do jogo (Front-end)
app.use(express.static(path.join(__dirname, '../')));

// Fallback para garantir que qualquer rota devolva o index.html (SPA/Game)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('[Server] Running on port ' + PORT);
});
