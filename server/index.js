const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const GameLoop = require('./core/GameLoop');
const CombatSystem = require('./logic/CombatSystem');
const LootSystem = require('./logic/LootSystem');
const RoomManager = require('./core/RoomManager');
const Auth = require('./core/Auth');
const Database = require('./core/Database');
const RedisCache = require('./core/RedisCache');

const roomGameLoops = new Map();
const playerNames = new Map();
const playerSessions = new Map();

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
    
    socket.on('join_game', async (data) => {
        try {
            // 1. Authenticate Token
            const token = data.token;
            const decoded = await Auth.verifyGoogleToken(token);
            if (!decoded) {
                console.log(`[Socket] Auth failed for ${socket.id}`);
                socket.emit('auth_failed', { message: "Invalid or missing token" });
                return;
            }

            const { uid, email } = decoded;
            let playerName = data.playerName || email.split('@')[0];
            playerNames.set(socket.id, playerName);

            // 2. Fetch/Create Account in DB
            let account = await Database.getAccountByGoogleUid(uid);
            if (!account) {
                account = await Database.createAccount(uid, email);
            }

            // 3. Fetch/Create Character in DB
            let character = await Database.getCharacterByAccountId(account.id);
            if (!character) {
                const initialGameState = { level: 1, xp: 0, hp: 100, mana: 100 };
                character = await Database.createCharacter(account.id, playerName, initialGameState);
            }

            // 4. Load Game State into Redis (Hot State)
            const hotState = character.game_state;
            await RedisCache.setHotState(uid, hotState);

            console.log(`[Socket] ${playerName} (UID: ${uid}) authenticated and loaded.`);

            // Record session start time for Playtime tracking
            playerSessions.set(socket.id, { characterId: character.id, loginTime: Date.now() });

            // 5. Initialize Server Memory State (Combat System)
            const playerState = CombatSystem.initPlayer(socket.id);
            // Override with loaded DB values if applicable
            if (hotState.hp) playerState.hp = hotState.hp;
            
            // 6. Join Room
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
            
            // Emit success and roster
            socket.emit('auth_success', { gameState: hotState });
            socket.emit('init_player', playerState);
            socket.emit('room_roster', roster);
            
            socket.to(roomId).emit('player_joined', { id: socket.id, name: playerName });

        } catch (error) {
            console.error(`[Socket] Error during join_game:`, error);
            socket.emit('auth_failed', { message: "Internal server error during login" });
        }
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

    socket.on('get_player_profile', async (targetName) => {
        try {
            const profile = await Database.getPublicProfile(targetName);
            if (profile) {
                socket.emit('player_profile_data', {
                    name: profile.name,
                    level: profile.game_state.level || 1,
                    xp: profile.game_state.xp || 0,
                    stats: {
                        vit: profile.game_state.vit || 1,
                        agi: profile.game_state.agi || 1,
                        int: profile.game_state.int || 1,
                        pow: profile.game_state.pow || 1,
                        mag: profile.game_state.mag || 1
                    },
                    playtimeMinutes: profile.playtime_minutes || 0
                });
            } else {
                socket.emit('player_profile_error', { message: 'Profile not found' });
            }
        } catch (e) {
            console.error('[Socket] get_player_profile error:', e);
            socket.emit('player_profile_error', { message: 'Internal error' });
        }
    });

    socket.on('disconnect', async () => {
        console.log(`[Socket] Player disconnected: ${socket.id}`);
        
        // Calculate and save playtime
        const session = playerSessions.get(socket.id);
        if (session && session.characterId) {
            const sessionDurationMs = Date.now() - session.loginTime;
            const sessionMinutes = Math.floor(sessionDurationMs / 60000);
            if (sessionMinutes > 0) {
                try {
                    await Database.updatePlaytime(session.characterId, sessionMinutes);
                    console.log(`[Socket] Saved ${sessionMinutes} minutes of playtime for Character ${session.characterId}`);
                } catch (e) {
                    console.error('[Socket] Failed to save playtime:', e);
                }
            }
        }
        playerSessions.delete(socket.id);
        
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
