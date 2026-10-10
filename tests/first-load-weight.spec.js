// Primeira carga da página inicial: não baixa o GIF escondido "Dream 36" e as imagens abaixo da dobra
// (lore, bestiário, equipamentos, equipe) usam loading="lazy" e só baixam ao rolar até elas.
// Sem banco: só o site estático na 8080 (o jogo não precisa conectar para esta checagem).
//
// Uso (na pasta "danger ghost", com a porta 8080 livre).
//   node tests/first-load-weight.spec.js
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

const BELOW_FOLD = ['UI/Ftasma_e.png', 'UI/1.png', 'Brd%20direita.webp', 'Slime%20esquerda.webp', 'Skull-esquerda.webp',
    'Cactus%20direita.webp', 'Sickcrow%20e.webp', 'equip_head.webp', 'equip_chest.webp', 'equip_weapon.webp',
    'equip_shield.webp', 'equip_ring_ice.webp', 'equip_ring_wood.webp', 'equip_amulet.webp', 'UI/becopro.png', 'klara_avatar.png'];

async function main() {
    const stat = await startStatic();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
        const requested = [];
        page.on('request', (r) => { if (r.url().startsWith(SITE)) requested.push(decodeURIComponent(r.url())); });
        await page.goto(SITE + '/', { waitUntil: 'load' });
        await sleep(3000);

        await check('1. o GIF escondido "Dream 36" não é baixado ao abrir a página', async () => {
            expectEq('pedidos', requested.filter((u) => /Dream 36/i.test(u)), []);
            expectEq('src do cutsceneGif', await page.evaluate(() => document.getElementById('cutsceneGif').getAttribute('src')), null);
        });
        await check('2. as 16 imagens abaixo da dobra têm loading="lazy"', async () => {
            const lazy = await page.evaluate((list) => list.map((s) => {
                var img = Array.from(document.querySelectorAll('img')).find((i) => (i.getAttribute('src') || '').indexOf(s) !== -1);
                return img ? img.getAttribute('loading') : 'SEM IMG';
            }), BELOW_FOLD);
            expectEq('loading', lazy, BELOW_FOLD.map(() => 'lazy'));
        });
        await check('3. as imagens da equipe (fim da página) não baixam antes de rolar', async () => {
            expectEq('pedidos', requested.filter((u) => /klara_avatar\.png|UI\/becopro\.png/.test(u)), []);
        });
        await check('4. ao rolar até o fim, as imagens da equipe baixam e aparecem', async () => {
            await page.evaluate(() => document.querySelector('img[src*="klara_avatar"]').scrollIntoView());
            await sleep(1500);
            const ok = await page.evaluate(() => ['klara_avatar', 'UI/becopro'].map((s) => {
                var i = document.querySelector('img[src*="' + s + '"]'); return i.complete && i.naturalWidth > 0;
            }));
            expectEq('carregadas', ok, [true, true]);
        });
        await check('5. o logo do cabeçalho continua carregando na hora', async () => {
            expectEq('logo', await page.evaluate(() => { var i = document.querySelector('.header-logo-img'); return i.complete && i.naturalWidth > 0; }), true);
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
