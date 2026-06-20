const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

function extractFunction(name) {
    const regex = new RegExp(`function\\s+${name}\\s*\\([\\s\\S]*?\\n\\}`);
    const match = content.match(regex);
    if (match) {
        console.log(`--- ${name} ---`);
        console.log(match[0].substring(0, 2000)); 
    } else {
        const regex2 = new RegExp(`const\\s+${name}\\s*=\\s*\\([\\s\\S]*?\\n\\}`);
        const match2 = content.match(regex2);
        if (match2) {
            console.log(`--- ${name} ---`);
            console.log(match2[0].substring(0, 2000));
        } else {
            console.log(`${name} not found`);
        }
    }
}

extractFunction('LoadRPGStateFromDeSo');
extractFunction('ExecuteDeSoRPGSave');
extractFunction('buildCharactersMap');
extractFunction('LoadDataFromDeSo');
