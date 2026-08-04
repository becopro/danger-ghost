const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'game_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB] Error opening database:', err.message);
    } else {
        console.log('[DB] Connected to SQLite database.');
        ensureTableReady();
    }
});

let tableReadyPromise = null;

function ensureTableReady() {
    if (!tableReadyPromise) {
        tableReadyPromise = new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS players (
                email TEXT PRIMARY KEY,
                name TEXT,
                level INTEGER DEFAULT 1,
                xp REAL DEFAULT 0,
                mana REAL DEFAULT 100,
                maxMana REAL DEFAULT 100,
                lives INTEGER DEFAULT 3,
                equippedSkills TEXT DEFAULT '[0,0,0,0]'
            )`, (err) => {
                if (err) {
                    console.error('[DB] Error creating table:', err.message);
                    reject(err);
                } else {
                    console.log('[DB] Players table ready.');
                    resolve();
                }
            });
        });
    }
    return tableReadyPromise;
}

async function loadOrCreatePlayer(email, profileName) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM players WHERE email = ?', [email], (err, row) => {
            if (err) return reject(err);
            if (row) {
                // Parse JSON array for equippedSkills
                try { row.equippedSkills = JSON.parse(row.equippedSkills); } catch(e) { row.equippedSkills = [0,0,0,0]; }
                resolve({ status: 'loaded', data: row });
            } else {
                // Create new player profile
                const defaultName = profileName || 'Ghost';
                const stmt = db.prepare('INSERT INTO players (email, name) VALUES (?, ?)');
                stmt.run([email, defaultName], function(err) {
                    if (err) return reject(err);
                    resolve({ status: 'created', data: {
                        email, name: defaultName, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0,0,0,0]
                    }});
                });
                stmt.finalize();
            }
        });
    });
}

async function savePlayerProgress(email, data) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        const skillsStr = JSON.stringify(data.equippedSkills || [0,0,0,0]);
        db.run(
            `UPDATE players SET 
                name = ?, level = ?, xp = ?, mana = ?, maxMana = ?, lives = ?, equippedSkills = ? 
            WHERE email = ?`,
            [data.name, data.level, data.xp, data.mana, data.maxMana, data.lives, skillsStr, email],
            function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            }
        );
    });
}

module.exports = {
    loadOrCreatePlayer,
    savePlayerProgress
};
