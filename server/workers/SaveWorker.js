const redisClient = require('../db/redisClient');
const pool = require('../db/postgresClient');

const SAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function processSaves() {
    console.log('Starting SaveWorker cycle...');
    try {
        let cursor = 0;
        let keys = [];
        
        // Scan for all player state keys in Redis
        do {
            const result = await redisClient.scan(cursor, {
                MATCH: 'player_state:*',
                COUNT: 100
            });
            cursor = result.cursor;
            keys.push(...result.keys);
        } while (cursor !== 0);

        if (keys.length === 0) {
            console.log('No player states to save.');
            return;
        }

        console.log(`Found ${keys.length} player states to sync.`);

        for (const key of keys) {
            const playerId = key.split(':')[1];
            const stateStr = await redisClient.get(key);
            
            if (!stateStr) continue;

            const state = JSON.parse(stateStr);

            // UPSERT to Postgres
            const query = `
                INSERT INTO player_states (player_id, state_data, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (player_id)
                DO UPDATE SET state_data = $2, updated_at = NOW();
            `;
            
            await pool.query(query, [playerId, state]);
            console.log(`Saved state for player ${playerId}`);
        }

        console.log('SaveWorker cycle completed.');
    } catch (err) {
        console.error('Error in SaveWorker cycle:', err);
    }
}

function start() {
    console.log(`SaveWorker started. Interval: ${SAVE_INTERVAL_MS}ms`);
    setInterval(processSaves, SAVE_INTERVAL_MS);
    // Optionally trigger one immediately
    processSaves();
}

module.exports = {
    start,
    processSaves
};
