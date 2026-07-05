const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const players = {}; 
const TICK_RATE = 30;

io.on('connection', (socket) => {
    console.log('[Socket] Player connected: ' + socket.id);

    socket.on('join_game', (data) => {
        const playerName = data.playerName || 'Ghost';
        
        players[socket.id] = {
            id: socket.id,
            name: playerName,
            x: -1000, 
            y: -1000,
            isFacingRight: true,
            level: '1',
            hp: 100
        };

        console.log('[Socket] Player joined: ' + playerName + ' (' + socket.id + ')');
        socket.emit('auth_success', { id: socket.id });
        io.emit('player_joined', { id: socket.id, name: playerName });
    });

    socket.on('player_move', (data) => {
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
});

setInterval(() => {
    if (Object.keys(players).length > 0) {
        io.emit('sync_state', {
            tick: Date.now(),
            players: players
        });
    }
}, 1000 / TICK_RATE);

app.get('/', (req, res) => { res.send('Danger Ghost Server Running!'); });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('[Server] Running on port ' + PORT);
});
