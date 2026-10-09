// Ghostdex, HERO STATUS: mostra o nível e os stats do personagem daquela espécie, esteja ele
// gravado como "001" ou como "ghost_001" (o servidor usa "ghost_" + id; saves locais usam o id cru).
// Se os dois existirem, vale o de mais progresso (nível, depois XP). Só exibição: nada é gravado.
// Só o site estático (sem banco, sem servidor do jogo): os personagens vão direto no localStorage.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre):
//   node tests/ghostdex-hero-status.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
function startStatic() {
    const srv = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]);
        const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
        if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
        fs.readFile(file, (err, buf) => {
            if (err) { res.statusCode = 404; return res.end(); }
            res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
            res.end(buf);
        });
    });
    return new Promise((ok) => srv.listen(8080, () => ok(srv)));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms, what) {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await fn()) return; await sleep(100); }
    throw new Error('tempo esgotado esperando: ' + what);
}
const results = [];
async function check(name, fn) {
    try { await fn(); results.push([true, name]); console.log('PASSOU  ' + name); }
    catch (e) { results.push([false, name]); console.log('FALHOU  ' + name + '\n        ' + e.message); }
}
function expectEq(label, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(label + ': esperado ' + JSON.stringify(want) + ', veio ' + JSON.stringify(got));
}

function char(id, level, xp, s) {
    return { characterId: id, name: 'Ftasma', level: level, xp: xp, xpRequired: 900, vit: s, agi: s + 1, int: s + 2, pow: s + 3, mag: s + 4 };
}

// Abre a página com estes personagens e este progresso, abre o detalhe da espécie e lê o HERO STATUS.
async function heroStatus(browser, chars, progress, ghostId) {
    const page = await (await browser.newContext()).newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((d) => {
        try {
            localStorage.setItem('ghostdex_progress', d.progress);
            localStorage.setItem('dg_local_characters', d.chars);
        } catch (e) {}
    }, { progress: JSON.stringify(progress), chars: JSON.stringify(chars) });
    await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await waitFor(() => page.evaluate(() => typeof window.ShowGhostdexDetail === 'function' && Array.isArray(window.g_ghostdexDB)), 15000, 'Ghostdex carregada');
    const view = await page.evaluate((id) => {
        var before = localStorage.getItem('dg_local_characters');
        window.InitializeGhostdex();
        window.ShowGhostdexDetail(id);
        var text = document.getElementById('ghdx-detail-content').textContent;
        var i = text.indexOf('HERO STATUS');
        var hero = i < 0 ? '' : text.slice(i).replace(/\s+/g, ' ').replace(/PLAY.*$/, '').trim();
        return { hero: hero, unchanged: localStorage.getItem('dg_local_characters') === before };
    }, ghostId);
    view.errors = errors;
    await page.close();
    return view;
}

function heroText(level, xp, s) {
    return 'HERO STATUS' + 'Level: ' + level + 'XP: ' + xp + '/900' +
        '❤️ VIT: ' + s + '⚡ AGI: ' + (s + 1) + '🔮 INT: ' + (s + 2) + '⚔️ POW: ' + (s + 3) + '🌀 MAG: ' + (s + 4);
}
function norm(t) { return t.replace(/\s+/g, '').replace(/🛡️/g, ''); }

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });

        await check('1. #001 gravado como "001" (nível 9): HERO STATUS mostra nível 9 e os stats reais', async () => {
            const v = await heroStatus(browser, [char('001', 9, 120, 10)], {}, '001');
            expectEq('hero', norm(v.hero), norm(heroText(9, 120, 10)));
            expectEq('nada gravado', v.unchanged, true);
            expectEq('erros', v.errors, []);
        });

        await check('2. #001 gravado como "ghost_001": continua mostrando o personagem', async () => {
            const v = await heroStatus(browser, [char('ghost_001', 7, 50, 8)], {}, '001');
            expectEq('hero', norm(v.hero), norm(heroText(7, 50, 8)));
        });

        await check('3. "001" e "ghost_001" juntos: vale o de mais progresso', async () => {
            const v1 = await heroStatus(browser, [char('ghost_001', 1, 0, 3), char('001', 9, 120, 10)], {}, '001');
            expectEq('nível maior', norm(v1.hero), norm(heroText(9, 120, 10)));
            const v2 = await heroStatus(browser, [char('ghost_001', 9, 300, 11), char('001', 9, 120, 10)], {}, '001');
            expectEq('mesmo nível, XP maior', norm(v2.hero), norm(heroText(9, 300, 11)));
        });

        await check('4. só um ghost forjado "dg_local_...": o #001 mostra o padrão de nível 1 (sem chutar)', async () => {
            const v = await heroStatus(browser, [char('dg_local_abc123', 12, 10, 20)], {}, '001');
            expectEq('hero', norm(v.hero), norm('HERO STATUS Level: 1 XP: 0/100 ❤️ VIT: 1 ⚡ AGI: 1 🔮 INT: 1 ⚔️ POW: 1 🌀 MAG: 1'));
        });

        await check('5. outra espécie capturada, gravada como "002": mostra o personagem dela', async () => {
            const v = await heroStatus(browser, [char('002', 4, 30, 6)], { '002': 2 }, '002');
            expectEq('hero', norm(v.hero), norm(heroText(4, 30, 6)));
            expectEq('erros', v.errors, []);
        });
    } finally {
        if (browser) await browser.close();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
