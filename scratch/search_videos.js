const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
const indexLines = indexContent.split('\n');

console.log('--- Search in index.html for video/cutscene/gif ---');
for (let i = 0; i < indexLines.length; i++) {
    const line = indexLines[i];
    if (line.toLowerCase().includes('video') || line.toLowerCase().includes('cutscene') || line.toLowerCase().includes('gif') || line.toLowerCase().includes('winpanel')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}

const enginePath = path.join(__dirname, '..', 'js', 'game', 'engine.js');
const engineContent = fs.readFileSync(enginePath, 'utf8');
const engineLines = engineContent.split('\n');

console.log('--- Search in engine.js for video/cutscene/gif ---');
for (let i = 0; i < engineLines.length; i++) {
    const line = engineLines[i];
    if (line.toLowerCase().includes('video') || line.toLowerCase().includes('cutscene') || line.toLowerCase().includes('gif') || line.toLowerCase().includes('winpanel')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
