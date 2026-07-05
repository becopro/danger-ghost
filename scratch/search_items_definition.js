const fs = require('fs');
const path = require('path');

const rpgPath = path.join(__dirname, '..', 'rpg_system.js');
const rpgContent = fs.readFileSync(rpgPath, 'utf8');
const rpgLines = rpgContent.split('\n');

console.log('--- Search in rpg_system.js for item definitions ---');
for (let i = 0; i < rpgLines.length; i++) {
    const line = rpgLines[i];
    if (line.includes('var ') || line.includes('const ') || line.includes('items') || line.includes('inventory')) {
        if (i < 300) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
        }
    }
}
