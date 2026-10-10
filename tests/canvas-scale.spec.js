// Tela do jogo no desktop: o canvas cresce com a janela mantendo a proporção 640:300 (o clique usa essa
// proporção), sem rolagem lateral; o menu de cima não corta "CONTROLS"/"SAVE GAME" em 1366 px; no celular
// nada muda; e o painel Legacy sem carteira mostra o link "Install Phantom".
// Sem banco: só o site estático na 8080 (o jogo não precisa conectar para estas medidas).
//
// Uso (na pasta "danger ghost", com a porta 8080 livre). Precisa de internet: o index.html carrega
// scripts de CDN.
//   node tests/canvas-scale.spec.js
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
function expectNear(label, got, want, tol) {
    if (Math.abs(got - want) > tol) throw new Error(label + ': esperado ~' + want + ' (±' + tol + '), veio ' + got);
}

async function open(browser, w, h, url) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(SITE + (url || '/'), { waitUntil: 'load' });
    await sleep(1000);
    return page;
}
const measure = (page) => page.evaluate(() => {
    var r = document.getElementById('myCanvas').getBoundingClientRect();
    return {
        w: Math.round(r.width), h: Math.round(r.height), ratio: r.width / r.height,
        hScroll: document.documentElement.scrollWidth - window.innerWidth,
        cut: Array.from(document.querySelectorAll('#gameNavbar button')).filter((b) => getComputedStyle(b).display !== 'none' && b.scrollWidth > b.clientWidth).map((b) => b.textContent.trim()),
    };
});

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        // Larguras esperadas = min(janela-40, (altura-330)*2.1333, 1280), e acima de 1500 px janela-680.
        for (const [w, h, ew, eh] of [[1366, 768, 934, 438], [1536, 864, 856, 401], [1920, 1080, 1240, 581]]) {
            const page = await open(browser, w, h);
            const m = await measure(page);
            await check(w + 'x' + h + ': canvas ' + ew + 'x' + eh + ', proporção 640:300, sem rolagem lateral, menu sem corte', async () => {
                expectNear('largura', m.w, ew, 3);
                expectNear('altura', m.h, eh, 3);
                expectNear('proporção', m.ratio, 640 / 300, 0.01);
                expectEq('rolagem lateral', m.hScroll, 0);
                expectEq('botões cortados', m.cut, []);
            });
            if (w === 1920) {
                await check('1920x1080: painel CONTROLS abre ao lado do canvas, dentro da janela', async () => {
                    await page.evaluate(() => window.ToggleNavbarTab('controls'));
                    await sleep(400);
                    const p = await page.evaluate(() => { var r = document.getElementById('navbarPanel').getBoundingClientRect(); var c = document.getElementById('myCanvas').getBoundingClientRect();
                        return { dentro: r.left >= 0 && r.right <= innerWidth, aoLado: r.left >= c.right }; });
                    expectEq('painel', p, { dentro: true, aoLado: true });
                });
            }
            await page.close();
        }
        const mob = await open(browser, 375, 812);
        const mm = await measure(mob);
        await check('375x812 (celular): canvas igual a antes (355x166)', async () => {
            expectNear('largura', mm.w, 355, 2);
            expectNear('altura', mm.h, 166, 2);
        });
        await mob.close();

        const leg = await open(browser, 1366, 768, '/?legacy=1');
        await check('?legacy=1 sem carteira: link "Install Phantom" para phantom.com/download, nova aba, noopener', async () => {
            await leg.click('#ggLegacyToggle');
            await sleep(800);
            const a = await leg.evaluate(() => {
                var l = Array.from(document.querySelectorAll('#ggLegacyPanel a')).find((x) => x.textContent === 'Install Phantom');
                return l ? { href: l.getAttribute('href'), target: l.getAttribute('target'), noopener: /\bnoopener\b/.test(l.getAttribute('rel') || '') } : null;
            });
            expectEq('link', a, { href: 'https://phantom.com/download', target: '_blank', noopener: true });
        });
        await leg.close();
    } finally {
        if (browser) await browser.close();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
