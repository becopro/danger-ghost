const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const BCRYPT_HASH_RE = /^\$2[aby]\$/;

// Usa variáveis separadas (dbhost/dbport/dbuser/dbpass/dbname) em vez de uma
// única DATABASE_URL — a connection string tem `:`, `@` e maiúsculas, que
// quebravam ao serem digitadas/coladas no console do servidor (teclado
// remoto que derruba o Shift). Se DATABASE_URL estiver definida (ex: outro
// ambiente sem esse problema), ela ainda tem prioridade.
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.dbhost,
        port: Number(process.env.dbport) || 5432,
        user: process.env.dbuser,
        password: process.env.dbpass,
        database: process.env.dbname || 'postgres',
        ssl: { rejectUnauthorized: false } // Supabase exige SSL; certificado gerenciado por eles.
    });

pool.on('error', (err) => {
    console.error('[DB] Erro inesperado numa conexão ociosa do Postgres:', err.message);
});

pool.on('connect', () => {
    console.log('[DB] Conectado ao Postgres (Supabase).');
});

let tableReadyPromise = null;

function ensureTableReady() {
    if (!tableReadyPromise) {
        tableReadyPromise = pool.query(`
            CREATE TABLE IF NOT EXISTS players (
                email TEXT PRIMARY KEY,
                name TEXT,
                password TEXT DEFAULT '',
                level INTEGER DEFAULT 1,
                xp DOUBLE PRECISION DEFAULT 0,
                mana DOUBLE PRECISION DEFAULT 100,
                max_mana DOUBLE PRECISION DEFAULT 100,
                lives INTEGER DEFAULT 3,
                equipped_skills JSONB DEFAULT '[0,0,0,0]',
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        `).then(() => {
            console.log('[DB] Players table ready.');
        }).catch((err) => {
            console.error('[DB] Error creating table:', err.message);
            tableReadyPromise = null; // permite tentar de novo na próxima chamada, em vez de travar pra sempre
            throw err;
        });
    }
    return tableReadyPromise;
}

async function loadOrCreatePlayer(email, profileName, password) {
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 12) {
        throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    }
    await ensureTableReady();

    const { rows } = await pool.query(
        `SELECT email, name, password, level, xp, mana, max_mana AS "maxMana", lives, equipped_skills AS "equippedSkills"
         FROM players WHERE email = $1`,
        [email]
    );
    const row = rows[0];

    if (row) {
        if (row.password && row.password !== '') {
            const isBcryptHash = BCRYPT_HASH_RE.test(row.password);
            const matches = isBcryptHash
                ? bcrypt.compareSync(password, row.password)
                : row.password === password; // legado em texto puro, ver migração abaixo

            if (!matches) {
                throw new Error("Senha incorreta para o e-mail " + email + "! Verifique sua senha.");
            }

            if (!isBcryptHash) {
                // Migração transparente: senha legada em texto puro confirmada, regrava já hasheada.
                const migratedHash = bcrypt.hashSync(password, 10);
                await pool.query('UPDATE players SET password = $1, updated_at = now() WHERE email = $2', [migratedHash, email]);
                row.password = migratedHash;
            }
        } else {
            // Conta existente nunca teve senha definida: define agora, já hasheada.
            const newHash = bcrypt.hashSync(password, 10);
            await pool.query('UPDATE players SET password = $1, updated_at = now() WHERE email = $2', [newHash, email]);
            row.password = newHash;
        }

        // Nunca devolver o hash da senha para o cliente.
        delete row.password;
        // equipped_skills é JSONB — o driver do pg já devolve como array JS, sem precisar de JSON.parse.
        return { status: 'loaded', data: row };
    } else {
        // Create new player profile
        const defaultName = profileName || 'Ghost';
        const passwordHash = bcrypt.hashSync(password, 10);
        await pool.query(
            'INSERT INTO players (email, name, password) VALUES ($1, $2, $3)',
            [email, defaultName, passwordHash]
        );
        return { status: 'created', data: {
            email, name: defaultName, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 0, 0, 0],
            characters: [{
                characterId: "001",
                displayName: "Ghost #001",
                level: 1, xp: 0, pointsToDistribute: 0,
                vit: 1, agi: 1, int: 1, pow: 1, mag: 1,
                equippedSkills: [0, 1, 2, 3], equippedRunes: [0, 0, 0, 0], equippedPassives: [-1, -1],
                weapon: { name: 'Starter Dirk', damage: 10 }
            }]
        } };
    }
}

async function savePlayerProgress(email, data) {
    await ensureTableReady();
    const result = await pool.query(
        `UPDATE players SET
            name = $1, level = $2, xp = $3, mana = $4, max_mana = $5, lives = $6, equipped_skills = $7, updated_at = now()
         WHERE email = $8`,
        [data.name, data.level, data.xp, data.mana, data.maxMana, data.lives, JSON.stringify(data.equippedSkills || [0, 0, 0, 0]), email]
    );
    return result.rowCount;
}

module.exports = {
    loadOrCreatePlayer,
    savePlayerProgress
};
