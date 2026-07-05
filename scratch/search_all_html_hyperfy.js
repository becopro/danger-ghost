const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..');
const files = fs.readdirSync(dir);

console.log('--- Search in HTML files ---');
for (const file of files) {
    if (file.endsWith('.html')) {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes('hyperfy')) {
                console.log(`${file} Line ${i + 1}: ${lines[i].trim()}`);
            }
        }
    }
}
