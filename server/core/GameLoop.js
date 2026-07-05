const TICK_RATE = 30;
const TICK_INTERVAL = 1000 / TICK_RATE;

const CombatSystem = require('../logic/CombatSystem');

class GameLoop {
    constructor(roomId) {
        this.roomId = roomId;
        this.lastTime = Date.now();
        this.running = false;
        this.tickCount = 0;
        this.entities = []; // Server tracked entities (bosses, items)
        this.players = {}; // Track player positions and stats
        this.combatIntents = []; // Queue for combat actions in this tick
    }

    start(io) {
        if (this.running) return;
        this.running = true;
        this.io = io;
        this.lastTime = Date.now();
        console.log(`[GameLoop] Room ${this.roomId} started at ${TICK_RATE} ticks/sec`);
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    loop() {
        if (!this.running) return;

        const now = Date.now();
        const deltaTime = now - this.lastTime;

        if (deltaTime >= TICK_INTERVAL) {
            this.update(deltaTime);
            this.lastTime = now - (deltaTime % TICK_INTERVAL);
        }

        const nextTick = TICK_INTERVAL - (Date.now() - this.lastTime);
        this.timeoutId = setTimeout(() => this.loop(), Math.max(0, nextTick));
    }

    update(deltaTime) {
        this.tickCount++;

        // Here we will update server-side entities (boss AI, moving projectiles, spawning loots)
        // For example, Boss behavior, moving them towards nearest player
        
        // Process combat intents
        if (this.combatIntents.length > 0) {
            const results = CombatSystem.processCombatIntents(this.combatIntents, this.entities);
            // In a full implementation, we'd broadcast these results (e.g. hits, damage, kills)
            this.combatIntents = [];
        }

        // Broadcast sync to all connected clients in the room every tick to consolidate positions
        if (this.io && this.roomId) {
            this.io.to(this.roomId).emit('sync_state', {
                tick: this.tickCount,
                entities: this.entities,
                players: this.players
            });
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entityId) {
        this.entities = this.entities.filter(e => e.id !== entityId);
    }

    updatePlayer(playerId, state) {
        this.players[playerId] = { ...this.players[playerId], ...state };
    }

    removePlayer(playerId) {
        delete this.players[playerId];
    }

    addCombatIntent(intent) {
        this.combatIntents.push(intent);
    }
}

module.exports = GameLoop;
