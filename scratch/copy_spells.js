const fs = require('fs');
const path = require('path');

const srcSpark = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\spell_spark_1782079593870.png';
const srcGhost = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\spell_ghost_1782081536485.png';
const srcOrb = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\spell_orb_1782081558901.png';
const srcPhantom = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\spell_phantom_1782081582275.png';

const destSpark = path.join(__dirname, '..', 'assets', 'sprites', 'spell_spark.png');
const destGhost = path.join(__dirname, '..', 'assets', 'sprites', 'spell_ghost.png');
const destOrb = path.join(__dirname, '..', 'assets', 'sprites', 'spell_orb.png');
const destPhantom = path.join(__dirname, '..', 'assets', 'sprites', 'spell_phantom.png');

fs.copyFileSync(srcSpark, destSpark);
fs.copyFileSync(srcGhost, destGhost);
fs.copyFileSync(srcOrb, destOrb);
fs.copyFileSync(srcPhantom, destPhantom);

console.log('All spell icon images copied successfully!');
