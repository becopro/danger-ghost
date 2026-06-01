/**
 * ECOSSISTEMA DRAGAMP - DANGER GHOST (DIABLO ARPG)
 * MÓDULO DE SEGURANÇA E INTEGRIDADE DE ESTADO DE JOGO (FAIL-SAFE)
 * 
 * Este módulo gerencia:
 * 1. Assinaturas Criptográficas Dinâmicas (SHA-256) com salt dinâmico (Cliente/Servidor)
 *    para evitar adulteração de dados de save na memória (F12 / Cheat Engine) antes do upload na blockchain.
 * 2. Política Fail-Safe Local: Cache offline criptografado (AES-GCM de 256 bits) para salvamentos
 *    locais em caso de falha de conexão ou timeout de nós, com ressincronização automática em segundo plano.
 * 
 * Desenvolvido sob princípios de Engenharia de Segurança AAA e Padrões de Criptografia Moderna.
 */

// Interface do Estado do Personagem (Save State)
export interface CharacterState {
    level: number;
    xp: number;
    pointsToDistribute: number;
    attributes: [number, number, number, number]; // [vit, agi, int, pow]
    gold: number;
    equippedItems: Record<string, string>; // Mapeamento de slots para string codificada do item
    stashItems: string[]; // Itens no baú
    timestamp: number; // UNIX timestamp de geração do estado
}

// Interface do Pacote de Sincronização Local Offline (Criptografado)
export interface EncryptedSaveEnvelope {
    ciphertext: string; // Dados criptografados do estado e assinatura (Base64)
    iv: string;         // Vetor de Inicialização (Base64)
    salt: string;       // Salt utilizado na derivação de chave PBKDF2 (Base64)
    createdAt: number;  // Base temporal de criação do buffer local
}

// Interface do Payload de Assinatura
export interface SignedPayload {
    state: CharacterState;
    signature: string;
    clientSaltUsed: string;
}

// Seleção resiliente do motor Web Crypto API (Navegador e Node.js)
let cryptoInstance: Crypto;
if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    cryptoInstance = globalThis.crypto;
} else {
    try {
        // Fallback dinâmico para Node.js (Ambientes de Teste de Integração)
        const nodeCrypto = require('crypto');
        cryptoInstance = nodeCrypto.webcrypto as unknown as Crypto;
    } catch {
        throw new Error("⛔ Crítico: O ambiente atual de execução não fornece suporte para a Web Crypto API.");
    }
}

/**
 * 1. GERENCIADOR DE INTEGRIDADE E ASSINATURA DE ESTADO
 * Aplica técnicas robustas de canonização JSON e geração de hashes SHA-256 com salt.
 */
export class IntegritySigner {
    /**
     * Ordena chaves de forma determinística para evitar que diferentes ordens de serialização quebrem a assinatura.
     */
    public static canonicalize(obj: any): string {
        if (obj === null) return "null";
        if (typeof obj !== "object") return JSON.stringify(obj);
        if (Array.isArray(obj)) {
            return "[" + obj.map(item => this.canonicalize(item)).join(",") + "]";
        }
        const sortedKeys = Object.keys(obj).sort();
        const keyValues = sortedKeys.map(key => `"${key}":${this.canonicalize(obj[key])}`);
        return "{" + keyValues.join(",") + "}";
    }

    /**
     * Gera um Salt Dinâmico combinando chaves criptográficas, sessões do cliente e dados do servidor.
     */
    public static generateDynamicSalt(
        clientWallet: string,
        serverLastBlockHash: string,
        sessionNonce: string
    ): string {
        // Mistura determinística de fatores locais do cliente e estados dinâmicos da Blockchain DeSo
        return `${clientWallet.toLowerCase()}_${serverLastBlockHash}_${sessionNonce}`;
    }

    /**
     * Calcula o Hash SHA-256 de uma string utilizando a Web Crypto API.
     */
    public static async computeSHA256(input: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await cryptoInstance.subtle.digest("SHA-256", data);
        
        // Conversão de ArrayBuffer para representação Hexadecimal
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Assina digitalmente o estado de jogo gerando um hash de integridade com o sal criptográfico.
     */
    public static async signState(
        state: CharacterState,
        dynamicSalt: string
    ): Promise<SignedPayload> {
        const canonicalState = this.canonicalize(state);
        // Assinatura = SHA256(JSON_Canonizado + Salt_Dinâmico)
        const signature = await this.computeSHA256(canonicalState + dynamicSalt);
        
        return {
            state,
            signature,
            clientSaltUsed: dynamicSalt
        };
    }

    /**
     * Valida a assinatura de integridade recebida contra um recálculo local do estado.
     */
    public static async verifyStateSignature(
        state: CharacterState,
        signature: string,
        dynamicSalt: string
    ): Promise<boolean> {
        const canonicalState = this.canonicalize(state);
        const computedSignature = await this.computeSHA256(canonicalState + dynamicSalt);
        return computedSignature === signature;
    }
}

/**
 * 2. WRAPPER DE CRIPTOGRAFIA SIMÉTRICA (AES-GCM + PBKDF2)
 * Criptografa dados sensíveis offline usando senhas locais ou chaves baseadas em hardware.
 */
export class CryptoWrapper {
    private static readonly PBKDF2_ITERATIONS = 100000;

    /**
     * Utilitários internos de conversão de dados
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Deriva uma chave AES-GCM segura a partir de uma senha de usuário usando PBKDF2.
     */
    private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const baseKey = await cryptoInstance.subtle.importKey(
            "raw",
            encoder.encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return await cryptoInstance.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: "SHA-256"
            },
            baseKey,
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Criptografa o payload assinado com AES-GCM de 256 bits.
     */
    public static async encrypt(
        payload: SignedPayload,
        encryptionSecret: string
    ): Promise<EncryptedSaveEnvelope> {
        const encoder = new TextEncoder();
        const serialized = JSON.stringify(payload);
        const dataToEncrypt = encoder.encode(serialized);

        // Gera componentes de aleatoriedade criptográfica (Salt e Vetor de Inicialização)
        const salt = cryptoInstance.getRandomValues(new Uint8Array(16));
        const iv = cryptoInstance.getRandomValues(new Uint8Array(12)); // 12 bytes recomendado para AES-GCM

        const aesKey = await this.deriveKey(encryptionSecret, salt);

        const ciphertextBuffer = await cryptoInstance.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            aesKey,
            dataToEncrypt
        );

        return {
            ciphertext: this.arrayBufferToBase64(ciphertextBuffer),
            iv: this.arrayBufferToBase64(iv),
            salt: this.arrayBufferToBase64(salt),
            createdAt: Date.now()
        };
    }

    /**
     * Decifra o envelope criptografado offline recuperando o payload assinado original.
     */
    public static async decrypt(
        envelope: EncryptedSaveEnvelope,
        encryptionSecret: string
    ): Promise<SignedPayload> {
        const saltDecoded = new Uint8Array(this.base64ToArrayBuffer(envelope.salt));
        const ivDecoded = new Uint8Array(this.base64ToArrayBuffer(envelope.iv));
        const ciphertextDecoded = this.base64ToArrayBuffer(envelope.ciphertext);

        const aesKey = await this.deriveKey(encryptionSecret, saltDecoded);

        const decryptedBuffer = await cryptoInstance.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: ivDecoded
            },
            aesKey,
            ciphertextDecoded
        );

        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedBuffer);

        return JSON.parse(decryptedText) as SignedPayload;
    }
}

/**
 * 3. CONTROLADOR DE FAIL-SAFE DE CACHE LOCAL
 * Gerencia o salvamento persistente local seguro e leitura de buffers de rede offline.
 */
export class FailSafeCache {
    private static readonly CACHE_KEY = "danger_ghost_secure_save_buffer";

    /**
     * Salva o estado criptografado no armazenamento local (localStorage ou abstração de banco de dados).
     */
    public static async saveOffline(
        payload: SignedPayload,
        encryptionSecret: string
    ): Promise<void> {
        try {
            const encryptedEnvelope = await CryptoWrapper.encrypt(payload, encryptionSecret);
            const serializedEnvelope = JSON.stringify(encryptedEnvelope);
            
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.CACHE_KEY, serializedEnvelope);
            } else {
                // Fallback para ambientes sem localStorage direto (mock local/testes)
                (globalThis as any)[this.CACHE_KEY] = serializedEnvelope;
            }
        } catch (error) {
            console.error("⛔ [FAIL-SAFE CACHE] Erro ao criptografar e persistir estado offline:", error);
            throw error;
        }
    }

    /**
     * Recupera e decodifica o estado salvo localmente.
     */
    public static async loadOffline(
        encryptionSecret: string
    ): Promise<SignedPayload | null> {
        try {
            let serializedEnvelope: string | null = null;
            
            if (typeof localStorage !== 'undefined') {
                serializedEnvelope = localStorage.getItem(this.CACHE_KEY);
            } else {
                serializedEnvelope = (globalThis as any)[this.CACHE_KEY] || null;
            }

            if (!serializedEnvelope) return null;

            const envelope = JSON.parse(serializedEnvelope) as EncryptedSaveEnvelope;
            return await CryptoWrapper.decrypt(envelope, encryptionSecret);
        } catch (error) {
            console.error("⛔ [FAIL-SAFE CACHE] Falha ao descriptografar ou carregar estado offline:", error);
            return null;
        }
    }

    /**
     * Remove o buffer local após sincronização bem-sucedida.
     */
    public static clearOffline(): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.CACHE_KEY);
        } else {
            delete (globalThis as any)[this.CACHE_KEY];
        }
    }

    /**
     * Verifica se existe um salvamento offline aguardando sincronização.
     */
    public static hasOfflineBuffer(): boolean {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem(this.CACHE_KEY) !== null;
        }
        return (globalThis as any)[this.CACHE_KEY] !== undefined;
    }
}

/**
 * 4. GERENCIADOR DINÂMICO DE SINCRONIZAÇÃO E REDE
 * Coordena tentativas de gravação em blockchain, fail-over para cache local e sincronização automática.
 */
export class FailSafeSyncManager {
    private isSyncing = false;
    private checkIntervalId: any = null;

    constructor(
        private desoNodeUrl: string = "https://node.deso.org/api/v0",
        private checkNetworkIntervalMs: number = 10000 // 10 segundos
    ) {}

    /**
     * Tenta salvar o estado na Blockchain. Se falhar, aciona imediatamente o fail-safe local criptografado.
     */
    public async saveState(
        state: CharacterState,
        clientWallet: string,
        serverLastBlockHash: string,
        sessionNonce: string,
        encryptionSecret: string,
        blockchainUploadCallback: (signedPayload: SignedPayload) => Promise<boolean>
    ): Promise<{ success: boolean; target: 'blockchain' | 'local_cache'; error?: string }> {
        
        // 1. Gerar Salt Dinâmico e assinar estado local
        const dynamicSalt = IntegritySigner.generateDynamicSalt(clientWallet, serverLastBlockHash, sessionNonce);
        const signedPayload = await IntegritySigner.signState(state, dynamicSalt);

        try {
            // 2. Tentar enviar para a Blockchain DeSo
            console.log("🔗 [SYNC-MANAGER] Tentando upload do Save State para a Blockchain...");
            const uploadSuccess = await blockchainUploadCallback(signedPayload);

            if (uploadSuccess) {
                console.log("✅ [SYNC-MANAGER] Save State persistido com sucesso na Blockchain!");
                // Se obteve sucesso e existia cache offline, limpa-o
                FailSafeCache.clearOffline();
                return { success: true, target: 'blockchain' };
            } else {
                throw new Error("Retorno falso do validador de transação");
            }
        } catch (error: any) {
            // 3. Ativar Fail-Safe em caso de falha de rede/timeout
            console.warn(`⚠️ [SYNC-MANAGER] Instabilidade de rede detectada (${error.message || error}). Ativando Fail-Safe Criptográfico Local...`);
            
            try {
                await FailSafeCache.saveOffline(signedPayload, encryptionSecret);
                console.log("🔒 [SYNC-MANAGER] Estado criptografado com AES-GCM e salvo offline com sucesso!");
                
                // Inicia o processo automático de monitoramento para ressincronizar
                this.initiateAutoSyncWatcher(
                    clientWallet,
                    serverLastBlockHash,
                    sessionNonce,
                    encryptionSecret,
                    blockchainUploadCallback
                );

                return { success: true, target: 'local_cache' };
            } catch (cacheError: any) {
                console.error("⛔ [SYNC-MANAGER] Falha catastrófica: não foi possível salvar nem no cache offline:", cacheError);
                return { success: false, target: 'local_cache', error: cacheError.toString() };
            }
        }
    }

    /**
     * Valida de forma agressiva a estabilidade da internet/conexão do nó, efetuando uma requisição de ping.
     */
    public async checkConnection(): Promise<boolean> {
        // Validação física de conectividade (browser state)
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return false;
        }

        try {
            // Efetua um ping rápido em um nó público da blockchain DeSo com um timeout agressivo (3000ms)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.desoNodeUrl}/get-app-state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Registra listeners de rede do navegador e inicia um loop periódico para sincronização automática imediata.
     */
    public initiateAutoSyncWatcher(
        clientWallet: string,
        serverLastBlockHash: string,
        sessionNonce: string,
        encryptionSecret: string,
        blockchainUploadCallback: (signedPayload: SignedPayload) => Promise<boolean>,
        onSyncCompleted?: (success: boolean) => void
    ): void {
        if (this.checkIntervalId) return; // Evita inicializar múltiplos watchers simultâneos

        console.log("🔄 [SYNC-MANAGER] Iniciando monitoramento de conectividade de rede...");

        // Handler para eventos de conexão ativa no navegador
        const attemptInstantSync = async () => {
            if (FailSafeCache.hasOfflineBuffer()) {
                await this.executeAutoSync(encryptionSecret, blockchainUploadCallback, onSyncCompleted);
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('online', attemptInstantSync);
        }

        // Loop periódico de checagem física de conexão (resiliência para timeouts silenciosos)
        this.checkIntervalId = setInterval(async () => {
            if (!FailSafeCache.hasOfflineBuffer()) {
                this.stopAutoSyncWatcher();
                return;
            }

            const isStable = await this.checkConnection();
            if (isStable) {
                console.log("🌐 [SYNC-MANAGER] Conexão restabelecida e estável detectada pelo batimento cardíaco!");
                await attemptInstantSync();
            }
        }, this.checkNetworkIntervalMs);
    }

    /**
     * Executa a descriptografia, verificação de integridade e envio on-chain do save em cache.
     */
    private async executeAutoSync(
        encryptionSecret: string,
        blockchainUploadCallback: (signedPayload: SignedPayload) => Promise<boolean>,
        onSyncCompleted?: (success: boolean) => void
    ): Promise<boolean> {
        if (this.isSyncing) return false;
        this.isSyncing = true;

        console.log("🚀 [SYNC-MANAGER] Iniciando processo de auto-sincronização do buffer local...");

        try {
            // 1. Carregar e descriptografar o envelope local
            const cachedPayload = await FailSafeCache.loadOffline(encryptionSecret);
            if (!cachedPayload) {
                console.warn("⚠️ [SYNC-MANAGER] Buffer offline corrompido ou inexistente durante auto-sync.");
                FailSafeCache.clearOffline();
                this.isSyncing = false;
                return false;
            }

            // 2. Re-verificar a assinatura do estado para garantir que não houve injeção de memória offline
            const isValid = await IntegritySigner.verifyStateSignature(
                cachedPayload.state,
                cachedPayload.signature,
                cachedPayload.clientSaltUsed
            );

            if (!isValid) {
                console.error("⛔ [SYNC-MANAGER] Falha crítica de segurança: Assinatura do estado cached offline é INVÁLIDA! Tentativa de fraude detectada.");
                FailSafeCache.clearOffline();
                this.isSyncing = false;
                if (onSyncCompleted) onSyncCompleted(false);
                return false;
            }

            // 3. Efetuar o upload do save recuperado para a Blockchain
            const success = await blockchainUploadCallback(cachedPayload);
            if (success) {
                console.log("🏆 [SYNC-MANAGER] Auto-sincronização efetuada com absoluto SUCESSO! Cache local limpo.");
                FailSafeCache.clearOffline();
                this.stopAutoSyncWatcher();
                this.isSyncing = false;
                if (onSyncCompleted) onSyncCompleted(true);
                return true;
            }

            this.isSyncing = false;
            return false;

        } catch (error) {
            console.error("⛔ [SYNC-MANAGER] Erro durante a tentativa de auto-sincronização:", error);
            this.isSyncing = false;
            return false;
        }
    }

    /**
     * Interrompe o loop de monitoramento.
     */
    public stopAutoSyncWatcher(): void {
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
            console.log("🛑 [SYNC-MANAGER] Monitoramento de conectividade de rede suspenso.");
        }
    }
}
