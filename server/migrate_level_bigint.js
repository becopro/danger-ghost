/*
 * MIGRAÇÃO DE SCHEMA — level / points_to_distribute / atributos / lives: INTEGER -> BIGINT
 * Escrita em 16/09/2026 pelo backend-architect. NÃO EXECUTADA.
 *
 * ---------------------------------------------------------------------------------------------
 * POR QUE ESTA MIGRAÇÃO EXISTE
 * ---------------------------------------------------------------------------------------------
 * O nível máximo de personagem passou a ser 100.000.000.000 (100 bilhões), literal e alcançável
 * por gameplay real sob a curva de lei de potência nova (docs/AAA_MASTER_PLAN_2026-09-16.md §7).
 * O tipo INTEGER do Postgres estoura em 2.147.483.647 — 47x MENOR que o teto novo. Três colunas
 * ficam no caminho:
 *
 *   players.level                    INTEGER -> BIGINT
 *   characters.level                 INTEGER -> BIGINT
 *   characters.points_to_distribute  INTEGER -> BIGINT   (5 pontos/nível acumulados: ~5e11 no teto)
 *
 * ACHADO DO BACKEND-ARCHITECT, FORA DO PEDIDO ORIGINAL (decida antes de rodar — ver a constante
 * INCLUDE_DERIVED_COLUMNS logo abaixo, é só trocar pra false se você quiser só as três de cima):
 * as colunas de ATRIBUTO sofrem exatamente do mesmo estouro, porque são alimentadas pelos mesmos
 * 5 pontos por nível. Num único atributo, 1e11 níveis somam ~5e11 — 233x acima do teto de INTEGER,
 * e mesmo espalhando os pontos pelos 5 atributos cada um passa de 2,1 bilhões bem antes do nível
 * máximo. players.lives idem: getMaxLivesCap() = 4 + vit (+1 de elmo), logo acompanha vit.
 *
 *   characters.vit / agi / int / pow / mag   INTEGER -> BIGINT
 *   players.lives                            INTEGER -> BIGINT
 *
 * A recomendação é migrar TUDO de uma vez: cada ALTER COLUMN TYPE reescreve a tabela inteira com
 * ACCESS EXCLUSIVE LOCK, então fazer as três agora e as outras seis daqui a um mês significa parar
 * o jogo duas vezes em vez de uma, sem nenhum ganho.
 *
 * Confirmado que NÃO precisam mudar: xp, xp_required, score e "time" já são DOUBLE PRECISION e
 * cabem nos números novos sem migração; mana/max_mana idem; world_level é o contador de episódio
 * de dungeon (1-33), um campo DIFERENTE do nível de personagem, e o INTEGER dele continua folgado
 * demais; total_kills/total_items_collected/total_lives_collected também ficam (o topo da escada de
 * badges é 10 milhões de kills, cinco ordens de grandeza abaixo do teto de INTEGER); deaths idem.
 *
 * Sem esta migração, um personagem que passe de ~2,1 bilhões de nível recebe um erro de
 * "integer out of range" no save (ou, pior, o servidor descarta o campo e o COALESCE de
 * saveCharacters preserva o nível ANTIGO — progresso congelando em silêncio).
 *
 * ---------------------------------------------------------------------------------------------
 * ⚠️  NÃO EXECUTE SEM O ALINHAMENTO EXPLÍCITO DO USUÁRIO  ⚠️
 * ---------------------------------------------------------------------------------------------
 * Isto toca dados de save de jogadores REAIS num Supabase de produção, sem ambiente de staging.
 * CLAUDE.md §7 do projeto: mudança de banco de dados exige alinhamento em Plan Mode com o usuário
 * ANTES de qualquer execução. Por isso o script roda em modo simulação por padrão e só aplica o
 * ALTER TABLE quando recebe --confirm explicitamente na linha de comando.
 *
 * COMO RODAR (no servidor, de DENTRO da pasta server/, com o .env já configurado):
 *
 *   1) Simulação (não escreve nada — mostra o tipo atual de cada coluna, quantas linhas existem e
 *      o maior nível já salvo hoje). Rode isto primeiro, sempre:
 *
 *        node migrate_level_bigint.js
 *
 *   2) Aplicar de verdade (irreversível na prática — ver ROLLBACK abaixo):
 *
 *        node migrate_level_bigint.js --confirm
 *
 *   3) Conferir depois: o próprio script relê information_schema no final e falha (exit 1) se
 *      alguma das colunas não tiver virado bigint, ou se a contagem de linhas tiver mudado.
 *
 * TRAVA DE ACESSO / DOWNTIME: ALTER COLUMN TYPE de int4 pra int8 NÃO é conversão binária no
 * Postgres — ele REESCREVE a tabela inteira e segura um ACCESS EXCLUSIVE LOCK enquanto faz isso
 * (nenhum SELECT/UPDATE passa nessas tabelas durante a reescrita). Nas dimensões atuais deste
 * jogo (players/characters na casa das dezenas/centenas de linhas) isso é questão de
 * milissegundos, mas o modo de espera correto ainda é: parar o servidor de jogo (pm2 stop) ou
 * rodar num momento sem jogadores online, pra nenhum save cair no meio da reescrita.
 *
 * IDEMPOTENTE: se as colunas já forem bigint, o script detecta, não emite nenhum ALTER e sai com
 * sucesso. Pode ser rodado de novo sem risco.
 *
 * TRANSACIONAL: DDL no Postgres é transacional — todos os ALTER vão dentro de um único
 * BEGIN/COMMIT. Se um falhar, nenhum é aplicado (sem estado meio-migrado).
 *
 * ROLLBACK: BIGINT -> INTEGER é possível (ALTER ... TYPE INTEGER) mas só enquanto nenhum valor
 * salvo passar de 2.147.483.647; depois disso a volta perde dado e o Postgres recusa. Na prática,
 * trate como caminho só de ida. Antes de rodar com --confirm, tire um backup/snapshot do projeto
 * no painel do Supabase (Database > Backups) — é a única rede de segurança real aqui.
 */

require('dotenv').config();
const { Pool } = require('pg');

// Mesma construção de Pool de server/db.js e server/migratetosupabase.js — variáveis minúsculas e
// sem underscore de propósito (o console remoto do servidor derruba Shift, ver CLAUDE.md).
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool({
        host: process.env.dbhost,
        port: Number(process.env.dbport) || 5432,
        user: process.env.dbuser,
        password: process.env.dbpass,
        database: process.env.dbname || 'postgres',
        ssl: { rejectUnauthorized: false }
    });

// Troque pra false se você quiser migrar SÓ as três colunas do pedido original (os dois níveis e
// points_to_distribute), deixando atributos e lives pra depois. Ver a explicação no cabeçalho: a
// recomendação é deixar true e fazer tudo numa parada só.
const INCLUDE_DERIVED_COLUMNS = true;

// (tabela, coluna) que precisam virar BIGINT. Ordem irrelevante — tudo vai na mesma transação.
const TARGET_COLUMNS = [
    { table: 'players', column: 'level' },
    { table: 'characters', column: 'level' },
    { table: 'characters', column: 'points_to_distribute' }
].concat(INCLUDE_DERIVED_COLUMNS ? [
    { table: 'characters', column: 'vit' },
    { table: 'characters', column: 'agi' },
    { table: 'characters', column: 'int' },
    { table: 'characters', column: 'pow' },
    { table: 'characters', column: 'mag' },
    { table: 'players', column: 'lives' }
] : []);

// "int" é palavra reservada do Postgres e a coluna foi criada entre aspas no schema (ver
// server/db.js) — todo identificador de coluna aqui vai entre aspas duplas pelo mesmo motivo, em
// vez de tratar esse caso como exceção e esquecer dele.
function quoteIdent(name) {
    return '"' + String(name).replace(/"/g, '""') + '"';
}

const CONFIRMED = process.argv.includes('--confirm');

async function describeColumn(table, column) {
    const { rows } = await pool.query(
        `SELECT data_type, column_default, is_nullable
           FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
    );
    return rows[0] || null;
}

async function main() {
    console.log('=== Migração level/points_to_distribute -> BIGINT ===');
    console.log(CONFIRMED
        ? 'MODO: APLICAR (--confirm presente). Os ALTER TABLE VÃO rodar.'
        : 'MODO: SIMULAÇÃO (sem --confirm). Nada será escrito no banco.');
    console.log('');

    // --- 1. Estado atual -----------------------------------------------------------------------
    const pending = [];
    for (const target of TARGET_COLUMNS) {
        const info = await describeColumn(target.table, target.column);
        if (!info) {
            throw new Error(`Coluna ${target.table}.${target.column} não existe neste banco. Abortado sem mexer em nada.`);
        }
        const alreadyDone = info.data_type === 'bigint';
        console.log(`  ${target.table}.${target.column}: ${info.data_type}${alreadyDone ? '  (já migrada, nada a fazer)' : '  -> precisa virar bigint'}`);
        if (!alreadyDone) pending.push(target);
    }
    console.log('');

    // --- 2. Fotografia dos dados antes (pra comparar depois) -----------------------------------
    // Identificadores não podem ir como parâmetro ($1) em SQL — por isso vão interpolados com
    // quoteIdent(). São seguros: saem todos do TARGET_COLUMNS hardcoded acima, nenhum vem de
    // entrada externa.
    const { rows: [playersBefore] } = await pool.query('SELECT COUNT(*)::text AS total FROM players');
    const { rows: [charsBefore] } = await pool.query('SELECT COUNT(*)::text AS total FROM characters');
    console.log(`  players:    ${playersBefore.total} linha(s)`);
    console.log(`  characters: ${charsBefore.total} linha(s)`);
    for (const target of TARGET_COLUMNS) {
        const { rows: [agg] } = await pool.query(
            `SELECT COALESCE(MAX(${quoteIdent(target.column)}), 0)::text AS max_value FROM ${quoteIdent(target.table)}`
        );
        console.log(`  maior ${target.table}.${target.column} hoje = ${agg.max_value}`);
    }
    console.log('');

    if (pending.length === 0) {
        console.log('Todas as colunas já são BIGINT. Nada a fazer.');
        return;
    }

    const statements = pending.map((t) => `ALTER TABLE ${quoteIdent(t.table)} ALTER COLUMN ${quoteIdent(t.column)} TYPE BIGINT;`);
    console.log('SQL que será executado (dentro de uma única transação):');
    statements.forEach((sql) => console.log('  ' + sql));
    console.log('');

    if (!CONFIRMED) {
        console.log('SIMULAÇÃO: nada foi executado.');
        console.log('Para aplicar de verdade, com o servidor de jogo parado e um backup feito no Supabase:');
        console.log('    node migrate_level_bigint.js --confirm');
        return;
    }

    // --- 3. Aplicação --------------------------------------------------------------------------
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const sql of statements) {
            console.log('  executando: ' + sql);
            await client.query(sql);
        }
        await client.query('COMMIT');
        console.log('COMMIT feito.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('ERRO durante os ALTER — ROLLBACK aplicado, nenhuma coluna foi alterada.');
        throw err;
    } finally {
        client.release();
    }
    console.log('');

    // --- 4. Verificação pós-migração -----------------------------------------------------------
    let allGood = true;
    for (const target of TARGET_COLUMNS) {
        const info = await describeColumn(target.table, target.column);
        const ok = info && info.data_type === 'bigint';
        if (!ok) allGood = false;
        console.log(`  ${target.table}.${target.column}: ${info ? info.data_type : 'AUSENTE'} ${ok ? 'OK' : 'FALHOU'}`);
    }

    const { rows: [playersAfter] } = await pool.query('SELECT COUNT(*)::text AS total FROM players');
    const { rows: [charsAfter] } = await pool.query('SELECT COUNT(*)::text AS total FROM characters');
    console.log('');
    console.log(`  players:    ${playersBefore.total} antes -> ${playersAfter.total} depois`);
    console.log(`  characters: ${charsBefore.total} antes -> ${charsAfter.total} depois`);

    if (playersAfter.total !== playersBefore.total || charsAfter.total !== charsBefore.total) {
        allGood = false;
        console.error('ATENÇÃO: a contagem de linhas mudou durante a migração. Investigue antes de religar o servidor.');
    }

    if (!allGood) {
        console.error('\nMigração NÃO pode ser considerada concluída. Revise os erros acima.');
        process.exitCode = 1;
    } else {
        console.log('\nMigração concluída com sucesso. Pode religar o servidor de jogo.');
    }
}

main()
    .catch((err) => {
        console.error('ERRO FATAL NA MIGRAÇÃO:', err.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
