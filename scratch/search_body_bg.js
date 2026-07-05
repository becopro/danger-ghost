const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const cssLines = cssContent.split('\n');

console.log('--- Search in style.css for background styles ---');
for (let i = 0; i < cssLines.length; i++) {
    const line = cssLines[i];
    if (line.includes('background') || line.includes('background-image')) {
        if (i < 100 || line.includes('body') || line.includes('html')) {
            console.log(`Line ${i + 1}: ${line.trim()}`);
        }
    }
}
