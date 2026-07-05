const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');

function searchInFile(filePath, query) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(query)) {
            const relPath = path.relative(projectDir, filePath);
            console.log(`${relPath} Line ${i + 1}: ${line.trim()}`);
        }
    }
}

searchInFile(path.join(projectDir, 'rpg_system.js'), 'state.vit');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'state.agi');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'state.int');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'state.pow');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'state.mag');

searchInFile(path.join(projectDir, 'js', 'game', 'engine.js'), 'GhostRPG');
searchInFile(path.join(projectDir, 'js', 'ui', 'ui_manager.js'), 'GhostRPG');
