// Painel Legacy (?legacy=1): Pass on e forge quando a carteira falha ou demora (contrato Legacy v1.2).
// - erro da carteira: código, mensagem real e tempo no console e na tela ("Wallet said: ...");
// - transação do prepare vencida (expiresAt) + erro da carteira: mensagem tx_expired_wallet;
// - 400 tx_expired / tx_failed no confirm: a transação pendente sai do localStorage;
// - 202 no confirm mantém a pendente, e recarregar a página termina o Pass on.
// Sem banco, sem Phantom, sem serviço real:
//   - site estático na 8080 (esta pasta);
//   - serviço Legacy falso na 8090 (tools/legacy-fake-server.js) + carteira de teste (?mockwallet=1).
//
// Uso (na pasta "danger ghost", com as portas 8080 e 8090 livres). Precisa de internet (cdn.socket.io).
//   node tests/legacy-pass-on.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';
const LEGACY = 'http://localhost:8090';
const PENDING_KEY = 'gg_legacy_pending';

const TEXT = {
    walletFailed: 'Your wallet could not finish this. This usually happens when the wallet takes too long to open or approve. Press the button again and approve right away. If it keeps failing, check that your wallet is in Devnet mode.',
    noSol: 'Not enough devnet SOL to pay the fee. Put your wallet in Devnet mode (Testnet Mode) and get free devnet SOL from the faucet.',
    expiredWallet: 'The transfer request expired while your wallet was opening. Nothing was sent. Press Pass on to try again.',
    expiredConfirm: 'This transfer expired before it reached Solana devnet. Nothing changed. Press Pass on to try again.',
    txFailed: 'The transaction failed on Solana devnet. Nothing changed.',
    cancelled: 'You cancelled in your wallet. Nothing was sent.',
    stillPending: 'Solana devnet is slow to confirm. Your transaction is kept: press "Finish pending transaction" in a moment.',
};
const FAUCET_LINK = 'Open the Solana faucet';

// ---------- servidores ----------
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
function startLegacyFake() {
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'legacy-fake-server.js')], { stdio: ['ignore', 'pipe', 'inherit'] });
    return new Promise((ok, fail) => {
        child.stdout.on('data', (d) => { if (/localhost:8090/.test(String(d))) ok(child); });
        child.on('exit', (c) => fail(new Error('legacy-fake-server saiu com código ' + c)));
    });
}
const dev = (route, body) => fetch(LEGACY + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });

// ---------- utilidades ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms, what) {
    const end = Date.now() + ms;
    while (Date.now() < end) { if (await fn()) return; await sleep(100); }
    throw new Error('tempo esgotado esperando: ' + what);
}
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function randomAddr() {
    let n = BigInt('0x' + crypto.randomBytes(32).toString('hex')), out = '';
    while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
    return out;
}
const short = (a) => a.slice(0, 4) + '…' + a.slice(-4);
const results = [];
async function check(name, fn) {
    try { await fn(); results.push([true, name]); console.log('PASSOU  ' + name); }
    catch (e) { results.push([false, name]); console.log('FALHOU  ' + name + '\n        ' + String(e.message).split('\n')[0]); }
}
function expectEq(label, got, want) {
    if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(label + ': esperado ' + JSON.stringify(want) + ', veio ' + JSON.stringify(got));
}
function expectMatch(label, got, re) {
    if (typeof got !== 'string' || !re.test(got)) throw new Error(label + ': ' + JSON.stringify(got) + ' não bate com ' + re);
}

// Mensagem principal do painel (logo abaixo do título).
const readMsg = (page) => page.evaluate(() => {
    var m = document.querySelector('#ggLegacyPanel > .gg-legacy-msg');
    if (!m) return null;
    var said = m.querySelector('.gg-legacy-wallet-said');
    return {
        kind: (m.className.match(/gg-legacy-msg-(\w+)/) || [])[1],
        text: m.firstChild.textContent,
        detail: said ? said.textContent : null,
        links: Array.prototype.map.call(m.querySelectorAll('a'), function (a) { return a.textContent; }),
    };
});
// Espera a ação terminar e lê a mensagem. Enquanto uma ação roda, o painel desativa todos os botões
// (o "Refresh balance" só fica desativado nessa hora).
async function waitResult(page) {
    const working = () => page.evaluate(() => Array.prototype.some.call(document.querySelectorAll('#ggLegacyPanel button'), function (b) { return /Refresh balance/.test(b.textContent) && b.disabled; }));
    await waitFor(working, 5000, 'ação começar');
    await waitFor(async () => !(await working()), 40000, 'ação terminar');
    return readMsg(page);
}
const pendingStored = (page) => page.evaluate((k) => localStorage.getItem(k), PENDING_KEY);

async function openPanel(page) {
    if (await page.locator('#ggLegacyPanel').isVisible()) return;
    await page.locator('#ggLegacyToggle').click();
}
async function ownedAssets(wallet) {
    const st = await (await fetch(LEGACY + '/dev/state')).json();
    return st.ghosts.filter((g) => g.registered && g.owner === wallet).map((g) => g.asset);
}
async function forge(page) {
    await page.getByRole('button', { name: 'Forge on Solana' }).click();
    await page.getByRole('button', { name: /forge now/i }).click();
    return waitResult(page);
}
// Abre o formulário do Pass on de um ghost e deixa pronto o botão "Pass on now".
async function openPassOn(page, asset) {
    const item = page.locator('.gg-legacy-ghost').filter({ hasText: short(asset) });
    if (await item.getByRole('button', { name: 'Pass on now' }).count()) return item;
    await item.getByRole('button', { name: 'Pass on', exact: true }).click();
    await page.getByLabel('Destination wallet address').fill(randomAddr());
    await item.getByRole('button', { name: 'Check', exact: true }).click();
    await item.getByRole('button', { name: 'Pass on now' }).waitFor({ timeout: 10000 });
    return item;
}
async function passOn(page, asset) {
    const item = await openPassOn(page, asset);
    await item.getByRole('button', { name: 'Pass on now' }).click();
    return waitResult(page);
}

// ---------- roteiro ----------
async function main() {
    const stat = await startStatic();
    const legacy = await startLegacyFake();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
        page.on('dialog', (d) => d.accept().catch(() => {}));
        const logs = [];
        page.on('console', (m) => { if (/\[Legacy\]/.test(m.text())) logs.push(m.type() + ' ' + m.text()); });
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        const lastLog = (re) => logs.filter((l) => re.test(l)).pop() || null;

        await page.goto(SITE + '/?legacy=1&mockwallet=1', { waitUntil: 'domcontentloaded' });
        await waitFor(() => page.evaluate(() => !!(window.GhostRPG && window.LegacyMode)), 15000, 'jogo e painel carregados');
        await openPanel(page);
        await page.getByRole('button', { name: 'Connect Ghost Test Wallet A' }).click();
        await page.getByRole('button', { name: 'Sign in (free)' }).click();
        await page.getByRole('button', { name: 'Sign out' }).waitFor({ timeout: 10000 });
        const wallet = await page.evaluate(() => window.GGMockWallet.address);
        const mock = (props) => page.evaluate((p) => Object.assign(window.GGMockWallet, p), props);
        await mock({ delayMs: 300 }); // a ação dura o bastante para o teste ver o começo

        // Três ghosts: G1 para os casos de erro e o recarregar, G2 Pass on normal, G3 prepare vencido + novo prepare.
        for (let i = 0; i < 3; i++) {
            const m = await forge(page);
            if (m.text !== 'Ghost forged on Solana devnet! You own it in your wallet.') throw new Error('forge do preparo: ' + JSON.stringify(m));
        }
        const [G1, G2, G3] = await ownedAssets(wallet);

        await check('1. cancelar na carteira continua "You cancelled in your wallet. Nothing was sent."', async () => {
            await mock({ rejectNext: true });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.cancelled);
            expectMatch('linha da carteira', m.detail, /^Wallet said: User rejected the request\. \(after \d+\.\d s\)$/);
            expectMatch('console', lastLog(/wallet:/), /^warning \[Legacy\] wallet: wallet_rejected User rejected the request\. after \d+ ms$/);
        });

        await check('2. "Blockhash not found" antes de expiresAt: texto novo do wallet_failed, "Wallet said" e o tempo', async () => {
            await mock({ failNext: 'Blockhash not found', delayMs: 300 });
            const m = await passOn(page, G1);
            await mock({ delayMs: 300 });
            expectEq('texto', m.text, TEXT.walletFailed);
            expectMatch('linha da carteira', m.detail, /^Wallet said: Blockhash not found \(after 0\.[3-9] s\)$/);
            expectEq('links', m.links, []);
            expectMatch('console', lastLog(/wallet:/), /^warning \[Legacy\] wallet: wallet_failed Blockhash not found after \d{3,} ms$/);
            expectEq('pendente depois de erro da carteira', await pendingStored(page), null);
        });

        await check('3. erro genérico da carteira: texto novo do wallet_failed, sem link do faucet', async () => {
            await mock({ failNext: 'Unexpected error' });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.walletFailed);
            expectEq('links', m.links, []);
            expectMatch('linha da carteira', m.detail, /^Wallet said: Unexpected error \(after \d+\.\d s\)$/);
        });

        await check('4. "insufficient funds" continua wallet_no_sol com o link do faucet', async () => {
            await mock({ failNext: 'Transaction simulation failed: insufficient funds for fee' });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.noSol);
            expectEq('links', m.links, [FAUCET_LINK]);
            expectMatch('linha da carteira', m.detail, /^Wallet said: Transaction simulation failed: insufficient funds for fee/);
        });

        await check('5. expiresAt no passado + erro da carteira: mensagem tx_expired_wallet', async () => {
            await dev('/dev/expire-prepare', { times: 2 }); // o painel pede um prepare novo uma vez antes de abrir a carteira
            await mock({ failNext: 'Blockhash not found' });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.expiredWallet);
            expectMatch('linha da carteira', m.detail, /^Wallet said: Blockhash not found/);
            expectMatch('console', lastLog(/wallet:/), /wallet: tx_expired_wallet Blockhash not found after \d+ ms$/);
        });

        await check('6. confirm com 400 tx_expired: mensagem nova e a pendente some do localStorage', async () => {
            await dev('/dev/fail', { route: 'POST /api/transfer/confirm', status: 400, code: 'tx_expired' });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.expiredConfirm);
            expectEq('pendente no localStorage', await pendingStored(page), null);
            expectEq('aviso de pendente no painel', await page.getByText('transaction is waiting for confirmation').count(), 0);
        });

        await check('7. confirm com 400 tx_failed: a pendente também some', async () => {
            await dev('/dev/fail', { route: 'POST /api/transfer/confirm', status: 400, code: 'tx_failed' });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.txFailed);
            expectEq('pendente no localStorage', await pendingStored(page), null);
        });

        await check('8. forge com erro da carteira: "Wallet said" e o texto novo', async () => {
            await mock({ failNext: 'Something broke inside the wallet' });
            const m = await forge(page);
            expectEq('texto', m.text, TEXT.walletFailed);
            expectEq('links', m.links, []);
            expectMatch('linha da carteira', m.detail, /^Wallet said: Something broke inside the wallet \(after \d+\.\d s\)$/);
        });

        await check('9. Pass on normal: dica dos 30 s com o aviso de Devnet, sucesso e tempo da carteira no console', async () => {
            await mock({ delayMs: 1500 });
            const item = await openPassOn(page, G2);
            await item.getByRole('button', { name: 'Pass on now' }).click();
            await page.getByText(/Approve within about 30 seconds\..*switch it to Devnet/).waitFor({ timeout: 5000 });
            const m = await waitResult(page);
            await mock({ delayMs: 300 });
            expectEq('tipo', m.kind, 'ok');
            expectMatch('texto', m.text, /^Ghost passed on\. It now belongs to /);
            expectEq('linha da carteira', m.detail, null);
            expectMatch('console', lastLog(/wallet: ok/), /^info \[Legacy\] wallet: ok after \d{4,} ms$/);
            expectEq('pendente no localStorage', await pendingStored(page), null);
        });

        await check('10. expiresAt vencido antes de abrir a carteira: pede outro prepare e o Pass on funciona', async () => {
            await dev('/dev/expire-prepare', { times: 1 });
            const m = await passOn(page, G3);
            expectEq('tipo', m.kind, 'ok');
            expectMatch('texto', m.text, /^Ghost passed on\./);
        });

        await check('11. confirm sem resposta da rede (202): a pendente fica guardada', async () => {
            await dev('/dev/pending', { route: 'POST /api/transfer/confirm', times: 6 });
            const m = await passOn(page, G1);
            expectEq('texto', m.text, TEXT.stillPending);
            const p = JSON.parse(await pendingStored(page) || 'null');
            expectEq('pendente guardada', p && p.asset, G1);
        });

        await check('12. recarregar no meio do Pass on: abrir o painel termina a transferência', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await waitFor(() => page.evaluate(() => !!(window.GhostRPG && window.LegacyMode)), 15000, 'painel depois de recarregar');
            const p = JSON.parse(await pendingStored(page) || 'null');
            expectEq('pendente depois de recarregar', p && p.asset, G1);
            await openPanel(page);
            await page.getByText(/^Ghost passed on\./).waitFor({ timeout: 20000 });
            expectEq('pendente no localStorage', await pendingStored(page), null);
            expectEq('ghosts na carteira A', await ownedAssets(wallet), []);
        });
        expectEq('erros na página (legacy=1)', errors, []);
        await page.close();

        await check('13. sem ?legacy=1 nada do painel aparece', async () => {
            const p2 = await (await browser.newContext()).newPage();
            const errs = [];
            p2.on('pageerror', (e) => errs.push(String(e)));
            await p2.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
            await waitFor(() => p2.evaluate(() => !!window.GhostRPG), 15000, 'jogo carregado');
            await sleep(1000);
            expectEq('window.LegacyMode', await p2.evaluate(() => typeof window.LegacyMode), 'undefined');
            expectEq('botão LEGACY', await p2.locator('#ggLegacyToggle').count(), 0);
            expectEq('carteira carregada', await p2.evaluate(() => typeof window.GGWallet), 'undefined');
            expectEq('erros na página', errs, []);
            await p2.close();
        });
    } finally {
        if (browser) await browser.close();
        legacy.kill();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
