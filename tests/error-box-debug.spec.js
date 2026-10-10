// Caixa vermelha "GLOBAL ERROR DETECTED": só aparece com ?debug=1 no endereço. Sem isso, um erro de
// JavaScript (do jogo, de extensão de carteira ou de script de terceiros) vai só para o console.
// Sem banco: só o site estático na 8080.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre).
//   node tests/error-box-debug.spec.js
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

// Abre a página, provoca um erro não tratado e devolve se a caixa apareceu e se o console recebeu o erro.
async function provoke(browser, url) {
    const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('erro de teste 123') !== -1) consoleErrors.push(m.text()); });
    await page.goto(SITE + url, { waitUntil: 'load' });
    await sleep(1000);
    await page.evaluate(() => { setTimeout(() => { throw new Error('erro de teste 123'); }, 0); });
    await sleep(500);
    const box = await page.evaluate(() => { var d = document.getElementById('debugCrashReport'); return d ? d.textContent.indexOf('erro de teste 123') !== -1 : false; });
    await page.close();
    return { box, console: consoleErrors.length > 0 };
}

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        await check('1. sem ?debug=1: um erro não mostra a caixa vermelha e vai para o console', async () => {
            expectEq('resultado', await provoke(browser, '/'), { box: false, console: true });
        });
        await check('2. com ?legacy=1 (sem debug): também sem caixa', async () => {
            expectEq('resultado', await provoke(browser, '/?legacy=1'), { box: false, console: true });
        });
        await check('3. com ?debug=1: a caixa vermelha aparece com o erro', async () => {
            expectEq('resultado', await provoke(browser, '/?debug=1'), { box: true, console: true });
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
