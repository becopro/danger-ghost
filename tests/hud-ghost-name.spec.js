// Canto superior direito do jogo (dentro da fase): mostra o nome da espécie do ghost em jogo. O
// personagem pode estar gravado como "ghost_001" (id do servidor) ou "001"; os dois mostram "Ftasma".
// Sem banco: site estático na 8080 + servidor de jogo FALSO na 3000 (só session_login e
// save_game_state). O texto é lido interceptando o fillText do canvas.
//
// Uso (na pasta "danger ghost", com as portas 3000 e 8080 livres). Precisa de internet: o
// index.html carrega o cliente socket.io de cdn.socket.io.
//   node tests/hud-ghost-name.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';
const EMAIL = 'teste@local.invalid';

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

let charId = 'ghost_001';
const serverAccount = () => ({
    email: EMAIL, name: 'Tester', level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 1, 2, 3],
    characters: [{ characterId: charId, name: 'MeuGhost', level: 9, xp: 50, vit: 20, agi: 10, int: 10, pow: 10, mag: 8, updatedAt: '2026-10-07T20:00:00Z' }],
});
function startGameServer() {
    const srv = http.createServer();
    const io = new Server(srv, { cors: { origin: SITE } });
    io.on('connection', (s) => {
        s.on('session_login', () => s.emit('session_login_success', { email: EMAIL, playerData: serverAccount(), token: 'fake-test-token' }));
        s.on('save_game_state', () => {});
    });
    return new Promise((ok) => srv.listen(3000, () => ok({ srv, io })));
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

// Entra na fase 1 com o personagem `id` e devolve o nome escrito no canto direito do HUD.
async function hudName(browser, id) {
    charId = id;
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    // Guarda os textos escritos no canvas com alinhamento à direita (é assim que o nome é desenhado).
    await page.addInitScript(() => {
        window.__rightTexts = [];
        var orig = CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText = function (t) {
            if (this.textAlign === 'right' && this.canvas && this.canvas.id === 'myCanvas') window.__rightTexts.push(String(t));
            return orig.apply(this, arguments);
        };
    });
    await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await waitFor(() => page.evaluate(() => !!(window.NetworkState && window.NetworkState.socket && window.NetworkState.socket.connected) && typeof window.EnterEpisode1FromOverworld === 'function'), 15000, 'jogo carregado e conectado');
    await page.evaluate((acc) => window.completeCloudLogin(acc.email, acc.name, acc, 'fake-test-token'), serverAccount());
    await sleep(1500);
    await page.evaluate((c) => window.SelectCharacterToPlay(c), id);
    await sleep(1000);
    await page.evaluate(() => window.EnterEpisode1FromOverworld());
    // Pula a cutscene até o HUD da fase ser desenhado.
    const end = Date.now() + 20000;
    let names = [];
    while (Date.now() < end) {
        await page.keyboard.press('Space').catch(() => {});
        await sleep(700);
        names = await page.evaluate(() => { var r = window.__rightTexts.slice(-20); window.__rightTexts.length = 0; return r; });
        if (names.length) break;
    }
    await page.close();
    return { name: names[names.length - 1] || null, errors };
}

async function main() {
    const stat = await startStatic();
    const game = await startGameServer();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        await check('1. personagem gravado como "ghost_001" (como vem do servidor): o canto mostra Ftasma', async () => {
            const r = await hudName(browser, 'ghost_001');
            expectEq('nome no canto', r.name, 'Ftasma');
            expectEq('erros', r.errors, []);
        });
        await check('2. personagem gravado como "001": o canto mostra Ftasma', async () => {
            const r = await hudName(browser, '001');
            expectEq('nome no canto', r.name, 'Ftasma');
            expectEq('erros', r.errors, []);
        });
    } finally {
        if (browser) await browser.close();
        stat.close(); game.io.close(); game.srv.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
