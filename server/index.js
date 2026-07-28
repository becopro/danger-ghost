const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const { loadOrCreatePlayer, savePlayerProgress } = require('./db');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client();

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
            players[socket.id] = { id: socket.id, name: 'Ghost', x: data.x, y: data.y, isFacingRight: data.isFacingRight, level: data.level, hp: data.hp || 100 };
        }
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].isFacingRight = data.isFacingRight;
            players[socket.id].level = data.level;
            if (data.hp !== undefined) players[socket.id].hp = data.hp;
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
            const token = data.token;
            // 1. Extrair payload do token JWT
            // NOTA: Em produção, você deve usar googleClient.verifyIdToken() com seu CLIENT_ID real
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const payload = JSON.parse(jsonPayload);
            const email = payload.email;
            const name = payload.name || payload.given_name || 'Ghost';

            console.log(`[Auth] Google Login request for: ${email}`);

            // 2. Load or Create Player in SQLite
            const result = await loadOrCreatePlayer(email, name);
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

        } catch (error) {
            console.error('[Auth] Error processing Google Token:', error);
            socket.emit('auth_google_error', { message: 'Falha na autenticação com o Google.' });
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
        io.emit('sync_state', {
            tick: Date.now(),
            players: players,
            totalOnline: Object.keys(players).length
        });
    }
}, 1000 / TICK_RATE);

app.get('/', (req, res) => { res.send('Danger Ghost Server Running!'); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('[Server] Running on port ' + PORT);
});
