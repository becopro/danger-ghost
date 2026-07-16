const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = 'c:/Users/Klara/Desktop/dragaMP/danger_ghost_mobile';
const ghostdexPath = path.join(projectRoot, 'www/js/game/ghostdex_data.js');
const spritesDir = path.join(projectRoot, 'www/assets/sprites');

const dataStr = fs.readFileSync(ghostdexPath, 'utf8');
const jsonStr = dataStr.replace('window.GHOST_DATABASE = ', '').replace('window.g_ghostdexDB = ', '').replace(/;\s*$/, '');
const ghosts = JSON.parse(jsonStr);

function hashStringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

function getHueShift(name) {
    const lower = name.toLowerCase();
    if (lower.includes('fogo')) return 0;
    if (lower.includes('toxi') || lower.includes('vaz') || lower.includes('tox')) return 120;
    if (lower.includes('aero') || lower.includes('fuma')) return 180;
    if (lower.includes('sombro')) return 270;
    if (lower.includes('gelo') || lower.includes('crista')) return 200;
    if (lower.includes('polter')) return 30;
    if (lower.includes('ecto') || lower.includes('spectro') || lower.includes('vulto')) return 300;
    if (lower.includes('cromo')) return 60;
    return hashStringToHue(name);
}

async function processGhosts() {
    const baseLPath = path.join(spritesDir, 'ghost_001_l.webp');
    const baseRPath = path.join(spritesDir, 'ghost_001_r.webp');
    let successCount = 0;
    for (const ghost of ghosts) {
        if (ghost.id === '001') continue;
        const hueShift = getHueShift(ghost.nome);
        const outL = path.join(spritesDir, `ghost_${ghost.id}_l.webp`);
        const outR = path.join(spritesDir, `ghost_${ghost.id}_r.webp`);
        await sharp(baseLPath).modulate({ hue: hueShift }).toFile(outL);
        await sharp(baseRPath).modulate({ hue: hueShift }).toFile(outR);
        successCount++;
    }
    console.log(`Successfully generated ${successCount} left and ${successCount} right sprites.`);
}

processGhosts().catch(console.error);
