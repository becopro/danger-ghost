const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname, '..');

function searchInFile(filePath, query) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            const relPath = path.relative(projectDir, filePath);
            console.log(`${relPath} Line ${i + 1}: ${lines[i].trim()}`);
        }
    }
}

console.log('--- Search for enemy death/defeat in engine.js ---');
searchInFile(path.join(projectDir, 'danger ghost', 'js', 'game', 'engine.js'), 'lives <= 0');
searchInFile(path.join(projectDir, 'danger ghost', 'js', 'game', 'engine.js'), 'die');
searchInFile(path.join(projectDir, 'danger ghost', 'js', 'game', 'engine.js'), 'destroy');

console.log('--- Search for RPG stats / attributes ---');
searchInFile(path.join(projectDir, 'danger ghost', 'rpg_system.js'), 'stats');
searchInFile(path.join(projectDir, 'danger ghost', 'rpg_system.js'), 'equipped');
searchInFile(path.join(projectDir, 'danger ghost', 'js', 'ui', 'ui_manager.js'), 'RenderEquip');
searchInFile(path.join(projectDir, 'danger ghost', 'js', 'ui', 'ui_manager.js'), 'Equip');
