const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const { createAccount, authenticatePlayer, saveFullProfile, loadFullProfile, getLeaderboard, migratePasswords, loadOrCreatePlayer, savePlayerProgress } = require('./db');

const players = {}; 
const TICK_RATE = 30;
const loginAttempts = {};

function checkRateLimit(ip) {
    const now = Date.now();
    if (!loginAttempts[ip]) loginAttempts[ip] = [];
    loginAttempts[ip] = loginAttempts[ip].filter(t => now - t < 60000);
    if (loginAttempts[ip].length >= 5) return false;
    loginAttempts[ip].push(now);
    return true;
}

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

    // --- New Save Events ---
    socket.on('register', async (data) => {
        try {
            if (!checkRateLimit(socket.handshake.address)) {
                return socket.emit('register_error', { message: 'Muitas tentativas. Tente novamente mais tarde.' });
            }
            const nickname = (data.nickname || '').trim();
            const email = (data.email || '').trim();
            const password = (data.password || '').trim();
            
            const result = await createAccount(nickname, email, password);
            if (!players[socket.id]) players[socket.id] = { id: socket.id };
            players[socket.id].email = email;
            players[socket.id].name = nickname;
            
            socket.emit('register_success', { email, playerData: result.data });
        } catch (error) {
            socket.emit('register_error', { message: error.message });
        }
    });

    socket.on('login', async (data) => {
        try {
            if (!checkRateLimit(socket.handshake.address)) {
                return socket.emit('login_error', { message: 'Muitas tentativas. Tente novamente mais tarde.' });
            }
            const email = (data.email || '').trim();
            const password = (data.password || '').trim();
            
            const result = await authenticatePlayer(email, password);
            if (!players[socket.id]) players[socket.id] = { id: socket.id };
            players[socket.id].email = email;
            players[socket.id].name = result.data.nickname || result.data.name;
            
            socket.emit('login_success', { email, playerData: result.data });
        } catch (error) {
            socket.emit('login_error', { message: error.message });
        }
    });

    socket.on('save_progress', async (data) => {
        const playerSession = players[socket.id];
        if (!playerSession || !playerSession.email) {
            return socket.emit('save_error', { message: 'Não autenticado' });
        }
        
        try {
            if (data.level < 1 || data.level > 100) data.level = 1;
            if (data.xp < 0) data.xp = 0;
            
            await saveFullProfile(playerSession.email, data);
            socket.emit('save_success');
        } catch (error) {
            socket.emit('save_error', { message: error.message });
        }
    });

    socket.on('get_leaderboard', async () => {
        try {
            const entries = await getLeaderboard(10);
            socket.emit('leaderboard_data', { entries });
        } catch (error) {
            console.error('Leaderboard error', error);
        }
    });

    // --- Old Auth & Save Events ---
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
                const token = data.token;
                const parts = token.split('.');
                if (parts.length !== 3) {
                    throw new Error('Invalid JWT format');
                }
                const base64Url = parts[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                const email = payload.email;
                if (!email) {
                    throw new Error('Email missing from JWT payload');
                }
                const name = payload.name || payload.given_name || 'Ghost';

                console.log(`[Auth] Google Login request for: ${email}`);

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
            } catch (jwtError) {
                console.warn('[Auth] JWT verification failed, checking fallback email:', jwtError.message);
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

app.use(express.static(path.join(__dirname, '../')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('[Server] Running on port ' + PORT);
    migratePasswords().catch(err => console.error('[Migration]', err));
});
