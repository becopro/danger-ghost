// Entrada do pacote da carteira usado pelo painel Legacy (js/legacy/legacy.js).
// Gerado por tools/build-legacy-wallet.js -> js/legacy/wallet.bundle.js (expõe window.GGWallet).
//
// O módulo de carteira vem do repo aberto ghostgames-onchain (src/wallet.js), sem cópia manual:
// o build lê o arquivo de lá. Aqui só entra o que o jogo precisa a mais:
// - signMessage (login Sign-In With Solana: a carteira assina a mensagem exata do servidor);
// - isAddress (validar endereço antes de mandar ao serviço).
import * as wallet from 'gg-onchain-wallet';
import { getBase58Decoder, isAddress } from '@solana/kit';

const SIGN_MESSAGE = 'solana:signMessage';

function connectedWalletAndAccount() {
    const state = wallet.getState();
    if (!state.connected) throw new Error('Connect your wallet first.');
    const w = wallet.listWallets().find((x) => x.name === state.walletName);
    const account = w && w.accounts.find((a) => a.address === state.address);
    if (!w || !account) throw new Error('Wallet not found. Reconnect your wallet.');
    return { w, account };
}

/** Assina os bytes UTF-8 de `message` sem alterar nada. Devolve a assinatura em base58. */
async function signMessage(message) {
    const { w, account } = connectedWalletAndAccount();
    const feature = w.features[SIGN_MESSAGE];
    if (!feature) throw new Error(`${w.name} cannot sign messages.`);
    const [{ signature }] = await feature.signMessage({ account, message: new TextEncoder().encode(message) });
    return getBase58Decoder().decode(signature);
}

window.GGWallet = Object.freeze({
    ...wallet,
    signMessage,
    isAddress: (value) => typeof value === 'string' && isAddress(value),
});
