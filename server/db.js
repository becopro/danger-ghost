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
        `).then(() => pool.query(`
            CREATE TABLE IF NOT EXISTS characters (
                email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                character_id TEXT NOT NULL,
                name TEXT,
                level INTEGER DEFAULT 1,
                xp DOUBLE PRECISION DEFAULT 0,
                xp_required DOUBLE PRECISION DEFAULT 100,
                points_to_distribute INTEGER DEFAULT 0,
                vit INTEGER DEFAULT 1,
                agi INTEGER DEFAULT 1,
                "int" INTEGER DEFAULT 1,
                pow INTEGER DEFAULT 1,
                mag INTEGER DEFAULT 1,
                equipped_skills JSONB DEFAULT '[0,1,2,3]',
                equipped_runes JSONB DEFAULT '[0,0,0,0]',
                equipped_passives JSONB DEFAULT '[-1,-1]',
                weapon JSONB DEFAULT '{"name":"Starter Dirk","damage":10}',
                inventory JSONB DEFAULT '[]',
                equipment JSONB DEFAULT '{"head":null,"chest":null,"mainhand":null,"offhand":null,"ring1":null,"ring2":null,"amulet":null}',
                score DOUBLE PRECISION DEFAULT 0,
                "time" DOUBLE PRECISION DEFAULT 0,
                world_level INTEGER DEFAULT 1,
                deaths INTEGER DEFAULT 0,
                image_url TEXT,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                PRIMARY KEY (email, character_id)
            )
        `)).then(() => {
            console.log('[DB] Players/characters tables ready.');
        }).catch((err) => {
            console.error('[DB] Error creating table:', err.message);
            tableReadyPromise = null; // permite tentar de novo na próxima chamada, em vez de travar pra sempre
            throw err;
        });
    }
    return tableReadyPromise;
}

// Coluna por coluna, sem depender de JS spread — assim um personagem com campos
// faltando (schemas antigos divergentes, ver docs/HANDOVER.md 20/08/2026) sempre
// grava algo válido em vez de estourar erro de "undefined column".
const CHARACTER_COLUMNS = [
    'character_id', 'name', 'level', 'xp', 'xp_required', 'points_to_distribute',
    'vit', 'agi', 'int', 'pow', 'mag',
    'equipped_skills', 'equipped_runes', 'equipped_passives', 'weapon', 'inventory', 'equipment',
    'score', 'time', 'world_level', 'deaths', 'image_url'
];

// Blindagem no servidor contra bugs de formato de characterId em qualquer cliente (site ou app),
// presente ou futuro: o site e o mobile já tiveram bugs independentes (recursão, prefixo duplicado)
// que geravam IDs tipo "ghost_ghost_001" ou um ID cru ("001") ao lado do formato prefixado
// ("ghost_001") pro mesmo fantasma — cada um corrigido na origem em 20/08/2026, mas sem isso aqui
// qualquer bug parecido no futuro voltaria a duplicar linhas no banco. Colapsa prefixos "ghost_"
// repetidos e força IDs puramente numéricos a usar o formato "ghost_NNN", que é o único que o
// catálogo de fantasmas usa de verdade.
function normalizeCharacterId(rawId) {
    let id = String(rawId);
    while (id.startsWith('ghost_ghost_')) {
        id = id.slice(6);
    }
    if (/^\d+$/.test(id)) {
        id = 'ghost_' + id;
    }
    return id;
}

function characterToRowValues(email, c) {
    return [
        email,
        c.characterId != null ? String(c.characterId) : null,
        c.name ?? c.displayName ?? null,
        c.level ?? 1,
        c.xp ?? 0,
        c.xpRequired ?? 100,
        c.pointsToDistribute ?? 0,
        c.vit ?? 1,
        c.agi ?? 1,
        c.int ?? 1,
        c.pow ?? 1,
        c.mag ?? 1,
        JSON.stringify(c.equippedSkills ?? [0, 1, 2, 3]),
        JSON.stringify(c.equippedRunes ?? [0, 0, 0, 0]),
        JSON.stringify(c.equippedPassives ?? [-1, -1]),
        JSON.stringify(c.weapon ?? { name: 'Starter Dirk', damage: 10 }),
        JSON.stringify(c.inventory ?? []),
        JSON.stringify(c.equipment ?? { head: null, chest: null, mainhand: null, offhand: null, ring1: null, ring2: null, amulet: null }),
        c.score ?? 0,
        c.time ?? 0,
        c.worldLevel ?? 1,
        c.deaths ?? 0,
        c.imageUrl ?? null
    ];
}

async function loadCharacters(email) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT
            character_id AS "characterId", name, level, xp, xp_required AS "xpRequired",
            points_to_distribute AS "pointsToDistribute", vit, agi, "int", pow, mag,
            equipped_skills AS "equippedSkills", equipped_runes AS "equippedRunes",
            equipped_passives AS "equippedPassives", weapon, inventory, equipment,
            score, "time", world_level AS "worldLevel", deaths, image_url AS "imageUrl"
         FROM characters WHERE email = $1 ORDER BY character_id`,
        [email]
    );
    return rows;
}

async function saveCharacters(email, charactersArray) {
    if (!Array.isArray(charactersArray) || charactersArray.length === 0) return 0;
    await ensureTableReady();

    // Personagens sem characterId não têm como ser identificados de forma estável —
    // ignora em vez de gravar lixo com character_id NULL.
    const validChars = charactersArray.filter((c) => c && c.characterId != null && String(c.characterId).length > 0);
    if (validChars.length === 0) return 0;

    // Normaliza e deduplica pelo ID normalizado: se o mesmo payload trouxer duas entradas que
    // colapsam pro mesmo ID (ex: "ghost_001" e "ghost_ghost_001" enviadas juntas por um cliente
    // com o bug antigo), mantém só a de maior nível em vez de gravar as duas ou deixar a ordem
    // do array decidir por acaso qual sobrescreve qual.
    const byNormalizedId = new Map();
    for (const c of validChars) {
        const normalizedId = normalizeCharacterId(c.characterId);
        const existing = byNormalizedId.get(normalizedId);
        if (!existing || (Number(c.level) || 0) >= (Number(existing.level) || 0)) {
            byNormalizedId.set(normalizedId, Object.assign({}, c, { characterId: normalizedId }));
        }
    }
    const dedupedChars = Array.from(byNormalizedId.values());

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const setClause = CHARACTER_COLUMNS
            .filter((col) => col !== 'character_id')
            .map((col) => `${col} = EXCLUDED.${col}`)
            .join(', ');
        for (const c of dedupedChars) {
            const values = characterToRowValues(email, c);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            await client.query(
                `INSERT INTO characters (email, ${CHARACTER_COLUMNS.join(', ')}, updated_at)
                 VALUES (${placeholders}, now())
                 ON CONFLICT (email, character_id) DO UPDATE SET ${setClause}, updated_at = now()`,
                values
            );
        }
        await client.query('COMMIT');
        return dedupedChars.length;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Carrega um jogador só pelo e-mail, sem checar senha — usado pelo login por token de sessão
// (30/08/2026): quem chama aqui já provou a identidade validando a assinatura do JWT antes,
// então repetir a senha seria redundante. Nunca seleciona a coluna password (nem pra apagar
// depois, como loadOrCreatePlayer faz) — assim não existe risco de vazar o hash por engano.
async function loadPlayerByEmail(email) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT email, name, level, xp, mana, max_mana AS "maxMana", lives, equipped_skills AS "equippedSkills"
         FROM players WHERE email = $1`,
        [email]
    );
    const row = rows[0];
    if (!row) return null;
    row.characters = await loadCharacters(email);
    return row;
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
        row.characters = await loadCharacters(email);
        return { status: 'loaded', data: row };
    } else {
        // Create new player profile
        const defaultName = profileName || 'Ghost';
        const passwordHash = bcrypt.hashSync(password, 10);
        try {
            await pool.query(
                'INSERT INTO players (email, name, password) VALUES ($1, $2, $3)',
                [email, defaultName, passwordHash]
            );
        } catch (err) {
            if (err.code === '23505') {
                // Condição de corrida: o cliente manda dois logins em paralelo no primeiro acesso
                // (cloud_save_login e auth_google_token com isFallback, ver server/index.js) — se
                // os dois chegarem quase juntos, os dois veem "conta não existe" e tentam criar,
                // só um consegue. Em vez de estourar erro pro segundo, refaz a consulta agora que
                // a conta já existe de verdade (cai no ramo "loaded" acima).
                return loadOrCreatePlayer(email, profileName, password);
            }
            throw err;
        }
        return { status: 'created', data: {
            email, name: defaultName, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 0, 0, 0],
            characters: [] // conta nova de verdade: nenhum fantasma no banco ainda. O cliente decide o
                            // que fazer com uma lista vazia (criar o Ghost #001 padrão ou adotar o que
                            // já existir em localStorage — ver auth.js).
        } };
    }
}

async function savePlayerProgress(email, data) {
    await ensureTableReady();
    // COALESCE(novo, existente) em cada coluna: quem chama essa função nem sempre manda
    // o estado completo (ex: um save disparado durante a jogatina só manda level/xp/skills,
    // sem mana/vidas/nome) — sem o COALESCE, campos ausentes do payload eram gravados como
    // NULL, apagando dado que já existia. Isso já acontecia mesmo antes de qualquer mudança
    // de hoje, só nunca tinha sido percebido.
    const result = await pool.query(
        `UPDATE players SET
            name = COALESCE($1, name),
            level = COALESCE($2, level),
            xp = COALESCE($3, xp),
            mana = COALESCE($4, mana),
            max_mana = COALESCE($5, max_mana),
            lives = COALESCE($6, lives),
            equipped_skills = COALESCE($7, equipped_skills),
            updated_at = now()
         WHERE email = $8`,
        [
            data.name ?? null,
            data.level ?? null,
            data.xp ?? null,
            data.mana ?? null,
            data.maxMana ?? null,
            data.lives ?? null,
            data.equippedSkills ? JSON.stringify(data.equippedSkills) : null,
            email
        ]
    );
    return result.rowCount;
}

module.exports = {
    loadOrCreatePlayer,
    loadPlayerByEmail,
    savePlayerProgress,
    loadCharacters,
    saveCharacters
};
