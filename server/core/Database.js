const { Pool } = require('pg');
require('dotenv').config();

// Configuração do pool de conexões
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dangerghost'
});

// In-memory fallback para ambiente local sem Postgres
const mockAccounts = new Map();
const mockCharacters = new Map();

class Database {
    static async getAccountByGoogleUid(googleUid) {
        try {
            const res = await pool.query('SELECT * FROM accounts WHERE google_uid = $1', [googleUid]);
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para getAccountByGoogleUid');
            return mockAccounts.get(googleUid) || null;
        }
    }

    static async createAccount(googleUid, email) {
        try {
            const res = await pool.query(
                'INSERT INTO accounts (google_uid, email) VALUES ($1, $2) RETURNING *',
                [googleUid, email]
            );
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para createAccount');
            const acc = { id: Date.now().toString(), google_uid: googleUid, email: email };
            mockAccounts.set(googleUid, acc);
            return acc;
        }
    }

    static async getCharacterByAccountId(accountId) {
        try {
            const res = await pool.query('SELECT * FROM characters WHERE account_id = $1', [accountId]);
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para getCharacterByAccountId');
            for (let [id, char] of mockCharacters) {
                if (char.account_id === accountId) return char;
            }
            return null;
        }
    }

    static async createCharacter(accountId, name, initialGameState) {
        try {
            const res = await pool.query(
                'INSERT INTO characters (account_id, name, game_state) VALUES ($1, $2, $3) RETURNING *',
                [accountId, name, initialGameState]
            );
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para createCharacter');
            const char = { id: Date.now().toString(), account_id: accountId, name: name, game_state: initialGameState, playtime_minutes: 0 };
            mockCharacters.set(char.id, char);
            return char;
        }
    }

    static async saveGameState(characterId, gameState) {
        try {
            const res = await pool.query(
                'UPDATE characters SET game_state = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [gameState, characterId]
            );
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para saveGameState');
            const char = mockCharacters.get(characterId);
            if (char) char.game_state = gameState;
            return char;
        }
    }

    static async updatePlaytime(characterId, sessionMinutes) {
        if (!sessionMinutes || sessionMinutes <= 0) return;
        try {
            const res = await pool.query(
                'UPDATE characters SET playtime_minutes = playtime_minutes + $1, last_login_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING playtime_minutes',
                [sessionMinutes, characterId]
            );
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para updatePlaytime');
            const char = mockCharacters.get(characterId);
            if (char) char.playtime_minutes += sessionMinutes;
            return char ? { playtime_minutes: char.playtime_minutes } : null;
        }
    }

    static async getPublicProfile(playerName) {
        try {
            const res = await pool.query(
                'SELECT name, game_state, playtime_minutes FROM characters WHERE name = $1 LIMIT 1',
                [playerName]
            );
            return res.rows[0];
        } catch (e) {
            console.warn('[Database] Usando fallback em memória para getPublicProfile');
            for (let [id, char] of mockCharacters) {
                if (char.name === playerName) return char;
            }
            return null;
        }
    }
}

module.exports = Database;
