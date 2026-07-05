const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, '..', 'css');
const cssFiles = fs.readdirSync(cssDir);

console.log('--- Search in CSS files ---');
for (const file of cssFiles) {
    if (file.endsWith('.css')) {
        const filePath = path.join(cssDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('hyperfy')) {
                console.log(`css/${file} Line ${i + 1}: ${lines[i].trim()}`);
            }
        }
    }
}
