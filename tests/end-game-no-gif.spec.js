// Fim do jogo (porta da fase 33): vai direto para a tela "YOU WIN!" sem carregar o GIF de encerramento.
// Continua igual: o painel de vitória aparece, o score é salvo (SaveScore) e o SPACE sai da tela de vitória.
// Sem banco: site estático na 8080 + servidor de jogo FALSO na 3000 (só session_login e save_game_state).
//
// Uso (na pasta "danger ghost", com as portas 3000 e 8080 livres). Precisa de internet: o
// index.html carrega o cliente socket.io de cdn.socket.io.
//   node tests/end-game-no-gif.spec.js
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

const serverAccount = () => ({
    email: EMAIL, name: 'Tester', level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 1, 2, 3],
    characters: [{ characterId: 'ghost_001', name: 'MeuGhost', level: 9, xp: 50, vit: 20, agi: 10, int: 10, pow: 10, mag: 8, updatedAt: '2026-10-07T20:00:00Z' }],
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

async function main() {
    const stat = await startStatic();
    const game = await startGameServer();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
        page.on('dialog', (d) => d.accept().catch(() => {}));
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        const gifRequests = [];
        page.on('request', (r) => { if (/Dream(%20| )36/i.test(r.url())) gifRequests.push(r.url()); });

        await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
        await waitFor(() => page.evaluate(() => !!(window.NetworkState && window.NetworkState.socket && window.NetworkState.socket.connected) && typeof window.EnterEpisode1FromOverworld === 'function'), 15000, 'jogo carregado e conectado');
        await page.evaluate((acc) => window.completeCloudLogin(acc.email, acc.name, acc, 'fake-test-token'), serverAccount());
        await sleep(1500);
        await page.evaluate(() => window.SelectCharacterToPlay('ghost_001'));
        await sleep(1000);
        await page.evaluate(() => window.EnterEpisode1FromOverworld());
        // Pula a cutscene de abertura até a fase estar rodando (G_PLAY = 1).
        const end = Date.now() + 20000;
        while (Date.now() < end && (await page.evaluate(() => window.g_gameState)) !== 1) {
            await page.keyboard.press('Space').catch(() => {});
            await sleep(700);
        }
        expectEq('estado antes do fim (G_PLAY)', await page.evaluate(() => window.g_gameState), 1);
        gifRequests.length = 0;

        // Conta as chamadas de SaveScore e passa pela porta da fase 33, como o jogador faria.
        await page.evaluate(() => {
            window.__saveScoreCalls = 0;
            var orig = window.SaveScore;
            window.SaveScore = function () { window.__saveScoreCalls++; if (typeof orig === 'function') return orig.apply(this, arguments); };
            window.g_currentLevel = 33;
            window.DeSoGhost.nextLevel();
        });
        await sleep(800);

        await check('1. ao zerar a fase 33 o jogo vai direto para a tela de vitória (G_WIN)', async () => {
            expectEq('estado', await page.evaluate(() => window.g_gameState), 2);
        });
        await check('2. nenhum GIF "Dream 36" é pedido no fim do jogo e o <img> da cutscene fica escondido, sem o GIF de encerramento', async () => {
            expectEq('pedidos de GIF', gifRequests, []);
            const img = await page.evaluate(() => { var g = document.getElementById('cutsceneGif'); return { display: g.style.display, src: g.getAttribute('src') || '' }; });
            expectEq('display do cutsceneGif', img.display, 'none');
            if (/Dream(%20| )36(%20| )\(1\)/i.test(img.src)) throw new Error('src do cutsceneGif aponta para o GIF de encerramento: ' + img.src);
        });
        await check('3. painel de vitória visível e score salvo uma vez', async () => {
            expectEq('winPanel', await page.evaluate(() => document.getElementById('winPanel').style.display), 'block');
            expectEq('chamadas de SaveScore', await page.evaluate(() => window.__saveScoreCalls), 1);
        });
        await check('4. SPACE sai da tela de vitória e esconde o painel', async () => {
            await page.keyboard.press('Space');
            await sleep(1500);
            const st = await page.evaluate(() => ({ state: window.g_gameState, panel: document.getElementById('winPanel').style.display }));
            if (st.state === 2) throw new Error('continua em G_WIN depois do SPACE');
            expectEq('winPanel', st.panel, 'none');
        });
        await check('5. sem erro de página', async () => { expectEq('erros', errors, []); });
        await page.close();
    } finally {
        if (browser) await browser.close();
        stat.close(); game.io.close(); game.srv.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
