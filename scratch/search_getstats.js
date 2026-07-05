const fs = require('fs');
const path = require('path');

const rpgPath = path.join(__dirname, '..', 'rpg_system.js');
const rpgContent = fs.readFileSync(rpgPath, 'utf8');
const rpgLines = rpgContent.split('\n');

console.log('--- Search for getStats in rpg_system.js ---');
for (let i = 0; i < rpgLines.length; i++) {
    const line = rpgLines[i];
    if (line.includes('getStats')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
