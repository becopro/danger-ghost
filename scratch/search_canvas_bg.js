const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search in engine.js for background / bg / fillStyle ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('fillStyle') || line.includes('Image') || line.includes('bg') || line.includes('Background') || line.includes('drawBackground') || line.includes('clear')) {
        if (line.toLowerCase().includes('canvas') || line.toLowerCase().includes('ctx') || line.toLowerCase().includes('draw') || line.toLowerCase().includes('bg') || line.toLowerCase().includes('background')) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
        }
    }
}
