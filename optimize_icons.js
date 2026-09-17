// optimize_icons.js — conversão dos 11 ícones de equipamento/magia para WebP.
//
// Contexto (16/09/2026, technical-artist): os 11 arquivos em assets/sprites/
// listados abaixo tinham extensão .png mas eram, de fato, **JPEG baseline**
// (`file` confirma: "JPEG image data, JFIF standard 1.01, ... 1024x1024,
// components 3"). 1024x1024 e ~600-800KB cada, para renderizar a 64px (DOM,
// index.html) e 24px (canvas HUD, engine.js drawImage slotSize-4).
//
// IMPORTANTE — o que este script NÃO faz: não cria transparência. JPEG tem 3
// canais, zero alpha. Uma sondagem do fundo (variação RGB na faixa de borda de
// 64px) deu delta de 35 a 286 entre os cantos — ou seja, o fundo é **pintado/
// texturizado, não uma cor chapada**. Não dá pra fazer chroma-key nem flood-fill
// e obter silhueta limpa; isso exige repasse de arte de verdade (`2d-artist`).
// O que este script entrega é o ganho real disponível: JPEG->WebP e 1024->256px.
//
// Segue o mesmo padrão sharp já usado em process_ghost.js e optimize_all.js:
// sharp(src).resize(...).webp({ quality: 80, effort: 6 }).toFile(dest)
//
// Saída são arquivos NOVOS (.webp); os .png originais não são tocados aqui —
// a remoção é passo separado, depois das referências atualizadas.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS = [
    'equip_amulet', 'equip_chest', 'equip_head', 'equip_ring_ice',
    'equip_ring_wood', 'equip_shield', 'equip_weapon',
    'spell_ghost', 'spell_orb', 'spell_phantom', 'spell_spark'
];

// 256px: 4x o maior tamanho de render real (64px no DOM), com folga pra
// devicePixelRatio 2x e pro redesign de moldura por raridade que vem a seguir.
const TARGET = 256;

// Web e mobile carregam os MESMOS assets de pastas separadas e não sincronizadas
// (CLAUDE.md §3) — o asset novo tem que cair nos dois lugares ou o mobile fica
// com referência quebrada.
const OUT_DIRS = [
    path.join(__dirname, 'assets', 'sprites'),
    path.join(__dirname, '..', 'danger_ghost_mobile', 'www', 'assets', 'sprites')
];

async function optimizeIcons() {
    const srcDir = path.join(__dirname, 'assets', 'sprites');
    let totalBefore = 0;
    let totalAfter = 0;

    for (const name of ICONS) {
        const srcPath = path.join(srcDir, name + '.png');
        if (!fs.existsSync(srcPath)) {
            console.error(`MISSING: ${srcPath}`);
            continue;
        }

        const before = fs.statSync(srcPath).size;
        totalBefore += before;

        const meta = await sharp(srcPath).metadata();

        // Buffer uma vez, grava nos dois destinos — evita reencodar duas vezes.
        const buf = await sharp(srcPath)
            .resize(TARGET, TARGET, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 })
            .toBuffer();

        for (const dir of OUT_DIRS) {
            if (!fs.existsSync(dir)) {
                console.error(`SKIP (no dir): ${dir}`);
                continue;
            }
            fs.writeFileSync(path.join(dir, name + '.webp'), buf);
        }

        totalAfter += buf.length;
        const pct = ((1 - buf.length / before) * 100).toFixed(1);
        console.log(
            `${name.padEnd(16)} ${meta.format}/${meta.width}x${meta.height} ` +
            `${(before / 1024).toFixed(0)}KB -> webp/${TARGET}x${TARGET} ` +
            `${(buf.length / 1024).toFixed(1)}KB (-${pct}%)`
        );
    }

    console.log('---');
    console.log(`TOTAL (por pasta): ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(1)}KB ` +
        `(-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
    console.log(`Gravado em ${OUT_DIRS.length} pastas (web + mobile www).`);
}

optimizeIcons().catch(err => { console.error(err); process.exit(1); });
