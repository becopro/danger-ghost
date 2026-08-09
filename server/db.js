const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
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
                nickname TEXT DEFAULT 'Ghost',
                password_hash TEXT NOT NULL DEFAULT '',
                password TEXT DEFAULT '',
                level INTEGER DEFAULT 1,
                xp REAL DEFAULT 0,
                mana REAL DEFAULT 100,
                maxMana REAL DEFAULT 100,
                lives INTEGER DEFAULT 3,
                equippedSkills TEXT DEFAULT '[0,0,0,0]',
                ghost_inventory TEXT DEFAULT '{}',
                ghost_favorites TEXT DEFAULT '[]',
                characters TEXT DEFAULT '[]',
                soul_essence INTEGER DEFAULT 0,
                saved_level INTEGER DEFAULT 1,
                leaderboard_score INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                name TEXT
            )`, (err) => {
                if (err) {
                    console.error('[DB] Error creating table:', err.message);
                    return reject(err);
                }
                
                const columnsToAdd = [
                    "nickname TEXT DEFAULT 'Ghost'",
                    "password_hash TEXT NOT NULL DEFAULT ''",
                    "password TEXT DEFAULT ''",
                    "level INTEGER DEFAULT 1",
                    "xp REAL DEFAULT 0",
                    "mana REAL DEFAULT 100",
                    "maxMana REAL DEFAULT 100",
                    "lives INTEGER DEFAULT 3",
                    "equippedSkills TEXT DEFAULT '[0,0,0,0]'",
                    "ghost_inventory TEXT DEFAULT '{}'",
                    "ghost_favorites TEXT DEFAULT '[]'",
                    "characters TEXT DEFAULT '[]'",
                    "soul_essence INTEGER DEFAULT 0",
                    "saved_level INTEGER DEFAULT 1",
                    "leaderboard_score INTEGER DEFAULT 0",
                    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "updated_at DATETIME DEFAULT CURRENT_TIMESTAMP",
                    "name TEXT"
                ];

                let promises = columnsToAdd.map(col => {
                    return new Promise(res => {
                        db.run(`ALTER TABLE players ADD COLUMN ${col}`, (e) => res());
                    });
                });

                Promise.all(promises).then(() => {
                    console.log('[DB] Players table ready.');
                    resolve();
                });
            });
        });
    }
    return tableReadyPromise;
}

async function createAccount(nickname, email, password) {
    if (!nickname || nickname.length < 2 || nickname.length > 20) throw new Error("Nickname deve ter entre 2 e 20 caracteres.");
    if (!email || email.trim() === '') throw new Error("E-mail inválido.");
    if (!password || password.length < 6 || password.length > 12) throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    
    await ensureTableReady();
    
    return new Promise((resolve, reject) => {
        db.get('SELECT email FROM players WHERE email = ?', [email], async (err, row) => {
            if (err) return reject(err);
            if (row) return reject(new Error("Este e-mail ja esta registrado!"));
            
            try {
                const hash = await bcrypt.hash(password, SALT_ROUNDS);
                const stmt = db.prepare('INSERT INTO players (email, nickname, password_hash) VALUES (?, ?, ?)');
                stmt.run([email, nickname, hash], function(err) {
                    if (err) return reject(err);
                    
                    db.get('SELECT * FROM players WHERE email = ?', [email], (err, newRow) => {
                        if (err) return reject(err);
                        delete newRow.password_hash;
                        
                        try { newRow.equippedSkills = JSON.parse(newRow.equippedSkills); } catch(e) { newRow.equippedSkills = [0,0,0,0]; }
                        try { newRow.ghost_inventory = JSON.parse(newRow.ghost_inventory); } catch(e) { newRow.ghost_inventory = {}; }
                        try { newRow.ghost_favorites = JSON.parse(newRow.ghost_favorites); } catch(e) { newRow.ghost_favorites = []; }
                        try { newRow.characters = JSON.parse(newRow.characters); } catch(e) { newRow.characters = []; }
                        
                        resolve({ status: 'created', data: newRow });
                    });
                });
                stmt.finalize();
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function authenticatePlayer(email, password) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM players WHERE email = ?', [email], async (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error("Conta nao encontrada. Verifique seu e-mail."));
            
            try {
                if (row.password_hash && row.password_hash.startsWith('$2b$')) {
                    const match = await bcrypt.compare(password, row.password_hash);
                    if (!match) return reject(new Error("Senha incorreta!"));
                } else if (!row.password_hash && row.password) {
                    if (row.password !== password) return reject(new Error("Senha incorreta!"));
                    const hash = await bcrypt.hash(password, SALT_ROUNDS);
                    await new Promise((res, rej) => {
                        db.run("UPDATE players SET password_hash = ? WHERE email = ?", [hash, email], (e) => e ? rej(e) : res());
                    });
                } else {
                    return reject(new Error("Senha incorreta!"));
                }
                
                delete row.password_hash;
                delete row.password;
                
                try { row.equippedSkills = JSON.parse(row.equippedSkills); } catch(e) { row.equippedSkills = [0,0,0,0]; }
                try { row.ghost_inventory = JSON.parse(row.ghost_inventory); } catch(e) { row.ghost_inventory = {}; }
                try { row.ghost_favorites = JSON.parse(row.ghost_favorites); } catch(e) { row.ghost_favorites = []; }
                try { row.characters = JSON.parse(row.characters); } catch(e) { row.characters = []; }
                
                resolve({ status: 'authenticated', data: row });
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function saveFullProfile(email, data) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE players SET
                nickname = COALESCE(?, nickname),
                level = COALESCE(?, level),
                xp = COALESCE(?, xp),
                mana = COALESCE(?, mana),
                maxMana = COALESCE(?, maxMana),
                lives = COALESCE(?, lives),
                equippedSkills = COALESCE(?, equippedSkills),
                ghost_inventory = COALESCE(?, ghost_inventory),
                ghost_favorites = COALESCE(?, ghost_favorites),
                characters = COALESCE(?, characters),
                soul_essence = COALESCE(?, soul_essence),
                saved_level = COALESCE(?, saved_level),
                leaderboard_score = COALESCE(?, leaderboard_score),
                updated_at = CURRENT_TIMESTAMP
            WHERE email = ?
        `;
        
        const params = [
            data.nickname !== undefined ? data.nickname : null,
            data.level !== undefined ? data.level : null,
            data.xp !== undefined ? data.xp : null,
            data.mana !== undefined ? data.mana : null,
            data.maxMana !== undefined ? data.maxMana : null,
            data.lives !== undefined ? data.lives : null,
            data.equippedSkills !== undefined ? JSON.stringify(data.equippedSkills) : null,
            data.ghost_inventory !== undefined ? JSON.stringify(data.ghost_inventory) : null,
            data.ghost_favorites !== undefined ? JSON.stringify(data.ghost_favorites) : null,
            data.characters !== undefined ? JSON.stringify(data.characters) : null,
            data.soul_essence !== undefined ? data.soul_essence : null,
            data.saved_level !== undefined ? data.saved_level : null,
            data.leaderboard_score !== undefined ? data.leaderboard_score : null,
            email
        ];
        
        db.run(query, params, function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
}

async function loadFullProfile(email) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM players WHERE email = ?', [email], (err, row) => {
            if (err) return reject(err);
            if (!row) return resolve(null);
            
            delete row.password_hash;
            delete row.password;
            
            try { row.equippedSkills = JSON.parse(row.equippedSkills); } catch(e) { row.equippedSkills = [0,0,0,0]; }
            try { row.ghost_inventory = JSON.parse(row.ghost_inventory); } catch(e) { row.ghost_inventory = {}; }
            try { row.ghost_favorites = JSON.parse(row.ghost_favorites); } catch(e) { row.ghost_favorites = []; }
            try { row.characters = JSON.parse(row.characters); } catch(e) { row.characters = []; }
            
            resolve(row);
        });
    });
}

async function getLeaderboard(limit) {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        const lim = limit || 10;
        db.all('SELECT nickname, email, leaderboard_score, level FROM players ORDER BY leaderboard_score DESC LIMIT ?', [lim], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function migratePasswords() {
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        db.all("SELECT email, password, password_hash FROM players WHERE (password_hash = '' OR password_hash IS NULL) AND password != ''", async (err, rows) => {
            if (err) return reject(err);
            let migrated = 0;
            for (let row of rows) {
                try {
                    const hash = await bcrypt.hash(row.password, SALT_ROUNDS);
                    await new Promise((res, rej) => {
                        db.run("UPDATE players SET password_hash = ? WHERE email = ?", [hash, row.email], (e) => e ? rej(e) : res());
                    });
                    migrated++;
                } catch (e) {
                    console.error("[Migration] Failed to migrate password for", row.email, e);
                }
            }
            if (migrated > 0) console.log(`[Migration] Migrated ${migrated} passwords to bcrypt.`);
            resolve(migrated);
        });
    });
}

// Old functions
async function loadOrCreatePlayer(email, profileName, password) {
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 12) {
        throw new Error("A senha deve ter entre 6 e 12 caracteres.");
    }
    await ensureTableReady();
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM players WHERE email = ?', [email], async (err, row) => {
            if (err) return reject(err);
            if (row) {
                if (row.password_hash && row.password_hash.startsWith('$2b$')) {
                    const match = await bcrypt.compare(password, row.password_hash);
                    if (!match) return reject(new Error("Senha incorreta para o e-mail " + email + "! Verifique sua senha."));
                } else if (row.password && row.password !== '') {
                    if (row.password !== password) return reject(new Error("Senha incorreta para o e-mail " + email + "! Verifique sua senha."));
                } else if (!row.password_hash && (!row.password || row.password === '')) {
                    try {
                        const hash = await bcrypt.hash(password, SALT_ROUNDS);
                        await new Promise((res, rej) => {
                            db.run("UPDATE players SET password_hash = ?, password = ? WHERE email = ?", [hash, password, email], (err) => {
                                if (err) return rej(err);
                                res();
                            });
                        });
                        row.password_hash = hash;
                        row.password = password;
                    } catch (err) {
                        return reject(err);
                    }
                }
                
                try { row.equippedSkills = JSON.parse(row.equippedSkills); } catch(e) { row.equippedSkills = [0,0,0,0]; }
                resolve({ status: 'loaded', data: row });
            } else {
                const defaultName = profileName || 'Ghost';
                const stmt = db.prepare('INSERT INTO players (email, nickname, name, password) VALUES (?, ?, ?, ?)');
                stmt.run([email, defaultName, defaultName, password], function(err) {
                    if (err) return reject(err);
                    resolve({ status: 'created', data: {
                        email, name: defaultName, nickname: defaultName, password, level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0,0,0,0]
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
                nickname = COALESCE(?, nickname), level = ?, xp = ?, mana = ?, maxMana = ?, lives = ?, equippedSkills = ? 
            WHERE email = ?`,
            [data.name || data.nickname, data.level, data.xp, data.mana, data.maxMana, data.lives, skillsStr, email],
            function(err) {
                if (err) return reject(err);
                resolve(this.changes);
            }
        );
    });
}

module.exports = {
    createAccount,
    authenticatePlayer,
    saveFullProfile,
    loadFullProfile,
    getLeaderboard,
    migratePasswords,
    loadOrCreatePlayer,
    savePlayerProgress
};
