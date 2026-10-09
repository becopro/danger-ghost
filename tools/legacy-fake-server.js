// SÓ PARA DESENVOLVIMENTO. Serviço Legacy FALSO, para construir e testar o painel Legacy
// (js/legacy/legacy.js) sem o serviço real. Segue docs/API_CONTRACT.md do ghostgames-onchain.
// Não fala com a Solana: "a rede" aqui é um mapa em memória. Transações são bytes falsos, então
// forge/transfer só funcionam com a carteira de teste (tools/legacy-mock-wallet.js).
// O login confere a assinatura ed25519 de verdade (funciona com Phantom também).
//
// Uso (na pasta "danger ghost"):   node tools/legacy-fake-server.js
// Escuta só em 127.0.0.1:8090. Aceita a origem http://localhost:8080 (o jogo local).
//
// Rotas extras de teste (/dev/...):
//   POST /dev/fail   { route, status, code, times, extra }  força erro nas próximas `times` chamadas
//                    route = "METHOD /api/..." com ":asset" no lugar do endereço (ex.: "PUT /api/save/:asset")
//   POST /dev/pending { route, times }          responde 202 nas próximas `times` chamadas
//   POST /dev/chain-owner { asset, owner }      muda o dono "na rede" sem passar pelo confirm
//   POST /dev/bump-version { asset }            simula um save feito em outra aba
//   POST /dev/offline { seconds }               responde como serviço fora do ar (fecha a conexão)
//   POST /dev/expire-prepare { times, offsetMs } as próximas `times` respostas do transfer/prepare vêm com
//                    expiresAt = agora + offsetMs (padrão -1000: já vencido). Sem isso: agora + 30 s.
//   Transação vencida no confirm (contrato v1.2):
//                    POST /dev/fail { route: "POST /api/transfer/confirm", status: 400, code: "tx_expired" }
//   POST /dev/reset                             apaga tudo
//   GET  /dev/state                             estado atual (sem tokens)
'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8090);
const ALLOWED_ORIGINS = new Set(['http://localhost:8080', 'http://localhost:' + PORT]);
const NONCE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_SAVE_BYTES = 262144;

// ---------- base58 ----------
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58encode(bytes) {
    let n = BigInt('0x' + (Buffer.from(bytes).toString('hex') || '0'));
    let out = '';
    while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
    for (const b of bytes) { if (b === 0) out = '1' + out; else break; }
    return out;
}
function b58decode(str) {
    if (typeof str !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(str)) return null;
    let n = 0n;
    for (const c of str) n = n * 58n + BigInt(B58.indexOf(c));
    let hex = n === 0n ? '' : n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const lead = str.match(/^1*/)[0].length;
    return Buffer.concat([Buffer.alloc(lead), Buffer.from(hex, 'hex')]);
}
const isAddr = (s) => { const b = b58decode(s); return !!b && b.length === 32; };
const isSig = (s) => { const b = b58decode(s); return !!b && b.length === 64; };
const randomAddr = () => b58encode(crypto.randomBytes(32));

// ---------- estado em memória ----------
let nonces, sessions, ghosts, failures, pendings, offlineUntil, expirePrepares, blockHeight;
function reset() {
    nonces = new Map();   // nonce -> { wallet, origin, message, expires, used }
    sessions = new Map(); // token -> { wallet, expires }
    ghosts = new Map();   // asset -> { asset, chainOwner, owner, registered, generation, save_version, save_data, save_hash, updated_at, pendingTo, forgeSig }
    failures = [];        // { route, status, code, times, extra }
    pendings = [];        // { route, times }
    offlineUntil = 0;
    expirePrepares = [];  // { times, offsetMs }
    blockHeight = 496000000;
}
reset();

// ---------- utilidades HTTP ----------
function send(res, status, body, extraHeaders) {
    res.writeHead(status, Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, extraHeaders || {}));
    res.end(JSON.stringify(body));
}
const err = (res, status, code, message, extra) => send(res, status, Object.assign({ error: message || code, code }, extra || {}));

function readJson(req) {
    return new Promise((resolve) => {
        let size = 0;
        const chunks = [];
        req.on('data', (c) => { size += c.length; if (size <= 1024 * 1024) chunks.push(c); });
        req.on('end', () => {
            if (size > 1024 * 1024) return resolve({ tooLarge: true });
            try { resolve({ body: JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null') }); }
            catch (e) { resolve({ bad: true }); }
        });
    });
}
const exactKeys = (obj, keys) => obj && typeof obj === 'object' && !Array.isArray(obj) &&
    Object.keys(obj).length === keys.length && keys.every((k) => k in obj);

function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonical(v[k])).join(',') + '}';
    return JSON.stringify(v);
}

function sessionOf(req) {
    const m = /^Bearer ([0-9a-f]{64})$/.exec(req.headers.authorization || '');
    const s = m && sessions.get(m[1]);
    if (!s || s.expires < Date.now()) return null;
    return s;
}

function takeInjected(list, route) {
    const i = list.findIndex((f) => f.route === route && f.times > 0);
    if (i < 0) return null;
    list[i].times -= 1;
    return list[i];
}

function validSave(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
    const depth = (v, n) => n > 32 ? Infinity : (v && typeof v === 'object' ? 1 + Math.max(0, ...Object.values(v).map((x) => depth(x, n + 1))) : 0);
    if (depth(d, 0) > 32) return false;
    if (!Number.isInteger(d.level) || d.level < 1) return false;
    if (typeof d.xp !== 'number' || d.xp < 0) return false;
    for (const k of ['xpRequired', 'pointsToDistribute', 'vit', 'agi', 'int', 'pow', 'mag']) {
        if (k in d && (typeof d[k] !== 'number' || d[k] < 0)) return false;
    }
    if ('characterId' in d && !(typeof d.characterId === 'number' || (typeof d.characterId === 'string' && d.characterId.length <= 64))) return false;
    for (const k of ['inventory', 'equippedSkills', 'equippedRunes', 'equippedPassives']) {
        if (k in d && !Array.isArray(d[k])) return false;
    }
    for (const k of ['equipment', 'weapon']) {
        if (k in d && d[k] !== null && (typeof d[k] !== 'object' || Array.isArray(d[k]))) return false;
    }
    if ('imageUrl' in d) return false;
    return true;
}

// ---------- servidor ----------
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const origin = req.headers.origin;

    if (Date.now() < offlineUntil && !url.pathname.startsWith('/dev/')) { req.socket.destroy(); return; }

    // CORS
    if (origin !== undefined) {
        if (!ALLOWED_ORIGINS.has(origin)) return err(res, 403, 'forbidden_origin', 'Origem não permitida.');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT', 'Access-Control-Allow-Headers': 'content-type, authorization', 'Access-Control-Max-Age': '600' });
        return res.end();
    }

    // ---- rotas de teste ----
    if (url.pathname.startsWith('/dev/')) {
        if (req.method === 'GET' && url.pathname === '/dev/state') {
            return send(res, 200, { ghosts: [...ghosts.values()], failures, pendings, sessions: sessions.size });
        }
        const { body } = await readJson(req);
        const b = body || {};
        switch (url.pathname) {
            case '/dev/fail': failures.push({ route: b.route, status: b.status, code: b.code, times: b.times || 1, extra: b.extra }); return send(res, 200, { ok: true });
            case '/dev/pending': pendings.push({ route: b.route, times: b.times || 1 }); return send(res, 200, { ok: true });
            case '/dev/chain-owner': { const g = ghosts.get(b.asset); if (!g) return err(res, 404, 'not_found'); g.chainOwner = b.owner; return send(res, 200, { ok: true }); }
            case '/dev/bump-version': { const g = ghosts.get(b.asset); if (!g) return err(res, 404, 'not_found'); g.save_version += 1; return send(res, 200, { ok: true, save_version: g.save_version }); }
            case '/dev/expire-prepare': expirePrepares.push({ times: b.times || 1, offsetMs: Number.isFinite(b.offsetMs) ? b.offsetMs : -1000 }); return send(res, 200, { ok: true });
            case '/dev/offline': offlineUntil = Date.now() + (b.seconds || 10) * 1000; return send(res, 200, { ok: true });
            case '/dev/reset': reset(); return send(res, 200, { ok: true });
            default: return err(res, 404, 'not_found');
        }
    }

    // ---- rotas do contrato ----
    const assetMatch = /^\/api\/(save|ghost)\/([^/]+)$/.exec(url.pathname);
    const routeKey = req.method + ' ' + (assetMatch ? '/api/' + assetMatch[1] + '/:asset' : url.pathname);

    const injected = takeInjected(failures, routeKey);
    if (injected) {
        const headers = injected.status === 429 ? { 'Retry-After': '5' } : {};
        return send(res, injected.status, Object.assign({ error: 'Erro de teste.', code: injected.code }, injected.extra || {}), headers);
    }

    const PROTECTED = ['POST /api/forge', 'POST /api/forge/confirm', 'GET /api/ghosts', 'GET /api/save/:asset', 'PUT /api/save/:asset', 'POST /api/transfer/prepare', 'POST /api/transfer/confirm'];
    let session = null;
    if (PROTECTED.includes(routeKey)) {
        session = sessionOf(req);
        if (!session) return err(res, 401, 'auth_required', 'Faça login de novo.');
    }

    if (takeInjected(pendings, routeKey)) {
        return send(res, 202, { status: 'pending', message: 'A rede ainda não confirmou.' });
    }

    let body;
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!/^application\/json/i.test(req.headers['content-type'] || '')) return err(res, 415, 'json_required');
        const r = await readJson(req);
        if (r.tooLarge) return err(res, 413, 'too_large');
        if (r.bad) return err(res, 400, 'bad_request');
        body = r.body;
    }

    switch (routeKey) {
        case 'GET /api/health':
            return send(res, 200, { status: 'ok' });

        case 'POST /api/auth/nonce': {
            if (!origin) return err(res, 400, 'origin_required');
            if (!exactKeys(body, ['wallet']) || !isAddr(body.wallet)) return err(res, 400, 'bad_request');
            const nonce = crypto.randomBytes(16).toString('hex');
            const now = new Date();
            const exp = new Date(now.getTime() + NONCE_TTL_MS);
            const host = new URL(origin).host;
            const message = host + ' wants you to sign in with your Solana account:\n' + body.wallet + '\n\n' +
                'Sign in to Ghost Games Legacy (devnet). Free: this does not approve any transaction.\n\n' +
                'URI: ' + origin + '\nVersion: 1\nChain ID: devnet\nNonce: ' + nonce +
                '\nIssued At: ' + now.toISOString() + '\nExpiration Time: ' + exp.toISOString();
            nonces.set(nonce, { wallet: body.wallet, origin, message, expires: exp.getTime(), used: false });
            return send(res, 200, { nonce, message, expires_at: exp.toISOString() });
        }

        case 'POST /api/auth/verify': {
            if (!origin) return err(res, 400, 'origin_required');
            if (!exactKeys(body, ['wallet', 'nonce', 'signature']) || !isAddr(body.wallet) || typeof body.nonce !== 'string' || !isSig(body.signature)) return err(res, 400, 'bad_request');
            const n = nonces.get(body.nonce);
            const fail = () => err(res, 401, 'login_failed', 'Login recusado.');
            if (!n || n.used || n.expires < Date.now() || n.wallet !== body.wallet || n.origin !== origin) return fail();
            n.used = true;
            let ok = false;
            try {
                const key = crypto.createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: b58decode(body.wallet).toString('base64url') }, format: 'jwk' });
                ok = crypto.verify(null, Buffer.from(n.message, 'utf8'), key, b58decode(body.signature));
            } catch (e) { ok = false; }
            if (!ok) return fail();
            const token = crypto.randomBytes(32).toString('hex');
            const expires = Date.now() + SESSION_TTL_MS;
            sessions.set(token, { wallet: body.wallet, expires });
            return send(res, 200, { token, wallet: body.wallet, expires_at: new Date(expires).toISOString() });
        }

        case 'POST /api/forge': {
            if (!exactKeys(body, [])) return err(res, 400, 'bad_request');
            const asset = randomAddr();
            ghosts.set(asset, { asset, chainOwner: session.wallet, owner: null, registered: false, generation: 1, save_version: 0, save_data: null, save_hash: null, updated_at: null, pendingTo: null, forgeSig: null });
            return send(res, 200, {
                transaction: crypto.randomBytes(200).toString('base64'),
                asset,
                attributes: { species: '001', VIT: '5', AGI: '5', INT: '5', POW: '4', MAG: '4', level: '1', episode: '1', generation: '1' },
            });
        }

        case 'POST /api/forge/confirm': {
            if (!exactKeys(body, ['asset', 'signature']) || !isAddr(body.asset) || !isSig(body.signature)) return err(res, 400, 'bad_request');
            const g = ghosts.get(body.asset);
            if (!g) return err(res, 400, 'wrong_transaction');
            if (g.chainOwner !== session.wallet) return err(res, 403, 'not_owner');
            if (g.registered) return send(res, 200, { status: 'already_registered', asset: g.asset, owner: g.owner, generation: g.generation });
            g.registered = true; g.owner = session.wallet; g.forgeSig = body.signature;
            return send(res, 200, { status: 'registered', asset: g.asset, owner: g.owner, generation: g.generation });
        }

        case 'GET /api/ghosts': {
            const list = [...ghosts.values()]
                .filter((g) => g.registered && g.owner === session.wallet && g.chainOwner === session.wallet)
                .map((g) => ({ asset: g.asset, species: '001', generation: g.generation, level: g.save_data ? g.save_data.level : null, save_version: g.save_version }));
            return send(res, 200, { wallet: session.wallet, ghosts: list });
        }

        case 'GET /api/save/:asset':
        case 'PUT /api/save/:asset': {
            const asset = assetMatch[2];
            if (!isAddr(asset)) return err(res, 400, 'bad_request');
            const g = ghosts.get(asset);
            if (!g || !g.registered || g.chainOwner !== session.wallet) return err(res, 403, 'not_owner', 'Você não é o dono deste ghost.');
            if (g.owner !== session.wallet) return err(res, 409, 'owner_sync_pending', 'Transferência ainda não registrada.');
            if (req.method === 'GET') {
                return send(res, 200, { asset, generation: g.generation, save_version: g.save_version, save_data: g.save_data, save_hash: g.save_hash, updated_at: g.updated_at, ghost: { species: '001', seeds: { VIT: 5, AGI: 5, INT: 5, POW: 4, MAG: 4 } } });
            }
            if (!exactKeys(body, ['save_data', 'expected_version']) || !Number.isInteger(body.expected_version) || body.expected_version < 0) return err(res, 400, 'bad_request');
            if (Buffer.byteLength(JSON.stringify(body.save_data)) >= MAX_SAVE_BYTES) return err(res, 413, 'too_large');
            if (!validSave(body.save_data)) return err(res, 422, 'invalid_save');
            if (body.expected_version !== g.save_version) return err(res, 409, 'version_conflict', 'O save mudou.', { current_version: g.save_version });
            g.save_data = body.save_data;
            g.save_version += 1;
            g.save_hash = crypto.createHash('sha256').update(canonical(body.save_data)).digest('hex');
            g.updated_at = new Date().toISOString();
            return send(res, 200, { asset, save_version: g.save_version, save_hash: g.save_hash, generation: g.generation, updated_at: g.updated_at });
        }

        case 'POST /api/transfer/prepare': {
            if (!exactKeys(body, ['asset', 'to']) || !isAddr(body.asset) || !isAddr(body.to)) return err(res, 400, 'bad_request');
            const g = ghosts.get(body.asset);
            if (!g || !g.registered) return err(res, 404, 'not_found');
            if (g.chainOwner !== session.wallet) return err(res, 403, 'not_owner');
            if (body.to === g.chainOwner) return err(res, 400, 'bad_request');
            g.pendingTo = body.to;
            // Contrato v1.2: a transação vence (rede real: ~38 s); expiresAt = prepare + 30 s, com folga.
            const forced = expirePrepares.find((x) => x.times > 0);
            if (forced) forced.times -= 1;
            blockHeight += 1;
            return send(res, 200, {
                transaction: crypto.randomBytes(200).toString('base64'), owner: g.chainOwner, generation: g.generation,
                lastValidBlockHeight: blockHeight + 150, expiresAt: new Date(Date.now() + (forced ? forced.offsetMs : 30000)).toISOString(),
            });
        }

        case 'POST /api/transfer/confirm': {
            if (!exactKeys(body, ['asset', 'signature']) || !isAddr(body.asset) || !isSig(body.signature)) return err(res, 400, 'bad_request');
            const g = ghosts.get(body.asset);
            if (!g || !g.registered) return err(res, 404, 'not_found');
            // A "rede" falsa aplica a transferência quando a assinatura chega (equivale ao envio pela carteira).
            if (g.pendingTo && g.chainOwner === session.wallet) { g.chainOwner = g.pendingTo; g.pendingTo = null; }
            if (g.owner === g.chainOwner) return send(res, 200, { status: 'already_counted', asset: g.asset, owner: g.owner, generation: g.generation, chainSync: 'ok' });
            if (session.wallet !== g.owner && session.wallet !== g.chainOwner) return err(res, 403, 'not_party');
            g.owner = g.chainOwner;
            g.generation += 1;
            return send(res, 200, { status: 'counted', asset: g.asset, owner: g.owner, generation: g.generation, chainSync: 'ok' });
        }

        case 'GET /api/ghost/:asset': {
            const asset = assetMatch[2];
            if (!isAddr(asset)) return err(res, 400, 'bad_request');
            const g = ghosts.get(asset);
            if (!g || !g.registered) return err(res, 404, 'not_found');
            return send(res, 200, { asset, owner: g.chainOwner, generation: g.generation, chainGeneration: String(g.generation), species: '001' });
        }

        default:
            return err(res, 404, 'not_found');
    }
});

server.listen(PORT, '127.0.0.1', () => console.log('[fake-legacy] DEV ONLY on http://localhost:' + PORT));
