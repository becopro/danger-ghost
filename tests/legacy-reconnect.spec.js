// Teste do painel Legacy (?legacy=1): o ghost legado não pode ser trocado pelo personagem próprio
// quando o socket do jogo reconecta e o login é refeito sozinho (TryAutoLoginFromSession ->
// completeCloudLogin). Sem banco, sem Phantom, sem serviço real:
//   - site estático na 8080 (esta pasta);
//   - serviço Legacy falso na 8090 (tools/legacy-fake-server.js) + carteira de teste (?mockwallet=1);
//   - servidor de jogo FALSO na 3000: só responde session_login, com ping curto (1 s + 1 s) para a
//     reconexão acontecer em poucos segundos de página travada (em produção: 15 s + 8 s).
// A página "trava" como em produção: alert() real segurado aberto, ou um laço ocupado.
//
// Uso (na pasta "danger ghost", com as portas 3000, 8080 e 8090 livres: desligue antes o
// servidor do jogo, a pré-visualização e qualquer legacy-fake-server já aberto). Precisa de
// internet: o index.html carrega o cliente socket.io de cdn.socket.io.
//   node tests/legacy-reconnect.spec.js
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Server } = require('socket.io');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SITE = 'http://localhost:8080';
const LEGACY = 'http://localhost:8090';
const EMAIL = 'teste@local.invalid';
const FREEZE_MS = 3500; // > pingInterval + pingTimeout do servidor falso

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

// "Banco" do servidor falso: o que o login devolve. O personagem mais recente da conta é um
// nível 1, como na conta de teste de produção.
const serverAccount = {
    email: EMAIL, name: 'Tester', level: 1, xp: 0, mana: 100, maxMana: 100, lives: 3, equippedSkills: [0, 1, 2, 3],
    characters: [
        { characterId: '001', name: 'MeuGhost', level: 9, xp: 50, vit: 20, agi: 10, int: 10, pow: 10, mag: 8, pointsToDistribute: 18, updatedAt: '2026-10-07T20:00:00Z' },
        { characterId: 'dg_local_test1', name: 'Ghost', level: 1, xp: 0, vit: 1, agi: 1, int: 1, pow: 1, mag: 1, pointsToDistribute: 0, updatedAt: '2026-10-07T23:00:00Z' },
    ],
};
const gameServer = { logins: 0 };
function startGameServer() {
    const srv = http.createServer();
    const io = new Server(srv, { pingInterval: 1000, pingTimeout: 1000, cors: { origin: SITE } });
    io.on('connection', (s) => {
        s.on('session_login', () => {
            gameServer.logins++;
            s.emit('session_login_success', { email: EMAIL, playerData: JSON.parse(JSON.stringify(serverAccount)), token: 'fake-test-token' });
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
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function randomAddr() {
    let n = BigInt('0x' + crypto.randomBytes(32).toString('hex')), out = '';
    while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
    return out;
}

const results = [];
async function check(name, fn) {
    try { await fn(); results.push([true, name]); console.log('PASSOU  ' + name); }
    catch (e) { results.push([false, name]); console.log('FALHOU  ' + name + '\n        ' + e.message); }
}
function expectEq(label, got, want) {
    if (got !== want) throw new Error(label + ': esperado ' + JSON.stringify(want) + ', veio ' + JSON.stringify(got));
}

// Estado do personagem na página, sem passar por getStats() (que tem efeito colateral).
const readGame = (page) => page.evaluate(() => ({
    legacy: !!(window.LegacyMode && window.LegacyMode.active),
    level: window.GhostRPG.getLevel(),
    ghost: window.g_currentPlayerGhost,
}));

// Espera uma reconexão + relogin completos (o LoadRPGStateFromDeSo roda 400 ms depois).
async function waitRelogin(before) {
    await waitFor(() => gameServer.logins > before, 15000, 'relogin automático depois da reconexão');
    await sleep(1500);
}

async function login(page) {
    await waitFor(() => page.evaluate(() => !!(window.NetworkState && window.NetworkState.socket && window.NetworkState.socket.connected)), 15000, 'socket do jogo conectado');
    await page.evaluate((acc) => window.completeCloudLogin(acc.email, acc.name, acc, 'fake-test-token'), serverAccount);
    await sleep(1500);
}

async function openPanel(page) {
    if (await page.locator('#ggLegacyPanel').isVisible()) return;
    await page.locator('#ggLegacyToggle').click();
}

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
        let holdDialog = 0;
        page.on('dialog', async (d) => { if (holdDialog) await sleep(holdDialog); await d.accept().catch(() => {}); });
        await page.goto(SITE + '/?legacy=1&mockwallet=1', { waitUntil: 'domcontentloaded' });
        await waitFor(() => page.evaluate(() => !!(window.GhostRPG && window.LegacyMode)), 15000, 'jogo e painel carregados');
        await login(page);

        await openPanel(page);
        await page.getByRole('button', { name: 'Connect Ghost Test Wallet A' }).click();
        await page.getByRole('button', { name: 'Sign in (free)' }).click();
        await page.getByRole('button', { name: 'Forge on Solana' }).click();
        await page.getByRole('button', { name: 'Forge now' }).click();
        await page.getByText('Ghost forged on Solana devnet!').waitFor({ timeout: 15000 });
        await page.getByRole('button', { name: 'Play', exact: true }).first().click();
        await waitFor(() => page.evaluate(() => window.LegacyMode.active), 10000, 'Play no ghost legado');

        // Joga: sobe de nível com o ghost legado.
        await page.evaluate(() => window.EnterEpisode1FromOverworld && window.EnterEpisode1FromOverworld());
        await page.evaluate(() => window.GhostRPG.addXp(3000));
        const start = await readGame(page);
        const L = start.level;
        console.log('ghost legado em jogo: nível ' + L + ', espécie ' + start.ghost);

        const stillLegacy = async (label) => {
            const g = await readGame(page);
            expectEq(label + ' / modo Legacy ativo', g.legacy, true);
            expectEq(label + ' / nível', g.level, L);
            expectEq(label + ' / ghost ativo', g.ghost, '001');
        };

        await check('1. SAVE GAME com o aviso de SUCCESS aberto (página travada) mantém o ghost legado', async () => {
            const before = gameServer.logins;
            holdDialog = FREEZE_MS;
            await page.evaluate(() => { window.TriggerRPGSaveToDeSo(); });
            await waitRelogin(before);
            holdDialog = 0;
            await stillLegacy('depois do SAVE');
        });

        await check('2. sair da tela cheia com a página travada mantém o ghost legado', async () => {
            const before = gameServer.logins;
            await page.evaluate((ms) => {
                document.dispatchEvent(new Event('fullscreenchange'));
                var end = Date.now() + ms; while (Date.now() < end) {}
            }, FREEZE_MS);
            await waitRelogin(before);
            await stillLegacy('depois de sair da tela cheia');
        });

        // Em produção era preciso clicar em "Play" de novo para voltar ao ghost. Com o ghost em jogo o
        // painel nem mostra "Play" (mostra "playing now"); o Play depois de sair é o cenário 4.
        await check('3. depois das travadas o painel ainda mostra o ghost em jogo (sem precisar de Play de novo)', async () => {
            await openPanel(page);
            await page.getByText('playing now').waitFor({ timeout: 3000 });
            expectEq('botões Play visíveis para o ghost em jogo', await page.getByRole('button', { name: 'Play', exact: true }).count(), 0);
            await stillLegacy('no painel');
        });

        await check('4. o save do serviço Legacy guardou o nível certo (Back to my ghost + Play)', async () => {
            await openPanel(page);
            await page.getByRole('button', { name: 'Back to my ghost' }).click();
            await waitFor(() => page.evaluate(() => !window.LegacyMode.active), 15000, 'voltar ao próprio ghost');
            await openPanel(page);
            await page.getByRole('button', { name: 'Play', exact: true }).first().click();
            await waitFor(() => page.evaluate(() => window.LegacyMode.active), 10000, 'Play de novo');
            await stillLegacy('depois de recarregar do serviço');
        });

        await check('5. iniciar o Pass on com a página travada mantém o ghost legado', async () => {
            // A confirmação na "rede" fica pendente: o Pass on está em andamento durante o teste.
            await fetch(LEGACY + '/dev/pending', { method: 'POST', headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ route: 'POST /api/transfer/confirm', times: 100 }) });
            await openPanel(page);
            await page.getByRole('button', { name: 'Pass on', exact: true }).first().click();
            await page.getByLabel('Destination wallet address').fill(randomAddr());
            await page.getByRole('button', { name: 'Check', exact: true }).click();
            const before = gameServer.logins;
            await page.getByRole('button', { name: 'Pass on now' }).click();
            await page.getByText('Waiting for Solana devnet to confirm the transfer').waitFor({ timeout: 15000 });
            await page.evaluate((ms) => { var end = Date.now() + ms; while (Date.now() < end) {} }, FREEZE_MS);
            await waitRelogin(before);
            await stillLegacy('durante o Pass on');
        });
        await check('6. login de OUTRA conta com o ghost legado em jogo continua saindo do modo Legacy', async () => {
            await page.evaluate((acc) => window.completeCloudLogin('outra@local.invalid', 'Outra',
                Object.assign({}, acc, { email: 'outra@local.invalid' }), 'fake-test-token-2'), serverAccount);
            await sleep(1500);
            const g = await readGame(page);
            expectEq('modo Legacy ativo', g.legacy, false);
            expectEq('ghost ativo (o mais recente da outra conta)', g.ghost, 'dg_local_test1');
        });
        await page.close();

        // ===== Controle: sem ?legacy=1 o comportamento é o de hoje =====
        // ATENÇÃO: isto confere o comportamento ATUAL do jogo normal, que ainda tem o bug do item 2
        // (o relogin troca o personagem pela cópia do servidor). Quando o item 2 for consertado,
        // este cenário tem que mudar junto: aqui ele só prova que este conserto não mexeu no jogo
        // normal.
        await check('7. controle sem ?legacy=1: o relogin continua carregando o personagem do servidor (igual a antes)', async () => {
            const p2 = await (await browser.newContext()).newPage();
            p2.on('dialog', (d) => d.accept().catch(() => {}));
            await p2.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
            await waitFor(() => p2.evaluate(() => !!window.GhostRPG), 15000, 'jogo carregado');
            expectEq('window.LegacyMode', await p2.evaluate(() => typeof window.LegacyMode), 'undefined');
            await login(p2);
            await p2.evaluate(() => window.SelectCharacterToPlay('001'));
            await sleep(500);
            const before = gameServer.logins;
            await p2.evaluate((ms) => { var end = Date.now() + ms; while (Date.now() < end) {} }, FREEZE_MS);
            await waitRelogin(before);
            const g = await readGame(p2);
            expectEq('personagem ativo depois do relogin (o mais recente do servidor)', g.ghost, 'dg_local_test1');
            expectEq('nível', g.level, 1);
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
