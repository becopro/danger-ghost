// O #001 "Ftasma" é o ghost inicial de todo jogador: nunca nasce como alvo de captura no meio
// da fase. As outras espécies continuam no sorteio de SpawnNativeGhosts (js/game/ghost_inventory.js)
// como antes, com as mesmas faixas por fase. Só o site estático (sem banco, sem servidor do jogo):
// o sorteio é chamado direto, com Math.random controlado e SpawnEpisode1Ghost trocado por um registro.
//
// Uso (na pasta "danger ghost", com a porta 8080 livre):
//   node tests/ghost-spawn-001.spec.js
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
function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(String(i).padStart(3, '0')); return r; }

// Varre o sorteio inteiro numa fase: Math.random devolve k/N para k = 0..N-1, então cada posição da
// lista de ids válidos é sorteada pelo menos uma vez. Devolve os ids sorteados, sem repetição, em ordem.
async function sweep(page, level) {
    return page.evaluate((lvl) => {
        var picked = {};
        var realRandom = Math.random;
        var realSpawn = window.SpawnEpisode1Ghost;
        window.SpawnEpisode1Ghost = function (id) { picked[id] = true; };
        window.g_currentLevel = lvl;
        var N = 1000;
        try {
            for (var k = 0; k < N; k++) {
                Math.random = function () { return k / N; };
                window.SpawnNativeGhosts(1);
            }
        } finally {
            Math.random = realRandom;
            window.SpawnEpisode1Ghost = realSpawn;
        }
        return Object.keys(picked).sort();
    }, level);
}

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext()).newPage();
        page.on('dialog', (d) => d.accept().catch(() => {}));
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
        await waitFor(() => page.evaluate(() => typeof window.SpawnNativeGhosts === 'function'), 15000, 'ghost_inventory.js carregado');

        await check('1. fases 1 a 19: nascem #002 a #030, nunca o #001', async () => {
            expectEq('fase 1', await sweep(page, 1), range(2, 30));
            expectEq('fase 19', await sweep(page, 19), range(2, 30));
        });

        await check('2. fases 20 a 30: nascem #002 a #050, nunca o #001', async () => {
            expectEq('fase 20', await sweep(page, 20), range(2, 50));
            expectEq('fase 30', await sweep(page, 30), range(2, 50));
        });

        await check('3. fases 31, 32 e cave1: nascem #002 a #030 e #051 a #080, nunca o #001', async () => {
            const want = range(2, 30).concat(range(51, 80));
            expectEq('fase 31', await sweep(page, 31), want);
            expectEq('cave1', await sweep(page, 'cave1'), want);
        });

        await check('4. fase 33: nascem #002 a #030 e #081 a #101, nunca o #001', async () => {
            expectEq('fase 33', await sweep(page, 33), range(2, 30).concat(range(81, 101)));
        });

        await check('5. sem erros na página', async () => {
            expectEq('erros na página', errors, []);
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
