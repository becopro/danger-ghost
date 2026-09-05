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
            -- Contadores de conta pro sistema de emblemas (31/08/2026, tarefa do backend-architect:
            -- "total de inimigos derrotados" e "total de itens/vidas coletadas" ao longo da CONTA, não
            -- do personagem/fantasma ativo). Vivem em players (não em characters) de propósito: o
            -- jogador troca de fantasma o tempo todo (rpg_system.js/SwitchActiveGhost), e um kill ou
            -- item coletado não "pertence" ao fantasma que por acaso estava ativo no momento — é
            -- estatística da conta inteira, mesmo raciocínio que já vale pra ghostdex_progress/
            -- favorites nesta mesma tabela. Nunca são gravados como valor absoluto vindo do cliente
            -- (trivial de forjar no console, igual ao já documentado em NUMERIC_BOUNDS acima) — só via
            -- incrementPlayerStat(), que soma no servidor (total_x = total_x + $delta), com o delta
            -- limitado a um teto pequeno por chamada (ver INCREMENT_STAT_BOUNDS em index.js).
            ALTER TABLE players ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS total_items_collected INTEGER DEFAULT 0
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS total_lives_collected INTEGER DEFAULT 0
        `)).then(() => pool.query(`
            -- Overworld isométrico de Niterói (02/09/2026, tarefa do backend-architect): última
            -- posição de grid conhecida do jogador no mapa aberto. Igual ghostdex_progress/favorites
            -- acima, é por CONTA (não por personagem/fantasma) — o overworld é compartilhado entre
            -- todos os fantasmas de uma conta, não uma instância de combate por personagem. NULL nos
            -- dois = jogador nunca esteve no overworld ainda; o cliente usa a posição da torre
            -- (window.OverworldTowerGridPos) como spawn padrão nesse caso — decisão e implementação
            -- do agente de Transição, não deste servidor. Nunca gravadas a cada movimento (ver
            -- overworld_move/saveOverworldPosition mais abaixo) — só em lote, para não sobrecarregar
            -- o Postgres com um UPDATE por tick de jogador.
            ALTER TABLE players ADD COLUMN IF NOT EXISTS overworld_grid_x INTEGER
        `)).then(() => pool.query(`
            ALTER TABLE players ADD COLUMN IF NOT EXISTS overworld_grid_y INTEGER
        `)).then(() => pool.query(`
            -- Baú de conta (04/09/2026, tarefa do backend-architect: Cemitério + Baú, Track A).
            -- Igual ghostdex_progress/favorites/overworld_grid_x/y acima, mora em players (não em
            -- characters) porque é dado de CONTA: o jogador troca de fantasma o tempo todo
            -- (rpg_system.js/SwitchActiveGhost), e um item guardado no baú não "pertence" ao
            -- fantasma que por acaso estava ativo no momento em que foi guardado — é um inventário
            -- extra COMPARTILHADO entre todos os fantasmas da conta, de onde qualquer um deles pode
            -- puxar item de volta. Mesmo formato de objeto já usado no inventory de personagem
            -- (id/name/icon/description/count/quality/etc., ver ui_manager.js:UpdateNavbarBag) —
            -- nenhum schema de item novo, só um array JSONB diferente guardando a mesma forma.
            -- Default '[]' (conta nova = baú vazio), teto de 1000 itens NUNCA confiado a este
            -- DEFAULT nem ao cliente — é reforçado no servidor dentro de
            -- sanitizePlayerProgressPayload (ver comentário lá) toda vez que o campo chega por
            -- save_game_state, porque um DEFAULT de coluna não impede um cliente de mandar um
            -- array maior depois.
            ALTER TABLE players ADD COLUMN IF NOT EXISTS chest_items JSONB DEFAULT '[]'
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
        `)).then(() => pool.query(`
            CREATE TABLE IF NOT EXISTS friendships (
                id SERIAL PRIMARY KEY,
                requester_email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                addressee_email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT now(),
                responded_at TIMESTAMPTZ,
                UNIQUE(requester_email, addressee_email),
                CHECK (requester_email <> addressee_email)
            )
        `)).then(() => pool.query(`
            CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_email, status)
        `)).then(() => pool.query(`
            CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_email, status)
        `)).then(() => pool.query(`
            -- Sistema de emblemas/conquistas (31/08/2026). "badges" é catálogo estático — populado
            -- uma vez por server/seed_badges.js, igual ghostdex_data.js do cliente mas server-side —
            -- nunca escrito por um jogador. "player_badges" é o desbloqueio real por conta, checado em
            -- checkAndUnlockBadges() sempre que level/kills/itens/vidas/ghostdex mudam de verdade.
            CREATE TABLE IF NOT EXISTS badges (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                requirement_type TEXT NOT NULL,
                requirement_value NUMERIC,
                sort_order INTEGER NOT NULL
            )
        `)).then(() => pool.query(`
            CREATE TABLE IF NOT EXISTS player_badges (
                email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
                unlocked_at TIMESTAMPTZ DEFAULT now(),
                PRIMARY KEY (email, badge_id)
            )
        `)).then(() => pool.query(`
            CREATE INDEX IF NOT EXISTS idx_player_badges_email ON player_badges(email)
        `)).then(() => pool.query(`
            -- Progresso cru por conta (01/09/2026, gameplay-engineer). "badges"/"player_badges" (acima,
            -- já existiam quando cheguei) cobrem catálogo + desbloqueio, mas nenhum dos dois guarda o
            -- VALOR corrente de um contador que só o sistema de badges rastreia (ex: quantas vezes já
            -- tentou sair do mapa, melhor tempo já feito numa fase) — muita coisa das minhas 3
            -- categorias (Exploração/Acrobacias/Segredos) não tem coluna equivalente em nenhuma tabela
            -- existente pra reaproveitar. Sem isso, o progresso "quase lá" se perderia a cada refresh
            -- (o cliente só manda o valor local, que também pode ser limpo com o localStorage).
            -- Convenção: "value" é sempre o MELHOR valor já visto pra essa conta+requirement_type —
            -- MAX pra contadores (quanto maior melhor) e MIN pra tempos (quanto menor melhor), ver
            -- isLowerBetter() logo abaixo.
            CREATE TABLE IF NOT EXISTS player_stat_progress (
                email TEXT NOT NULL REFERENCES players(email) ON DELETE CASCADE,
                requirement_type TEXT NOT NULL,
                value NUMERIC NOT NULL,
                updated_at TIMESTAMPTZ DEFAULT now(),
                PRIMARY KEY (email, requirement_type)
            )
        `)).then(() => seedBadgeCatalog()).then(() => {
            console.log('[DB] Players/characters/diary_entries/friendships/badges/player_stat_progress tables ready.');
        }).catch((err) => {
            console.error('[DB] Error creating table:', err.message);
            tableReadyPromise = null; // permite tentar de novo na próxima chamada, em vez de travar pra sempre
            throw err;
        });
    }
    return tableReadyPromise;
}

// Popula/atualiza o catálogo estático de emblemas a partir de server/seed_badges.js (idempotente —
// ON CONFLICT faz UPDATE pra editar nome/descrição/threshold de um emblema só editando o arquivo e
// reiniciando o servidor, sem precisar de migration manual). Nunca toca em player_badges — só o
// catálogo. Roda uma vez por boot, dentro da mesma cadeia de ensureTableReady().
async function seedBadgeCatalog() {
    let catalog;
    try {
        catalog = require('./seed_badges.js');
    } catch (err) {
        console.warn('[DB] seed_badges.js ausente ou inválido — catálogo de emblemas não populado:', err.message);
        return;
    }
    if (!Array.isArray(catalog) || catalog.length === 0) return;

    // Achado 31/08/2026 (agente que testou "ver medalhas de outro jogador"): a versão original
    // fazia 1 INSERT por linha (320 round-trips sequenciais pro Supabase), travando o primeiro
    // login de qualquer jogador em 1-2 minutos toda vez que o servidor reinicia — ensureTableReady()
    // roda isso antes de liberar qualquer query. Um único INSERT multi-linha (mesmo ON CONFLICT,
    // mesmo resultado) faz isso em 1 round-trip.
    const rows = catalog.filter((b) => b && b.id && b.category && b.name && b.requirement_type);
    if (rows.length === 0) return;

    const values = [];
    const placeholders = rows.map((b, i) => {
        const base = i * 7;
        values.push(b.id, b.category, b.name, b.description || '', b.requirement_type, b.requirement_value, b.sort_order || 0);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    }).join(', ');

    await pool.query(
        `INSERT INTO badges (id, category, name, description, requirement_type, requirement_value, sort_order)
         VALUES ${placeholders}
         ON CONFLICT (id) DO UPDATE SET
            category = EXCLUDED.category,
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            requirement_type = EXCLUDED.requirement_type,
            requirement_value = EXCLUDED.requirement_value,
            sort_order = EXCLUDED.sort_order`,
        values
    );
    console.log(`[DB] Catálogo de emblemas: ${rows.length} linhas seedadas/atualizadas de seed_badges.js.`);
}

// requirement_type cujo progresso é "quanto MENOR, melhor" (recordes de tempo) — todo o resto usa
// a convenção padrão "quanto MAIOR, melhor" (contadores/thresholds). Não existe coluna de direção
// no schema de badges (dado como está); inferir por convenção de nome evita adicionar uma coluna
// que o outro agente (schema/210 badges numéricas) não previu. Se um requirement_type numérico novo
// também for "menor melhor" (ex: "menos mortes"), adicione aqui — não crie uma segunda convenção.
function isLowerBetter(requirementType) {
    return requirementType.startsWith('level_time_') || requirementType === 'full_game_time';
}

// Push-based, irmão do checkAndUnlockBadges(email) pull-based do backend-architect (acima) — não dá
// pra reusar aquele aqui: ele relê level/kills/lives/episode_items_complete direto de colunas que
// já existem em players/characters, com uma WHERE fixa pra só esses 4 requirement_type. As minhas 3
// categorias (Exploração/Acrobacias/Segredos) não têm nenhuma coluna equivalente pra reler — o
// cliente PRECISA empurrar o valor (quantas vezes já phaseou parede, melhor tempo de fase, etc.),
// daí o nome diferente. Devolve os emblemas recém-desbloqueados no MESMO formato de linha que
// checkAndUnlockBadges devolve, pra o handler em index.js poder emitir os dois pelo mesmo evento
// 'badges_unlocked' sem o cliente precisar saber qual dos dois caminhos disparou.
async function submitBadgeProgress(email, requirementType, rawValue) {
    await ensureTableReady();
    const value = Number(rawValue);
    if (!email || typeof requirementType !== 'string' || !requirementType || !isFinite(value)) return [];

    const lowerBetter = isLowerBetter(requirementType);
    const { rows: progressRows } = await pool.query(
        `INSERT INTO player_stat_progress (email, requirement_type, value, updated_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (email, requirement_type) DO UPDATE SET
            value = CASE WHEN $4 THEN LEAST(player_stat_progress.value, EXCLUDED.value)
                          ELSE GREATEST(player_stat_progress.value, EXCLUDED.value) END,
            updated_at = now()
         RETURNING value`,
        [email, requirementType, value, lowerBetter]
    );
    const bestValue = Number(progressRows[0].value);

    // Mesma transação + ON CONFLICT DO NOTHING que checkAndUnlockBadges usa (mesma preocupação de
    // corrida rara entre duas chamadas quase simultâneas pra essa conta — inofensiva por causa da
    // PK composta (email, badge_id), sem precisar de fila).
    const { rows: candidates } = await pool.query(
        `SELECT b.id, b.category, b.name, b.description, b.requirement_type, b.requirement_value, b.sort_order
         FROM badges b
         WHERE b.requirement_type = $1
           AND NOT EXISTS (SELECT 1 FROM player_badges pb WHERE pb.email = $2 AND pb.badge_id = b.id)
           AND (($3 AND b.requirement_value >= $4) OR (NOT $3 AND b.requirement_value <= $4))`,
        [requirementType, email, lowerBetter, bestValue]
    );
    if (candidates.length === 0) return [];

    const client = await pool.connect();
    const unlocked = [];
    try {
        await client.query('BEGIN');
        for (const badge of candidates) {
            const result = await client.query(
                `INSERT INTO player_badges (email, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING badge_id`,
                [email, badge.id]
            );
            if (result.rowCount > 0) unlocked.push(badge);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    return unlocked;
}

async function getPlayerStatProgress(email, requirementType) {
    await ensureTableReady();
    const { rows } = await pool.query(
        'SELECT value FROM player_stat_progress WHERE email = $1 AND requirement_type = $2',
        [email, requirementType]
    );
    return rows.length > 0 ? Number(rows[0].value) : null;
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
//   - level: teto alinhado ao maxLevel=1e11 (100 bilhões) já hardcoded no cliente como trava de
//     loop infinito (decisão do usuário, 31/08/2026, pro emblema "Entidade Máxima" do sistema de
//     medalhas ser um alvo real, ainda que praticamente inalcançável por gameplay legítimo — a
//     curva de XP exponencial já torna isso simbólico). ATENÇÃO: isso remove a proteção anti-cheat
//     específica contra um level fabricado no console — só o teto numérico mudou, o resto da
//     validação (xp/atributos/mana/vidas abaixo) continua no mesmo padrão de antes.
//   - xp/xpRequired: tetados um pouco acima de xpRequired(999) (~6.3M) por folga — não escalados
//     junto com o teto de level (fora do pedido, e escalar isso removeria proteção real que
//     ninguém pediu pra remover); na prática nenhum level acima de ~999 vai ter xp/xpRequired
//     consistentes com ele, mas isso não trava o save (campo implausível vira "ausente", não
//     rejeita o save inteiro) — só relevante pra levels que nenhum jogador real vai alcançar mesmo.
//   - vit/agi/int/pow/mag: cada nível dá 5 pontos; nem 998 níveis inteiros num único atributo
//     (4990 pontos) chegam perto de 9999.
//   - pointsToDistribute: mesmo teto de 5 pontos/nível, com folga.
//   - mana/maxMana: getMaxMana() = 100 + mag*20; com mag no teto (9999) isso é ~200 mil.
//   - lives: getMaxLivesCap() = 4 + vit + bônus de elmo; com vit no teto isso é ~10 mil.
//   - score: sem fórmula fechada (kills, level-up = level*200, etc.) — teto generoso mas finito.
//   - weapon.damage: upgradeWeapon() soma 10 por upgrade, custo cresce a cada vez; nenhum jogador
//     real chega nem perto de 100 mil de dano.
const NUMERIC_BOUNDS = {
    level: [1, 100000000000],
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
// Teto do baú de conta (04/09/2026) — número de negócio do pedido do usuário (Cemitério + Baú),
// não calibrado de uma faixa plausível de gameplay como PLAYER_NUMERIC_BOUNDS acima. Usado em
// sanitizePlayerProgressPayload pra rejeitar (não truncar) um chestItems maior que isso — ver
// comentário lá pro raciocínio completo de por que rejeitar o payload inteiro é mais seguro que
// truncar pros primeiros 1000.
const MAX_CHEST_ITEMS = 1000;
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
    // Baú de conta (04/09/2026): forma errada (não-array) OU array maior que o teto de 1000 vira
    // "ausente" igual a qualquer outro campo implausível acima — o COALESCE em savePlayerProgress
    // já preserva o chest_items atual do banco nesse caso, é o MESMO mecanismo, nenhum código novo
    // precisou entrar lá. Deliberadamente NÃO trunca pros primeiros 1000 mantendo o resto de fora
    // (igual galleryUrls faz acima em sanitizeProfilePayload) — truncar silenciosamente é mais
    // perigoso aqui do que lá: um cliente forjando um array gigante no console (chestItems:
    // new Array(50000).fill(item)) poderia ficar tentando tamanhos até acertar exatamente 1000 e
    // POR SORTE preencher o baú inteiro de uma vez com item forjado, em vez de ser rejeitado toda
    // vez que passar do teto. Rejeitar o payload INTEIRO (preservando o chest_items válido que já
    // está no banco) fecha esse caminho: não existe tamanho de payload forjado que "funcione
    // parcialmente".
    if (clean.chestItems != null && (!Array.isArray(clean.chestItems) || clean.chestItems.length > MAX_CHEST_ITEMS)) reject('chestItems', Array.isArray(clean.chestItems) ? `array com ${clean.chestItems.length} itens` : clean.chestItems);

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
            ghostdex_progress AS "ghostdexProgress", favorites, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls",
            overworld_grid_x AS "overworldGridX", overworld_grid_y AS "overworldGridY", chest_items AS "chestItems"
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
            ghostdex_progress AS "ghostdexProgress", favorites, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls",
            overworld_grid_x AS "overworldGridX", overworld_grid_y AS "overworldGridY", chest_items AS "chestItems"
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
        overworldGridX: null, overworldGridY: null, // conta nova: nunca esteve no overworld, cliente usa a torre como spawn
        chestItems: [], // conta nova: baú vazio (mesmo default '[]' da coluna chest_items) — objeto
                         // devolvido direto ao cliente aqui, sem passar por um SELECT de volta ao
                         // banco, então precisa espelhar o DEFAULT da coluna manualmente
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
            chest_items = COALESCE($9, chest_items),
            updated_at = now()
         WHERE email = $10`,
        [
            data.level ?? null,
            data.xp ?? null,
            data.mana ?? null,
            data.maxMana ?? null,
            data.lives ?? null,
            data.equippedSkills ? JSON.stringify(data.equippedSkills) : null,
            data.ghostdexProgress ? JSON.stringify(data.ghostdexProgress) : null,
            data.favorites ? JSON.stringify(data.favorites) : null,
            // Baú de conta (04/09/2026): mesmo padrão de favorites/ghostdexProgress acima —
            // sanitizePlayerProgressPayload já reduziu "ausente, forma errada, ou maior que 1000"
            // a "chestItems não existe mais em data" antes daqui, então `? JSON.stringify(...) :
            // null` é só o de sempre: campo presente vira JSON, campo ausente vira null, e o
            // COALESCE preserva o chest_items que já está no banco.
            data.chestItems ? JSON.stringify(data.chestItems) : null,
            email
        ]
    );
    return result.rowCount;
}

// Persiste a última posição de grid do overworld isométrico (02/09/2026). Deliberadamente
// separada de savePlayerProgress/sanitizePlayerProgressPayload: aquela é disparada pelo cliente a
// cada save_game_state (evento relativamente raro, snapshot completo de personagem) e passa pelo
// pipeline inteiro de sanitização de payload solto; esta é chamada pelo servidor em lote (batch
// periódico, ver server/index.js) a partir de coordenadas que JÁ foram validadas contra
// OVERWORLD_GRID_BOUNDS no momento em que chegaram via overworld_move — validar de novo aqui
// seria redundante. gridX/gridY sempre chegam juntos (nunca um só) por construção do chamador, daí
// não precisar de COALESCE como savePlayerProgress precisa para campos opcionais.
async function saveOverworldPosition(email, gridX, gridY) {
    await ensureTableReady();
    const result = await pool.query(
        `UPDATE players SET overworld_grid_x = $1, overworld_grid_y = $2, updated_at = now() WHERE email = $3`,
        [gridX, gridY, email]
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
        throw new Error(`Diary text must be between 1 and ${DIARY_CONTENT_MAX_LENGTH} characters.`);
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
            throw new Error('Invalid beforeId.');
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

// ============================================================================
// Sistema de amizades (31/08/2026). status só assume 'pending'/'accepted' — um pedido recusado
// é DELETADO (não vira um registro 'rejected' pra sempre bloquear um pedido futuro entre os
// mesmos dois e-mails, mesmo espírito de "recusar não deixa rastro" já usado neste projeto pra
// outras coisas). Identidade de quem AGE (busca, manda pedido, responde) nunca vem daqui — todas
// as funções abaixo recebem `sessionEmail`/`fromEmail`(ator) já resolvido pelo socket.io a partir
// do JWT da sessão (ver server/index.js); os parâmetros vindos direto do payload do cliente
// (`toEmail`, o e-mail buscado) só identificam o ALVO da ação, nunca o autor.
// ============================================================================

const FRIEND_SEARCH_MIN_QUERY_LENGTH = 2;
const FRIEND_SEARCH_RESULT_LIMIT = 20;

// Escapa os caracteres especiais do LIKE/ILIKE (%, _ e a própria barra de escape) antes de montar
// o padrão "%query%" — sem isso, um jogador buscando literalmente por "%" ou "_" no nome faria uma
// varredura de curinga total em vez de uma busca por substring, e passaria por baixo do limite de
// resultados pretendido (o LIMIT 20 ainda protege, mas o padrão de busca deixaria de significar o
// que o jogador digitou).
function escapeLikePattern(str) {
    return str.replace(/[\\%_]/g, '\\$&');
}

// search_players: busca por NOME (nunca por e-mail — não é um lookup de contato, é descoberta
// pública de apelido), exige pelo menos 2 caracteres (menos que isso é essencialmente "liste a
// tabela inteira de jogadores", ver comentário do handler no index.js) e nunca retorna a própria
// conta que está buscando.
async function searchPlayers(sessionEmail, rawQuery) {
    await ensureTableReady();
    const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    if (query.length < FRIEND_SEARCH_MIN_QUERY_LENGTH) {
        throw new Error(`Type at least ${FRIEND_SEARCH_MIN_QUERY_LENGTH} characters to search.`);
    }
    const { rows } = await pool.query(
        `SELECT email, name, avatar_url AS "avatarUrl" FROM players
         WHERE name ILIKE $1 ESCAPE '\\' AND email <> $2
         ORDER BY name
         LIMIT ${FRIEND_SEARCH_RESULT_LIMIT}`,
        [`%${escapeLikePattern(query)}%`, sessionEmail]
    );
    return rows;
}

// send_friend_request: valida o alvo, e decide entre criar um pedido pendente novo ou (caso já
// exista um pedido pendente na direção OPOSTA) aceitar automaticamente o que já existia, em vez de
// deixar dois pedidos pendentes cruzados — na prática os dois já queriam ser amigos.
//
// Tudo dentro de UMA transação com um advisory lock por PAR de e-mails (ordenado, pra "A,B" e
// "B,A" caírem na mesma trava): dois pedidos concorrentes entre as MESMAS duas contas (ex: A manda
// pra B e B manda pra A quase ao mesmo tempo, de sockets/processos diferentes) não têm nenhuma
// relação de "quem chegou primeiro" garantida só pela ordem de chegada no servidor — sem a trava,
// os dois poderiam ler "nenhum pedido existe ainda" antes de qualquer um COMMITar, e o resultado
// seria dois registros pendentes cruzados (A->B e B->A) em vez do auto-accept pretendido. A trava
// é liberada sozinha no fim da transação (xact_lock), sem precisar de unlock explícito.
async function sendFriendRequest(sessionEmail, rawToEmail) {
    await ensureTableReady();
    const toEmail = typeof rawToEmail === 'string' ? rawToEmail.trim().toLowerCase() : '';
    if (!toEmail) {
        throw new Error('Recipient email missing or invalid.');
    }
    if (toEmail === sessionEmail) {
        throw new Error('You cannot send a friend request to yourself.');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pairKey = [sessionEmail, toEmail].sort().join('|');
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [pairKey]);

        const { rows: targetRows } = await client.query('SELECT email FROM players WHERE email = $1', [toEmail]);
        if (targetRows.length === 0) {
            throw new Error('This player does not exist.');
        }

        const { rows: existingRows } = await client.query(
            `SELECT id, requester_email AS "requesterEmail", status FROM friendships
             WHERE (requester_email = $1 AND addressee_email = $2)
                OR (requester_email = $2 AND addressee_email = $1)
             FOR UPDATE`,
            [sessionEmail, toEmail]
        );
        const existing = existingRows[0];

        let autoAccepted = false;
        if (existing) {
            if (existing.status === 'accepted') {
                throw new Error('You are already friends.');
            }
            if (existing.requesterEmail === sessionEmail) {
                throw new Error('You already sent a friend request to this player.');
            }
            // Pedido pendente já existia na direção oposta (toEmail -> sessionEmail): aceita em
            // vez de criar um segundo registro pendente cruzado.
            await client.query(
                `UPDATE friendships SET status = 'accepted', responded_at = now() WHERE id = $1`,
                [existing.id]
            );
            autoAccepted = true;
        } else {
            await client.query(
                `INSERT INTO friendships (requester_email, addressee_email, status) VALUES ($1, $2, 'pending')`,
                [sessionEmail, toEmail]
            );
        }

        await client.query('COMMIT');
        return { toEmail, autoAccepted };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// get_friend_requests: só os pedidos pendentes que a conta autenticada RECEBEU (nunca os que ela
// mandou — isso não é "meus pedidos enviados", é "minha caixa de entrada").
async function getFriendRequests(sessionEmail) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT f.requester_email AS "fromEmail", p.name AS "fromName", p.avatar_url AS "fromAvatarUrl",
                f.created_at AS "createdAt"
         FROM friendships f
         JOIN players p ON p.email = f.requester_email
         WHERE f.addressee_email = $1 AND f.status = 'pending'
         ORDER BY f.created_at DESC`,
        [sessionEmail]
    );
    return rows;
}

// respond_friend_request: o filtro "addressee_email = sessionEmail" na própria query é o que
// garante que só quem é o DESTINATÁRIO do pedido pode responder — alguém tentando responder um
// pedido endereçado a outra conta simplesmente não encontra a linha (0 resultados), cai no mesmo
// erro genérico de "pedido não encontrado" que qualquer fromEmail inválido também cairia, sem
// vazar se o pedido existe endereçado a outra pessoa.
async function respondFriendRequest(sessionEmail, rawFromEmail, accept) {
    await ensureTableReady();
    const fromEmail = typeof rawFromEmail === 'string' ? rawFromEmail.trim().toLowerCase() : '';
    if (!fromEmail) {
        throw new Error('Sender email missing or invalid.');
    }

    const { rows } = await pool.query(
        `SELECT id FROM friendships
         WHERE requester_email = $1 AND addressee_email = $2 AND status = 'pending'`,
        [fromEmail, sessionEmail]
    );
    const row = rows[0];
    if (!row) {
        throw new Error('Friend request not found.');
    }

    if (accept) {
        await pool.query(`UPDATE friendships SET status = 'accepted', responded_at = now() WHERE id = $1`, [row.id]);
    } else {
        // Recusar APAGA o registro (não existe status 'rejected') — permite um pedido futuro
        // entre as mesmas duas contas sem ficar bloqueado por um "não" antigo pra sempre.
        await pool.query('DELETE FROM friendships WHERE id = $1', [row.id]);
    }
    return { fromEmail, accepted: !!accept };
}

// get_friends: amizade aceita vale nos dois sentidos — a conta autenticada pode estar como
// requester OU addressee da linha, então o JOIN escolhe dinamicamente qual dos dois e-mails da
// linha é "o outro lado" em vez de assumir uma coluna fixa.
async function getFriends(sessionEmail) {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT p.email, p.name, p.avatar_url AS "avatarUrl"
         FROM friendships f
         JOIN players p ON p.email = CASE WHEN f.requester_email = $1 THEN f.addressee_email ELSE f.requester_email END
         WHERE f.status = 'accepted' AND (f.requester_email = $1 OR f.addressee_email = $1)
         ORDER BY p.name`,
        [sessionEmail]
    );
    return { friends: rows, count: rows.length };
}

// get_player_profile (31/08/2026, pedido do usuário: "ver perfil de OUTRO jogador, pode ver tudo
// sem restrição"). Público de propósito — não checa amizade nem se o alvo é a própria sessão,
// só que o email pedido exista em players. Devolve EXATAMENTE 6 campos (email + as 5 coisas
// públicas do perfil: nome, avatar, galeria, data de criação, contador de amigos) — nunca
// password/hash nem qualquer outra coluna de players (level/xp/mana/etc são progresso de jogo,
// não perfil público). friendCount usa a MESMA contagem de getFriends (status 'accepted', nas
// duas direções da amizade), só que pro email pedido em vez do da sessão autenticada.
async function getPlayerProfile(rawEmail) {
    await ensureTableReady();
    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    if (!email) {
        throw new Error('Invalid or missing email.');
    }

    const { rows } = await pool.query(
        `SELECT email, name, avatar_url AS "avatarUrl", gallery_urls AS "galleryUrls", created_at AS "createdAt"
         FROM players WHERE email = $1`,
        [email]
    );
    const player = rows[0];
    if (!player) {
        throw new Error('This player does not exist.');
    }

    const { rows: countRows } = await pool.query(
        `SELECT COUNT(*)::int AS count FROM friendships
         WHERE status = 'accepted' AND (requester_email = $1 OR addressee_email = $1)`,
        [email]
    );

    return {
        email: player.email,
        name: player.name,
        avatarUrl: player.avatarUrl,
        galleryUrls: player.galleryUrls,
        createdAt: player.createdAt,
        friendCount: countRows[0].count
    };
}

// ============================================================================
// Sistema de emblemas/conquistas (31/08/2026, backend-architect)
// ============================================================================
//
// 101 = window.g_ghostdexDB.length em js/game/ghostdex_data.js (contado em 31/08/2026: IDs "001" a
// "101"). É o "episódio 1" inteiro: os 33 níveis numerados + cave1 (js/game/engine.js, g_levels e
// Initialize_Map_Array.loadLevel) e as 4 pools de fantasma de SpawnNativeGhosts (js/game/
// ghost_inventory.js) cobrem só essa faixa. Não existe episódio 2+ jogável hoje — a lore de
// "Episódio 2/3/4/5" (lore_books.md, js/lore_data.js) é só texto narrativo, sem level nenhum
// implementado, então "episode_items_complete" só faz sentido pro episódio 1 por enquanto. Se um
// dia existir conteúdo de episódio 2, esse número (e a query abaixo) precisam ser revisitados —
// não há como esse arquivo descobrir sozinho quantos episódios existem de verdade.
const EPISODE_1_TOTAL_GHOSTS = 101;

// Mesmo padrão de "conta inteira, nunca por personagem" de ghostdex_progress/favorites: soma
// direto no servidor (coluna = coluna + delta), nunca aceita um total absoluto vindo do cliente —
// isso seria trivial de forjar no console (mesmo raciocínio de NUMERIC_BOUNDS acima, só que aqui
// nem preciso de uma faixa plausível pro VALOR final, porque o cliente nunca manda um valor final).
// O nome da coluna vem só deste mapa fixo (nunca de string do cliente concatenada na query) —
// não há injeção possível, mas documentando por clareza pra quem for mexer aqui depois.
const STAT_COLUMN_BY_INCREMENT_TYPE = {
    kill: 'total_kills',
    item: 'total_items_collected',
    life: 'total_lives_collected'
};

// Teto por chamada (não por janela de tempo — ver ressalva no relatório do backend-architect: isso
// limita o estrago de UMA chamada forjada, não a frequência de chamadas repetidas; um rate-limit de
// verdade pro socket increment_stat, no mesmo espírito do que já existe pra login em index.js, é
// uma melhoria futura ainda não implementada).
const INCREMENT_STAT_MAX_PER_CALL = 50;

async function incrementPlayerStat(email, type, amount) {
    await ensureTableReady();
    const column = STAT_COLUMN_BY_INCREMENT_TYPE[type];
    if (!column) {
        throw new Error(`Tipo de estatística desconhecido: ${type}`);
    }
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1 || n > INCREMENT_STAT_MAX_PER_CALL) {
        throw new Error(`Quantidade inválida para incremento de estatística (1-${INCREMENT_STAT_MAX_PER_CALL}): ${amount}`);
    }
    await pool.query(
        `UPDATE players SET ${column} = ${column} + $1, updated_at = now() WHERE email = $2`,
        [n, email]
    );
}

// Le os quatro insumos que os emblemas hoje sabem avaliar, sempre frescos do banco (nunca confia
// em nenhum valor que o chamador já tenha em mãos — mesmo espírito de "banco é a única fonte de
// verdade" já documentado em vários pontos deste arquivo). "level" é o MAIOR level entre TODOS os
// personagens da conta (não characters.level de um só, nem players.level — esse último é só um
// espelho de qual foi o ÚLTIMO personagem a salvar, ver comentário grande em savePlayerProgress;
// usar ele aqui deixaria um emblema de nível "regredir" só porque o jogador deu save num alt
// fraco). "episodeItemsComplete" conta quantas entradas da Ghostdex já chegaram no estado 2
// ("capturado", ver js/game/ghostdex_ui.js/UpdateGhostdex) dentro do JSONB ghostdex_progress.
async function getPlayerBadgeStats(email) {
    const { rows } = await pool.query(
        `SELECT
            COALESCE((SELECT MAX(level) FROM characters WHERE email = $1), 0) AS max_level,
            p.total_kills AS kills,
            p.total_lives_collected AS lives,
            p.total_items_collected AS items,
            COALESCE((
                SELECT COUNT(*) FROM jsonb_each_text(COALESCE(p.ghostdex_progress, '{}'::jsonb)) AS kv(key, value)
                WHERE kv.value::int >= 2
            ), 0) AS ghosts_captured
         FROM players p WHERE p.email = $1`,
        [email]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        level: Number(row.max_level) || 0,
        kills: Number(row.kills) || 0,
        lives: Number(row.lives) || 0,
        items: Number(row.items) || 0,
        episodeItemsComplete: Number(row.ghosts_captured) >= EPISODE_1_TOTAL_GHOSTS ? 1 : 0
    };
}

// Chamado depois de qualquer save que possa ter mudado level/kills/vidas/itens/ghostdex (ver
// index.js: save_game_state, increment_stat). Idempotente por natureza: o "WHERE NOT EXISTS"
// já evita reprocessar emblema que essa conta já tem, e o INSERT usa ON CONFLICT DO NOTHING como
// segunda camada (cobre a corrida rara de duas chamadas concorrentes pra mesma conta chegando quase
// juntas — mesma preocupação de saveQueues em index.js, só que aqui uma dupla tentativa é inofensiva
// por causa da PK composta (email, badge_id) em vez de precisar de fila). Só INSERE o que faltava;
// nunca remove um emblema já concedido, mesmo que a estatística caia (não deveria cair, já que são
// contadores monotônicos, mas não é papel desta função reforçar isso).
async function checkAndUnlockBadges(email) {
    await ensureTableReady();
    const stats = await getPlayerBadgeStats(email);
    if (!stats) return [];

    const { rows: candidates } = await pool.query(
        `SELECT b.id, b.category, b.name, b.description, b.requirement_type, b.requirement_value, b.sort_order
         FROM badges b
         WHERE NOT EXISTS (SELECT 1 FROM player_badges pb WHERE pb.email = $1 AND pb.badge_id = b.id)
           AND (
                (b.requirement_type = 'level' AND b.requirement_value <= $2) OR
                (b.requirement_type = 'kills' AND b.requirement_value <= $3) OR
                (b.requirement_type = 'lives' AND b.requirement_value <= $4) OR
                (b.requirement_type = 'episode_items_complete' AND b.requirement_value <= $5)
           )`,
        [email, stats.level, stats.kills, stats.lives, stats.episodeItemsComplete]
    );
    if (candidates.length === 0) return [];

    const client = await pool.connect();
    const unlocked = [];
    try {
        await client.query('BEGIN');
        for (const badge of candidates) {
            const result = await client.query(
                `INSERT INTO player_badges (email, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING badge_id`,
                [email, badge.id]
            );
            if (result.rowCount > 0) unlocked.push(badge);
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    return unlocked;
}

// Catálogo estático inteiro (todas as categorias, não só as 210 do backend-architect — get_badges
// em index.js não filtra por categoria, ver briefing da tarefa).
async function getBadgeCatalog() {
    await ensureTableReady();
    const { rows } = await pool.query(
        `SELECT id, category, name, description, requirement_type, requirement_value, sort_order
         FROM badges ORDER BY sort_order`
    );
    return rows.map((r) => ({
        id: r.id,
        category: r.category,
        name: r.name,
        description: r.description,
        requirementType: r.requirement_type,
        requirementValue: r.requirement_value,
        sortOrder: r.sort_order
    }));
}

async function getUnlockedBadgeIds(email) {
    await ensureTableReady();
    const { rows } = await pool.query('SELECT badge_id FROM player_badges WHERE email = $1', [email]);
    return rows.map((r) => r.badge_id);
}

module.exports = {
    loginPlayer,
    createPlayer,
    loadOrCreatePlayer,
    loadPlayerByEmail,
    savePlayerProgress,
    saveOverworldPosition,
    loadCharacters,
    saveCharacters,
    deleteCharacter,
    updateProfile,
    postDiaryEntry,
    getDiaryEntries,
    searchPlayers,
    sendFriendRequest,
    getFriendRequests,
    respondFriendRequest,
    getFriends,
    getPlayerProfile,
    incrementPlayerStat,
    checkAndUnlockBadges,
    getBadgeCatalog,
    getUnlockedBadgeIds,
    submitBadgeProgress,
    getPlayerStatProgress,
    // 05/09/2026 (auditoria forense de multiplayer, achado #1): exportados pra server/index.js
    // reaproveitar EXATAMENTE estes limites na validação de player_move (hp/ghostLevel), em vez
    // de inventar uma segunda faixa "plausível" divergente pro mesmo tipo de dado no mesmo
    // projeto. isPlausibleNumber é o predicado que os dois lados usam pra checar contra elas.
    PLAYER_NUMERIC_BOUNDS,
    NUMERIC_BOUNDS,
    isPlausibleNumber
};
