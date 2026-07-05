const fs = require('fs');
const path = require('path');

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search in engine.js ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.includes('g_levels') || line.includes('loadLevel') || line.includes('level1') || line.includes('level_') || line.includes('map_data') || line.includes('levels =') || line.includes('g_mapData')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}

const indexPath = path.join(__dirname, '..', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const indexLines = indexContent.split('\n');

console.log('--- Search in index.html for Hyperfy ---');
for (let i = 0; i < indexLines.length; i++) {
    const line = indexLines[i];
    if (line.toLowerCase().includes('hyperfy')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
