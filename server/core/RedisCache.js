const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let useMock = false;
const mockCache = new Map();

client.on('error', (err) => {
    console.error('[RedisCache] Redis Client Error, falling back to mock cache', err.message);
    useMock = true;
});

let isConnected = false;
async function connect() {
    if (useMock) return;
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
        } catch(e) {
            console.error('[RedisCache] Fallback to mock cache due to connect error:', e.message);
            useMock = true;
        }
    }
}

class RedisCache {
    static async getHotState(googleUid) {
        await connect();
        if (useMock) {
            const data = mockCache.get(`hotstate:${googleUid}`);
            return data ? JSON.parse(data) : null;
        }
        const data = await client.get(`hotstate:${googleUid}`);
        return data ? JSON.parse(data) : null;
    }

    static async setHotState(googleUid, state) {
        await connect();
        if (useMock) {
            mockCache.set(`hotstate:${googleUid}`, JSON.stringify(state));
            return;
        }
        await client.setEx(`hotstate:${googleUid}`, 86400, JSON.stringify(state));
    }

    static async deleteHotState(googleUid) {
        await connect();
        if (useMock) {
            mockCache.delete(`hotstate:${googleUid}`);
            return;
        }
        await client.del(`hotstate:${googleUid}`);
    }
}

module.exports = RedisCache;
