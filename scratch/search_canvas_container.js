const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const cssLines = cssContent.split('\n');

console.log('--- Search in style.css for canvas-container / cutsceneGif ---');
for (let i = 0; i < cssLines.length; i++) {
    const line = cssLines[i];
    if (line.includes('canvas-container') || line.includes('cutsceneGif') || line.includes('fullscreenGameArea')) {
        console.log(`Line ${i + 1}: ${line.trim()}`);
    }
}
