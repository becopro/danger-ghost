const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..'); // danger ghost/ folder

function searchInFile(filePath, query) {
    if (!fs.existsSync(filePath)) {
        console.warn('File does not exist:', filePath);
        return;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            const relPath = path.relative(projectDir, filePath);
            console.log(`${relPath} Line ${i + 1}: ${lines[i].trim()}`);
        }
    }
}

console.log('--- Search in engine.js ---');
searchInFile(path.join(projectDir, 'js', 'game', 'engine.js'), 'lives -=');
searchInFile(path.join(projectDir, 'js', 'game', 'engine.js'), 'alive = false');

console.log('--- Search in rpg_system.js ---');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'stats');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'equipped');
searchInFile(path.join(projectDir, 'rpg_system.js'), 'equip');

console.log('--- Search in ui_manager.js ---');
searchInFile(path.join(projectDir, 'js', 'ui', 'ui_manager.js'), 'equip');
searchInFile(path.join(projectDir, 'js', 'ui', 'ui_manager.js'), 'render');
