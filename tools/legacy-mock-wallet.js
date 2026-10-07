// SÓ PARA DESENVOLVIMENTO. Carteira de teste (Wallet Standard) para testar o painel Legacy num
// navegador sem Phantom. Injetada pelo painel (js/legacy/legacy.js) a partir do jogo local, só em
// localhost com ?legacy=1&mockwallet=N (N = 1, 2, ... escolhe a carteira A, B, ...).
// A chave é derivada de um texto público ("gg-legacy-mock-wallet-N"): não tem fundos, não é segredo
// e não serve para nada fora deste teste. Nada é gravado no navegador.
//
// Controles (console do navegador), para simular erros:
//   GGMockWallet.rejectNext = true          a próxima assinatura é recusada (como "Cancel" na Phantom)
//   GGMockWallet.balanceLamports = 0        saldo mostrado pelo painel (?mockbal=0 na URL faz o mesmo)
(function () {
    'use strict';
    var params = new URLSearchParams(location.search);
    var index = Math.max(1, Math.min(9, parseInt(params.get('mockwallet'), 10) || 1));
    var B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    function b58encode(bytes) {
        var n = 0n;
        for (var i = 0; i < bytes.length; i++) n = n * 256n + BigInt(bytes[i]);
        var out = '';
        while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
        for (var j = 0; j < bytes.length && bytes[j] === 0; j++) out = '1' + out;
        return out;
    }
    function b64urlToBytes(s) {
        var bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
        return Uint8Array.from(bin, function (c) { return c.charCodeAt(0); });
    }
    function rejected() { var e = new Error('User rejected the request.'); e.code = 4001; return e; }

    var controls = {
        rejectNext: false,
        balanceLamports: params.get('mockbal') !== null ? Number(params.get('mockbal')) : 2000000000,
        address: null,
    };
    window.GGMockWallet = controls;

    var keyPromise = (async function () {
        var seed = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('gg-legacy-mock-wallet-' + index)));
        var prefix = [0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20];
        var pkcs8 = new Uint8Array(prefix.concat(Array.from(seed)));
        var key = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, true, ['sign']);
        var jwk = await crypto.subtle.exportKey('jwk', key);
        var publicKey = b64urlToBytes(jwk.x);
        controls.address = b58encode(publicKey);
        return { key: key, publicKey: publicKey, address: controls.address };
    })();

    var listeners = new Set();
    var CHAINS = ['solana:devnet'];
    var wallet = {
        version: '1.0.0',
        name: 'Ghost Test Wallet ' + String.fromCharCode(64 + index),
        icon: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#222"/><text x="16" y="22" font-size="16" text-anchor="middle" fill="#0f0">T</text></svg>'),
        chains: CHAINS,
        accounts: [],
        features: {
            'standard:connect': {
                version: '1.0.0',
                connect: async function () {
                    var k = await keyPromise;
                    wallet.accounts = [{ address: k.address, publicKey: k.publicKey, chains: CHAINS, features: ['solana:signMessage', 'solana:signAndSendTransaction'] }];
                    listeners.forEach(function (fn) { fn({ accounts: wallet.accounts }); });
                    return { accounts: wallet.accounts };
                },
            },
            'standard:disconnect': {
                version: '1.0.0',
                disconnect: async function () {
                    wallet.accounts = [];
                    listeners.forEach(function (fn) { fn({ accounts: wallet.accounts }); });
                },
            },
            'standard:events': {
                version: '1.0.0',
                on: function (event, fn) {
                    if (event !== 'change') return function () {};
                    listeners.add(fn);
                    return function () { listeners.delete(fn); };
                },
            },
            'solana:signMessage': {
                version: '1.0.0',
                signMessage: async function (input) {
                    if (controls.rejectNext) { controls.rejectNext = false; throw rejected(); }
                    var k = await keyPromise;
                    var sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, k.key, input.message));
                    return [{ signedMessage: input.message, signature: sig }];
                },
            },
            'solana:signAndSendTransaction': {
                version: '1.0.0',
                supportedTransactionVersions: ['legacy', 0],
                signAndSendTransaction: async function () {
                    if (controls.rejectNext) { controls.rejectNext = false; throw rejected(); }
                    if (controls.balanceLamports < 3000000) throw new Error('Insufficient funds for fee');
                    return [{ signature: crypto.getRandomValues(new Uint8Array(64)) }];
                },
            },
        },
    };

    function register(api) { api.register(wallet); }
    window.addEventListener('wallet-standard:app-ready', function (e) { register(e.detail); });
    window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet', { detail: register }));
})();
