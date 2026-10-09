// Baú da conta e painel Legacy (?legacy=1): enquanto um ghost legado está carregado, o baú da conta
// fica fechado (abrir, guardar, transferir, descartar), inclusive chamado pelo console; ao voltar ao
// próprio ghost, o baú volta ao normal. O forge mostra o aviso de consentimento antes da carteira.
// Sem ?legacy=1, o baú funciona como antes. Sem banco, sem Phantom, sem serviço real:
//   - site estático na 8080 (esta pasta);
//   - serviço Legacy falso na 8090 (tools/legacy-fake-server.js) + carteira de teste (?mockwallet=1);
//   - servidor de jogo FALSO na 3000 (só session_login e save_game_state).
//
// Uso (na pasta "danger ghost", com as portas 3000, 8080 e 8090 livres). Precisa de internet: o
// index.html carrega o cliente socket.io de cdn.socket.io.
//   node tests/legacy-chest.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Server } = require('socket.io');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';
const EMAIL = 'teste@local.invalid';

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

const CHEST_ITEM = { id: 'elixir', name: 'Elixir', icon: '🧪', description: 'Item de teste do baú.', count: 2 };
const serverAccount = () => ({
    email: EMAIL, name: 'Tester', level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 1, 2, 3],
    chestItems: [Object.assign({}, CHEST_ITEM)],
    characters: [
        { characterId: '001', name: 'MeuGhost', level: 9, xp: 50, vit: 20, agi: 10, int: 10, pow: 10, mag: 8, pointsToDistribute: 18, updatedAt: '2026-10-07T20:00:00Z' },
    ],
});
const gameServer = { chestSaves: 0, charSaves: 0 };
function startGameServer() {
    const srv = http.createServer();
    const io = new Server(srv, { cors: { origin: SITE } });
    io.on('connection', (s) => {
        s.on('session_login', () => {
            s.emit('session_login_success', { email: EMAIL, playerData: serverAccount(), token: 'fake-test-token' });
        });
        s.on('save_game_state', (data) => {
            if (data && Array.isArray(data.chestItems)) gameServer.chestSaves++;
            if (data && Array.isArray(data.characters)) gameServer.charSaves++;
        });
    });
    return new Promise((ok) => srv.listen(3000, () => ok({ srv, io })));
}

function startLegacyFake() {
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'legacy-fake-server.js')], { stdio: ['ignore', 'pipe', 'inherit'] });
    return new Promise((ok, fail) => {
        child.stdout.on('data', (d) => { if (/localhost:8090/.test(String(d))) ok(child); });
        child.on('exit', (c) => fail(new Error('legacy-fake-server saiu com código ' + c)));
    });
}

// ---------- utilidades ----------
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

async function login(page) {
    await waitFor(() => page.evaluate(() => !!(window.NetworkState && window.NetworkState.socket && window.NetworkState.socket.connected)), 15000, 'socket do jogo conectado');
    await page.evaluate((acc) => window.completeCloudLogin(acc.email, acc.name, acc, 'fake-test-token'), serverAccount());
    await sleep(1500);
}
async function openPanel(page) {
    if (await page.locator('#ggLegacyPanel').isVisible()) return;
    await page.locator('#ggLegacyToggle').click();
}

// Estado do baú e do inventário ativo, sem mudar nada.
const readChest = (page) => page.evaluate(() => {
    var ov = document.getElementById('chestModalOverlay');
    var note = document.getElementById('chestLegacyNotice');
    var inv = (window.GhostRPG.getStats().inventory || []).map(function (i) { return i.id + 'x' + (i.count || 1); }).sort();
    return {
        chest: (window.g_chestItems || []).map(function (i) { return i.id + 'x' + (i.count || 1); }),
        inventory: inv,
        modalOpen: !!(ov && ov.style.display !== 'none'),
        notice: note && note.style.display !== 'none' ? note.textContent : null,
        locked: window.OverworldDebug && window.OverworldDebug.getInputLocked ? window.OverworldDebug.getInputLocked() : null,
    };
});
const closeChest = (page) => page.evaluate(() => { if (window.CloseChestModal) window.CloseChestModal(); var n = document.getElementById('chestLegacyNotice'); if (n) n.style.display = 'none'; });

// ---------- roteiro ----------
async function main() {
    const stat = await startStatic();
    const game = await startGameServer();
    const legacy = await startLegacyFake();
    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        // ===== Com ?legacy=1 =====
        const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
        page.on('dialog', (d) => d.accept().catch(() => {}));
        const consoleErrors = [];
        page.on('pageerror', (e) => consoleErrors.push(String(e)));
        await page.goto(SITE + '/?legacy=1&mockwallet=1', { waitUntil: 'domcontentloaded' });
        await waitFor(() => page.evaluate(() => !!(window.GhostRPG && window.LegacyMode)), 15000, 'jogo e painel carregados');
        await login(page);
        // O jogo lê o baú do perfil no boot e ao abrir o baú; aqui o login veio depois do boot.
        await page.evaluate(() => window.LoadChestItemsFromCloudProfile());
        await page.evaluate(() => window.SelectCharacterToPlay('001'));
        await sleep(500);
        // O personagem do jogador tem um item próprio (vai junto para o ghost legado no forge).
        await page.evaluate(() => window.GhostRPG.addItem({ id: 'deso_coin', name: 'Coin', icon: '🪙', description: 'teste', count: 3 }));

        await openPanel(page);
        await page.getByRole('button', { name: 'Connect Ghost Test Wallet A' }).click();
        await page.getByRole('button', { name: 'Sign in (free)' }).click();
        await page.getByRole('button', { name: 'Forge on Solana' }).click();
        await check('1. forge mostra o aviso de consentimento (nível, itens e nome) antes da carteira', async () => {
            await page.getByText('This forges a Legacy ghost on Solana devnet. In this demo it is always species #001 Ftasma. It takes the level, items and name of your active character. Your original character stays in your account for now. Whoever owns the ghost can play it.').waitFor({ timeout: 3000 });
            await page.getByText('Character: MeuGhost · level 9').waitFor({ timeout: 3000 });
            expectEq('botão de confirmar', await page.getByRole('button', { name: 'I agree, forge now' }).count(), 1);
        });
        await page.getByRole('button', { name: /forge now/i }).click();
        await page.getByText('Ghost forged on Solana devnet!').waitFor({ timeout: 15000 });

        await page.getByRole('button', { name: 'Play', exact: true }).first().click();
        await waitFor(() => page.evaluate(() => window.LegacyMode.active), 10000, 'Play no ghost legado');
        await page.locator('#ggLegacyPanel .gg-legacy-close').click().catch(() => {});
        const start = await readChest(page);
        console.log('modo legado: baú ' + JSON.stringify(start.chest) + ', inventário ' + JSON.stringify(start.inventory));
        if (!start.chest.length || !start.inventory.length) throw new Error('preparo do teste: baú ou inventário vazio');

        await check('2. abrir o baú com ghost legado: não abre, mostra a mensagem, movimento livre', async () => {
            await page.evaluate(() => window.OpenChestModal());
            const s = await readChest(page);
            expectEq('baú aberto', s.modalOpen, false);
            if (!s.notice || s.notice.indexOf('Account chest is disabled while playing a Legacy ghost') !== 0) throw new Error('mensagem: ' + JSON.stringify(s.notice));
            expectEq('overworld travado', s.locked, false);
            await closeChest(page);
        });

        await check('3. console: TransferChestItemToGhost para ghost_001 é recusado e nada muda', async () => {
            const before = gameServer.chestSaves + gameServer.charSaves;
            const r = await page.evaluate(() => window.TransferChestItemToGhost(window.g_chestItems[0], 'ghost_001'));
            expectEq('retorno', r, false);
            const s = await readChest(page);
            expectEq('baú', s.chest, start.chest);
            expectEq('inventário', s.inventory, start.inventory);
            await sleep(500);
            expectEq('save_game_state emitidos', gameServer.chestSaves + gameServer.charSaves, before);
            await closeChest(page);
        });

        await check('4. console: guardar, descartar e transferir pelo baú são recusados e nada muda', async () => {
            const before = gameServer.chestSaves;
            await page.evaluate(() => {
                var inv = window.GhostRPG.getStats().inventory || [];
                window.StoreActiveGhostItemInChest(inv[0].id);
                window.DiscardChestItem(0);
            });
            const s = await readChest(page);
            expectEq('baú', s.chest, start.chest);
            expectEq('inventário', s.inventory, start.inventory);
            await sleep(500);
            expectEq('save_game_state { chestItems } emitidos', gameServer.chestSaves, before);
            await closeChest(page);
        });

        await check('5. Back to my ghost: o baú abre normal, com os mesmos itens', async () => {
            await openPanel(page);
            await page.getByRole('button', { name: 'Back to my ghost' }).click();
            await waitFor(() => page.evaluate(() => !window.LegacyMode.active), 15000, 'voltar ao próprio ghost');
            await page.evaluate(() => window.OpenChestModal());
            const s = await readChest(page);
            expectEq('baú aberto', s.modalOpen, true);
            expectEq('mensagem', s.notice, null);
            expectEq('baú', s.chest, start.chest);
            expectEq('personagem ativo', await page.evaluate(() => window.GhostRPG.getStats().characterId), '001');
            await closeChest(page);
        });
        expectEq('erros na página (legacy=1)', consoleErrors, []);
        await page.close();

        // ===== Sem ?legacy=1: o baú funciona como antes =====
        await check('6. sem ?legacy=1: guardar e transferir funcionam como antes', async () => {
            const p2 = await (await browser.newContext()).newPage();
            p2.on('dialog', (d) => d.accept().catch(() => {}));
            const errs = [];
            p2.on('pageerror', (e) => errs.push(String(e)));
            await p2.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
            await waitFor(() => p2.evaluate(() => !!window.GhostRPG), 15000, 'jogo carregado');
            expectEq('window.LegacyMode', await p2.evaluate(() => typeof window.LegacyMode), 'undefined');
            expectEq('botão LEGACY', await p2.locator('#ggLegacyToggle').count(), 0);
            await login(p2);
            await p2.evaluate(() => window.SelectCharacterToPlay('001'));
            await sleep(500);
            await p2.evaluate(() => window.GhostRPG.addItem({ id: 'deso_coin', name: 'Coin', icon: '🪙', description: 'teste', count: 3 }));
            await p2.evaluate(() => window.OpenChestModal());
            let s = await readChest(p2);
            expectEq('baú aberto', s.modalOpen, true);
            expectEq('mensagem', s.notice, null);
            const before = gameServer.chestSaves;
            await p2.evaluate(() => window.StoreActiveGhostItemInChest('deso_coin'));
            s = await readChest(p2);
            expectEq('baú depois de guardar', s.chest, ['elixirx2', 'deso_coinx3']);
            if (s.inventory.indexOf('deso_coinx3') !== -1) throw new Error('o item continuou no inventário');
            const r = await p2.evaluate(() => window.TransferChestItemToGhost(window.g_chestItems[1], 'ghost_001'));
            expectEq('retorno da transferência', r, true);
            s = await readChest(p2);
            expectEq('baú depois de transferir', s.chest, ['elixirx2']);
            if (s.inventory.indexOf('deso_coinx3') === -1) throw new Error('o item não voltou ao inventário');
            await sleep(500);
            if (gameServer.chestSaves < before + 2) throw new Error('o baú não foi salvo no servidor do jogo');
            await p2.evaluate(() => window.CloseChestModal());
            expectEq('erros na página (sem flag)', errs, []);
            await p2.close();
        });
    } finally {
        if (browser) await browser.close();
        legacy.kill();
        game.io.close();
        stat.close();
    }
    const failed = results.filter((r) => !r[0]).length;
    console.log('\n' + (results.length - failed) + ' passaram, ' + failed + ' falharam');
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
