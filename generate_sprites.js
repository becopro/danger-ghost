const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = 'c:/Users/Klara/Desktop/dragaMP/danger_ghost_mobile';
const ghostdexPath = path.join(projectRoot, 'www/js/game/ghostdex_data.js');
const spritesDir = path.join(projectRoot, 'www/assets/sprites');

const dataStr = fs.readFileSync(ghostdexPath, 'utf8');
const jsonStr = dataStr.replace('window.GHOST_DATABASE = ', '').replace('window.g_ghostdexDB = ', '').replace(/;\s*$/, '');
const ghosts = JSON.parse(jsonStr);

function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function hashStringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

function getHueShift(name) {
    const lower = name.toLowerCase();
    if (lower.includes('fogo') || lower.includes('flame')) return 0;
    if (lower.includes('toxi') || lower.includes('vaz') || lower.includes('tox')) return 120;
    if (lower.includes('aero') || lower.includes('fuma')) return 180;
    if (lower.includes('sombro')) return 270;
    if (lower.includes('gelo') || lower.includes('crista')) return 200;
    if (lower.includes('polter')) return 30;
    if (lower.includes('ecto') || lower.includes('spectro') || lower.includes('vulto')) return 300;
    if (lower.includes('cromo') || lower.includes('prata')) return 0; // fallback to red if grey wasn't easy
    return hashStringToHue(name);
}

async function processGhosts() {
    const baseLPath = path.join(spritesDir, 'ghost_001_l.webp');
    const baseRPath = path.join(spritesDir, 'ghost_001_r.webp');
    let successCount = 0;
    for (const ghost of ghosts) {
        if (ghost.id === '001') continue;
        const hueShift = getHueShift(ghost.nome);
        const rgb = HSVtoRGB(hueShift / 360, 1.0, 1.0);
        
        const outL = path.join(spritesDir, `ghost_${ghost.id}_l.webp`);
        const outR = path.join(spritesDir, `ghost_${ghost.id}_r.webp`);
        
        await sharp(baseLPath).tint(rgb).toFile(outL);
        await sharp(baseRPath).tint(rgb).toFile(outR);
        successCount++;
    }
    console.log(`Successfully generated ${successCount} colored left and right sprites using TINT.`);
}

processGhosts().catch(console.error);
