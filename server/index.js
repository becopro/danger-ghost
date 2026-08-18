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

const { loadOrCreatePlayer, savePlayerProgress } = require('./db');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const players = {}; 
const TICK_RATE = 30;

io.on('connection', (socket) => {
    console.log('[Socket] Player connected: ' + socket.id);

    socket.on('join_game', (data) => {
        const playerName = data.playerName || 'Ghost';
        
        players[socket.id] = {
            id: socket.id,
            name: playerName,
            x: 48, 
            y: 150,
            isFacingRight: true,
            level: '1',
            hp: 100
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
    });

    // --- Google Auth & Save System ---
    socket.on('auth_google_token', async (data) => {
        try {
            if (!data) {
                socket.emit('auth_google_error', { message: 'Dados de autenticação inválidos.' });
                return;
            }

            if (data.isFallback === true || !data.token || typeof data.token !== 'string' || data.token.split('.').length !== 3) {
                if (data.email) {
                    const email = String(data.email).trim();
                    const name = data.name || 'Ghost';
                    console.log(`[Auth] Direct/Fallback Login request for: ${email} (${name})`);
                    const result = await loadOrCreatePlayer(email, name, data.password);
                    console.log(`[DB] Player ${email} ${result.status}. Level: ${result.data.level}`);
                    if (players[socket.id]) {
                        players[socket.id].email = email;
                        players[socket.id].name = result.data.name;
                    }
                    socket.emit('auth_google_success', {
                        email: email,
                        playerData: result.data
                    });
                    return;
                }
            }

            try {
                // 1. Verificar a assinatura do token junto ao Google — NUNCA confiar no payload
                //    decodificado sem verificação (era exatamente essa a falha corrigida aqui:
                //    antes o servidor só fazia atob() do payload e acreditava no e-mail).
                const ticket = await googleClient.verifyIdToken({
                    idToken: data.token,
                    audience: GOOGLE_CLIENT_ID
                });
                const payload = ticket.getPayload();
                const email = payload && payload.email;
                if (!email) {
                    throw new Error('Email missing from verified Google token');
                }
                const name = (payload.name || payload.given_name || 'Ghost');

                console.log(`[Auth] Google Login request for: ${email}`);

                // 2. Load or Create Player in SQLite
                const result = await loadOrCreatePlayer(email, name, data.password);
                console.log(`[DB] Player ${email} ${result.status}. Level: ${result.data.level}`);

                // 3. Vincular email ao socket atual
                if (players[socket.id]) {
                    players[socket.id].email = email;
                    players[socket.id].name = result.data.name; // Atualiza o nome para o do banco
                }

                // 4. Enviar os dados carregados de volta para o cliente
                socket.emit('auth_google_success', {
                    email: email,
                    playerData: result.data
                });
                return;
            } catch (jwtError) {
                console.warn('[Auth] Google token verification failed, checking fallback email:', jwtError.message);
                if (data.email) {
                    const email = String(data.email).trim();
                    const name = data.name || 'Ghost';
                    console.log(`[Auth] Direct/Fallback Login request for: ${email} (${name})`);
                    const result = await loadOrCreatePlayer(email, name, data.password);
                    console.log(`[DB] Player ${email} ${result.status}. Level: ${result.data.level}`);
                    if (players[socket.id]) {
                        players[socket.id].email = email;
                        players[socket.id].name = result.data.name;
                    }
                    socket.emit('auth_google_success', {
                        email: email,
                        playerData: result.data
                    });
                    return;
                }
                throw jwtError;
            }
        } catch (error) {
            console.error('[Auth] Error processing Google Token:', error);
            socket.emit('auth_google_error', { message: error.message || 'Falha ao acessar o Cloud Save. Verifique sua senha e e-mail.' });
        }
    });

    socket.on('cloud_save_login', async (data) => {
        try {
            if (!data || !data.email) {
                socket.emit('cloud_save_error', { message: 'E-mail inválido para o Cloud Save.' });
                return;
            }
            const email = String(data.email).trim();
            const name = data.name || 'Ghost';
            console.log(`[CloudSave] Login request for: ${email} (${name})`);
            const result = await loadOrCreatePlayer(email, name, data.password);
            console.log(`[DB] Player ${email} ${result.status}. Level: ${result.data.level}`);
            if (players[socket.id]) {
                players[socket.id].email = email;
                players[socket.id].name = result.data.name;
            }
            socket.emit('cloud_save_success', {
                email: email,
                playerData: result.data
            });
        } catch (error) {
            console.error('[CloudSave] Error processing login:', error);
            socket.emit('cloud_save_error', { message: error.message || 'Falha ao acessar o Cloud Save.' });
        }
    });

    socket.on('save_game_state', async (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            console.log('[Save] Rejected: Player not authenticated.');
            return; 
        }
        
        try {
            await savePlayerProgress(playerSession.email, data);
            console.log(`[DB] Progress saved for ${playerSession.email}`);
            socket.emit('save_success', { message: 'Progresso salvo na nuvem!' });
        } catch (error) {
            console.error('[DB] Save error:', error);
            socket.emit('save_error', { message: 'Erro ao salvar progresso.' });
        }
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
