const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search for player spawn/start in engine.js ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('spawn') || line.includes('player.x') || line.includes('player.y') || line.includes('g_player') || line.includes('ResetPlayer') || line.includes('xPos =') || line.includes('yPos =')) {
        if (line.toLowerCase().includes('position') || line.toLowerCase().includes('start') || line.toLowerCase().includes('reset') || line.toLowerCase().includes('level')) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
        }
    }
}
