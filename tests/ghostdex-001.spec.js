// Ghostdex: o #001 "Ftasma" é o ghost inicial de todo jogador e aparece sempre como visto e
// capturado, desde a criação da conta, sem contar duas vezes. Os outros ghosts e os contadores
// seguem ghostdex_progress como antes. Só o site estático (sem banco, sem servidor do jogo):
// o progresso da Ghostdex é posto direto no localStorage antes da página carregar.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre):
//   node tests/ghostdex-001.spec.js
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

// Abre a página com este ghostdex_progress no localStorage e desenha a Ghostdex.
async function openGhostdex(browser, progress, query) {
    const page = await (await browser.newContext()).newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.addInitScript((p) => { try { localStorage.setItem('ghostdex_progress', p); } catch (e) {} }, JSON.stringify(progress));
    await page.goto(SITE + '/' + (query || ''), { waitUntil: 'domcontentloaded' });
    await waitFor(() => page.evaluate(() => typeof window.InitializeGhostdex === 'function' && Array.isArray(window.g_ghostdexDB)), 15000, 'Ghostdex carregada');
    const view = await page.evaluate(() => {
        window.InitializeGhostdex();
        var box = document.getElementById('navbarPanelContent');
        var counters = (box.textContent.match(/Seen: \d+ \/ \d+ \| Caught: \d+ \/ \d+/) || [''])[0];
        var cards = {};
        box.querySelectorAll('.ghdx-card').forEach(function (c) {
            var id = (c.textContent.match(/#(\d{3})/) || [])[1];
            cards[id] = { text: c.textContent.replace('#' + id, '').trim(), img: !!c.querySelector('img') };
        });
        window.ShowGhostdexDetail('001');
        var ov = document.getElementById('ghdx-detail-overlay');
        var detail = ov && ov.style.display === 'block' ? (document.getElementById('ghdx-detail-content').querySelector('h3') || {}).textContent : null;
        return { counters: counters, c001: cards['001'], c002: cards['002'], c003: cards['003'], detail001: detail, stored: localStorage.getItem('ghostdex_progress') };
    });
    view.errors = errors;
    view.page = page;
    return view;
}

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });

        await check('1. conta nova (progresso vazio): #001 Ftasma visto e capturado, com imagem e detalhe', async () => {
            const v = await openGhostdex(browser, {});
            expectEq('contadores', v.counters, 'Seen: 1 / 101 | Caught: 1 / 101');
            expectEq('card #001', v.c001, { text: 'Ftasma', img: true });
            expectEq('detalhe #001', v.detail001, '#001 - Ftasma');
            expectEq('card #003', v.c003, { text: '❓???', img: false });
            expectEq('nada gravado no progresso', v.stored, '{}');
            expectEq('erros na página', v.errors, []);
            await v.page.close();
        });

        await check('2. conta antiga com "ghost_001" (personagem inicial do servidor) e capturas: #001 aparece, outros iguais', async () => {
            const v = await openGhostdex(browser, { ghost_001: 2, '002': 2, '005': 1 });
            expectEq('contadores', v.counters, 'Seen: 3 / 101 | Caught: 2 / 101');
            expectEq('card #001', v.c001, { text: 'Ftasma', img: true });
            expectEq('card #002', v.c002, { text: 'Toxiwisp', img: true });
            expectEq('card #003', v.c003, { text: '❓???', img: false });
            await v.page.close();
        });

        await check('3. conta que já tinha "001" capturado: não conta duas vezes', async () => {
            const v = await openGhostdex(browser, { '001': 2, '002': 2 });
            expectEq('contadores', v.counters, 'Seen: 2 / 101 | Caught: 2 / 101');
            await v.page.close();
        });

        await check('4. conta que tinha o "001" só como visto: passa a capturado, sem somar a mais', async () => {
            const v = await openGhostdex(browser, { '001': 1, '002': 1 });
            expectEq('contadores', v.counters, 'Seen: 2 / 101 | Caught: 1 / 101');
            await v.page.close();
        });

        await check('5. com ?legacy=1 o painel Legacy carrega e chama a espécie #001 de Ftasma', async () => {
            const v = await openGhostdex(browser, {}, '?legacy=1');
            expectEq('window.LegacyMode', await v.page.evaluate(() => typeof window.LegacyMode), 'object');
            expectEq('nome da espécie', await v.page.evaluate(() => window.GetGhostdexEntry('001').nome), 'Ftasma');
            expectEq('erros na página', v.errors, []);
            await v.page.close();
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
