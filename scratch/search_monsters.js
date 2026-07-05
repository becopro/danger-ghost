const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search for monster spawning ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('new c_') || line.includes('c_Slime') || line.includes('c_Skull') || line.includes('.push(')) {
        if (line.includes('Boss') || line.includes('Enemy') || line.includes('Monster') || line.includes('slime') || line.includes('skull')) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
        }
    }
}
