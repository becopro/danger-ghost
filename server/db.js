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
                ghostdex_progress JSONB DEFAULT '{}',
                favorites JSONB DEFAULT '[]',
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            )
        `).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS ghostdex_progress JSONB DEFAULT '{}'
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS favorites JSONB DEFAULT '[]'
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS avatar_url TEXT
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS gallery_urls JSONB DEFAULT '[]'
        `)).then(() => pool.query(`
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
        `)).then(() => pool.query(`
            CREATE TABLE IF NOT EXISTS diary_entries (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT now()
            )
        `)).then(() => pool.query(`
            CREATE INDEX IF NOT EXISTS idx_diary_entries_email_created ON diary_entries(email, created_at DESC)
        `)).then(() => {
            console.log('[DB] Players/characters/diary_entries tables ready.');
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

// Faixas plausíveis pra rejeitar valor absurdo vindo do cliente (achado 27/08/2026, auditoria de
// segurança: hoje nada impede um jogador de abrir o console e mandar level: 999999999, arma com
// damage: 999999, etc. — isso gravava direto e ficava pra sempre). Não é um catálogo de itens
// completo (seria uma reescrita maior) — é bom senso calibrado a partir das regras reais do jogo
// (rpg_system.js/ghostdex_data.js), não um número arbitrário:
//   - level: xpRequired(999) = floor(100 * 999^1.6) ≈ 6.3M já é astronômico pra alcançar jogando
//     (a curva é exponencial); o maxLevel=1e11 hardcoded no cliente é só trava de loop infinito,
//     nunca um alvo de gameplay real.
//   - xp/xpRequired: tetados um pouco acima de xpRequired(999) (~6.3M) por folga.
//   - vit/agi/int/pow/mag: cada nível dá 5 pontos; nem 998 níveis inteiros num único atributo
//     (4990 pontos) chegam perto de 9999.
//   - pointsToDistribute: mesmo teto de 5 pontos/nível, com folga.
//   - mana/maxMana: getMaxMana() = 100 + mag*20; com mag no teto (9999) isso é ~200 mil.
//   - lives: getMaxLivesCap() = 4 + vit + bônus de elmo; com vit no teto isso é ~10 mil.
//   - score: sem fórmula fechada (kills, level-up = level*200, etc.) — teto generoso mas finito.
//   - weapon.damage: upgradeWeapon() soma 10 por upgrade, custo cresce a cada vez; nenhum jogador
//     real chega nem perto de 100 mil de dano.
const NUMERIC_BOUNDS = {
    level: [1, 999],
    xp: [0, 7000000],
    xpRequired: [0, 7000000],
    pointsToDistribute: [0, 6000],
    vit: [0, 9999],
    agi: [0, 9999],
    int: [0, 9999],
    pow: [0, 9999],
    mag: [0, 9999],
    score: [0, 2000000000],
    time: [0, 100000000],
    worldLevel: [1, 999],
    deaths: [0, 1000000]
};
const PLAYER_NUMERIC_BOUNDS = {
    level: NUMERIC_BOUNDS.level,
    xp: NUMERIC_BOUNDS.xp,
    mana: [0, 250000],
    maxMana: [0, 250000],
    lives: [0, 15000]
};
const WEAPON_DAMAGE_BOUNDS = [0, 100000];

function isPlausibleNumber(value, bounds) {
    const n = Number(value);
    return Number.isFinite(n) && n >= bounds[0] && n <= bounds[1];
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlausibleWeapon(weapon) {
    if (!isPlainObject(weapon)) return false;
    if (typeof weapon.name !== 'string' || weapon.name.length === 0 || weapon.name.length > 100) return false;
    return isPlausibleNumber(weapon.damage, WEAPON_DAMAGE_BOUNDS);
}

// Remove (não grava, loga) campos implausíveis/malformados de um payload de personagem antes de
// ele alimentar tanto o INSERT (personagem novo) quanto o UPDATE (ver saveCharacters logo abaixo)
// — um campo ruim vira "ausente" pros dois casos, em vez de derrubar o save inteiro por causa de
// UM campo ruim (acontece cedo o bastante pra também blindar o desempate de saveCharacters contra
// um characterId duplicado com level forjado tentando "vencer" a deduplicação).
function sanitizeCharacterPayload(email, c) {
    const clean = Object.assign({}, c);
    function reject(field, value) {
        console.warn(`[DB] saveCharacters: campo "${field}" implausível/malformado para ${email}/${c.characterId} (valor: ${JSON.stringify(value)}), ignorado.`);
        delete clean[field];
    }

    ['level', 'xp', 'xpRequired', 'pointsToDistribute', 'vit', 'agi', 'int', 'pow', 'mag', 'score', 'time', 'worldLevel', 'deaths'].forEach((field) => {
        if (clean[field] != null && !isPlausibleNumber(clean[field], NUMERIC_BOUNDS[field])) {
            reject(field, clean[field]);
        }
    });
    if (clean.inventory != null && !Array.isArray(clean.inventory)) reject('inventory', clean.inventory);
    if (clean.equipment != null && !isPlainObject(clean.equipment)) reject('equipment', clean.equipment);
    if (clean.weapon != null && !isPlausibleWeapon(clean.weapon)) reject('weapon', clean.weapon);
    if (clean.equippedSkills != null && !Array.isArray(clean.equippedSkills)) reject('equippedSkills', clean.equippedSkills);
    if (clean.equippedRunes != null && !Array.isArray(clean.equippedRunes)) reject('equippedRunes', clean.equippedRunes);
    if (clean.equippedPassives != null && !Array.isArray(clean.equippedPassives)) reject('equippedPassives', clean.equippedPassives);

    return clean;
}

// Mesma ideia, pro payload que alimenta players (savePlayerProgress).
function sanitizePlayerProgressPayload(email, data) {
    const clean = Object.assign({}, data);
    function reject(field, value) {
        console.warn(`[DB] savePlayerProgress: campo "${field}" implausível/malformado para ${email} (valor: ${JSON.stringify(value)}), ignorado.`);
        delete clean[field];
    }

    if (clean.level != null && !isPlausibleNumber(clean.level, PLAYER_NUMERIC_BOUNDS.level)) reject('level', clean.level);
    if (clean.xp != null && !isPlausibleNumber(clean.xp, PLAYER_NUMERIC_BOUNDS.xp)) reject('xp', clean.xp);
    if (clean.mana != null && !isPlausibleNumber(clean.mana, PLAYER_NUMERIC_BOUNDS.mana)) reject('mana', clean.mana);
    if (clean.maxMana != null && !isPlausibleNumber(clean.maxMana, PLAYER_NUMERIC_BOUNDS.maxMana)) reject('maxMana', clean.maxMana);
    if (clean.lives != null && !isPlausibleNumber(clean.lives, PLAYER_NUMERIC_BOUNDS.lives)) reject('lives', clean.lives);
    if (clean.favorites != null && !Array.isArray(clean.favorites)) reject('favorites', clean.favorites);
    if (clean.ghostdexProgress != null && !isPlainObject(clean.ghostdexProgress)) reject('ghostdexProgress', clean.ghostdexProgress);
    if (clean.equippedSkills != null && !Array.isArray(clean.equippedSkills)) reject('equippedSkills', clean.equippedSkills);

    return clean;
}

// Faixas/formatos plausíveis pro perfil de jogador (29/08/2026, feature nova: nome de exibição,
// avatar, galeria, diário) — mesmo espírito das checagens acima (achados 27/08/2026), aplicado a
// um payload cujos campos são opcionais por natureza (o cliente só manda o que mudou de verdade).
// avatarUrl/galleryUrls apontam pra Supabase Storage (upload feito direto do navegador, ver
// briefing da tarefa) — o servidor nunca recebe o binário, só a URL final; a checagem aqui é
// deliberadamente simples (prefixo https:// + teto de comprimento) porque validar que a URL
// realmente existe exigiria uma requisição de rede synchronous ao Storage a cada update_profile,
// o que não foi pedido e adicionaria uma dependência de rede externa a um caminho que hoje é só
// banco de dados.
const DISPLAY_NAME_MAX_LENGTH = 30;
const MAX_GALLERY_SIZE = 9;
const MAX_PROFILE_URL_LENGTH = 2000;

function isValidProfileUrl(value) {
    return typeof value === 'string'
        && value.startsWith('https://')
        && value.length > 'https://'.length
        && value.length <= MAX_PROFILE_URL_LENGTH;
}

// Sanitiza o payload de update_profile. Diferente de sanitizeCharacterPayload/
// sanitizePlayerProgressPayload (que clonam o payload inteiro e deletam campo ruim), aqui clean
// começa VAZIO: um campo ausente do payload não deve virar chave nenhuma em clean (senão
// updateProfile não teria como distinguir "cliente não mandou esse campo" de "cliente mandou
// null"), e um campo presente mas inválido é logado e também não entra — nos dois casos o SQL
// (COALESCE($valor, coluna_atual)) preserva o que já está gravado.
function sanitizeProfilePayload(email, data) {
    const clean = {};
    const source = isPlainObject(data) ? data : {};

    if (source.displayName !== undefined) {
        if (typeof source.displayName === 'string' && source.displayName.length >= 1 && source.displayName.length <= DISPLAY_NAME_MAX_LENGTH) {
            clean.displayName = source.displayName;
        } else {
            console.warn(`[DB] updateProfile: campo "displayName" inválido para ${email} (precisa ser string de 1 a ${DISPLAY_NAME_MAX_LENGTH} caracteres; valor: ${JSON.stringify(source.displayName)}), ignorado.`);
        }
    }

    if (source.avatarUrl !== undefined) {
        if (isValidProfileUrl(source.avatarUrl)) {
            clean.avatarUrl = source.avatarUrl;
        } else {
            console.warn(`[DB] updateProfile: campo "avatarUrl" inválido para ${email} (precisa ser URL https:// de até ${MAX_PROFILE_URL_LENGTH} caracteres; valor: ${JSON.stringify(source.avatarUrl)}), ignorado.`);
        }
    }

    if (source.galleryUrls !== undefined) {
        if (Array.isArray(source.galleryUrls) && source.galleryUrls.length <= MAX_GALLERY_SIZE && source.galleryUrls.every(isValidProfileUrl)) {
            clean.galleryUrls = source.galleryUrls;
        } else if (Array.isArray(source.galleryUrls) && source.galleryUrls.length > MAX_GALLERY_SIZE) {
            // Rejeita o campo INTEIRO em vez de truncar pros primeiros 9 — truncar silenciosamente
            // esconderia do jogador que parte da galeria que ele mandou não foi salva.
            console.warn(`[DB] updateProfile: campo "galleryUrls" para ${email} veio com ${source.galleryUrls.length} itens (máximo ${MAX_GALLERY_SIZE}), campo inteiro rejeitado sem truncar.`);
        } else {
            console.warn(`[DB] updateProfile: campo "galleryUrls" inválido para ${email} (precisa ser array de até ${MAX_GALLERY_SIZE} URLs https://; valor: ${JSON.stringify(source.galleryUrls)}), ignorado.`);
        }
    }

    return clean;
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

// Valor CRU (sem default JS nenhum, null se ausente) de uma coluna a partir do payload já
// sanitizado — usado só no braço DO UPDATE de saveCharacters (ver comentário lá). Diferente de
// characterToRowValues (que preenche default pro caso de INSERT de verdade), aqui um campo
// ausente tem que virar null de propósito: é o que faz COALESCE($raw, characters.col) preservar
// o valor que já está no banco em vez de sobrescrever com o default de "personagem novo".
function characterFieldRawValue(col, c) {
    switch (col) {
        case 'name': return c.name ?? c.displayName ?? null;
        case 'level': return c.level ?? null;
        case 'xp': return c.xp ?? null;
        case 'xp_required': return c.xpRequired ?? null;
        case 'points_to_distribute': return c.pointsToDistribute ?? null;
        case 'vit': return c.vit ?? null;
        case 'agi': return c.agi ?? null;
        case 'int': return c.int ?? null;
        case 'pow': return c.pow ?? null;
        case 'mag': return c.mag ?? null;
        case 'equipped_skills': return c.equippedSkills ? JSON.stringify(c.equippedSkills) : null;
        case 'equipped_runes': return c.equippedRunes ? JSON.stringify(c.equippedRunes) : null;
        case 'equipped_passives': return c.equippedPassives ? JSON.stringify(c.equippedPassives) : null;
        case 'weapon': return c.weapon ? JSON.stringify(c.weapon) : null;
        case 'inventory': return c.inventory ? JSON.stringify(c.inventory) : null;
        case 'equipment': return c.equipment ? JSON.stringify(c.equipment) : null;
        case 'score': return c.score ?? null;
        case 'time': return c.time ?? null;
        case 'world_level': return c.worldLevel ?? null;
        case 'deaths': return c.deaths ?? null;
        case 'image_url': return c.imageUrl ?? null;
        default: return null;
    }
}

async function loadCharacters(email) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT
            character_id AS "characterId", name, level, xp, xp_required AS "xpRequired",
            points_to_distribute AS "pointsToDistribute", vit, agi, "int", pow, mag,
            equipped_skills AS "equippedSkills", equipped_runes AS "equippedRunes",
            equipped_passives AS "equippedPassives", weapon, inventory, equipment,
            score, "time", world_level AS "worldLevel", deaths, image_url AS "imageUrl",
            updated_at AS "updatedAt"
         FROM characters WHERE email = $1 ORDER BY character_id`,
        [email]
    );
    return rows;
}

// Colunas que entram no braço DO UPDATE (todas menos character_id, que é chave de conflito e
// nunca muda).
const CHARACTER_UPDATE_COLUMNS = CHARACTER_COLUMNS.filter((col) => col !== 'character_id');

async function saveCharacters(email, charactersArray) {
    if (!Array.isArray(charactersArray) || charactersArray.length === 0) return 0;
    await ensureTableReady();

    // Personagens sem characterId não têm como ser identificados de forma estável —
    // ignora em vez de gravar lixo com character_id NULL.
    const validChars = charactersArray.filter((c) => c && c.characterId != null && String(c.characterId).length > 0);
    if (validChars.length === 0) return 0;

    // Sanitiza ANTES de deduplicar (achado 27/08/2026): um campo implausível vira "ausente" desse
    // ponto em diante pra tudo — inclusive pro próprio desempate abaixo, que compara level. Sem
    // sanitizar antes, um characterId duplicado com level forjado (ex: 999999999) venceria a
    // deduplicação só por ter o número mais alto, mesmo rejeitado depois; sanitizando primeiro, um
    // level inválido vira "sem level" (perde o desempate) em vez de "vence o desempate".
    const sanitizedChars = validChars.map((c) => sanitizeCharacterPayload(email, c));

    // Normaliza e deduplica pelo ID normalizado: se o mesmo payload trouxer duas entradas que
    // colapsam pro mesmo ID (ex: "ghost_001" e "ghost_ghost_001" enviadas juntas por um cliente
    // com o bug antigo), mantém só a de maior nível em vez de gravar as duas ou deixar a ordem
    // do array decidir por acaso qual sobrescreve qual.
    const byNormalizedId = new Map();
    for (const c of sanitizedChars) {
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
        // ACHADO CRÍTICO #1 (27/08/2026): antes, o braço DO UPDATE fazia "col = EXCLUDED.col" pra
        // todas as colunas — como characterToRowValues já preenche todo campo ausente do payload
        // com um default fixo em JS (ex: inventory ausente -> "[]"), um UPDATE parcial (payload
        // com só 11 dos 21 campos, ex: UnlockGhostForPlayer em ghost_inventory.js capturando um
        // fantasma já existente no banco mas não no cache local do aparelho) apagava de verdade o
        // progresso real (inventário, equipamento, etc.) que o payload não mencionou.
        //
        // A correção não é só trocar EXCLUDED.col por COALESCE(EXCLUDED.col, characters.col): como
        // EXCLUDED sempre reflete o valor JÁ DEFAULTADO usado no INSERT (nunca NULL, porque
        // characterToRowValues preenche o default ANTES de virar parâmetro), esse COALESCE nunca
        // cairia pro valor existente — sempre escolheria o default de "campo ausente", reproduzindo
        // o mesmo bug com uma sintaxe diferente. Testado e confirmado que essa forma ingênua NÃO
        // preserva dado nenhum antes de chegar nesta versão.
        //
        // A versão que realmente funciona usa DOIS conjuntos de parâmetros pra cada linha:
        //   - insertValues (characterToRowValues, com default JS já aplicado) alimenta só a lista
        //     VALUES(...) do INSERT — cobre o caso de personagem realmente novo, que precisa dos
        //     defaults (fantasma nunca visto antes, capturado pela primeira vez).
        //   - rawValues (characterFieldRawValue, SEM nenhum default — null quando o payload não
        //     trouxe o campo) alimenta só o SET do DO UPDATE, via COALESCE($raw, characters.col) —
        //     aqui um campo ausente cai de verdade pro valor que já está no banco, porque o
        //     parâmetro é null de propósito, não o default de personagem novo.
        // Mesma query resolve os dois casos porque o Postgres só executa UM dos dois braços
        // (INSERT ou DO UPDATE) por linha, dependendo de o (email, character_id) já existir.
        const insertColumnList = CHARACTER_COLUMNS.join(', ');
        // insertValues sempre tem CHARACTER_COLUMNS.length + 1 posições (email + cada coluna) —
        // os parâmetros "crus" usados pelo COALESCE do UPDATE começam logo depois desses ($1.. até
        // esse número já estão ocupados pelo INSERT).
        const INSERT_PARAM_COUNT = CHARACTER_COLUMNS.length + 1;
        const setClause = CHARACTER_UPDATE_COLUMNS
            .map((col, i) => `${col} = COALESCE($${INSERT_PARAM_COUNT + 1 + i}, characters.${col})`)
            .join(', ');
        for (const c of dedupedChars) {
            const insertValues = characterToRowValues(email, c); // [email, character_id, ...20 cols defaultados]
            const rawValues = CHARACTER_UPDATE_COLUMNS.map((col) => characterFieldRawValue(col, c));
            const allValues = insertValues.concat(rawValues);
            const insertPlaceholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
            await client.query(
                `INSERT INTO characters (email, ${insertColumnList}, updated_at)
                 VALUES (${insertPlaceholders}, now())
                 ON CONFLICT (email, character_id) DO UPDATE SET ${setClause}, updated_at = now()`,
                allValues
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

// Apaga um fantasma forjado do banco (30/08/2026) — antes disso, "descartar fantasma"
// (BurnGhostNFT, nome antigo da era DeSo) só tirava do localStorage; o fantasma reaparecia no
// próximo login porque nunca saía do banco. Normaliza o ID pelo mesmo motivo de saveCharacters:
// um cliente com bug de formato não pode deixar uma cópia "presa" sob um ID diferente.
async function deleteCharacter(email, characterId) {
    await ensureTableReady();
    const normalizedId = normalizeCharacterId(characterId);
    const result = await pool.query(
        'DELETE FROM characters WHERE email = $1 AND character_id = $2',
        [email, normalizedId]
    );
    return result.rowCount;
}

// Carrega um jogador só pelo e-mail, sem checar senha — usado pelo login por token de sessão
// (30/08/2026): quem chama aqui já provou a identidade validando a assinatura do JWT antes,
// então repetir a senha seria redundante. Nunca seleciona a coluna password (nem pra apagar
// depois, como loadOrCreatePlayer faz) — assim não existe risco de vazar o hash por engano.
async function loadPlayerByEmail(email) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT email, name, level, xp, mana, max_mana AS "maxMana", lives, equipped_skills AS "equippedSkills",
            ghostdex_progress AS "ghostdexProgress", favorites, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls"
         FROM players WHERE email = $1`,
        [email]
    );
    const row = rows[0];
    if (!row) return null;
    row.characters = await loadCharacters(email);
    return row;
}

// Confere a senha contra o hash salvo, migrando transparentemente senhas antigas em texto puro
// pra bcrypt na primeira vez que confirmam certo. Lança erro se a senha não bater. Só chamar
// depois de confirmar que a linha (row) existe.
async function verifyAndMigratePassword(email, row, password) {
    if (row.password && row.password !== '') {
        const isBcryptHash = BCRYPT_HASH_RE.test(row.password);
        const matches = isBcryptHash
            ? bcrypt.compareSync(password, row.password)
            : row.password === password; // legado em texto puro, ver migração abaixo

        if (!matches) {
            throw new Error("Senha incorreta para o e-mail " + email + "! Verifique sua senha.");
        }

        if (!isBcryptHash) {
            const migratedHash = bcrypt.hashSync(password, 10);
            await pool.query('UPDATE players SET password = $1, updated_at = now() WHERE email = $2', [migratedHash, email]);
        }
    } else {
        // Conta existente nunca teve senha definida: define agora, já hasheada.
        const newHash = bcrypt.hashSync(password, 10);
        await pool.query('UPDATE players SET password = $1, updated_at = now() WHERE email = $2', [newHash, email]);
    }
}

// LOGIN (30/08/2026, pedido do usuário: login e criação de conta são ações separadas agora).
// Recupera uma conta que já existe — NUNCA cria uma nova. Se o e-mail não estiver cadastrado,
// erro claro pedindo pra criar uma conta primeiro, em vez de criar silenciosamente.
async function loginPlayer(email, password) {
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 12) {
        throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    }
    await ensureTableReady();

    const { rows } = await pool.query(
        `SELECT email, name, password, level, xp, mana, max_mana AS "maxMana", lives, equipped_skills AS "equippedSkills",
            ghostdex_progress AS "ghostdexProgress", favorites, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls"
         FROM players WHERE email = $1`,
        [email]
    );
    const row = rows[0];
    if (!row) {
        throw new Error("Não existe conta cadastrada com esse e-mail. Crie uma conta primeiro.");
    }

    await verifyAndMigratePassword(email, row, password);
    delete row.password; // nunca devolver o hash pro cliente
    row.characters = await loadCharacters(email);
    return row;
}

// CRIAR CONTA (30/08/2026). Cadastra um e-mail novo — NUNCA "loga" em cima de um e-mail que já
// existe. Se o e-mail já tiver conta, erro claro pedindo pra usar LOGIN em vez de criar de novo.
async function createPlayer(email, profileName, password) {
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 12) {
        throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    }
    await ensureTableReady();

    const defaultName = profileName || 'Ghost';
    const passwordHash = bcrypt.hashSync(password, 10);
    try {
        await pool.query(
            'INSERT INTO players (email, name, password) VALUES ($1, $2, $3)',
            [email, defaultName, passwordHash]
        );
    } catch (err) {
        if (err.code === '23505') {
            throw new Error("Esse e-mail já está cadastrado. Use LOGIN para recuperar sua conta.");
        }
        throw err;
    }
    return {
        email, name: defaultName, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 0, 0, 0],
        ghostdexProgress: {}, favorites: [], avatarUrl: null, galleryUrls: [],
        characters: [] // conta nova de verdade: nenhum fantasma no banco ainda — o jogador forja o
                        // primeiro (30/08/2026: não existe mais criação automática de um "Ghost
                        // #001" nem adoção de personagens que só existiam no localStorage).
    };
}

// Mantida só para o login real do Google (auth_google_token com token verificado) — nesse fluxo
// faz sentido criar a conta automaticamente no primeiro acesso, igual qualquer login OAuth
// padrão (diferente do login por e-mail/senha manual, que agora exige um CRIAR CONTA explícito).
// Esse caminho está desativado no cliente hoje (nenhuma das duas plataformas tem um client_id do
// Google configurado de verdade — ver CLAUDE.md), mas a função continua pronta pra quando for.
async function loadOrCreatePlayer(email, profileName, password) {
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 12) {
        throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    }
    await ensureTableReady();

    const { rows } = await pool.query(
        `SELECT email, name, password, level, xp, mana, max_mana AS "maxMana", lives, equipped_skills AS "equippedSkills",
            avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls"
         FROM players WHERE email = $1`,
        [email]
    );
    const row = rows[0];

    if (row) {
        await verifyAndMigratePassword(email, row, password);
        delete row.password;
        row.characters = await loadCharacters(email);
        return { status: 'loaded', data: row };
    } else {
        const defaultName = profileName || 'Ghost';
        const passwordHash = bcrypt.hashSync(password, 10);
        try {
            await pool.query(
                'INSERT INTO players (email, name, password) VALUES ($1, $2, $3)',
                [email, defaultName, passwordHash]
            );
        } catch (err) {
            if (err.code === '23505') {
                // Condição de corrida: dois logins Google em paralelo no primeiro acesso, os dois
                // veem "conta não existe" e tentam criar, só um consegue. Refaz a consulta agora
                // que a conta já existe de verdade (cai no ramo "loaded" acima).
                return loadOrCreatePlayer(email, profileName, password);
            }
            throw err;
        }
        return { status: 'created', data: {
            email, name: defaultName, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 0, 0, 0],
            avatarUrl: null, galleryUrls: [],
            characters: []
        } };
    }
}

async function savePlayerProgress(email, data) {
    await ensureTableReady();
    // ACHADO CRÍTICO #2 (27/08/2026): sanitiza ANTES do COALESCE — um campo implausível/malformado
    // (level: 999999999, favorites que não é array, etc.) vira "ausente" pra tudo daqui em diante,
    // e o COALESCE abaixo já trata "ausente" como "preserva o valor atual" — mesmo mecanismo dos
    // dois achados, sem precisar de nenhum código novo no corpo da função além desta linha.
    data = sanitizePlayerProgressPayload(email, data);
    // COALESCE(novo, existente) em cada coluna: quem chama essa função nem sempre manda
    // o estado completo (ex: um save disparado durante a jogatina só manda level/xp/skills,
    // sem mana/vidas) — sem o COALESCE, campos ausentes do payload eram gravados como
    // NULL, apagando dado que já existia. Isso já acontecia mesmo antes de qualquer mudança
    // de hoje, só nunca tinha sido percebido.
    //
    // "name" NUNCA é atualizado aqui (30/08/2026) — antes disso, todo save automático de
    // gameplay mandava data.name = o nome do PERSONAGEM ativo no momento (state.name em
    // rpg_system.js, que existe por personagem), e isso sobrescrevia o nome da CONTA
    // (players.name, mostrado no botão de login, chat, etc.) com o nome de qualquer fantasma
    // que o jogador estivesse jogando. Achado ao investigar por que o nome da conta real do
    // usuário tinha virado "Sombroloom" (o nome de um fantasma nível 1) depois de testar o
    // jogo hoje. O nome da conta só é definido no CRIAR CONTA (server/db.js/createPlayer) e
    // não muda mais sozinho durante o jogo.
    const result = await pool.query(
        `UPDATE players SET
            level = COALESCE($1, level),
            xp = COALESCE($2, xp),
            mana = COALESCE($3, mana),
            max_mana = COALESCE($4, max_mana),
            lives = COALESCE($5, lives),
            equipped_skills = COALESCE($6, equipped_skills),
            ghostdex_progress = COALESCE($7, ghostdex_progress),
            favorites = COALESCE($8, favorites),
            updated_at = now()
         WHERE email = $9`,
        [
            data.level ?? null,
            data.xp ?? null,
            data.mana ?? null,
            data.maxMana ?? null,
            data.lives ?? null,
            data.equippedSkills ? JSON.stringify(data.equippedSkills) : null,
            data.ghostdexProgress ? JSON.stringify(data.ghostdexProgress) : null,
            data.favorites ? JSON.stringify(data.favorites) : null,
            email
        ]
    );
    return result.rowCount;
}

// Grava o perfil de jogador (nome de exibição, avatar, galeria — 29/08/2026, feature nova). Reusa
// a coluna players.name já existente pro nome de exibição (não existe coluna duplicada). Mesmo
// mecanismo de COALESCE dos achados críticos de 27/08/2026: sanitizeProfilePayload já reduziu
// "campo ausente ou inválido" a "chave ausente em clean" antes de chegar aqui, então o `?? null`
// abaixo é o que faz esse campo ser tratado como "não mudou" pelo COALESCE em vez de apagar o
// valor já salvo. RETURNING devolve só o que o cliente precisa pra atualizar a UI local, sem
// round-trip extra nem vazar a senha (nem selecionada nesta query).
async function updateProfile(email, data) {
    await ensureTableReady();
    const clean = sanitizeProfilePayload(email, data);
    const { rows } = await pool.query(
        `UPDATE players SET
            name = COALESCE($1, name),
            avatar_url = COALESCE($2, avatar_url),
            gallery_urls = COALESCE($3, gallery_urls),
            updated_at = now()
         WHERE email = $4
         RETURNING name, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls"`,
        [
            clean.displayName ?? null,
            clean.avatarUrl ?? null,
            clean.galleryUrls ? JSON.stringify(clean.galleryUrls) : null,
            email
        ]
    );
    return rows[0];
}

const DIARY_CONTENT_MAX_LENGTH = 5000;
const DIARY_DEFAULT_LIMIT = 20;
const DIARY_MAX_LIMIT = 50;

// Publica uma entrada de diário (29/08/2026). created_at vem do DEFAULT now() da coluna — nunca
// do cliente, mesma regra de nunca confiar em timestamp vindo do payload que updated_at já segue
// no resto deste arquivo. Lança erro de validação (mensagem segura de expor ao jogador, mesmo
// padrão de loginPlayer/createPlayer acima) em vez de rejeitar em silêncio, porque aqui — ao
// contrário de update_profile, que grava parcialmente o que for válido — a entrada inteira é uma
// coisa só: ou o conteúdo é válido e vira uma linha nova, ou não tem "publicar parcialmente".
async function postDiaryEntry(email, content) {
    await ensureTableReady();
    if (typeof content !== 'string' || content.length < 1 || content.length > DIARY_CONTENT_MAX_LENGTH) {
        throw new Error(`O texto do diário precisa ter entre 1 e ${DIARY_CONTENT_MAX_LENGTH} caracteres.`);
    }
    const { rows } = await pool.query(
        `INSERT INTO diary_entries (email, content) VALUES ($1, $2)
         RETURNING id, content, created_at AS "createdAt"`,
        [email, content]
    );
    return rows[0];
}

// Lista o diário da conta autenticada, paginado (29/08/2026). Ordena por id DESC (não
// created_at): id é SERIAL, cresce exatamente na ordem de inserção, então "WHERE id < $beforeId"
// dá uma página seguinte estável mesmo que duas entradas caiam no mesmíssimo created_at — usar
// created_at como cursor teria esse risco de empate. Busca limit+1 pra saber se existe próxima
// página sem precisar de um COUNT(*) separado; devolve só `limit` linhas pro chamador.
async function getDiaryEntries(email, options) {
    await ensureTableReady();
    const opts = isPlainObject(options) ? options : {};

    let limit = Number(opts.limit);
    if (!Number.isFinite(limit) || limit <= 0) limit = DIARY_DEFAULT_LIMIT;
    limit = Math.min(Math.floor(limit), DIARY_MAX_LIMIT);

    let rows;
    if (opts.beforeId !== undefined && opts.beforeId !== null) {
        const beforeId = Number(opts.beforeId);
        if (!Number.isFinite(beforeId)) {
            throw new Error('beforeId inválido.');
        }
        ({ rows } = await pool.query(
            `SELECT id, content, created_at AS "createdAt" FROM diary_entries
             WHERE email = $1 AND id < $2 ORDER BY id DESC LIMIT $3`,
            [email, beforeId, limit + 1]
        ));
    } else {
        ({ rows } = await pool.query(
            `SELECT id, content, created_at AS "createdAt" FROM diary_entries
             WHERE email = $1 ORDER BY id DESC LIMIT $2`,
            [email, limit + 1]
        ));
    }

    const hasMore = rows.length > limit;
    return { entries: rows.slice(0, limit), hasMore };
}

module.exports = {
    loginPlayer,
    createPlayer,
    loadOrCreatePlayer,
    loadPlayerByEmail,
    savePlayerProgress,
    loadCharacters,
    saveCharacters,
    deleteCharacter,
    updateProfile,
    postDiaryEntry,
    getDiaryEntries
};
