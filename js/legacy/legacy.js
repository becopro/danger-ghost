// Painel Legacy: liga o jogo ao serviço Ghost Games Legacy (dono do ghost na Solana devnet,
// save no servidor Legacy). Contrato das rotas: ghostgames-onchain/docs/API_CONTRACT.md.
//
// Só liga com ?legacy=1 na URL (ou LEGACY_ENABLED_FOR_ALL = true). Sem isso, este arquivo termina
// na primeira checagem: não carrega carteira, não cria nada na tela e não define window.LegacyMode.
//
// Modo legado: enquanto um ghost legado está carregado no jogo, rpg_system.js manda os saves
// automáticos para cá (window.LegacyMode.onAutoSave) em vez do save local e do banco do jogo,
// e o botão SAVE chama window.LegacyMode.saveNow (game_core.js). Qualquer troca de personagem
// feita pelo jogo sai do modo legado (window.LegacyMode.exit). O personagem do jogador nunca é
// sobrescrito pelo ghost legado.
(function () {
    'use strict';

    // ---------- configuração ----------
    var LEGACY_ENABLED_FOR_ALL = false; // deploy final: true para mostrar o painel sem ?legacy=1
    var LEGACY_API_DEV = 'http://localhost:8090';
    var LEGACY_API_PROD = 'https://legacy.ghostgames.club';

    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (!LEGACY_ENABLED_FOR_ALL && params.get('legacy') !== '1') return;

    var IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    var LEGACY_API = IS_LOCAL ? LEGACY_API_DEV : LEGACY_API_PROD;
    var USE_MOCK_WALLET = IS_LOCAL && !!params.get('mockwallet');

    var SESSION_KEY = 'gg_legacy_session';  // sessionStorage: { token, wallet, expires_at }
    var PENDING_KEY = 'gg_legacy_pending';  // localStorage: transação enviada esperando confirm (dado público)
    var EXPLORER = 'https://explorer.solana.com';
    var FAUCET = 'https://faucet.solana.com/';
    var FORGE_MIN_LAMPORTS = BigInt(10000000);  // ~0.01 SOL: criar o ativo + taxa
    var TX_MIN_LAMPORTS = BigInt(100000);       // taxa de uma transferência, com folga
    var SAVE_INTERVAL_MS = 5000;                // contrato: no máximo um PUT a cada 5 s
    var POLL_TRIES = 6;
    var POLL_DELAY_MS = 3000;
    var MAX_SAVE_CHARS = 200000;                // abaixo do limite de 256 KB do serviço
    var BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,88}$/;
    var CODE_RE = /^[a-z0-9_]{1,40}$/;

    // ---------- estado ----------
    var S = {
        open: false,
        walletReady: false,
        walletLoadError: false,
        balance: null,          // bigint ou null
        balanceError: false,
        session: loadSession(),
        ghosts: null,           // lista do serviço ou null
        busy: null,             // nome da ação em andamento (uma por vez)
        msg: null,              // { kind: 'info'|'ok'|'error', text, links: [{ href, text }] }
        forgeConfirm: false,
        transfer: null,         // { asset, to, before, error }
        transferResult: null,   // { asset, before, after }
    };
    var play = null;            // ghost legado carregado no jogo
    var applyingSave = false;   // true enquanto o painel aplica um save (ignora o autosave)

    // ---------- utilidades ----------
    function short(addr) { return typeof addr === 'string' && addr.length > 10 ? addr.slice(0, 4) + '…' + addr.slice(-4) : String(addr || ''); }
    function isB58(s) { return typeof s === 'string' && BASE58_RE.test(s); }
    function isAddress(s) { return window.GGWallet ? window.GGWallet.isAddress(s) : isB58(s); }
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function explorerAddress(a) { return isB58(a) ? EXPLORER + '/address/' + a + '?cluster=devnet' : null; }
    function explorerTx(sig) { return isB58(sig) ? EXPLORER + '/tx/' + sig + '?cluster=devnet' : null; }
    function speciesName(species) {
        var entry = typeof window.GetGhostdexEntry === 'function' ? window.GetGhostdexEntry(species) : null;
        return entry && typeof entry.nome === 'string' ? entry.nome : 'Ghost #' + species;
    }
    function timeText(d) { try { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }

    function LegacyError(code, status, data, retryAfter) {
        this.code = CODE_RE.test(code) ? code : 'error';
        this.status = status || 0;
        this.data = data || null;
        this.retryAfter = retryAfter || 0;
    }
    function uiError(text, links) { var e = new LegacyError('ui'); e.text = text; e.links = links; return e; }

    function loadSession() {
        try {
            var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
            if (s && typeof s.token === 'string' && isB58(s.wallet)) return s;
            sessionStorage.removeItem(SESSION_KEY);
        } catch (e) {}
        return null;
    }
    function saveSession(s) {
        S.session = s;
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {}
    }
    function clearSession() {
        S.session = null;
        S.ghosts = null;
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    }
    // A validade do token é decidida pelo serviço (401 auth_required), não pelo relógio do navegador.
    function sessionValid() { return !!S.session; }

    function getPending() {
        try {
            var p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
            if (p && (p.kind === 'forge' || p.kind === 'transfer') && isB58(p.asset) && isB58(p.signature) && isB58(p.wallet)) return p;
        } catch (e) {}
        return null;
    }
    function setPending(p) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch (e) {} }
    function clearPending() { try { localStorage.removeItem(PENDING_KEY); } catch (e) {} }

    // ---------- serviço Legacy ----------
    async function api(method, path, body, needAuth) {
        var headers = {};
        if (body !== undefined) headers['content-type'] = 'application/json';
        if (needAuth) {
            if (!sessionValid()) throw new LegacyError('auth_required', 401);
            headers.authorization = 'Bearer ' + S.session.token;
        }
        var res;
        try {
            res = await fetch(LEGACY_API + path, {
                method: method,
                headers: headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
                credentials: 'omit',
                cache: 'no-store',
            });
        } catch (e) {
            throw new LegacyError('offline');
        }
        var data = null;
        try { data = await res.json(); } catch (e) {}
        if (res.status === 202) return { pending: true, data: data };
        if (!res.ok) {
            var code = data && typeof data.code === 'string' ? data.code : (res.status >= 500 ? 'internal' : 'error');
            var err = new LegacyError(code, res.status, data, parseInt(res.headers.get('Retry-After'), 10) || 0);
            if (err.code === 'auth_required') clearSession();
            throw err;
        }
        return { pending: false, data: data };
    }

    // Repete enquanto o serviço responder 202 ("a rede ainda não confirmou").
    async function untilConfirmed(call) {
        for (var i = 0; i < POLL_TRIES; i++) {
            var r = await call();
            if (!r.pending) return r.data;
            await sleep(POLL_DELAY_MS);
        }
        throw new LegacyError('still_pending');
    }

    // Repete quando a transferência ainda não foi registrada no serviço (409 owner_sync_pending).
    async function withOwnerSync(asset, call) {
        for (var i = 0; ; i++) {
            try { return await call(); } catch (e) {
                if (e.code !== 'owner_sync_pending' || i >= POLL_TRIES - 1) throw e;
                var pending = getPending();
                if (pending && pending.kind === 'transfer' && pending.asset === asset && S.session && pending.wallet === S.session.wallet) {
                    await finishTransfer(pending);
                } else {
                    setMsg('info', 'The ownership change is still syncing. Retrying…');
                    await sleep(POLL_DELAY_MS);
                }
            }
        }
    }

    // ---------- carteira ----------
    function walletState() { return window.GGWallet ? window.GGWallet.getState() : { connected: false }; }

    function isUserRejection(e) {
        return !!e && (e.code === 4001 || /reject|declin|cancel|denied|closed/i.test(String(e.message || '')));
    }
    async function walletCall(fn) {
        try { return await fn(); } catch (e) {
            var err = new LegacyError(isUserRejection(e) ? 'wallet_rejected'
                : /insufficient|lamport|not enough|funds|balance/i.test(String(e && e.message)) ? 'wallet_no_sol'
                : 'wallet_failed');
            err.walletMessage = String((e && e.message) || '').slice(0, 160);
            throw err;
        }
    }

    async function refreshBalance() {
        var st = walletState();
        S.balanceError = false;
        if (!st.connected) { S.balance = null; return; }
        try {
            if (USE_MOCK_WALLET && window.GGMockWallet && /^Ghost Test Wallet/.test(st.walletName)) {
                S.balance = BigInt(Math.max(0, Math.floor(Number(window.GGMockWallet.balanceLamports) || 0)));
            } else {
                S.balance = await window.GGWallet.getBalanceLamports(st.address);
            }
        } catch (e) {
            S.balance = null;
            S.balanceError = true;
        }
    }

    // A carteira não conta ao site em qual rede está. Fora da devnet, a Phantom mostra "Solana",
    // "not enough SOL" e uma opção de confirmar "não seguro": o aviso vem antes da janela abrir.
    var DEVNET_CHECK = 'If your wallet shows mainnet, "not enough SOL" or "unable to simulate", press Cancel and switch it to Devnet (Testnet Mode) first.';

    function needsSolHint() { return S.balance !== null && S.balance === BigInt(0); }

    async function requireWalletWithSol(min, what) {
        var st = walletState();
        if (!st.connected) throw uiError('Connect your wallet first.');
        if (!S.session || S.session.wallet !== st.address) throw uiError('Sign in with this wallet first.');
        await refreshBalance();
        if (S.balance !== null && S.balance < min) {
            throw uiError('Not enough devnet SOL to ' + what + '. Put your wallet in Devnet mode (Testnet Mode) and get free devnet SOL from the faucet.',
                [{ href: FAUCET, text: 'Open the Solana faucet' }]);
        }
    }

    // ---------- mensagens ----------
    var CODE_TEXT = {
        offline: 'The Legacy service is unreachable right now. Your game is fine; try again in a moment.',
        auth_required: 'Your Legacy session ended. Press Sign in, then try again.',
        login_failed: 'Sign-in failed. Please try again.',
        forbidden_origin: 'This page is not allowed to use the Legacy service.',
        origin_required: 'Sign-in must run from the game page.',
        rate_limited: 'Too many requests. Wait a few seconds and try again.',
        not_owner: 'This ghost belongs to another wallet now.',
        not_party: 'This wallet was not part of that transfer.',
        not_found: 'Ghost not found on Solana devnet.',
        version_conflict: 'This ghost was saved somewhere else (another tab or device).',
        owner_sync_pending: 'The ownership change is still syncing. Try again in a minute.',
        owner_changed_again: 'This ghost changed owner again before the transfer was confirmed.',
        tx_failed: 'The transaction failed on Solana devnet. Nothing changed.',
        wrong_transaction: 'That transaction does not match this ghost.',
        wrong_collection: 'This ghost is not from the Ghost Games collection.',
        already_used: 'That transaction was already used for another ghost.',
        ghost_invalid: 'This ghost does not match species #001.',
        invalid_save: 'This save has an unexpected format and was not stored.',
        too_large: 'This save is too large to store.',
        json_required: 'Unexpected request format.',
        bad_request: 'The Legacy service rejected the request (invalid data).',
        internal: 'The Legacy service had an error. Try again later.',
        still_pending: 'Solana devnet is slow to confirm. Your transaction is kept: press "Finish pending transaction" in a moment.',
        bad_response: 'Unexpected answer from the Legacy service.',
        wallet_rejected: 'You cancelled in your wallet. Nothing was sent.',
        wallet_no_sol: 'Not enough devnet SOL to pay the fee. Put your wallet in Devnet mode (Testnet Mode) and get free devnet SOL from the faucet.',
        wallet_failed: 'Your wallet could not finish this. Check that it is in Devnet mode (Testnet Mode) and has some devnet SOL.',
    };
    function describe(e) {
        if (e && e.code === 'ui') return { text: e.text, links: e.links };
        var text = (e && CODE_TEXT[e.code]) || ('Something went wrong (' + ((e && e.code) || 'error') + ').');
        if (e && e.code === 'rate_limited' && e.retryAfter) text = 'Too many requests. Try again in ' + e.retryAfter + ' s.';
        if (e && e.code === 'internal' && e.data && typeof e.data.error === 'string') text += ' (' + e.data.error.slice(0, 120) + ')';
        var links = (e && (e.code === 'wallet_no_sol' || e.code === 'wallet_failed')) ? [{ href: FAUCET, text: 'Open the Solana faucet' }] : undefined;
        return { text: text, links: links };
    }
    function setMsg(kind, text, links) { S.msg = { kind: kind, text: text, links: links || [] }; render(); }
    function showError(e) {
        if (!(e instanceof LegacyError)) { console.error('[Legacy]', e); e = new LegacyError('error'); }
        var d = describe(e);
        setMsg('error', d.text, d.links);
    }

    // ---------- ações (uma por vez; o botão sempre destrava) ----------
    function action(name, fn) {
        return async function () {
            if (S.busy) return;
            S.busy = name;
            render();
            try { await fn.apply(null, arguments); } catch (e) { showError(e); }
            finally { S.busy = null; render(); }
        };
    }

    async function connectWallet(w) {
        setMsg('info', 'Approve the connection in ' + w.name + '…');
        await walletCall(function () { return window.GGWallet.connect(w); });
        var st = walletState();
        if (S.session && S.session.wallet !== st.address) clearSession();
        await refreshBalance();
        S.msg = null;
    }

    async function disconnectWallet() {
        try { await window.GGWallet.disconnect(); } catch (e) {}
        S.balance = null;
        S.msg = null;
    }

    async function signIn() {
        var st = walletState();
        if (!st.connected) throw uiError('Connect your wallet first.');
        var n = (await api('POST', '/api/auth/nonce', { wallet: st.address })).data;
        if (!n || typeof n.nonce !== 'string' || typeof n.message !== 'string') throw new LegacyError('bad_response');
        setMsg('info', 'Check your wallet: sign the message. It is free and approves no transaction.');
        var signature = await walletCall(function () { return window.GGWallet.signMessage(n.message); });
        if (walletState().address !== st.address) throw uiError('Your wallet account changed. Please sign in again.');
        var v = (await api('POST', '/api/auth/verify', { wallet: st.address, nonce: n.nonce, signature: signature })).data;
        if (!v || typeof v.token !== 'string' || v.wallet !== st.address) throw new LegacyError('bad_response');
        saveSession({ token: v.token, wallet: v.wallet, expires_at: v.expires_at });
        setMsg('ok', 'Signed in as ' + short(v.wallet) + '.');
        if (play && play.blocked === 'auth') { play.blocked = null; play.dirty = true; queueSave(play, null); }
        await loadGhosts();
        await resumePending();
    }

    function signOut() { clearSession(); S.transfer = null; S.msg = null; render(); }

    async function loadGhosts() {
        var r = (await api('GET', '/api/ghosts', undefined, true)).data;
        if (!r || !Array.isArray(r.ghosts)) throw new LegacyError('bad_response');
        S.ghosts = r.ghosts.filter(function (g) { return g && isB58(g.asset); }).map(function (g) {
            return {
                asset: g.asset,
                species: /^\d{3}$/.test(g.species) ? g.species : '001',
                generation: Number.isInteger(g.generation) ? g.generation : null,
                level: Number.isFinite(g.level) ? g.level : null,
            };
        });
        render();
    }

    // ----- Forge -----
    // Personagem atual do jogo, ou null se o jogador ainda não tem personagem (aí o primeiro save
    // usa as sementes da espécie, lidas de GET /api/save depois do confirm).
    function currentCharacterSave(species) {
        var hasChar = false;
        try { hasChar = !!(window.GhostRPG && window.GhostRPG.getStats().characterId); } catch (e) {}
        return hasChar ? buildSaveData(species) : null;
    }

    async function forge() {
        S.forgeConfirm = false;
        await requireWalletWithSol(FORGE_MIN_LAMPORTS, 'forge a ghost (about 0.01 SOL)');
        var wallet = S.session.wallet;
        var r = (await api('POST', '/api/forge', {}, true)).data;
        if (!r || !isAddress(r.asset) || typeof r.transaction !== 'string') throw new LegacyError('bad_response');
        var species = r.attributes && /^\d{3}$/.test(r.attributes.species) ? r.attributes.species : '001';
        var saveData = currentCharacterSave(species);
        setMsg('info', 'Approve the transaction in your wallet. You pay a small devnet fee. ' + DEVNET_CHECK);
        var signature = await walletCall(function () { return window.GGWallet.signAndSendBase64Transaction(r.transaction); });
        var pending = { kind: 'forge', asset: r.asset, signature: signature, wallet: wallet, species: species, save: saveData };
        setPending(pending);
        await finishForge(pending);
    }

    async function finishForge(p) {
        setMsg('info', 'Waiting for Solana devnet to confirm…');
        await untilConfirmed(function () { return api('POST', '/api/forge/confirm', { asset: p.asset, signature: p.signature }, true); });
        var links = [
            { href: explorerAddress(p.asset), text: 'View ghost on Solana Explorer' },
            { href: explorerTx(p.signature), text: 'View transaction' },
        ];
        var firstSaveError = null;
        try {
            var firstSave = p.save;
            if (!firstSave) {
                var g = (await api('GET', '/api/save/' + p.asset, undefined, true)).data;
                if (!g || !Number.isInteger(g.save_version)) throw new LegacyError('bad_response');
                firstSave = g.save_version === 0 ? starterSave(g, p.species || '001') : null;
            }
            if (firstSave) {
                await api('PUT', '/api/save/' + p.asset, { save_data: firstSave, expected_version: 0 }, true);
            }
        } catch (e) {
            if (e.code !== 'version_conflict') firstSaveError = e; // version_conflict: o primeiro save já tinha sido feito
        }
        clearPending();
        if (firstSaveError) {
            setMsg('error', 'Ghost forged, but its first save failed: ' + describe(firstSaveError).text + ' You can still play it from your list.', links);
        } else {
            setMsg('ok', 'Ghost forged on Solana devnet! You own it in your wallet.', links);
        }
        await loadGhosts();
    }

    // ----- Pass on -----
    function validateDestination(to) {
        if (!to) return 'Paste the destination wallet address.';
        if (!isAddress(to)) return 'That is not a valid Solana address.';
        if (S.session && to === S.session.wallet) return 'That is your own wallet. Pick another one.';
        return null;
    }

    async function checkTransfer() {
        var t = S.transfer;
        t.to = (t.to || '').trim();
        t.error = validateDestination(t.to);
        t.before = null;
        if (t.error) return;
        var info = (await api('GET', '/api/ghost/' + t.asset)).data;
        if (!info || !isB58(info.owner)) throw new LegacyError('bad_response');
        t.before = { owner: info.owner, generation: info.generation };
    }

    async function sendTransfer() {
        var t = S.transfer;
        t.to = (t.to || '').trim();
        t.error = validateDestination(t.to);
        if (t.error) return;
        await requireWalletWithSol(TX_MIN_LAMPORTS, 'pay the transfer fee');
        if (play && play.asset === t.asset) {
            play.dirty = true;
            await queueSave(play, null);
        }
        var wallet = S.session.wallet;
        var r = (await api('POST', '/api/transfer/prepare', { asset: t.asset, to: t.to }, true)).data;
        if (!r || typeof r.transaction !== 'string') throw new LegacyError('bad_response');
        setMsg('info', 'Approve the transfer in your wallet. You pay a small devnet fee. ' + DEVNET_CHECK);
        var signature = await walletCall(function () { return window.GGWallet.signAndSendBase64Transaction(r.transaction); });
        var pending = { kind: 'transfer', asset: t.asset, signature: signature, wallet: wallet, to: t.to,
            before: { owner: r.owner, generation: r.generation } };
        setPending(pending);
        await finishTransfer(pending);
    }

    async function finishTransfer(p) {
        setMsg('info', 'Waiting for Solana devnet to confirm the transfer…');
        var c = await untilConfirmed(function () { return api('POST', '/api/transfer/confirm', { asset: p.asset, signature: p.signature }, true); });
        clearPending();
        var after = { owner: c && c.owner, generation: c && c.generation };
        S.transfer = null;
        S.transferResult = { asset: p.asset, before: p.before || null, after: after };
        var iSent = S.session && p.wallet === S.session.wallet && after.owner !== p.wallet;
        setMsg('ok', iSent ? 'Ghost passed on. It now belongs to ' + short(after.owner) + '.' : 'Transfer confirmed.',
            [{ href: explorerAddress(p.asset), text: 'View ghost on Solana Explorer' }, { href: explorerTx(p.signature), text: 'View transaction' }]);
        if (iSent && play && play.asset === p.asset) backToMyGhost(true);
        if (sessionValid()) await loadGhosts();
    }

    async function resumePending() {
        var p = getPending();
        if (!p || !S.session || p.wallet !== S.session.wallet) return;
        if (p.kind === 'forge') await finishForge(p); else await finishTransfer(p);
    }

    // ---------- modo legado (ghost legado dentro do jogo) ----------
    // O save usa os atributos puros: getStats() devolve vit/agi/... já somados com o equipamento.
    function buildSaveData(species) {
        var d = JSON.parse(JSON.stringify(window.GhostRPG.getStats()));
        ['vit', 'agi', 'int', 'pow', 'mag'].forEach(function (k) {
            var baseKey = 'base' + k.charAt(0).toUpperCase() + k.slice(1);
            if (typeof d[baseKey] === 'number') d[k] = d[baseKey];
            delete d[baseKey];
        });
        delete d.bonuses;
        delete d.imageUrl;
        d.level = Math.max(1, Math.floor(Number(d.level) || 1));
        d.xp = Math.max(0, Number(d.xp) || 0);
        ['xpRequired', 'pointsToDistribute', 'vit', 'agi', 'int', 'pow', 'mag'].forEach(function (k) {
            if (k in d && !(typeof d[k] === 'number' && isFinite(d[k]) && d[k] >= 0)) delete d[k];
        });
        ['inventory', 'equippedSkills', 'equippedRunes', 'equippedPassives'].forEach(function (k) {
            if (k in d && !Array.isArray(d[k])) delete d[k];
        });
        ['equipment', 'weapon'].forEach(function (k) {
            if (k in d && d[k] !== null && (typeof d[k] !== 'object' || Array.isArray(d[k]))) delete d[k];
        });
        d.characterId = species;
        if (typeof d.name !== 'string' || !d.name) d.name = speciesName(species);
        if (JSON.stringify(d).length > MAX_SAVE_CHARS) throw new LegacyError('too_large');
        return d;
    }

    // O save vem de fora do jogo (depois de uma transferência, quem escreveu foi o dono anterior):
    // copia campo por campo, só com tipos JSON simples, sem chaves especiais e sem caracteres de HTML
    // nos textos, antes de qualquer coisa chegar ao state do jogo ou à interface.
    var BLOCKED_KEYS = { __proto__: true, constructor: true, prototype: true };
    function cleanValue(v, depth) {
        if (depth > 8) return null;
        if (typeof v === 'string') return v.replace(/[<>"'`&\\]/g, '').slice(0, 200);
        if (typeof v === 'number') return isFinite(v) ? v : 0;
        if (typeof v === 'boolean' || v === null) return v;
        if (Array.isArray(v)) return v.slice(0, 500).map(function (x) { return cleanValue(x, depth + 1); });
        if (typeof v === 'object') {
            var o = {};
            Object.keys(v).slice(0, 100).forEach(function (k) {
                if (BLOCKED_KEYS[k] === true || !/^[A-Za-z0-9_ .-]{1,64}$/.test(k)) return;
                o[k] = cleanValue(v[k], depth + 1);
            });
            return o;
        }
        return null;
    }
    function numberList(v) {
        return Array.isArray(v) ? v.slice(0, 16).map(Number).filter(function (n) { return isFinite(n); }) : undefined;
    }
    function objectOrNull(v) {
        return v && typeof v === 'object' && !Array.isArray(v) ? cleanValue(v, 1) : undefined;
    }
    function readSave(raw, species) {
        var d = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
        var num = function (v, def) { var n = Number(v); return isFinite(n) && n >= 0 ? n : def; };
        return {
            level: Math.max(1, Math.floor(num(d.level, 1))),
            xp: num(d.xp, 0),
            pointsToDistribute: Math.floor(num(d.pointsToDistribute, 0)),
            vit: num(d.vit, 1), agi: num(d.agi, 1), int: num(d.int, 1), pow: num(d.pow, 1), mag: num(d.mag, 1),
            equippedSkills: numberList(d.equippedSkills),
            equippedRunes: numberList(d.equippedRunes),
            equippedPassives: numberList(d.equippedPassives),
            weapon: objectOrNull(d.weapon),
            inventory: Array.isArray(d.inventory) ? cleanValue(d.inventory, 1).filter(function (x) { return x && typeof x === 'object' && !Array.isArray(x); }) : undefined,
            equipment: objectOrNull(d.equipment),
            name: typeof d.name === 'string' && cleanValue(d.name, 0) ? cleanValue(d.name, 0).slice(0, 40) : speciesName(species),
        };
    }

    function applySaveToGame(raw, species) {
        var d = readSave(raw, species);
        applyingSave = true;
        try {
            window.g_currentPlayerGhost = species;
            window.GhostRPG.loadBlockchainState(
                d.level, d.vit, d.agi, d.int, d.pow, species, d.xp, d.pointsToDistribute, d.mag,
                d.equippedSkills, d.equippedRunes, d.equippedPassives, d.weapon, d.inventory, d.equipment, d.name
            );
        } finally {
            applyingSave = false;
        }
    }

    function starterSave(resp, species) {
        var seeds = (resp.ghost && resp.ghost.seeds) || {};
        var n = function (k, d) { return Number.isFinite(seeds[k]) && seeds[k] >= 0 ? seeds[k] : d; };
        return { level: 1, xp: 0, xpRequired: 100, pointsToDistribute: 0, vit: n('VIT', 5), agi: n('AGI', 5), int: n('INT', 5), pow: n('POW', 4), mag: n('MAG', 4), characterId: species, name: speciesName(species) };
    }

    async function playGhost(asset) {
        if (!window.GhostRPG || typeof window.GhostRPG.loadBlockchainState !== 'function') throw uiError('The game is still loading. Try again in a moment.');
        if (!window.g_hasAuthenticatedThisPageLoad) {
            if (typeof window.OpenLoginModal === 'function') window.OpenLoginModal();
            throw uiError('Log in to the game first (email and password), then press Play again.');
        }
        if (play && play.asset === asset) { S.open = false; render(); return; }
        var resp = (await withOwnerSync(asset, function () { return api('GET', '/api/save/' + asset, undefined, true); })).data;
        if (!resp || !Number.isInteger(resp.save_version)) throw new LegacyError('bad_response');
        var species = resp.ghost && /^\d{3}$/.test(resp.ghost.species) ? resp.ghost.species : '001';
        var data = resp.save_data && typeof resp.save_data === 'object' ? resp.save_data : starterSave(resp, species);

        var own;
        var prevGhost = window.g_currentPlayerGhost;
        if (play) {
            own = play.own;
            prevGhost = play.prevGhost;
            leavePlay();
        } else {
            window.GhostRPG.saveLocalStorage(); // guarda o personagem do jogador antes da troca (save normal)
            own = snapshotOwnCharacter();
        }

        play = {
            asset: asset, species: species, version: resp.save_version, generation: resp.generation,
            own: own, prevGhost: prevGhost,
            dirty: false, timer: null, lastPutAt: 0, chain: Promise.resolve(), saving: false,
            blocked: null, error: null, savedAt: null,
        };
        applySaveToGame(data, species);
        S.open = false;
        setMsg('ok', 'Playing your legacy ghost. Progress saves to Ghost Games Legacy.');
    }

    function scheduleSave() {
        var p = play;
        if (!p || p.blocked || p.timer) return;
        var wait = Math.max(0, p.lastPutAt + SAVE_INTERVAL_MS - Date.now());
        p.timer = setTimeout(function () {
            p.timer = null;
            if (play === p && p.dirty) queueSave(p, null);
        }, wait);
    }

    // Um PUT por vez por ghost: cada save espera o anterior terminar.
    function queueSave(p, snapshot) {
        p.chain = p.chain.then(function () { return putSave(p, snapshot); });
        return p.chain;
    }

    async function putSave(p, snapshot) {
        if (p.blocked) return false;
        if (!snapshot) {
            if (play !== p || !p.dirty) return true;
            try { snapshot = buildSaveData(p.species); } catch (e) { p.blocked = 'invalid'; p.error = e; updateBadge(); return false; }
        }
        p.dirty = false;
        p.saving = true;
        p.lastPutAt = Date.now();
        updateBadge();
        try {
            var r = (await withOwnerSync(p.asset, function () {
                return api('PUT', '/api/save/' + p.asset, { save_data: snapshot, expected_version: p.version }, true);
            })).data;
            if (!r || !Number.isInteger(r.save_version)) throw new LegacyError('bad_response');
            p.version = r.save_version;
            if (Number.isInteger(r.generation)) p.generation = r.generation;
            p.savedAt = new Date();
            p.error = null;
            return true;
        } catch (e) {
            p.dirty = true;
            p.error = e;
            if (e.code === 'version_conflict') p.blocked = 'conflict';
            else if (e.code === 'not_owner') p.blocked = 'not_owner';
            else if (e.code === 'auth_required') p.blocked = 'auth';
            else if (e.code === 'invalid_save' || e.code === 'too_large' || e.code === 'bad_request') p.blocked = 'invalid';
            else if (play === p) {
                setTimeout(function () { if (play === p && p.dirty && !p.blocked) scheduleSave(); }, (e.retryAfter ? e.retryAfter * 1000 : 10000));
            }
            return false;
        } finally {
            p.saving = false;
            updateBadge();
            render();
        }
    }

    // Sai do modo legado sem trocar o personagem (quem chamou vai carregar outro).
    // Se havia progresso não salvo, manda um último save com o estado de agora.
    function leavePlay() {
        var p = play;
        if (!p) return null;
        play = null;
        if (p.timer) { clearTimeout(p.timer); p.timer = null; }
        var snapshot = null;
        if (p.dirty && !p.blocked) { try { snapshot = buildSaveData(p.species); } catch (e) {} }
        if (snapshot) queueSave(p, snapshot);
        updateBadge();
        render();
        return p;
    }

    async function backToMyGhost(skipWait) {
        var p = leavePlay();
        if (!p) return;
        if (!skipWait) {
            setMsg('info', 'Saving your legacy ghost…');
            await Promise.race([p.chain, sleep(8000)]);
        }
        var o = p.own;
        if (!o || !o.characterId) {
            window.location.reload(); // sem foto: recarrega o personagem do jogador do save normal, que não foi tocado
            return;
        }
        // Devolve a foto tirada no Play (não a lista g_ownedCharacters, que é do momento do login e pode
        // estar atrás do progresso). O saveLocalStorage no fim de loadBlockchainState regrava o mesmo estado.
        window.g_currentPlayerGhost = p.prevGhost;
        window.GhostRPG.loadBlockchainState(
            o.level, o.vit, o.agi, o.int, o.pow, o.characterId, o.xp, o.pointsToDistribute, o.mag,
            o.equippedSkills, o.equippedRunes, o.equippedPassives, o.weapon, o.inventory, o.equipment, o.name
        );
        try { localStorage.setItem('dg_deso_character_id', String(o.characterId)); } catch (e) {}
        if (!skipWait) setMsg('ok', 'Back to your own ghost.');
    }

    // Foto do personagem do próprio jogador, com os atributos puros (getStats() soma o equipamento).
    function snapshotOwnCharacter() {
        try {
            var s = JSON.parse(JSON.stringify(window.GhostRPG.getStats()));
            ['vit', 'agi', 'int', 'pow', 'mag'].forEach(function (k) {
                var baseKey = 'base' + k.charAt(0).toUpperCase() + k.slice(1);
                if (typeof s[baseKey] === 'number') s[k] = s[baseKey];
            });
            return s;
        } catch (e) {
            return null;
        }
    }

    async function reloadSavedVersion() {
        if (!play) return;
        var p = play;
        var resp = (await withOwnerSync(p.asset, function () { return api('GET', '/api/save/' + p.asset, undefined, true); })).data;
        if (!resp || !Number.isInteger(resp.save_version)) throw new LegacyError('bad_response');
        if (play !== p) return;
        if (p.timer) { clearTimeout(p.timer); p.timer = null; }
        p.version = resp.save_version;
        p.generation = resp.generation;
        p.blocked = null;
        p.error = null;
        p.dirty = false;
        p.savedAt = Date.parse(resp.updated_at) ? new Date(resp.updated_at) : null;
        applySaveToGame(resp.save_data && typeof resp.save_data === 'object' ? resp.save_data : starterSave(resp, p.species), p.species);
        setMsg('ok', 'Loaded the latest saved version of this ghost.');
    }

    async function saveNow() {
        var btn = document.getElementById('rpgSaveBtn') || document.getElementById('btnNavSave');
        if (btn) { btn.innerText = 'SAVING...'; btn.disabled = true; }
        try {
            var p = play;
            if (!p) return;
            if (p.blocked) { alert(blockedText(p)); return; }
            p.dirty = true;
            if (p.timer) { clearTimeout(p.timer); p.timer = null; }
            await queueSave(p, null);
            if (p.blocked || p.dirty) alert(blockedText(p) || describe(p.error).text);
            else alert('🎉 SUCCESS! Legacy ghost saved to Ghost Games Legacy.');
        } catch (e) {
            alert(describe(e).text);
        } finally {
            if (btn) { btn.innerText = 'SAVE GAME'; btn.disabled = false; }
        }
    }

    function blockedText(p) {
        switch (p.blocked) {
            case 'not_owner': return 'This ghost now belongs to another wallet. Progress since the last save was not saved.';
            case 'conflict': return 'This ghost was saved somewhere else (another tab or device). Open LEGACY to load the latest version.';
            case 'auth': return 'Your Legacy session ended. Open LEGACY and sign in to keep saving.';
            case 'invalid': return 'This save could not be stored. ' + describe(p.error).text;
            default: return null;
        }
    }

    window.LegacyMode = Object.freeze({
        get active() { return !!play; },
        get applying() { return applyingSave; },
        onAutoSave: function () {
            if (!play || applyingSave) return;
            play.dirty = true;
            scheduleSave();
        },
        saveNow: saveNow,
        exit: function () { if (!applyingSave) leavePlay(); },
    });

    // ---------- interface ----------
    function el(tag, attrs, children) {
        var n = document.createElement(tag);
        if (attrs) Object.keys(attrs).forEach(function (k) {
            var v = attrs[k];
            if (v === undefined || v === null || v === false) return;
            if (k === 'class') n.className = v;
            else if (k === 'text') n.textContent = v;
            else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
            else if (k === 'disabled') n.disabled = !!v;
            else n.setAttribute(k, v);
        });
        (children || []).forEach(function (c) {
            if (c === null || c === undefined || c === false) return;
            n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        });
        return n;
    }
    function link(href, text) {
        if (!href || !/^https:\/\//.test(href)) return null;
        return el('a', { href: href, target: '_blank', rel: 'noopener noreferrer', text: text });
    }
    function button(label, onClick, opts) {
        opts = opts || {};
        var busyHere = S.busy && S.busy === opts.busyKey;
        return el('button', {
            type: 'button',
            class: 'gg-legacy-btn' + (opts.primary ? ' gg-legacy-btn-primary' : '') + (opts.danger ? ' gg-legacy-btn-danger' : ''),
            disabled: !!S.busy || opts.disabled,
            onclick: onClick,
            text: busyHere ? 'Working…' : label,
        });
    }

    var ui = {};

    function buildShell() {
        ui.toggle = el('button', { type: 'button', id: 'ggLegacyToggle', title: 'Ghost Games Legacy (Solana devnet)', text: 'LEGACY', onclick: function () { S.open = !S.open; render(); if (S.open) onOpen(); } });
        ui.panel = el('div', { id: 'ggLegacyPanel', role: 'dialog', 'aria-label': 'Ghost Games Legacy' });
        ui.badge = el('button', { type: 'button', id: 'ggLegacyBadge', onclick: function () { S.open = true; render(); } });
        // O jogo escuta o teclado na janela inteira: não deixa o que é digitado no painel virar comando do jogo.
        ['keydown', 'keyup', 'keypress'].forEach(function (t) {
            ui.panel.addEventListener(t, function (e) {
                if (e.key === 'Escape' && t === 'keydown') { S.open = false; render(); }
                e.stopPropagation();
            });
        });
        document.body.appendChild(ui.toggle);
        document.body.appendChild(ui.panel);
        document.body.appendChild(ui.badge);
    }

    function onOpen() {
        if (sessionValid() && !S.busy) {
            action('open', async function () {
                await loadGhosts();
                await resumePending();
            })();
        }
    }

    function updateBadge() {
        if (!ui.badge) return;
        var p = play;
        ui.badge.style.display = p ? 'block' : 'none';
        if (!p) return;
        var status;
        if (p.blocked) status = p.blocked === 'not_owner' ? 'NOT SAVING: owned by another wallet' : p.blocked === 'conflict' ? 'NOT SAVING: saved elsewhere' : p.blocked === 'auth' ? 'NOT SAVING: sign in again' : 'NOT SAVING';
        else if (p.saving) status = 'Saving…';
        else if (p.error) status = 'Save paused, retrying';
        else if (p.savedAt) status = 'Saved ' + timeText(p.savedAt);
        else status = 'Loaded';
        ui.badge.className = p.blocked ? 'gg-legacy-badge-warn' : '';
        ui.badge.textContent = 'LEGACY GHOST · GEN ' + (p.generation || '?') + ' · ' + status;
    }

    function render() {
        if (!ui.panel) return;
        updateBadge();
        ui.panel.style.display = S.open ? 'flex' : 'none';
        ui.toggle.classList.toggle('gg-legacy-toggle-open', S.open);
        if (!S.open) return;
        var scrollTop = ui.panel.scrollTop;
        var focusedId = document.activeElement && ui.panel.contains(document.activeElement) ? document.activeElement.id : null;
        ui.panel.textContent = '';

        ui.panel.appendChild(el('div', { class: 'gg-legacy-head' }, [
            el('div', { class: 'gg-legacy-title', text: 'LEGACY' }),
            el('div', { class: 'gg-legacy-sub', text: 'Solana devnet' }),
            el('button', { type: 'button', class: 'gg-legacy-close', 'aria-label': 'Close', text: '×', onclick: function () { S.open = false; render(); } }),
        ]));

        if (S.msg) {
            ui.panel.appendChild(el('div', { class: 'gg-legacy-msg gg-legacy-msg-' + S.msg.kind, role: S.msg.kind === 'error' ? 'alert' : 'status' },
                [el('div', { text: S.msg.text })].concat((S.msg.links || []).map(function (l) { return link(l.href, l.text); }))));
        }

        ui.panel.appendChild(renderWallet());
        if (S.session) ui.panel.appendChild(renderGhosts());
        if (play) ui.panel.appendChild(renderPlaying());

        ui.panel.appendChild(el('p', { class: 'gg-legacy-foot', text: 'Ownership lives on Solana devnet. Progress is saved on the Ghost Games Legacy server, not on-chain.' }));

        ui.panel.scrollTop = scrollTop;
        if (focusedId) { var f = document.getElementById(focusedId); if (f) f.focus(); }
    }

    function renderWallet() {
        var box = el('section', { class: 'gg-legacy-section' }, [el('h3', { text: 'Wallet' })]);
        if (S.walletLoadError) { box.appendChild(el('p', { text: 'Wallet support failed to load. Reload the page to try again.' })); return box; }
        if (!S.walletReady) { box.appendChild(el('p', { text: 'Loading wallet support…' })); return box; }

        var st = walletState();
        if (!st.connected) {
            var wallets = window.GGWallet.listWallets();
            if (!wallets.length) {
                box.appendChild(el('p', { text: 'No Solana wallet found. Install Phantom, Solflare or Backpack in this browser, then reload the page.' }));
            } else {
                box.appendChild(el('p', { class: 'gg-legacy-hint', text: 'Optional: connect a wallet to own your ghost on Solana devnet. Your game login does not change.' }));
                wallets.forEach(function (w) {
                    var icon = typeof w.icon === 'string' && /^data:image\//.test(w.icon) ? el('img', { src: w.icon, alt: '', width: '18', height: '18' }) : null;
                    var b = button('', action('connect', function () { return connectWallet(w); }), { busyKey: 'connect' });
                    b.textContent = '';
                    if (icon) b.appendChild(icon);
                    b.appendChild(document.createTextNode(S.busy === 'connect' ? ' Working…' : ' Connect ' + w.name));
                    box.appendChild(b);
                });
            }
            if (S.session) box.appendChild(el('p', { class: 'gg-legacy-hint', text: 'Signed in as ' + short(S.session.wallet) + '. Connect the same wallet to forge or pass on.' }));
            return box;
        }

        box.appendChild(el('div', { class: 'gg-legacy-row' }, [
            el('span', { class: 'gg-legacy-addr', title: st.address, text: st.walletName + ' · ' + short(st.address) }),
            el('span', { class: 'gg-legacy-bal', text: S.balance !== null ? window.GGWallet.formatSol(S.balance) + ' SOL (devnet)' : (S.balanceError ? 'Balance unavailable' : '…') }),
        ]));
        if (needsSolHint()) {
            box.appendChild(el('div', { class: 'gg-legacy-msg gg-legacy-msg-info' }, [
                el('div', { text: 'Your wallet has 0 SOL on devnet. If you have SOL elsewhere, your wallet is probably on the wrong network: turn on Testnet Mode and choose Devnet. Then get free devnet SOL from the faucet.' }),
                link(FAUCET, 'Open the Solana faucet'),
            ]));
        }
        var row = el('div', { class: 'gg-legacy-row' });
        var signedHere = S.session && S.session.wallet === st.address;
        if (!signedHere) row.appendChild(button('Sign in (free)', action('signin', signIn), { primary: true, busyKey: 'signin' }));
        else row.appendChild(button('Sign out', signOut));
        row.appendChild(button('Refresh balance', action('balance', refreshBalance), { busyKey: 'balance' }));
        row.appendChild(button('Disconnect', action('disconnect', disconnectWallet), { busyKey: 'disconnect' }));
        box.appendChild(row);
        if (!signedHere) box.appendChild(el('p', { class: 'gg-legacy-hint', text: 'Sign in = your wallet signs a message. It is free and approves no transaction.' }));
        return box;
    }

    function renderGhosts() {
        var box = el('section', { class: 'gg-legacy-section' }, [el('h3', { text: 'My legacy ghosts' })]);
        var st = walletState();
        var canSign = st.connected && S.session && st.address === S.session.wallet;

        var pending = getPending();
        if (pending && pending.wallet === S.session.wallet) {
            box.appendChild(el('div', { class: 'gg-legacy-msg gg-legacy-msg-info' }, [
                el('div', { text: 'A ' + (pending.kind === 'forge' ? 'forge' : 'transfer') + ' transaction is waiting for confirmation.' }),
                button('Finish pending transaction', action('pending', resumePending), { busyKey: 'pending' }),
            ]));
        }

        if (S.forgeConfirm) {
            box.appendChild(el('div', { class: 'gg-legacy-confirm' }, [
                el('p', { text: 'Forge a legacy ghost (species #001) on Solana devnet. It starts with your current ghost\'s level and items; your own ghost stays as it is. Your wallet pays a small devnet fee (about 0.01 SOL).' }),
                el('div', { class: 'gg-legacy-row' }, [
                    button('Forge now', action('forge', forge), { primary: true, busyKey: 'forge' }),
                    button('Cancel', function () { S.forgeConfirm = false; render(); }),
                ]),
            ]));
        } else {
            box.appendChild(button('Forge on Solana', function () { S.forgeConfirm = true; S.msg = null; render(); }, { primary: true, disabled: !canSign }));
            if (!canSign) box.appendChild(el('p', { class: 'gg-legacy-hint', text: 'Connect the wallet you signed in with to forge or pass on.' }));
        }

        if (S.transferResult) {
            var tr = S.transferResult;
            box.appendChild(el('div', { class: 'gg-legacy-msg gg-legacy-msg-ok' }, [
                el('div', { text: 'Ghost ' + short(tr.asset) }),
                el('div', { text: 'Owner: ' + (tr.before ? short(tr.before.owner) : '?') + ' → ' + short(tr.after.owner) }),
                el('div', { text: 'Generation: ' + (tr.before ? tr.before.generation : '?') + ' → ' + (tr.after.generation || '?') }),
            ]));
        }

        if (S.ghosts === null) {
            box.appendChild(button('Load my ghosts', action('list', loadGhosts), { busyKey: 'list' }));
            return box;
        }
        if (!S.ghosts.length) box.appendChild(el('p', { class: 'gg-legacy-hint', text: 'No legacy ghosts in this wallet yet.' }));
        S.ghosts.forEach(function (g) {
            var isPlaying = play && play.asset === g.asset;
            var item = el('div', { class: 'gg-legacy-ghost' + (isPlaying ? ' gg-legacy-ghost-playing' : '') }, [
                el('div', { class: 'gg-legacy-ghost-title', title: g.asset, text: speciesName(g.species) + ' · ' + short(g.asset) }),
                el('div', { class: 'gg-legacy-hint', text: 'Generation ' + (g.generation === null ? '?' : g.generation) + ' · ' + (g.level === null ? 'no save yet' : 'Level ' + g.level) + (isPlaying ? ' · playing now' : '') }),
            ]);
            var row = el('div', { class: 'gg-legacy-row' }, [
                isPlaying ? null : button('Play', action('play', function () { return playGhost(g.asset); }), { primary: true, busyKey: 'play' }),
                button('Pass on', function () { S.transfer = { asset: g.asset, to: '', before: null, error: null }; S.transferResult = null; S.msg = null; render(); }, { disabled: !canSign }),
                link(explorerAddress(g.asset), 'Explorer'),
            ]);
            item.appendChild(row);
            if (S.transfer && S.transfer.asset === g.asset) item.appendChild(renderTransferForm());
            box.appendChild(item);
        });
        box.appendChild(button('Refresh list', action('list', loadGhosts), { busyKey: 'list' }));
        return box;
    }

    function renderTransferForm() {
        var t = S.transfer;
        var input = el('input', {
            id: 'ggLegacyTo', type: 'text', class: 'gg-legacy-input', value: t.to, placeholder: 'Destination wallet address',
            autocomplete: 'off', spellcheck: 'false', maxlength: '64', 'aria-label': 'Destination wallet address',
            oninput: function (e) { t.to = e.target.value; t.before = null; t.error = null; },
        });
        var form = el('div', { class: 'gg-legacy-transfer' }, [
            el('p', { class: 'gg-legacy-hint', text: 'Pass this ghost on to another wallet. The new owner gets it with its progress; you can no longer play or save it.' }),
            input,
            t.error ? el('div', { class: 'gg-legacy-field-error', role: 'alert', text: t.error }) : null,
            t.before ? el('div', { class: 'gg-legacy-hint', text: 'Now: owner ' + short(t.before.owner) + ', generation ' + t.before.generation + '. After: owner ' + short(t.to) + ', generation ' + (Number(t.before.generation) + 1) + '.' }) : null,
            el('div', { class: 'gg-legacy-row' }, [
                t.before
                    ? button('Pass on now', action('transfer', sendTransfer), { primary: true, danger: true, busyKey: 'transfer' })
                    : button('Check', action('check', checkTransfer), { busyKey: 'check' }),
                button('Cancel', function () { S.transfer = null; render(); }),
            ]),
        ]);
        return form;
    }

    function renderPlaying() {
        var p = play;
        var box = el('section', { class: 'gg-legacy-section' }, [el('h3', { text: 'Playing a legacy ghost' })]);
        box.appendChild(el('p', { class: 'gg-legacy-hint', title: p.asset, text: short(p.asset) + ' · generation ' + (p.generation || '?') + ' · save version ' + p.version }));
        var warn = blockedText(p);
        if (warn) box.appendChild(el('div', { class: 'gg-legacy-msg gg-legacy-msg-error', role: 'alert', text: warn }));
        var row = el('div', { class: 'gg-legacy-row' });
        if (!p.blocked) row.appendChild(button('Save now', saveNow));
        if (p.blocked === 'conflict') row.appendChild(button('Load latest saved version', action('reload', reloadSavedVersion), { primary: true, busyKey: 'reload' }));
        row.appendChild(button('Back to my ghost', action('back', function () { return backToMyGhost(false); }), { busyKey: 'back' }));
        box.appendChild(row);
        return box;
    }

    // ---------- inicialização ----------
    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function start() {
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'css/legacy.css?v=1';
        document.head.appendChild(css);
        buildShell();
        render();

        var mock = USE_MOCK_WALLET ? loadScript('tools/legacy-mock-wallet.js').catch(function () {}) : Promise.resolve();
        mock.then(function () { return loadScript('js/legacy/wallet.bundle.js?v=1'); }).then(function () {
            S.walletReady = !!window.GGWallet;
            S.walletLoadError = !window.GGWallet;
            if (!window.GGWallet) return render();
            window.GGWallet.onWalletsChanged(function () { render(); });
            window.GGWallet.onChange(function (st) {
                if (S.session && st.connected && S.session.wallet !== st.address) {
                    clearSession();
                    S.transfer = null;
                    setMsg('info', 'Your wallet account changed. Sign in again with this account.');
                }
                refreshBalance().then(render);
            });
            render();
        }).catch(function () {
            S.walletLoadError = true;
            render();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
