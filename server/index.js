const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const GameLoop = require('./core/GameLoop');
const CombatSystem = require('./logic/CombatSystem');
const LootSystem = require('./logic/LootSystem');
const RoomManager = require('./core/RoomManager');

const roomGameLoops = new Map();
const playerNames = new Map();

function getOrCreateRoomLoop(io, roomId) {
    if (!roomGameLoops.has(roomId)) {
        const loop = new GameLoop(roomId);
        loop.start(io);
        roomGameLoops.set(roomId, loop);
    }
    return roomGameLoops.get(roomId);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files if needed (e.g. from the js/ directory)
app.use(express.static(path.join(__dirname, '../')));

io.on('connection', (socket) => {
    console.log(`[Socket] Player connected: ${socket.id}`);
    
    socket.on('join_game', (data) => {
        const playerName = data.playerName || 'Unknown';
        playerNames.set(socket.id, playerName);

        // Initialize player state
        const playerState = CombatSystem.initPlayer(socket.id);
        socket.emit('init_player', playerState);

        // Join specific room for local sync
        const roomId = RoomManager.matchmake(socket.id);
        socket.join(roomId);
        
        const loop = getOrCreateRoomLoop(io, roomId);
        loop.updatePlayer(socket.id, playerState);

        // Build room roster
        const roster = [];
        const roomPlayers = RoomManager.rooms.get(roomId);
        if (roomPlayers) {
            for (const pid of roomPlayers) {
                roster.push({ id: pid, name: playerNames.get(pid) || 'Unknown' });
            }
        }
        
        // Emit room roster to the joining player
        socket.emit('room_roster', roster);
        
        // Broadcast player_joined to everyone else in the room
        socket.to(roomId).emit('player_joined', { id: socket.id, name: playerName });
    });

    socket.on('player_move', (data) => {
        // Consolidate player positions in the GameLoop instead of broadcasting immediately
        const roomId = RoomManager.getRoom(socket.id);
        const loop = roomId ? roomGameLoops.get(roomId) : null;
        if (loop) loop.updatePlayer(socket.id, { position: data });
    });

    socket.on('player_attack', (data) => {
        const roomId = RoomManager.getRoom(socket.id);
        const loop = roomId ? roomGameLoops.get(roomId) : null;
        if (loop) {
            // Queue combat intent with timestamp to be processed at the end of the tick
            loop.addCombatIntent({
                type: 'attack_boss',
                playerId: socket.id,
                bossId: data.bossId,
                damage: data.damage,
                timestamp: data.timestamp || Date.now(),
                manaCost: 10
            });
            
            io.to(roomId).emit('attack_effect', { id: socket.id, effect: data.type });
        }
    });

    socket.on('boss_collision', (data) => {
        // Take damage
        const result = CombatSystem.takeDamage(socket.id, 1);
        socket.emit('update_hp', result.state.hp);
        if (result.dead) {
            socket.emit('player_died');
        }
    });

    socket.on('kill_boss', (data) => {
        // Add score and XP
        CombatSystem.addScore(socket.id, 3000);
        const xpResult = CombatSystem.addXp(socket.id, 500);
        
        socket.emit('update_stats', { 
            score: CombatSystem.players.get(socket.id).score, 
            xp: xpResult.state.xp,
            level: xpResult.state.level
        });

        // Roll Loot
        const drops = LootSystem.rollEnemyDrop(xpResult.state.level);
        if (drops.length > 0) {
            socket.emit('loot_dropped', drops);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Player disconnected: ${socket.id}`);
        playerNames.delete(socket.id);
        CombatSystem.players.delete(socket.id);
        const leftRoomId = RoomManager.removePlayer(socket.id);
        if (leftRoomId) {
            io.to(leftRoomId).emit('player_left', socket.id);
            const leftLoop = roomGameLoops.get(leftRoomId);
            if (leftLoop) {
                leftLoop.removePlayer(socket.id);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`[Server] Danger Ghost Backend running on port ${PORT}`);
});
