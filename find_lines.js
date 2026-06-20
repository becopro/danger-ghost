const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('rank') || 
        line.includes('triggerrpgsavetodeso') || 
        line.includes('loadrpgstatefromdeso') ||
        line.includes('fd622') // the global thread mentioned
       ) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    }
}
