// Guarda o retorno do dotenv (em vez de descartar) porque ele é a única fonte confiável pra
// diagnosticar, mais abaixo, um problema real encontrado em 29/08/2026: dotenv.config() por
// padrão NUNCA sobrescreve uma variável que já exista em process.env (comportamento documentado
// da própria lib) — então se o PM2 já guarda um valor (mesmo vazio/velho) pra alguma dessas
// variáveis na sua "snapshot" de ambiente do processo (ex: de um `pm2 set` ou export de shell
// antigo capturado por um `--update-env` anterior), editar server/.env e reiniciar não muda
// nada, pra sempre, com zero erro visível. Ver diagnóstico logo após a leitura de supabaseservicerolekey.
let dotenvLoadResult = null;
try {
    dotenvLoadResult = require('dotenv').config();
} catch (err) {
    // dotenv é opcional se as variáveis de ambiente já vierem injetadas pelo PM2/OS
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs'); // 03/09/2026 (Estágio 6, backend-architect): leitura síncrona do manifest.json
// do overworld no boot — dado estático pequeno (poucos KB), lido uma única vez ao subir o processo,
// não em request/tick nenhum, então fs.readFileSync aqui não bloqueia nada em produção.

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const { loginPlayer, createPlayer, loadOrCreatePlayer, loadPlayerByEmail, savePlayerProgress, saveOverworldPosition, saveCharacters, deleteCharacter, updateProfile, postDiaryEntry, getDiaryEntries, searchPlayers, sendFriendRequest, getFriendRequests, respondFriendRequest, getFriends, getPlayerProfile, incrementPlayerStat, checkAndUnlockBadges, getBadgeCatalog, getUnlockedBadgeIds, submitBadgeProgress } = require('./db');
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

// Overworld isométrico de Niterói (02/09/2026, tarefa do backend-architect). Reaproveita
// EXATAMENTE o padrão já existente de player_move/sync_state acima (ver
// .claude/skills/isometric-canvas-rendering/SKILL.md): overworld_move só atualiza
// players[socket.id] em memória (sem broadcast direto no handler), um setInterval separado manda
// o dicionário pra todo mundo. Duas decisões deliberadas, documentadas aqui:
//
// 1) Broadcast em interval PRÓPRIO (OVERWORLD_TICK_RATE), não o mesmo TICK_RATE=30 do sync_state
//    de combate side-view: aquele é pixel-a-pixel (posição fina, precisa de 30Hz pra não
//    engasgar visualmente numa perseguição/luta); o overworld é grid-a-grid (tile discreto,
//    85x85) — 30Hz de broadcast pra uma posição que só muda em passos de tile inteiro é banda
//    desperdiçada. 10Hz é suave o bastante pro cliente interpolar entre tiles sem parecer
//    "teleporte".
// 2) Grid 85x85 (0-84 em cada eixo, ver briefing da tarefa) — mesmo padrão de faixa plausível já
//    usado em NUMERIC_BOUNDS (server/db.js), só que aqui exige INTEIRO (tile de grid não existe
//    fracionado, diferente de xp/score que aceitam DOUBLE PRECISION).
//
// ATUALIZAÇÃO 03/09/2026 (Estágio 3 do plano crystalline-launching-goose.md, overworld
// expansível) — bounds 0-84 acima eram do MODELO ANTIGO (grid local a um único arquivo).
// js/game/overworld.js migrou pra coordenadas GLOBAIS de cidade neste estágio (col/row que
// o cliente manda em overworld_move deixam de ser "posição dentro do arquivo" e passam a
// ser "posição na cidade inteira"); 0-84 rejeitaria em silêncio qualquer chunk que não seja
// o (0,0) assim que o Estágio 5 (streaming de múltiplos chunks) começar a rodar. Isso NÃO É
// "sem validação" — é um bound PROVISÓRIO mais largo, escolhido com escala real, não um
// número arbitrário:
//   - Niterói (a cidade inteira que este overworld representa, ver manifest.json/plano §4)
//     tem uma extensão real de aproximadamente 20km na maior dimensão. Com
//     tile_size_m=10 (data/overworld/manifest.json), isso equivale a ~2000 tiles a partir
//     da origem (Rua Doutor Beltrão, chunk 0,0) em qualquer direção.
//   - chunkX/chunkY são assinados por design (plano §1: bairros a noroeste/sudoeste da
//     origem exigem offset negativo) — o bound abaixo é SIMÉTRICO (permite negativo) por
//     esse motivo, mesmo que nenhum chunk com offset negativo exista ainda.
//   - Ainda REJEITA valores implausíveis (ex.: um cliente forjado mandando 999999999) —
//     continua sendo proteção anti-cheat de verdade, só que dimensionada pra cidade
//     inteira em vez de um único arquivo de 850m.
// NÃO é a validação final: a validação real (coordenada cai dentro de algum chunk que de
// fato existe em manifest.json, carregado pelo servidor no boot) é trabalho do Estágio 6,
// ainda não implementado — isto aqui é só uma rede de segurança mais larga pra não quebrar
// nada enquanto isso não chega, não um substituto dela.
//
// ATUALIZAÇÃO 03/09/2026 (Estágio 6, backend-architect, implementado): a validação final chegou —
// ver validOverworldChunks/isChunkKnownOrAdjacent() logo abaixo, carregados de manifest.json no
// boot. O bound -2000/2000 NÃO foi removido (a própria seção 5 do plano diz "além do range check
// numérico que já existe" — não "no lugar dele"): ele continua sendo a primeira triagem barata
// (rejeita Infinity/NaN/valores absurdamente grandes antes de qualquer Math.floor ou lookup em
// Set), e isChunkKnownOrAdjacent() é a segunda camada, mais estrita, que checa contra os chunks
// que de fato existem.
const OVERWORLD_TICK_RATE = 10;
const OVERWORLD_GRID_MIN = -2000;
const OVERWORLD_GRID_MAX = 2000;

function isPlausibleGridCoord(value) {
    return Number.isInteger(value) && value >= OVERWORLD_GRID_MIN && value <= OVERWORLD_GRID_MAX;
}

// Manifesto do overworld (Estágio 6) — lido uma vez no boot, não a cada overworld_move. Caminho
// relativo a partir de server/index.js (este arquivo): server/ -> .. -> data/overworld/manifest.json
// (confirmado lendo a árvore real de data/overworld/ antes de escrever isto, não presumido).
// validOverworldChunks guarda só a CHAVE "chunkX_chunkY" de cada chunk existente — checagem O(1) por
// movimento, sem varrer o array a cada evento. OVERWORLD_CHUNK_DIM_TILES vem do próprio manifesto
// (chunk_dim_tiles=85 hoje) em vez de hardcoded aqui, pra nunca dessincronizar do valor real usado
// pra gerar os chunks — se o manifesto mudar de escala no futuro, este valor acompanha sozinho.
const OVERWORLD_MANIFEST_PATH = path.join(__dirname, '..', 'data', 'overworld', 'manifest.json');
let OVERWORLD_CHUNK_DIM_TILES = 85; // fallback só usado se a leitura do manifesto falhar (ver catch abaixo)
const validOverworldChunks = new Set();
try {
    const overworldManifest = JSON.parse(fs.readFileSync(OVERWORLD_MANIFEST_PATH, 'utf8'));
    if (Number.isInteger(overworldManifest.chunk_dim_tiles) && overworldManifest.chunk_dim_tiles > 0) {
        OVERWORLD_CHUNK_DIM_TILES = overworldManifest.chunk_dim_tiles;
    }
    (overworldManifest.chunks || []).forEach((chunk) => {
        if (Number.isInteger(chunk.chunkX) && Number.isInteger(chunk.chunkY)) {
            validOverworldChunks.add(chunk.chunkX + '_' + chunk.chunkY);
        }
    });
    console.log(`[Overworld] manifest.json carregado: ${validOverworldChunks.size} chunk(s) válido(s), chunk_dim_tiles=${OVERWORLD_CHUNK_DIM_TILES}.`);
} catch (err) {
    // Falha de boot (arquivo ausente/corrompido) não derruba o servidor inteiro — mas com o Set
    // vazio, isChunkKnownOrAdjacent() abaixo rejeita QUALQUER posição (nenhum chunk é "conhecido"),
    // então overworld_move fica efetivamente desligado até isso ser corrigido. Log alto propositalmente
    // ruidoso: isto não pode passar despercebido em produção.
    console.error('[Overworld] FALHA ao carregar manifest.json no boot — todo overworld_move será rejeitado até isso ser corrigido:', err.message);
}

// Zona = chunk (plano §5, Estágio 6). "ow_{chunkX}_{chunkY}" é o nome da room do socket.io.
function getOverworldZoneId(chunkX, chunkY) {
    return 'ow_' + chunkX + '_' + chunkY;
}

// Critério de folga documentado aqui (plano §5, item 5): o chunk calculado é aceito se ELE MESMO
// existe no manifesto OU se está a distância de Chebyshev <= 1 (qualquer um dos 8 vizinhos,
// incluindo diagonais) de algum chunk que existe — varrendo os 9 candidatos (o próprio + 8
// vizinhos) contra validOverworldChunks cobre as duas condições numa só checagem, já que "o
// próprio existe" é só o caso dx=0,dy=0 dentro do mesmo laço. Motivo da folga: o cliente
// (Estágio 5, streaming de chunks) já trata client-side um jogador perto da borda de uma região
// ainda não gerada, mas o servidor não pode confiar cegamente nisso — sem esta folga, um jogador
// legítimo andando na borda exata de um chunk gerado em direção a um vizinho ainda não gerado seria
// travado (overworld_move rejeitado) assim que o pé encostasse na borda, antes mesmo do cliente
// terminar de decidir o que fazer. Com a folga, o servidor aceita esse passo (o chunk vizinho "não
// existe" mas está a 1 de distância de um que existe) — quem decide se há o que renderizar ali é o
// cliente; o servidor só garante que não é um salto implausível pra longe de qualquer área real.
function isChunkKnownOrAdjacent(chunkX, chunkY) {
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (validOverworldChunks.has((chunkX + dx) + '_' + (chunkY + dy))) {
                return true;
            }
        }
    }
    return false;
}

// Persistência em lote (não a cada movimento — instrução explícita da tarefa, seria caro demais
// contra o Postgres). Não existe hoje nenhum "timing de save de personagem" periódico do SERVIDOR
// pra reaproveitar (save_game_state é sempre disparado pelo CLIENTE, nunca por um setInterval
// daqui) — então esta é uma escolha nova, documentada: 30s é o meio-termo entre "o processo pode
// cair sem um disconnect limpo e a posição salva fica só até 30s desatualizada" e "não vira um
// UPDATE por jogador ativo a cada poucos segundos". Só grava quem tem overworldDirty=true (setado
// em overworld_move, limpo aqui), pra não reescrever a mesma posição toda vez que um jogador fica
// parado. disconnect (mais abaixo) faz um flush imediato, fora deste ciclo, pra não esperar até
// 30s numa desconexão normal.
const OVERWORLD_PERSIST_INTERVAL_MS = 30 * 1000;

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
// search_players (31/08/2026, sistema de amizades): é leitura, não escrita, mas ainda assim
// varre a tabela players inteira via ILIKE a cada chamada — sem limite nenhum, um script podia
// disparar centenas de buscas por segundo só pra forçar carga no banco. 20/min é folgado pro uso
// legítimo (digitar um nome, ajustar, buscar de novo) e barra abuso automatizado.
const FRIEND_SEARCH_MAX_ATTEMPTS = 20;
// get_player_profile (31/08/2026, "ver perfil de outro jogador"): é leitura de UMA linha por
// email (não varre a tabela como search_players), então pode ser mais generoso — 30/min ainda
// barra um script abrindo perfis em sequência só pra forçar carga no banco.
const PLAYER_PROFILE_MAX_ATTEMPTS = 30;
const RATE_LIMIT_MESSAGE = 'Muitas tentativas, aguarde um momento.';
// Mesmo texto de RATE_LIMIT_MESSAGE, só que em inglês — pedido do usuário (31/08/2026) foi
// traduzir só as mensagens de perfil/diário/upload/amizades pro inglês, sem mexer nas de
// login/cadastro/sessão (fora de escopo), que continuam usando RATE_LIMIT_MESSAGE em português.
// Como o bucket de rate limit é o mesmo mecanismo (isRateLimited) pros dois grupos de eventos,
// a mensagem tem que ser escolhida por CONSTANTE, nunca por tradução da mesma string.
const RATE_LIMIT_MESSAGE_EN = 'Too many attempts, please wait a moment.';
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
            hp: existing.hp !== undefined ? existing.hp : 100,
            // Reset defensivo (02/09/2026, feature overworld): join_game já é o evento existente que
            // o cliente reemite ao entrar/voltar pro contexto side-view (troca de fantasma, etc — ver
            // comentário acima). Trata isso como sinal de "não está mais no overworld agora" pra não
            // deixar o jogador aparecendo pra sempre em overworld_players_update depois que ele entrou
            // em combate — não apaga overworldGridX/Y (última posição continua válida pra quando ele
            // voltar), só a flag de "ativo agora". O agente de Transição pode (e deveria) chamar o
            // evento overworld_leave explicitamente também, ver socket.on('overworld_leave') abaixo —
            // este reset aqui é só uma rede de segurança, não o mecanismo principal.
            //
            // NOTA (Estágio 6, 03/09/2026): este reset NÃO chama socket.leave() da room do chunk —
            // só apaga a flag. Deliberado: overworldZoneId permanece correto (a última room em que o
            // socket realmente está), então se overworld_move disparar de novo depois mudando de
            // chunk, o join/leave de lá compara contra esse valor e corrige a room sozinho; se disparar
            // no MESMO chunk, o socket já está na room certa, nada a fazer. Enquanto fica "preso" nessa
            // room sem estar ativo, o merge de vizinhança do broadcast (setInterval mais abaixo) filtra
            // por overworldActive antes de incluir alguém no payload — então a membership residual na
            // room nunca vaza pra outro jogador ver um "fantasma" inativo.
            overworldActive: false
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

    // Overworld isométrico (02/09/2026): mesmo padrão de player_move (side-view) acima — só
    // atualiza players[socket.id] em memória, sem broadcast aqui dentro (o setInterval separado,
    // OVERWORLD_TICK_RATE, cuida disso). Diferente de player_move, EXIGE sessão autenticada
    // (players[socket.id].email) porque a posição vai ser persistida contra uma conta real no
    // Postgres — um jogador anônimo (que player_move aceita) não tem onde persistir.
    socket.on('overworld_move', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            return; // silencioso — mesmo espírito de save_game_state/update_profile pra evento de alta frequência sem sessão
        }
        if (!data || !isPlausibleGridCoord(data.gridX) || !isPlausibleGridCoord(data.gridY)) {
            return; // fora da faixa -2000/2000 ou não-inteiro: rejeita em silêncio, mesmo padrão de NUMERIC_BOUNDS (db.js)
        }

        // Estágio 6: chunk da posição GLOBAL recebida (85 = chunk_dim_tiles, lido do manifesto, não
        // hardcoded — ver OVERWORLD_CHUNK_DIM_TILES). Math.floor (não truncamento) é obrigatório aqui
        // porque chunkX/chunkY são assinados (plano §1) — pra gridX=-1, floor(-1/85)=-1 (chunk correto,
        // à esquerda da origem), enquanto truncamento daria 0 (chunk errado, começaria a origem).
        const chunkX = Math.floor(data.gridX / OVERWORLD_CHUNK_DIM_TILES);
        const chunkY = Math.floor(data.gridY / OVERWORLD_CHUNK_DIM_TILES);
        if (!isChunkKnownOrAdjacent(chunkX, chunkY)) {
            return; // chunk implausível: nem existe no manifesto, nem é vizinho (folga de 1) de um que existe
        }

        if (playerSession.overworldGridX !== data.gridX || playerSession.overworldGridY !== data.gridY) {
            playerSession.overworldDirty = true; // só marca "precisa persistir" se a posição de fato mudou
        }
        playerSession.overworldGridX = data.gridX;
        playerSession.overworldGridY = data.gridY;
        playerSession.overworldActive = true;
        playerSession.overworldChunkX = chunkX;
        playerSession.overworldChunkY = chunkY;

        // Join/leave de room (Estágio 6) — EXATAMENTE 1 room por jogador, nunca 9 (ver plano §5 e o
        // comentário grande no broadcast mais abaixo pro motivo: o cliente, js/game/network.js:136,
        // faz SUBSTITUIÇÃO da lista a cada overworld_players_update recebido, não merge — se o socket
        // estivesse em 9 rooms, 9 emits fragmentados no mesmo tick se sobrescreveriam um ao outro no
        // cliente, causando jogadores "piscando"). Só troca de room quando o CHUNK muda (não a cada
        // tile), já que zoneId é derivado 1:1 de chunkX/chunkY.
        const zoneId = getOverworldZoneId(chunkX, chunkY);
        if (playerSession.overworldZoneId !== zoneId) {
            if (playerSession.overworldZoneId) {
                socket.leave(playerSession.overworldZoneId);
            }
            socket.join(zoneId);
            playerSession.overworldZoneId = zoneId;
        }
    });

    // Sinal explícito de "saí do overworld" (02/09/2026) — complemento de overworld_move, pro
    // agente de Transição chamar ao entrar na torre/combate side-view, sem depender só do reset
    // defensivo em join_game (ver comentário lá). Não apaga overworldGridX/Y (a última posição
    // continua sendo a correta pra quando o jogador voltar) nem mexe em nada além da flag — não
    // precisa nem persistir aqui, o valor já salvo (ou o próximo ciclo do batch/disconnect) cobre.
    //
    // ATUALIZAÇÃO 03/09/2026 (Estágio 6): agora também sai da room do chunk atual (socket.leave) e
    // limpa overworldZoneId — sem isso, o socket continuaria fisicamente na room do socket.io mesmo
    // marcado como "inativo", e ficaria contando como membro da room pro merge de vizinhança no
    // broadcast (mais abaixo) até o próximo overworld_move mudar de chunk. O merge já filtra por
    // overworldActive como segunda camada de defesa (join_game faz um reset só da flag, sem
    // socket.leave() — ver comentário em join_game), mas aqui, no caminho explícito de saída, o
    // correto é limpar os dois: flag E membership da room, não só a flag.
    socket.on('overworld_leave', () => {
        const playerSession = players[socket.id];
        if (playerSession) {
            playerSession.overworldActive = false;
            if (playerSession.overworldZoneId) {
                socket.leave(playerSession.overworldZoneId);
                playerSession.overworldZoneId = null;
            }
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
            const p = players[socket.id];
            // Flush imediato da posição do overworld (02/09/2026) — não espera o ciclo de
            // OVERWORLD_PERSIST_INTERVAL_MS (até 30s) numa desconexão normal. Incondicional (não
            // checa overworldDirty) porque é barato — no máximo um UPDATE por desconexão, nunca por
            // tick — e garante que o valor salvo está sempre atualizado quando o jogador reconecta.
            if (p.email && Number.isInteger(p.overworldGridX) && Number.isInteger(p.overworldGridY)) {
                saveOverworldPosition(p.email, p.overworldGridX, p.overworldGridY).catch((error) => {
                    console.error(`[Overworld] Erro ao persistir posição de ${p.email} na desconexão:`, error);
                });
            }
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
            players[socket.id].avatarUrl = result.data.avatarUrl || null; // usado pelo payload de overworld_players_update
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
            players[socket.id].avatarUrl = playerData.avatarUrl || null; // usado pelo payload de overworld_players_update
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
            players[socket.id].avatarUrl = playerData.avatarUrl || null; // usado pelo payload de overworld_players_update
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
            players[socket.id].avatarUrl = playerData.avatarUrl || null; // usado pelo payload de overworld_players_update
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

                // Emblemas (31/08/2026): save_game_state é o único ponto por onde level (via
                // characters) e ghostdexProgress (via players) sempre passam, então é aqui que faz
                // sentido checar — depois de já ter confirmado que os dois upserts acima terminaram.
                // Não bloqueia o save_success de cima nem o rejeita se falhar (um emblema atrasado é
                // muito menos grave que um save rejeitado por causa de uma feature separada).
                try {
                    const newlyUnlocked = await checkAndUnlockBadges(playerSession.email);
                    if (newlyUnlocked.length > 0) {
                        console.log(`[Badges] ${playerSession.email} desbloqueou ${newlyUnlocked.length} emblema(s).`);
                        socket.emit('badges_unlocked', { badges: newlyUnlocked });
                    }
                } catch (badgeError) {
                    console.error('[Badges] Erro ao checar emblemas após save_game_state:', badgeError);
                }
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
            socket.emit('profile_error', { message: 'Not authenticated.' });
            return;
        }

        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                const updated = await updateProfile(playerSession.email, data);
                if (updated && updated.name) players[socket.id].name = updated.name;
                // Mantém o avatarUrl em memória sincronizado (02/09/2026) — players[socket.id].avatarUrl
                // só existe pra alimentar overworld_players_update; sem isso, trocar de avatar no meio
                // da sessão deixaria o overworld mostrando a imagem antiga até reconectar.
                if (updated && updated.avatarUrl !== undefined) players[socket.id].avatarUrl = updated.avatarUrl;
                console.log(`[DB] Profile updated for ${playerSession.email}`);
                socket.emit('profile_updated', updated);
            } catch (error) {
                console.error('[DB] Profile update error:', error);
                socket.emit('profile_error', { message: 'Error updating profile.' });
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
            socket.emit('diary_error', { message: 'Not authenticated.' });
            return;
        }
        if (isRateLimited('post_diary_entry:' + socket.handshake.address, DIARY_POST_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            socket.emit('diary_error', { message: RATE_LIMIT_MESSAGE_EN });
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
            socket.emit('diary_error', { message: error.message || 'Error posting diary entry.' });
        });
    });

    // Lista o diário, paginado. Somente leitura — não toca players/characters, não precisa de
    // saveQueues nem de rate limit dedicado (já limitado por limit máximo de 50 em
    // db.js/getDiaryEntries).
    //
    // email opcional no payload (31/08/2026, pedido do usuário: "ver diário de outro jogador",
    // mesmo espírito público de get_player_profile abaixo) — se vier e for diferente da sessão,
    // lê o diário desse OUTRO jogador; sem o campo (ou igual ao e-mail da própria sessão), o
    // comportamento é EXATAMENTE o de antes (retrocompatibilidade: sempre o próprio diário).
    // Continua exigindo socket autenticado (algum jogador logado) — só não exige que o ALVO seja
    // amigo nem a própria sessão, porque o usuário pediu leitura pública entre jogadores logados.
    socket.on('get_diary_entries', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Diary] Rejected: Player not authenticated.');
            socket.emit('diary_error', { message: 'Not authenticated.' });
            return;
        }

        const requestedEmail = data && typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
        const targetEmail = requestedEmail || playerSession.email;

        getDiaryEntries(targetEmail, data || {}).then((result) => {
            socket.emit('diary_entries_loaded', result);
        }).catch((error) => {
            console.error('[DB] Diary load error:', error);
            socket.emit('diary_error', { message: error.message || 'Error loading diary.' });
        });
    });

    // Perfil PÚBLICO de outro jogador (31/08/2026, pedido do usuário: "ver profile de outro
    // jogador, pode ver tudo sem restrição" — nome, avatar, galeria, data de criação da conta,
    // contador de amigos). Mesma decisão de get_diary_entries acima: exige só que o socket esteja
    // autenticado (algum jogador logado, não anônimo), nunca que o alvo seja amigo. getPlayerProfile
    // (db.js) já garante que NUNCA volta password/hash nem qualquer coluna fora dessas 5 + email.
    socket.on('get_player_profile', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('player_profile_error', { message: 'Not authenticated.' });
            return;
        }
        if (isRateLimited('get_player_profile:' + socket.handshake.address, PLAYER_PROFILE_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            socket.emit('player_profile_error', { message: RATE_LIMIT_MESSAGE_EN });
            return;
        }

        getPlayerProfile(data && data.email).then((profile) => {
            socket.emit('player_profile_loaded', profile);
        }).catch((error) => {
            // error.message aqui é sempre a validação de db.js/getPlayerProfile ("e-mail
            // ausente/inválido" ou "esse jogador não existe") — segura de expor, mesmo padrão já
            // usado em searchPlayers/sendFriendRequest.
            socket.emit('player_profile_error', { message: error.message || 'Error loading player profile.' });
        });
    });

    // Sistema de emblemas (31/08/2026, backend-architect). Catálogo estático inteiro (todas as
    // categorias que existirem na tabela `badges`, não só as 210 desta tarefa) + a lista de IDs que
    // uma conta já desbloqueou. Exige login pelo mesmo motivo de get_diary_entries/get_player_profile
    // (nenhuma dessas telas faz sentido pra um socket anônimo).
    //
    // email opcional no payload (01/09/2026, pedido do usuário: "ver medalhas de outro jogador a
    // partir do perfil dele" — mesmo padrão já usado em get_diary_entries acima e get_player_profile):
    // se vier e for diferente da sessão, "unlocked" é a lista DAQUELE jogador; sem o campo (ou igual
    // ao e-mail da própria sessão), comportamento idêntico a antes (sempre os próprios). O catálogo
    // (getBadgeCatalog) nunca muda por jogador — só o filtro de getUnlockedBadgeIds(targetEmail) é
    // que passa a olhar pra outra conta. Mesma decisão já tomada pra get_player_profile/diário: exige
    // só socket autenticado, nunca amizade com o alvo (leitura pública entre contas logadas).
    socket.on('get_badges', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('badges_error', { message: 'Not authenticated.' });
            return;
        }

        const requestedEmail = data && typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
        const targetEmail = requestedEmail || playerSession.email;

        Promise.all([getBadgeCatalog(), getUnlockedBadgeIds(targetEmail)])
            .then(([badges, unlocked]) => {
                socket.emit('badges_loaded', { badges, unlocked, email: targetEmail });
            })
            .catch((error) => {
                console.error('[Badges] Erro ao carregar catálogo:', error);
                socket.emit('badges_error', { message: 'Error loading badges.' });
            });
    });

    // Incremento de contador de conta pro sistema de emblemas (kills / itens / vidas — ver
    // server/db.js, incrementPlayerStat e o comentário grande em ensureTableReady sobre por que
    // esses contadores vivem em players e não em characters). NUNCA aceita um total absoluto do
    // cliente, só um delta pequeno desde a última chamada — db.js já rejeita amount fora de
    // [1, INCREMENT_STAT_MAX_PER_CALL], mas a checagem de "type" é redundante de propósito aqui:
    // um erro de validação rejeitado ainda ANTES de entrar na fila evita que um payload malformado
    // ocupe espaço numa fila que também serve save_game_state/delete_character/update_profile.
    //
    // Encadeado na MESMA fila (saveQueues) que save_game_state/delete_character/update_profile: são
    // todos updates na mesma linha de players (colunas diferentes, mesma linha, mesmo motivo já
    // documentado nesses outros handlers) — sem a fila, um increment_stat disparado no mesmo
    // instante que um save_game_state manual poderia terminar fora de ordem.
    const VALID_STAT_TYPES = ['kill', 'item', 'life'];
    socket.on('increment_stat', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Badges] increment_stat rejected: Player not authenticated.');
            return;
        }
        const type = data && data.type;
        const amount = data && data.amount;
        if (!VALID_STAT_TYPES.includes(type) || !Number.isInteger(amount) || amount < 1) {
            socket.emit('increment_stat_error', { message: 'Payload inválido para increment_stat.' });
            return;
        }

        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                await incrementPlayerStat(playerSession.email, type, amount);
                const newlyUnlocked = await checkAndUnlockBadges(playerSession.email);
                if (newlyUnlocked.length > 0) {
                    console.log(`[Badges] ${playerSession.email} desbloqueou ${newlyUnlocked.length} emblema(s) via increment_stat.`);
                    socket.emit('badges_unlocked', { badges: newlyUnlocked });
                }
            } catch (error) {
                console.error('[Badges] Erro em increment_stat:', error);
                socket.emit('increment_stat_error', { message: error.message || 'Erro ao registrar estatística.' });
            }
        });
        saveQueues[socket.id] = current.catch(() => {});
    });

    // Progresso de emblemas das categorias Exploração/Acrobacias/Segredos (01/09/2026,
    // gameplay-engineer) — irmão do increment_stat logo acima, mas NÃO é a mesma coisa:
    // increment_stat soma um delta pequeno numa coluna fixa de players (kill/item/life) e
    // recomputa contra checkAndUnlockBadges(email) (pull, lê de players/characters).
    // badge_progress empurra um VALOR (contador OU melhor tempo, requirement_type livre —
    // ver js/game/badge_tracker.js) pra uma tabela que só esse sistema usa
    // (player_stat_progress, porque nenhuma dessas ~30 métricas novas tem coluna em
    // players/characters pra reler) e chama submitBadgeProgress (push, MIN/MAX no servidor
    // conforme isLowerBetter() em db.js — nunca aceita o valor bruto como "já é a conquista",
    // sempre compara contra o melhor já registrado, então reenviar um valor pior não desfaz
    // nada). Emite no MESMO evento 'badges_unlocked' que increment_stat/save_game_state usam,
    // pra UI do cliente não precisar saber qual dos dois caminhos disparou um emblema.
    //
    // requirement_type é validado contra um formato esperado (não uma allowlist fechada dos
    // 123 — impediria o outro agente de reusar esse mesmo evento pra um requirement_type novo
    // sem editar este arquivo) só pra rejeitar payload obviamente malformado antes de entrar
    // na fila; quem decide se aquele requirement_type existe de verdade é a query em
    // submitBadgeProgress (WHERE b.requirement_type = $1 — um tipo que não bate com nenhuma
    // linha de badges simplesmente não desbloqueia nada, sem erro).
    //
    // Mesma fila (saveQueues) que save_game_state/increment_stat: mesmo raciocínio de "linha
    // compartilhada" não se aplica aqui (player_stat_progress é uma tabela própria, PK
    // composta), mas o client pode disparar save_game_state e badge_progress bem próximos
    // (ex: level_completed emite os dois) — encadear evita round-trips fora de ordem no log,
    // mesmo sem risco real de corrupção de dado.
    socket.on('badge_progress', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Badges] badge_progress rejected: Player not authenticated.');
            return;
        }
        const requirementType = data && data.requirement_type;
        const value = data && data.value;
        if (typeof requirementType !== 'string' || !/^[a-zA-Z0-9_]{1,64}$/.test(requirementType) || typeof value !== 'number' || !isFinite(value)) {
            socket.emit('badge_progress_error', { message: 'Payload inválido para badge_progress.' });
            return;
        }

        const previous = saveQueues[socket.id] || Promise.resolve();
        const current = previous.then(async () => {
            try {
                const newlyUnlocked = await submitBadgeProgress(playerSession.email, requirementType, value);
                if (newlyUnlocked.length > 0) {
                    console.log(`[Badges] ${playerSession.email} desbloqueou ${newlyUnlocked.length} emblema(s) via badge_progress (${requirementType}).`);
                    socket.emit('badges_unlocked', { badges: newlyUnlocked });
                }
            } catch (error) {
                console.error('[Badges] Erro em badge_progress:', error);
                socket.emit('badge_progress_error', { message: error.message || 'Erro ao registrar progresso de emblema.' });
            }
        });
        saveQueues[socket.id] = current.catch(() => {});
    });

    // Sistema de amizades (31/08/2026): busca de jogadores, pedido de amizade, aceitar/recusar,
    // lista de amigos com contador. Mesma regra de identidade usada em todo o resto deste
    // servidor (save_game_state, update_profile, etc.): quem está AGINDO vem SEMPRE de
    // players[socket.id].email (a sessão autenticada pelo JWT), nunca de um campo do payload —
    // um campo do payload só pode identificar o ALVO da ação (toEmail/fromEmail), nunca o autor.
    // Nenhum desses eventos toca players/characters diretamente (friendships é uma tabela
    // própria, sem coluna compartilhada com o que saveQueues protege), então não precisam entrar
    // na fila saveQueues — mesmo raciocínio já usado pra diary_entries acima; a corrida entre
    // duas contas mandando pedido uma pra outra ao mesmo tempo é resolvida dentro do próprio
    // db.js/sendFriendRequest, com um advisory lock por par de e-mails.

    socket.on('search_players', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('friend_search_error', { message: 'Not authenticated.' });
            return;
        }
        if (isRateLimited('search_players:' + socket.handshake.address, FRIEND_SEARCH_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            socket.emit('friend_search_error', { message: RATE_LIMIT_MESSAGE_EN });
            return;
        }

        searchPlayers(playerSession.email, data && data.query).then((results) => {
            socket.emit('players_found', { results });
        }).catch((error) => {
            // error.message aqui é sempre a validação de comprimento mínimo (db.js/searchPlayers),
            // segura de expor — mesmo padrão de loginPlayer/postDiaryEntry.
            socket.emit('friend_search_error', { message: error.message || 'Error searching players.' });
        });
    });

    socket.on('send_friend_request', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('friend_request_error', { message: 'Not authenticated.' });
            return;
        }

        sendFriendRequest(playerSession.email, data && data.toEmail).then((result) => {
            console.log(`[Friends] ${playerSession.email} -> ${result.toEmail} (autoAccepted: ${result.autoAccepted})`);
            socket.emit('friend_request_sent', result);
        }).catch((error) => {
            socket.emit('friend_request_error', { message: error.message || 'Error sending friend request.' });
        });
    });

    socket.on('get_friend_requests', () => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('friend_request_error', { message: 'Not authenticated.' });
            return;
        }

        getFriendRequests(playerSession.email).then((requests) => {
            socket.emit('friend_requests_loaded', { requests });
        }).catch((error) => {
            console.error('[DB] Friend requests load error:', error);
            socket.emit('friend_request_error', { message: 'Error loading friend requests.' });
        });
    });

    socket.on('respond_friend_request', (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('friend_request_error', { message: 'Not authenticated.' });
            return;
        }

        const accept = !!(data && data.accept);
        respondFriendRequest(playerSession.email, data && data.fromEmail, accept).then((result) => {
            console.log(`[Friends] ${playerSession.email} respondeu pedido de ${result.fromEmail}: ${result.accepted ? 'aceitou' : 'recusou'}`);
            socket.emit('friend_request_responded', result);
        }).catch((error) => {
            socket.emit('friend_request_error', { message: error.message || 'Error responding to friend request.' });
        });
    });

    socket.on('get_friends', () => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            socket.emit('friend_request_error', { message: 'Not authenticated.' });
            return;
        }

        getFriends(playerSession.email).then((result) => {
            socket.emit('friends_loaded', result);
        }).catch((error) => {
            console.error('[DB] Friends load error:', error);
            socket.emit('friend_request_error', { message: 'Error loading friends list.' });
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

// Broadcast periódico do overworld isométrico (02/09/2026, reescrito 03/09/2026 no Estágio 6) — em
// OVERWORLD_TICK_RATE (10Hz, não os 30Hz do combate side-view — motivo documentado na declaração da
// constante lá em cima).
//
// ATÉ O ESTÁGIO 5: io.emit() global — todo jogador ativo no overworld recebia a posição de TODO
// outro jogador ativo, sem nenhum filtro de proximidade (ok pra 1 chunk só; não escala pra cidade
// inteira). ESTÁGIO 6 (aqui): substituído por 1 emissão por CHUNK OCUPADO, cada uma só pra room de
// origem (io.to(zoneId), nunca io.emit global), com o payload mesclado da vizinhança 3×3 desse
// chunk. Cada jogador está em EXATAMENTE 1 room (ow_{chunkX}_{chunkY}, ver overworld_move acima) —
// nunca em 9 — porque o cliente (js/game/network.js:136) faz SUBSTITUIÇÃO da lista a cada
// overworld_players_update recebido, não merge; um jogador em 9 rooms receberia até 9 mensagens
// fragmentadas por tick, cada uma sobrescrevendo a anterior, causando jogadores "piscando" na tela
// (bug real, encontrado por revisão de arquitetura antes deste código ser escrito — ver plano
// crystalline-launching-goose.md §5).
//
// Chunks ocupados são derivados de `players` (não de uma varredura de todas as rooms possíveis —
// instrução explícita da tarefa): só chunks com pelo menos 1 socket overworldActive contam. Pra
// cada um, os 9 candidatos da vizinhança (o próprio + 8 vizinhos) são consultados via
// io.sockets.adapter.rooms.get('ow_'+cx+'_'+cy) — API nativa do socket.io, devolve o Set de
// socket.id daquela room ou undefined se a room não existe/está vazia; nenhum Set/Map paralelo de
// rastreamento é mantido só pra isso.
//
// Note a ausência de um "lastOverworldBroadcastCount" (existia na versão pré-Estágio-6, ver commit
// 73e0bf4): não é mais necessário. Antes, era preciso um flag pra emitir MAIS UMA VEZ com lista
// vazia na transição "tinha gente -> zero", senão o último destinatário global ficava com um
// "fantasma" preso pra sempre (não existiria mais nenhum tick seguinte que o avisasse). Agora, como
// cada chunk ocupado é recalculado do zero A CADA TICK direto de `players`/rooms atuais (sem
// nenhum estado acumulado do tick anterior), a remoção de um jogador da vizinhança aparece
// automaticamente no PRÓXIMO tick pra quem ainda está olhando pra aquele chunk — não existe
// "última lista" pra ficar desatualizada. Só para de emitir pra um chunk quando NINGUÉM mais está
// nele (não há mais destinatário ali mesmo, então não há quem ficaria com um fantasma).
setInterval(() => {
    // 1) Chunks ocupados: Map<zoneId, {chunkX, chunkY}>, um registro por chunk (não por jogador) —
    // vários jogadores no mesmo chunk colapsam na mesma entrada.
    const occupiedZones = new Map();
    Object.values(players).forEach((p) => {
        if (p.overworldActive && p.email && p.overworldZoneId &&
            Number.isInteger(p.overworldChunkX) && Number.isInteger(p.overworldChunkY)) {
            occupiedZones.set(p.overworldZoneId, { chunkX: p.overworldChunkX, chunkY: p.overworldChunkY });
        }
    });

    occupiedZones.forEach((chunk, zoneId) => {
        // 2) Merge da vizinhança 3×3 — chave por socket.id (Map, não array) só pra garantir que um
        // mesmo socket nunca entra duas vezes no payload; na prática nunca duplica de verdade (cada
        // socket está em exatamente 1 das 9 rooms candidatas), isto é só defesa barata.
        const merged = new Map();
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const neighbourZoneId = getOverworldZoneId(chunk.chunkX + dx, chunk.chunkY + dy);
                const room = io.sockets.adapter.rooms.get(neighbourZoneId);
                if (!room) continue; // room não existe (nenhum chunk lá) ou está vazia agora
                room.forEach((socketId) => {
                    const p = players[socketId];
                    // Filtro por overworldActive é OBRIGATÓRIO aqui, não redundante: um socket pode
                    // continuar fisicamente numa room mesmo marcado inativo (join_game faz reset só
                    // da flag, sem socket.leave() — ver comentário lá) até o próximo overworld_move
                    // corrigir a membership. Sem este filtro, esse jogador "fantasma" vazaria pro
                    // payload de quem está por perto mesmo sem estar mais realmente no overworld.
                    if (p && p.overworldActive && p.email &&
                        Number.isInteger(p.overworldGridX) && Number.isInteger(p.overworldGridY)) {
                        merged.set(socketId, {
                            email: p.email,
                            name: p.name,
                            avatarUrl: p.avatarUrl || null,
                            gridX: p.overworldGridX,
                            gridY: p.overworldGridY
                        });
                    }
                });
            }
        }

        // 3) UMA emissão, só pra room de origem (não pras 9 vizinhas) — quem está nas rooms vizinhas
        // recebe o PRÓPRIO payload mesclado quando for a vez delas no forEach acima, cada uma com sua
        // própria vizinhança 3×3 (não a mesma lista replicada 9x).
        io.to(zoneId).emit('overworld_players_update', {
            players: Array.from(merged.values())
        });
    });
}, 1000 / OVERWORLD_TICK_RATE);

// Persistência em lote da posição do overworld (02/09/2026) — ver comentário completo na
// declaração de OVERWORLD_PERSIST_INTERVAL_MS lá em cima. Só grava quem tem overworldDirty=true;
// limpa a flag ANTES do await pra não perder um movimento que chegue durante a escrita (mesmo
// UPDATE reaplicado no próximo ciclo em caso de erro, ver catch abaixo).
setInterval(() => {
    Object.values(players).forEach((p) => {
        if (p.email && p.overworldDirty && Number.isInteger(p.overworldGridX) && Number.isInteger(p.overworldGridY)) {
            p.overworldDirty = false;
            saveOverworldPosition(p.email, p.overworldGridX, p.overworldGridY).catch((error) => {
                console.error(`[Overworld] Erro ao persistir posição de ${p.email}:`, error);
                p.overworldDirty = true; // tenta de novo no próximo ciclo em vez de perder o dado silenciosamente
            });
        }
    });
}, OVERWORLD_PERSIST_INTERVAL_MS);

// ============================================================================
// Upload de imagem de perfil (avatar/galeria) — 29/08/2026, decisão de
// arquitetura revisada pelo usuário: o navegador NÃO fala mais direto com o
// Supabase Storage usando a anon key pública (plano original, abandonado —
// ver comentário histórico em js/web2/profile.js, função UploadImageToSupabase,
// que o agente de cliente ainda vai precisar trocar por uma chamada a este
// endpoint). Este projeto não usa Supabase Auth (login é 100% custom, JWT
// próprio — mesmo jwt.verify() já usado em session_login acima), então não
// existia forma de restringir aquele upload direto a "usuário logado de
// verdade" no sentido do Supabase; só dava pra liberar geral pra qualquer um
// com a anon key. Este servidor Node agora fica no meio: autentica com o JWT
// real do jogo, valida o arquivo (tamanho + assinatura binária real, nunca
// extensão/Content-Type declarado pelo cliente) e só ELE fala com o Supabase
// Storage, usando a service_role key (secreta, nunca sai daqui, ignora RLS).
// O cliente troca a URL pública devolvida aqui pelo mesmo evento
// update_profile que já existia — nada mudou no contrato desse evento.
// ============================================================================

const MAX_UPLOAD_FILE_SIZE_MB = 5; // mesmo teto configurado nos buckets avatars/gallery no painel do Supabase
const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;
const MAX_UPLOAD_BODY_BYTES = MAX_UPLOAD_FILE_SIZE_BYTES + 64 * 1024; // folga pra boundary/headers/campo "type"
const MAX_MULTIPART_PARTS = 20; // teto defensivo — este endpoint só usa 2 partes de verdade (arquivo + "type")

const UPLOAD_TYPE_TO_BUCKET = { avatar: 'avatars', gallery: 'gallery' };

// Rate limit da rota de upload (mesmo mecanismo isRateLimited() já usado em login/signup/diário
// acima): upload é uma operação cara (lê o corpo inteiro, decodifica multipart, faz uma chamada de
// rede pro Supabase Storage) — nunca deixar sem limite. 12/min é generoso o bastante pra um
// jogador legítimo trocar o avatar e preencher a galeria inteira (9 fotos) numa sessão só, mas
// barra um script tentando estourar o bucket ou forçar erro repetidamente.
const UPLOAD_MAX_ATTEMPTS = 12;

// Assinaturas binárias reais (magic bytes) dos formatos aceitos — checadas nos primeiros bytes do
// arquivo de verdade, nunca no nome/extensão nem no Content-Type que o cliente declarou (um
// arquivo .txt renomeado pra .jpg tem Content-Type "image/jpeg" segundo o próprio navegador, mas
// falha em todas as assinaturas abaixo). Cobre os 4 formatos que os buckets aceitam na prática.
const IMAGE_SIGNATURES = [
    { ext: 'jpg', mime: 'image/jpeg', check: (b) => b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
    { ext: 'png', mime: 'image/png', check: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A },
    { ext: 'gif', mime: 'image/gif', check: (b) => b.length >= 6 && b.toString('ascii', 0, 3) === 'GIF' && (b.toString('ascii', 3, 6) === '87a' || b.toString('ascii', 3, 6) === '89a') },
    { ext: 'webp', mime: 'image/webp', check: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' }
];

function detectRealImageType(buffer) {
    return IMAGE_SIGNATURES.find((sig) => sig.check(buffer)) || null;
}

// Parser multipart/form-data escrito à mão de propósito: este endpoint só precisa de 2 campos
// conhecidos (um arquivo + um campo de texto "type"), então escrever isso à mão e testar contra
// requisições reais saiu mais barato — em dependências novas e em superfície de auditoria — do que
// adicionar multer/busboy só pra esse único uso. Opera em Buffer (nunca converte o corpo inteiro
// pra string) porque o conteúdo do arquivo é binário — uma conversão UTF-8 corromperia qualquer
// byte de imagem que não seja um ponto de código UTF-8 válido.
function parseMultipartFormData(bodyBuffer, contentTypeHeader) {
    const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentTypeHeader || '');
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]).trim() : null;
    if (!boundary) throw new Error('Content-Type sem boundary multipart.');

    const boundaryDelim = Buffer.from('--' + boundary);
    const parts = [];
    let cursor = bodyBuffer.indexOf(boundaryDelim);
    if (cursor === -1) throw new Error('Boundary inicial não encontrado no corpo multipart.');
    cursor += boundaryDelim.length;

    while (cursor < bodyBuffer.length) {
        if (bodyBuffer[cursor] === 0x2d && bodyBuffer[cursor + 1] === 0x2d) break; // "--boundary--" = fim
        if (bodyBuffer[cursor] === 0x0d && bodyBuffer[cursor + 1] === 0x0a) cursor += 2; // CRLF após o boundary

        const nextBoundaryIndex = bodyBuffer.indexOf(boundaryDelim, cursor);
        if (nextBoundaryIndex === -1) throw new Error('Boundary de fechamento não encontrado no corpo multipart.');

        let partEnd = nextBoundaryIndex;
        if (bodyBuffer[partEnd - 2] === 0x0d && bodyBuffer[partEnd - 1] === 0x0a) partEnd -= 2; // CRLF antes do próximo boundary

        parts.push(parseMultipartPart(bodyBuffer.subarray(cursor, partEnd)));
        if (parts.length > MAX_MULTIPART_PARTS) throw new Error('Corpo multipart com partes demais.');

        cursor = nextBoundaryIndex + boundaryDelim.length;
    }
    return parts;
}

function parseMultipartPart(partBuffer) {
    const headerEndMarker = Buffer.from('\r\n\r\n');
    const headerEndIndex = partBuffer.indexOf(headerEndMarker);
    if (headerEndIndex === -1) throw new Error('Parte multipart sem separador de headers.');

    const headers = {};
    partBuffer.subarray(0, headerEndIndex).toString('utf8').split('\r\n').forEach((line) => {
        const sep = line.indexOf(':');
        if (sep === -1) return;
        headers[line.slice(0, sep).trim().toLowerCase()] = line.slice(sep + 1).trim();
    });

    const disposition = headers['content-disposition'] || '';
    const nameMatch = /name="([^"]*)"/.exec(disposition);
    const filenameMatch = /filename="([^"]*)"/.exec(disposition);

    return {
        fieldName: nameMatch ? nameMatch[1] : null,
        filename: filenameMatch ? filenameMatch[1] : null,
        data: partBuffer.subarray(headerEndIndex + headerEndMarker.length)
    };
}

// Extrai e valida o Bearer token do mesmo jeito que session_login já valida (jwt.verify contra o
// mesmo JWT_SECRET) — a identidade do dono do upload vem SÓ daqui, nunca de um campo do corpo da
// requisição (mesmo princípio já documentado em save_game_state/update_profile: nunca confiar no
// que o cliente diz que é o dono de um dado, só no que a assinatura do token prova).
function getAuthenticatedEmailFromRequest(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string' || authHeader.slice(0, 7).toLowerCase() !== 'bearer ') return null;
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload && payload.email ? String(payload.email).trim().toLowerCase() : null;
    } catch (err) {
        return null;
    }
}

// Deriva a URL do projeto Supabase a partir do que já existe em server/.env, sem precisar de mais
// uma variável nova pra digitar no console remoto: o usuário de conexão do pooler (dbuser) já vem
// no formato "postgres.<project-ref>" (confirmado no .env atual: "postgres.ywexmucihqjzlqllmqxa").
// Aceita um override explícito via "supabaseurl" (URL completa) pro caso do projeto um dia trocar
// pra conexão direta, onde dbuser vira só "postgres" sem o project-ref embutido — e, desde
// 29/08/2026, também tenta extrair o project-ref direto do HOST nesse caso (dbhost/DATABASE_URL
// no formato "db.<project-ref>.supabase.co"), já que "postgres" sozinho no usuário não carrega
// o ref nenhum. Antes disso, conexão direta caía sempre em `null` (mesmo erro 503 ambíguo da
// chave ausente) sem log nenhum explicando o motivo real.
function getSupabaseProjectUrl() {
    if (process.env.supabaseurl) return process.env.supabaseurl.replace(/\/+$/, '');
    const fromDbUser = /^postgres\.([a-z0-9]+)$/i.exec(process.env.dbuser || '');
    if (fromDbUser) return `https://${fromDbUser[1]}.supabase.co`;
    const fromDbUrl = /postgres\.([a-z0-9]+)/i.exec(process.env.DATABASE_URL || '');
    if (fromDbUrl) return `https://${fromDbUrl[1]}.supabase.co`;
    // Conexão direta (não-pooler): dbuser/DATABASE_URL trazem só "postgres", sem project-ref
    // embutido — o ref mora no HOST ("db.<ref>.supabase.co"), não no usuário.
    const hostSource = process.env.dbhost || process.env.DATABASE_URL || '';
    const fromHost = /(?:^|@|\/\/)db\.([a-z0-9]+)\.supabase\.co/i.exec(hostSource);
    if (fromHost) return `https://${fromHost[1]}.supabase.co`;
    return null;
}

// Diagnóstico de startup — 29/08/2026. Antes disto, `projectUrl` nulo e `serviceKey` ausente
// jogavam a MESMA mensagem de erro ("configuração ausente"), então "a chave não está definida" e
// "a URL do projeto não pôde ser derivada" eram indistinguíveis pelos logs. Loga cada causa
// separadamente, nunca o valor da chave — só comprimento (uma service_role key do Supabase é um
// JWT, tipicamente bem acima de 100 caracteres; comprimento 0 ou muito curto indica linha vazia,
// aspas mal fechadas ou colagem cortada no meio, não ausência total da variável).
(function diagnoseSupabaseUploadConfig() {
    const serviceKey = process.env.supabaseservicerolekey;
    const projectUrl = getSupabaseProjectUrl();

    if (dotenvLoadResult && dotenvLoadResult.error) {
        console.warn(`[Upload] dotenv não conseguiu ler um .env (path tentado: ${dotenvLoadResult.error.path || 'desconhecido'} — cwd atual: ${process.cwd()}). Se este NÃO for o caminho de server/.env, o processo foi iniciado com o cwd errado e nenhuma edição em server/.env terá efeito, não importa quantas vezes reiniciar.`);
    }

    if (!serviceKey) {
        console.warn('[Upload] supabaseservicerolekey não definido no ambiente — POST /api/upload-profile-image vai responder 503 até essa variável existir em server/.env.');
        // dotenv nunca sobrescreve uma variável que JÁ exista em process.env (mesmo vazia) — se o
        // arquivo .env tem um valor mas ele não "pegou", o mais provável é que o PM2 já guardava
        // essa chave (vazia ou velha) na env salva do processo antes mesmo do dotenv rodar.
        const fileHadValue = dotenvLoadResult && dotenvLoadResult.parsed && dotenvLoadResult.parsed.supabaseservicerolekey;
        if (fileHadValue) {
            console.warn('[Upload] server/.env TEM uma linha supabaseservicerolekey=... com conteúdo, mas o processo terminou sem a variável — indica que o PM2 já tinha essa chave gravada na env salva do processo (de um `pm2 set`, export de shell antigo, ou --update-env anterior) e dotenv não sobrescreve o que já existe. Rode `pm2 env <id>` pra confirmar.');
        }
    } else if (serviceKey.length < 100) {
        console.warn(`[Upload] supabaseservicerolekey está definido mas com só ${serviceKey.length} caracteres — uma service_role key real do Supabase (JWT) costuma passar de 200. Isso cheira a valor vazio, truncado, ou colagem cortada no meio de uma linha.`);
    }

    if (!projectUrl) {
        console.warn('[Upload] Não foi possível derivar a URL do projeto Supabase a partir de supabaseurl/dbuser/DATABASE_URL/dbhost — POST /api/upload-profile-image vai responder 503 até uma dessas variáveis identificar o projeto (ver getSupabaseProjectUrl em server/index.js).');
    }

    // Caça a nomes de variável parecidos mas não exatos (typo de maiúscula/underscore/hífen) —
    // este console remoto tem um teclado que derruba o Shift (ver comentário do JWT_SECRET acima),
    // então "SUPABASE_SERVICE_ROLE_KEY" (nome padrão do próprio painel do Supabase) digitado à mão
    // vira algo com hífen ou minúsculo sem avisar ninguém, e o nome exato exigido aqui
    // ("supabaseservicerolekey", tudo minúsculo, sem underscore) não bate com nada disso.
    if (dotenvLoadResult && dotenvLoadResult.parsed) {
        const nearMisses = Object.keys(dotenvLoadResult.parsed)
            .filter((k) => k !== 'supabaseservicerolekey' && k !== 'supabaseurl')
            .filter((k) => /supa|servic/i.test(k));
        if (nearMisses.length > 0) {
            console.warn(`[Upload] server/.env tem variável(is) parecida(s) com o nome esperado mas com grafia diferente: ${nearMisses.join(', ')}. Nenhuma delas é lida pelo código — o nome exato precisa ser "supabaseservicerolekey" (tudo minúsculo, sem underscore/hífen).`);
        }
    }
})();

// Sobe o arquivo pro Supabase Storage via REST direta (PUT), autenticado com a service_role key —
// nunca com a anon key. Não usa @supabase/supabase-js: um PUT com fetch nativo do Node resolve
// sozinho, sem precisar de mais uma dependência só pra isso (mantém o footprint de dependências do
// projeto igual).
async function uploadBufferToSupabaseStorage(bucket, storagePath, buffer, mimeType) {
    const projectUrl = getSupabaseProjectUrl();
    const serviceKey = process.env.supabaseservicerolekey;
    // Duas causas completamente diferentes (chave ausente vs. URL do projeto não-derivável)
    // jogavam a mesma mensagem — achado da investigação de 29/08/2026 (mesmo erro "configuração
    // ausente" persistindo apesar de duas correções de .env em produção). Separadas aqui pra
    // nunca mais exigir adivinhação: o log do servidor (não exposto ao cliente) diz exatamente
    // qual das duas faltou.
    if (!projectUrl && !serviceKey) {
        console.warn('[Upload] Upload bloqueado: nem a URL do projeto Supabase nem supabaseservicerolekey estão disponíveis no ambiente.');
        const err = new Error('Image upload unavailable: Supabase Storage configuration missing on the server.');
        err.httpStatus = 503;
        throw err;
    }
    if (!serviceKey) {
        console.warn('[Upload] Upload bloqueado: supabaseservicerolekey ausente/vazio no ambiente (URL do projeto foi derivada normalmente).');
        const err = new Error('Image upload unavailable: Supabase service key missing on the server.');
        err.httpStatus = 503;
        throw err;
    }
    if (!projectUrl) {
        console.warn('[Upload] Upload bloqueado: URL do projeto Supabase não pôde ser derivada de supabaseurl/dbuser/DATABASE_URL/dbhost (chave de serviço está presente).');
        const err = new Error('Image upload unavailable: Supabase project URL could not be determined on the server.');
        err.httpStatus = 503;
        throw err;
    }

    const uploadUrl = `${projectUrl}/storage/v1/object/${bucket}/${storagePath}`;
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': mimeType
        },
        body: buffer
    });

    if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        console.error(`[Upload] Supabase Storage respondeu ${response.status} para ${bucket}/${storagePath}: ${bodyText}`);
        const err = new Error('Failed to upload the image to storage.');
        err.httpStatus = 502;
        throw err;
    }

    return `${projectUrl}/storage/v1/object/public/${bucket}/${storagePath}`;
}

// Corpo bruto (Buffer) só quando o Content-Type é multipart/form-data — separado do resto do app
// porque este é o único endpoint HTTP deste servidor que recebe upload binário; os outros
// (join_game, save_game_state, etc.) são tudo socket.io, sem precisar de body parser HTTP nenhum.
const uploadRawBodyParser = express.raw({ type: 'multipart/form-data', limit: MAX_UPLOAD_BODY_BYTES });
function parseUploadBody(req, res, next) {
    uploadRawBodyParser(req, res, (err) => {
        if (err) {
            // Cobre tanto "corpo maior que o limite" (PayloadTooLargeError) quanto qualquer outro
            // erro do parser — os dois viram 400 com mensagem clara, conforme pedido.
            return res.status(400).json({ message: `File larger than the ${MAX_UPLOAD_FILE_SIZE_MB}MB limit, or invalid request body.` });
        }
        next();
    });
}

// CORS permissivo só nesta rota (mesma política origin:'*' que o socket.io já usa pro resto do
// jogo, ver `const io = new Server(...)` no topo) — necessário pro app mobile (Capacitor, origem
// diferente do site) conseguir chamar este endpoint depois de escolher uma imagem.
function allowUploadCors(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    next();
}
app.options('/api/upload-profile-image', allowUploadCors, (req, res) => res.sendStatus(204));

app.post('/api/upload-profile-image', allowUploadCors, parseUploadBody, async (req, res) => {
    try {
        if (isRateLimited('upload_profile_image:' + req.ip, UPLOAD_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_MS)) {
            return res.status(429).json({ message: RATE_LIMIT_MESSAGE_EN });
        }

        const email = getAuthenticatedEmailFromRequest(req);
        if (!email) {
            return res.status(401).json({ message: 'Not authenticated. Please log in again.' });
        }

        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ message: 'Send the image as multipart/form-data (Content-Type missing or incorrect).' });
        }

        let parts;
        try {
            parts = parseMultipartFormData(req.body, req.headers['content-type']);
        } catch (parseErr) {
            return res.status(400).json({ message: 'Malformed multipart body.' });
        }

        const filePart = parts.find((p) => p.filename);
        if (!filePart || !filePart.data || filePart.data.length === 0) {
            return res.status(400).json({ message: 'No image file sent (file field missing or empty).' });
        }
        if (filePart.data.length > MAX_UPLOAD_FILE_SIZE_BYTES) {
            return res.status(400).json({ message: `File larger than the ${MAX_UPLOAD_FILE_SIZE_MB}MB limit.` });
        }

        const typePart = parts.find((p) => p.fieldName === 'type');
        const uploadType = typePart ? typePart.data.toString('utf8').trim() : '';
        const bucket = UPLOAD_TYPE_TO_BUCKET[uploadType];
        if (!bucket) {
            return res.status(400).json({ message: 'The "type" field must be "avatar" or "gallery".' });
        }

        // Nunca confia na extensão do nome do arquivo nem no Content-Type declarado pela parte —
        // só nos magic bytes reais do conteúdo (ver IMAGE_SIGNATURES acima).
        const signature = detectRealImageType(filePart.data);
        if (!signature) {
            return res.status(400).json({ message: 'File is not a valid image (accepted formats: JPEG, PNG, GIF, WEBP).' });
        }

        // Hash do e-mail (nunca o e-mail cru) no path — e-mail em texto puro na URL pública do
        // Supabase Storage vazaria o e-mail de qualquer jogador que compartilhasse o link do avatar.
        const emailHash = crypto.createHash('sha256').update(email).digest('hex').slice(0, 32);
        const storagePath = `${emailHash}/${uploadType}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${signature.ext}`;

        const publicUrl = await uploadBufferToSupabaseStorage(bucket, storagePath, filePart.data, signature.mime);

        console.log(`[Upload] Imagem (${uploadType}, ${filePart.data.length} bytes) enviada para ${bucket}/${storagePath} — dono: ${email}`);
        return res.status(200).json({ url: publicUrl });
    } catch (error) {
        // error.httpStatus só existe nos erros esperados (503 "não configurado", 502 "Supabase
        // recusou") — esses já logam o próprio contexto onde acontecem (ex: uploadBufferToSupabaseStorage
        // já loga o corpo da resposta do Supabase em erro). Só imprime o stack trace completo pra
        // exceção genuína e inesperada, senão o log de produção enche de stack trace todo request
        // enquanto supabaseservicerolekey não estiver configurado.
        if (error.httpStatus) {
            console.warn(`[Upload] ${error.httpStatus}: ${error.message}`);
        } else {
            console.error('[Upload] Erro inesperado:', error);
        }
        return res.status(error.httpStatus || 500).json({ message: error.message || 'Error uploading the image.' });
    }
});
// ---------------------------------

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

const PUBLIC_FRONTEND_DIRS = ['js', 'css', 'assets', 'assets2', 'UI', 'Ghosts', 'data'];
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
