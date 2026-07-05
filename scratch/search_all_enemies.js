const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search for enemies array / list ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('enemies =') || line.includes('g_enemies') || line.includes('SpawnEnemy')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
