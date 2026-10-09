// Tela cheia do jogo (botão #gameScreenModeBtn): o canvas começa logo abaixo do header, sem nada
// empurrando para cima; título, botões de conta, nome, APK e resumo do Legacy ficam escondidos; o
// mute continua na tela. Com ?legacy=1, o botão LEGACY entra na tela cheia e volta ao sair. Fora da
// tela cheia nada muda. Só o site estático (sem banco, sem servidor do jogo), Chromium headless com
// a API de tela cheia de verdade (clique no botão), em 1366x768, 1536x864 e 1920x1080.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre):
//   node tests/fullscreen-layout.spec.js
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
const results = [];
async function check(name, fn) {
    try { await fn(); results.push([true, name]); console.log('PASSOU  ' + name); }
    catch (e) { results.push([false, name]); console.log('FALHOU  ' + name + '\n        ' + e.message); }
}
function expectEq(label, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(label + ': esperado ' + JSON.stringify(want) + ', veio ' + JSON.stringify(got));
}

// Posição de cada bloco: "oculto" ou [topo, base, esquerda, direita] arredondados.
const layout = (page) => page.evaluate(() => {
    function box(sel) {
        var e = document.querySelector(sel);
        if (!e) return null;
        if (getComputedStyle(e).display === 'none') return 'oculto';
        var b = e.getBoundingClientRect();
        return [Math.round(b.top), Math.round(b.bottom), Math.round(b.left), Math.round(b.right)];
    }
    return {
        canvas: box('#myCanvas'), header: box('.site-header'), titulo: box('#game-section > h2'),
        conta: box('#loginButtonsContainer'), nome: box('.char-name-area'), apk: box('.mobile-app-download-area'),
        legado: box('.legacy-game-summary'), mute: box('#muteBtn'), telaCheia: box('#gameScreenModeBtn'),
        botaoLegacy: box('#ggLegacyToggle'),
        legacyNaTelaCheia: document.getElementById('ggLegacyToggle') && document.fullscreenElement
            ? document.fullscreenElement.contains(document.getElementById('ggLegacyToggle')) : null,
        emTelaCheia: !!document.fullscreenElement,
    };
});

async function run(browser, w, h, query) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.goto(SITE + '/' + query, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.ToggleGameFullscreen === 'function', null, { timeout: 15000 });
    // O botão de tela cheia só aparece depois de escolher o personagem; aqui ele é mostrado direto.
    await page.evaluate(() => { document.getElementById('gameScreenModeBtn').style.display = 'block'; });
    // Fontes da web mudam a altura do header e dos textos: mede só com o layout parado.
    await page.evaluate(() => document.fonts.ready);
    let before = await layout(page);
    for (let i = 0; i < 20; i++) {
        await sleep(500);
        const again = await layout(page);
        if (JSON.stringify(again) === JSON.stringify(before)) break;
        before = again;
    }
    await page.click('#gameScreenModeBtn');
    await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 5000 });
    await sleep(500);
    const full = await layout(page);
    await page.evaluate(() => document.exitFullscreen());
    await page.waitForFunction(() => !document.fullscreenElement, null, { timeout: 5000 });
    await sleep(500);
    const after = await layout(page);
    after.botaoLegacyNoBody = await page.evaluate(() => { var t = document.getElementById('ggLegacyToggle'); return t ? t.parentNode === document.body : null; });
    await page.close();
    return { before, full, after, errors };
}

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        for (const [w, h] of [[1366, 768], [1536, 864], [1920, 1080]]) {
            const r = await run(browser, w, h, '');
            await check(w + 'x' + h + ': na tela cheia o canvas começa logo abaixo do header e vai até o fim da tela', async () => {
                expectEq('em tela cheia', r.full.emTelaCheia, true);
                expectEq('header', r.full.header.slice(0, 2), [0, 60]);
                expectEq('canvas (topo, base)', r.full.canvas.slice(0, 2), [60, h]);
            });
            await check(w + 'x' + h + ': na tela cheia os blocos extras somem e o mute fica na tela', async () => {
                expectEq('extras', [r.full.titulo, r.full.conta, r.full.nome, r.full.apk, r.full.legado], ['oculto', 'oculto', 'oculto', 'oculto', 'oculto']);
                const m = r.full.mute;
                if (!(m[0] >= 60 && m[1] <= h && m[2] >= 0 && m[3] <= w)) throw new Error('mute fora da tela: ' + JSON.stringify(m));
                const t = r.full.telaCheia;
                if (m[3] > t[2]) throw new Error('mute em cima do botão de tela cheia: ' + JSON.stringify([m, t]));
            });
            await check(w + 'x' + h + ': fora da tela cheia, antes e depois, nada muda', async () => {
                const a = Object.assign({}, r.after); delete a.botaoLegacyNoBody;
                expectEq('layout depois de sair', a, r.before);
                expectEq('erros', r.errors, []);
            });
        }
        const l = await run(browser, 1366, 768, '?legacy=1');
        await check('?legacy=1: o botão LEGACY aparece na tela cheia e volta para o body ao sair', async () => {
            expectEq('dentro da tela cheia', l.full.legacyNaTelaCheia, true);
            expectEq('no body depois de sair', l.after.botaoLegacyNoBody, true);
            expectEq('mesma posição antes e depois', l.after.botaoLegacy, l.before.botaoLegacy);
            expectEq('erros', l.errors, []);
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
