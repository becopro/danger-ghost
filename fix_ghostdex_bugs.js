const fs = require('fs');

// 1. Fix Ghostdex DB loading (avoid fetch CORS issues in Capacitor)
const dbJsonPath = 'www/data/ghostdex_db.json';
if (fs.existsSync(dbJsonPath)) {
    const dbData = fs.readFileSync(dbJsonPath, 'utf8');
    const jsData = `window.g_ghostdexDB = ${dbData};\nconsole.log("Ghostdex DB loaded from JS.");`;
    fs.writeFileSync('www/js/game/ghostdex_data.js', jsData, 'utf8');
}

// 2. Update index.html to include ghostdex_data.js before UI
let html = fs.readFileSync('www/index.html', 'utf8');
if (!html.includes('ghostdex_data.js')) {
    html = html.replace(
        /<script src="js\/game\/ghost_inventory.js"><\/script>/,
        '<script src="js/game/ghostdex_data.js"></script>\n    <script src="js/game/ghost_inventory.js"></script>'
    );
    fs.writeFileSync('www/index.html', html, 'utf8');
}

// 3. Update ghostdex_ui.js to skip fetch if g_ghostdexDB exists immediately
let ui = fs.readFileSync('www/js/game/ghostdex_ui.js', 'utf8');
if (ui.includes('fetch(')) {
    ui = ui.replace(
        /if \(!window\.g_ghostdexDB\) {[\s\S]*?\} else {/,
        'if (!window.g_ghostdexDB) {\n        console.error("Ghostdex DB missing!");\n    } else {'
    );
    fs.writeFileSync('www/js/game/ghostdex_ui.js', ui, 'utf8');
}

// 4. Export SpawnBossAtRandomLocation to window in engine.js
let engine = fs.readFileSync('www/js/game/engine.js', 'utf8');
if (!engine.includes('window.SpawnBossAtRandomLocation = SpawnBossAtRandomLocation;')) {
    // Find the definition of SpawnBossAtRandomLocation
    engine = engine.replace(
        /function SpawnBossAtRandomLocation\(bossType\) {/,
        'window.SpawnBossAtRandomLocation = SpawnBossAtRandomLocation;\n			function SpawnBossAtRandomLocation(bossType) {'
    );
    fs.writeFileSync('www/js/game/engine.js', engine, 'utf8');
}

console.log("Bugs fixed: DB fetch bypassed & SpawnBoss exported.");
