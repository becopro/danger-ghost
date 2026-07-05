const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search for blueKey / key in engine.js ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('blueKey') || line.includes('key') || line.includes('Key')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
