// Logo do cabeçalho e ícone da aba: carregam na página e são as versões leves (logo 128x128 com fundo
// transparente, favicon 64x64), não mais a imagem de 712x721 / 173 KB usada nos dois lugares.
// Sem banco: só o site estático na 8080.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre).
//   node tests/logo-files.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
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

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
        await page.goto(SITE + '/', { waitUntil: 'load' });
        await sleep(1000);
        await check('1. logo do cabeçalho carrega em 128x128, exibido com 40 px de altura', async () => {
            const l = await page.evaluate(() => { var i = document.querySelector('.header-logo-img');
                return { src: i.getAttribute('src'), nat: [i.naturalWidth, i.naturalHeight], h: Math.round(i.getBoundingClientRect().height) }; });
            expectEq('logo', l, { src: 'assets/sprites/ghost_games_logo.png', nat: [128, 128], h: 40 });
        });
        await check('1b. logo, título (uma linha) e botões do menu com a mesma altura (~40 px)', async () => {
            const hs = await page.evaluate(() => ['.header-logo-img', '.neon-title', '#btnNavProfile'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
            hs.forEach((h) => { if (Math.abs(h - 40) > 2) throw new Error('alturas ' + JSON.stringify(hs)); });
        });
        await check('1c. o menu do cabeçalho não tem botão LOGIN (o login fica no RESTORE PROGRESS)', async () => {
            const r = await page.evaluate(() => ({ login: !!document.getElementById('btnNavLogin'),
                restore: !!Array.from(document.querySelectorAll('#loginButtonsContainer button')).find((b) => /RESTORE PROGRESS/i.test(b.textContent)) }));
            expectEq('cabeçalho', r, { login: false, restore: true });
        });
        await check('2. favicon aponta para favicon.png e é a imagem de 64x64', async () => {
            const href = await page.evaluate(() => document.querySelector('link[rel="icon"]').getAttribute('href'));
            expectEq('href', href, 'favicon.png');
            const nat = await page.evaluate(() => new Promise((ok) => { var i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.onerror = () => ok(null); i.src = 'favicon.png'; }));
            expectEq('tamanho', nat, [64, 64]);
        });
        await check('3. arquivos leves (logo < 50 KB, favicon < 20 KB)', async () => {
            const logo = fs.statSync(path.join(ROOT, 'assets/sprites/ghost_games_logo.png')).size;
            const fav = fs.statSync(path.join(ROOT, 'favicon.png')).size;
            if (logo >= 50 * 1024 || fav >= 20 * 1024) throw new Error('logo ' + logo + ' B, favicon ' + fav + ' B');
        });
        await page.close();
    } finally {
        if (browser) await browser.close();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
