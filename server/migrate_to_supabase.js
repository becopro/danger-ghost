/*
 * Script de uso único: migra os jogadores do SQLite local (game_data.db) pro
 * Postgres do Supabase (DATABASE_URL no .env).
 *
 * Só LÊ do SQLite, nunca escreve nele — o arquivo original fica intacto,
 * servindo de backup/rollback caso algo dê errado na migração.
 *
 * Como rodar (no servidor, na pasta server/, com o .env já configurado):
 *   node migrate_to_supabase.js
 *
 * Roda de novo sem problema se precisar (idempotente): contas que já existem
 * no Supabase são puladas, não duplicadas nem sobrescritas.
 */
require('dotenv').config();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

const SQLITE_PATH = path.resolve(__dirname, 'game_data.db');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function readAllPlayersFromSqlite() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(new Error('Não consegui abrir ' + SQLITE_PATH + ': ' + err.message));
        });
        db.all('SELECT * FROM players', [], (err, rows) => {
            db.close();
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function main() {
    console.log('Lendo jogadores de', SQLITE_PATH, '...');
    const players = await readAllPlayersFromSqlite();
    console.log(`Encontrei ${players.length} jogador(es) no SQLite.`);

    await pool.query(`
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
    `);

    let migrados = 0;
    let jaExistiam = 0;
    let comErro = 0;

    for (const p of players) {
        let equippedSkills;
        try {
            equippedSkills = JSON.parse(p.equippedSkills);
        } catch (e) {
            equippedSkills = [0, 0, 0, 0];
        }

        try {
            const result = await pool.query(
                `INSERT INTO players (email, name, password, level, xp, mana, max_mana, lives, equipped_skills)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT (email) DO NOTHING`,
                [p.email, p.name, p.password || '', p.level, p.xp, p.mana, p.maxMana, p.lives, JSON.stringify(equippedSkills)]
            );
            if (result.rowCount === 1) {
                migrados++;
                console.log(`  OK: ${p.email}`);
            } else {
                jaExistiam++;
                console.log(`  já existia no Supabase, pulei: ${p.email}`);
            }
        } catch (err) {
            comErro++;
            console.error(`  ERRO ao migrar ${p.email}:`, err.message);
        }
    }

    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM players');

    console.log('\n--- Resumo ---');
    console.log('No SQLite:', players.length);
    console.log('Migrados agora:', migrados);
    console.log('Já existiam no Supabase (pulados):', jaExistiam);
    console.log('Com erro:', comErro);
    console.log('Total no Supabase agora:', count);

    if (Number(count) < players.length) {
        console.warn('\nATENÇÃO: o total no Supabase é menor que o total no SQLite. Revise os erros acima antes de considerar a migração concluída.');
        process.exitCode = 1;
    } else {
        console.log('\nContagem bate. Migração concluída com sucesso.');
    }

    await pool.end();
}

main().catch((err) => {
    console.error('ERRO FATAL NA MIGRAÇÃO:', err);
    process.exit(1);
});
