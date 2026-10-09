// Texto honesto: o tutorial não tem mais a aba do simulador de save "na blockchain"; as abas que
// ficaram (Play Sandbox, Spells & Runes, Getting Started) abrem sem erro; o painel Legacy continua
// com ?legacy=1; codex.html e lore_reader.html abrem sem erro. Só o site estático (sem banco).
//
// Uso (na pasta "danger ghost", com a porta 8080 livre):
//   node tests/texto-honesto.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.md': 'text/plain' };
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
async function open(browser, url) {
    const page = await (await browser.newContext()).newPage();
    page.on('dialog', (d) => d.accept().catch(() => {}));
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(SITE + url, { waitUntil: 'domcontentloaded' });
    return { page, errors };
}

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });

        await check('1. sem ?legacy=1: tutorial abre as 3 abas sem erro e sem o simulador', async () => {
            const { page, errors } = await open(browser, '/');
            await waitFor(() => page.evaluate(() => typeof window.OpenInteractiveTutorial === 'function' && typeof window.SwitchTutorialTab === 'function'), 15000, 'engine.js carregado');
            await sleep(1500);
            expectEq('window.LegacyMode', await page.evaluate(() => typeof window.LegacyMode), 'undefined');
            const r = await page.evaluate(() => {
                window.OpenInteractiveTutorial();
                var out = {};
                [['sandbox', 'paneSandbox'], ['spells', 'paneSpells'], ['start', 'paneGettingStarted']].forEach(function (t) {
                    window.SwitchTutorialTab(t[0]);
                    var pane = document.getElementById(t[1]);
                    out[t[0]] = !!(pane && pane.classList.contains('active'));
                });
                return {
                    tabs: out,
                    blockchainTab: !!document.getElementById('tabBtnBlockchain'),
                    blockchainPane: !!document.getElementById('paneBlockchain'),
                    simulatorText: document.body.innerHTML.indexOf('Blockchain Cloud Save Simulator') !== -1,
                    tabButtons: Array.prototype.map.call(document.querySelectorAll('.tutorial-tab-btn'), function (b) { return b.id; })
                        .filter(function (id) { return id.indexOf('tabBtnLore') !== 0; }), // abas do modal de Lore usam a mesma classe
                };
            });
            expectEq('abas ativas', r.tabs, { sandbox: true, spells: true, start: true });
            expectEq('botões das abas', r.tabButtons, ['tabBtnSandbox', 'tabBtnSpells', 'tabBtnGettingStarted']);
            expectEq('aba/painel do simulador', [r.blockchainTab, r.blockchainPane, r.simulatorText], [false, false, false]);
            expectEq('erros na página', errors, []);
            await page.close();
        });

        await check('2. com ?legacy=1 o painel Legacy continua aparecendo, sem erro', async () => {
            const { page, errors } = await open(browser, '/?legacy=1');
            await waitFor(() => page.evaluate(() => !!(window.GhostRPG && window.LegacyMode)), 15000, 'jogo e painel carregados');
            expectEq('botão LEGACY', await page.locator('#ggLegacyToggle').count(), 1);
            await sleep(1000);
            expectEq('erros na página', errors, []);
            await page.close();
        });

        for (const url of ['/codex.html', '/lore_reader.html']) {
            await check('3. ' + url + ' abre sem erro e sem "DeSo blockchain"', async () => {
                const { page, errors } = await open(browser, url);
                await sleep(1500);
                const text = await page.evaluate(() => document.body.innerText);
                if (/DeSo blockchain|on the blockchain|from the Blockchain/i.test(text)) throw new Error('texto antigo ainda na página');
                expectEq('erros na página', errors, []);
                await page.close();
            });
        }
    } finally {
        if (browser) await browser.close();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
