const fs = require('fs');
const file = 'c:/Users/Klara/Desktop/dragaMP/danger ghost/js/game/engine.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');
lines.forEach((line, i) => {
    if (line.includes('addXp')) {
        console.log(`${i+1}: ${line.trim()}`);
    }
});
