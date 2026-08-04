/*
 * ============================================================================
 * CLIENTE HTTP DE CLOUD SAVE & GOOGLE SIGN-IN - DANGER GHOST
 * ============================================================================
 *
 * COMO INSTALAR E CONFIGURAR O @capacitor-community/google-sign-in NO CAPACITOR:
 *
 * 1. Instalação via NPM:
 *    No diretório raiz do projeto Capacitor (onde está o capacitor.config.ts/.json),
 *    execute os seguintes comandos no terminal:
 *      npm install @capacitor-community/google-sign-in
 *      npx cap sync
 *
 * 2. Configuração do Plugin (capacitor.config.ts ou capacitor.config.json):
 *    Adicione a configuração do plugin GoogleAuth indicando seu Server Client ID
 *    (obtido no Console do Google Cloud) e os escopos desejados:
 *
 *    // Em capacitor.config.ts:
 *    import { CapacitorConfig } from '@capacitor/cli';
 *
 *    const config: CapacitorConfig = {
 *      appId: 'com.dangerghost.app',
 *      appName: 'Danger Ghost',
 *      webDir: 'www',
 *      plugins: {
 *        GoogleAuth: {
 *          scopes: ['profile', 'email'],
 *          serverClientId: 'SEU_CLIENT_ID_DO_GOOGLE.apps.googleusercontent.com',
 *          forceCodeForRefreshToken: true
 *        }
 *      }
 *    };
 *    export default config;
 *
 *    // Ou em capacitor.config.json:
 *    {
 *      "plugins": {
 *        "GoogleAuth": {
 *          "scopes": ["profile", "email"],
 *          "serverClientId": "SEU_CLIENT_ID_DO_GOOGLE.apps.googleusercontent.com",
 *          "forceCodeForRefreshToken": true
 *        }
 *      }
 *    }
 *
 * 3. Configuração no Android (android/app/src/main/res/values/strings.xml):
 *    Configure a string do Client ID no arquivo strings.xml do seu projeto Android:
 *      <string name="server_client_id">SEU_CLIENT_ID_DO_GOOGLE.apps.googleusercontent.com</string>
 *    No Capacitor 5+, o autodescobrimento (auto-discovery) de plugins registra
 *    automaticamente o GoogleAuth no Android (MainActivity). Caso esteja em uma versão
 *    antiga que exija registro manual no MainActivity.java:
 *      registerPlugin(com.codetrixstudio.capacitor.GoogleAuth.class);
 *
 * 4. Como Usar no Código (WebView Nativa Android/iOS):
 *    - O objeto nativo do Capacitor expõe o plugin através de:
 *        window.Capacitor.Plugins.GoogleAuth
 *    - Para autenticar o jogador:
 *        const user = await window.Capacitor.Plugins.GoogleAuth.signIn();
 *    - Propriedades capturadas no retorno do login:
 *        - user.authentication.idToken (Token JWT do Google para validar no backend)
 *        - user.id (ID único do Google)
 *        - user.email (E-mail da conta Google)
 *        - user.name / user.displayName (Nome de perfil do usuário)
 * ============================================================================
 */

const API_BASE_URL = (typeof window !== 'undefined' && window.CLOUD_API_URL) || "https://server.ghostgames.club"; // Endpoint da API na Deso Hosting

function getCloudApiUrl() {
    return (typeof window !== 'undefined' && window.CLOUD_API_URL) || API_BASE_URL;
}

/**
 * Helper para gerar um dicionário estruturado representando o estado completo
 * do jogo do jogador para salvar na nuvem (Ghostdex, fantasmas desbloqueados, estatísticas e evoluções).
 *
 * @returns {Object} Dicionário do estado do jogo.
 */
function getGhostdexDictionaryForCloud() {
    const win = typeof window !== 'undefined' ? window : {};
    return {
        ghostdex: win.GhostdexData || {},
        unlockedGhosts: win.g_unlockedGhosts || ['001'],
        currentGhost: win.g_currentPlayerGhost || '001',
        stats: {
            level: win.g_currentLevel || 1,
            xp: win.g_xp || 0
        },
        evolutions: win.g_ghostEvolutions || {},
        timestamp: Date.now()
    };
}

/**
 * Realiza autenticação com o Google Sign-In (compatível com Capacitor Android WebView e Web Browser padrão),
 * envia as credenciais para o servidor e armazena JWT e perfil no localStorage.
 *
 * @returns {Promise<{success: boolean, profile?: Object, gameData?: Object, error?: string}>}
 */
async function LoginWithGoogle() {
    const isNative = typeof window !== 'undefined' &&
                     typeof window.Capacitor !== 'undefined' &&
                     window.Capacitor.isNativePlatform();

    let loginPayload = {};

    if (isNative) {
        try {
            // Ambiente Nativo do Capacitor (Android WebView / iOS)
            // Utiliza window.Capacitor.Plugins.GoogleAuth.signIn() de @capacitor-community/google-sign-in
            const googleAuth = window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth;
            if (!googleAuth) {
                throw new Error("Plugin GoogleAuth do Capacitor (@capacitor-community/google-sign-in) não encontrado.");
            }

            const user = await googleAuth.signIn();
            const idToken = (user.authentication && user.authentication.idToken) ? user.authentication.idToken : user.idToken;
            const id = user.id;
            const email = user.email;
            const name = user.name || user.displayName || user.givenName || email;

            if (idToken) {
                loginPayload = { idToken, googleId: id, email, name };
            } else {
                loginPayload = { googleId: id, email, name };
            }
        } catch (err) {
            console.error("[CloudSave] Erro no Google Sign-In Nativo (Capacitor):", err);
            return { success: false, error: err.message || "Erro no Google Sign-In Nativo" };
        }
    } else {
        try {
            // Ambiente de Web Browser padrão
            // Suporta Google One Tap / popup fallback via google.accounts.id ou solicita dados ao usuário
            let idToken = null;

            if (typeof window !== 'undefined' && window.google && window.google.accounts && window.google.accounts.id && window.GOOGLE_CLIENT_ID) {
                idToken = await new Promise((resolve) => {
                    try {
                        window.google.accounts.id.initialize({
                            client_id: window.GOOGLE_CLIENT_ID,
                            callback: (response) => {
                                if (response && response.credential) {
                                    resolve(response.credential);
                                } else {
                                    resolve(null);
                                }
                            }
                        });
                        window.google.accounts.id.prompt((notification) => {
                            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                                resolve(null);
                            }
                        });
                    } catch (e) {
                        resolve(null);
                    }
                });
            }

            if (idToken) {
                loginPayload = { idToken };
            } else {
                // Fallback via prompt do navegador quando Google One Tap / GSI não estiver configurado ou disponível
                const emailInput = typeof window !== 'undefined' ? window.prompt("Google Login (Web) - Digite seu e-mail do Google:", "ghosthunter@gmail.com") : null;
                if (!emailInput) {
                    return { success: false, error: "Login cancelado pelo usuário." };
                }
                const nameInput = window.prompt("Digite o seu nome de jogador:", emailInput.split('@')[0]) || "Jogador";
                let hash = 0;
                for (let i = 0; i < emailInput.length; i++) {
                    hash = ((hash << 5) - hash) + emailInput.charCodeAt(i);
                    hash |= 0;
                }
                const googleId = "web_" + Math.abs(hash);
                loginPayload = { googleId, email: emailInput.trim(), name: nameInput.trim() };
            }
        } catch (err) {
            console.error("[CloudSave] Erro no Google Sign-In Web:", err);
            return { success: false, error: err.message || "Erro no Google Sign-In Web" };
        }
    }

    try {
        const apiUrl = getCloudApiUrl();
        const response = await fetch(`${apiUrl}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginPayload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            const errorMsg = data && data.error ? data.error : "Falha na autenticação com o servidor.";
            console.error("[CloudSave] Erro na API de login:", errorMsg);
            return { success: false, error: errorMsg };
        }

        // Salva o token JWT e o perfil no localStorage
        if (data.token) {
            localStorage.setItem('dg_cloud_jwt', data.token);
        }
        if (data.profile) {
            localStorage.setItem('dg_cloud_profile', JSON.stringify(data.profile));
        }

        console.log("[CloudSave] Login efetuado com sucesso na nuvem:", data.profile);
        return {
            success: true,
            profile: data.profile,
            gameData: data.gameData
        };
    } catch (networkErr) {
        console.error("[CloudSave] Erro de rede ou de comunicação HTTP ao logar:", networkErr);
        return { success: false, error: networkErr.message || "Erro de conexão ao servidor de login" };
    }
}

/**
 * Salva os dados do jogo (Ghostdex, evoluções e estatísticas) na nuvem.
 *
 * @param {Object} [dadosDoJogo] Dicionário de dados do jogo. Se não fornecido, utiliza getGhostdexDictionaryForCloud().
 * @returns {Promise<Object>} Resultado JSON da requisição.
 */
async function SaveToCloud(dadosDoJogo) {
    const jwt = localStorage.getItem('dg_cloud_jwt');
    if (!jwt) {
        console.warn("[CloudSave] Usuário não autenticado. Impossível salvar na nuvem.");
        return { success: false, error: "Usuário não autenticado" };
    }

    const payload = typeof dadosDoJogo !== 'undefined' && dadosDoJogo !== null ? dadosDoJogo : getGhostdexDictionaryForCloud();
    const apiUrl = getCloudApiUrl();

    try {
        const res = await fetch(`${apiUrl}/api/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwt
            },
            body: JSON.stringify({ gameData: payload })
        });

        const result = await res.json();
        if (res.ok && result.success !== false) {
            console.log("[CloudSave] Dicionário de Ghostdex e evolução salvo na nuvem com sucesso!");
        } else {
            console.warn("[CloudSave] Aviso retornado pelo servidor ao salvar:", result);
        }
        return result;
    } catch (err) {
        console.error("[CloudSave] Erro na comunicação ao salvar na nuvem:", err);
        return { success: false, error: err.message || "Erro de comunicação ao salvar na nuvem." };
    }
}

/**
 * Carrega da nuvem os dados salvos pelo jogador na API.
 *
 * @returns {Promise<Object|null>} Retorna res.json().then(d => d.gameData) com o dicionário do jogo.
 */
async function LoadFromCloud() {
    const jwt = localStorage.getItem('dg_cloud_jwt');
    if (!jwt) {
        console.warn("[CloudSave] Usuário não autenticado. Impossível carregar da nuvem.");
        return null;
    }

    const apiUrl = getCloudApiUrl();
    const res = await fetch(`${apiUrl}/api/load`, {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + jwt
        }
    });

    if (!res.ok) {
        console.warn("[CloudSave] Erro HTTP ao carregar da nuvem. Status:", res.status);
        throw new Error(`Erro na requisição de carregamento da nuvem (Status HTTP ${res.status})`);
    }

    return res.json().then(d => d.gameData);
}

// Exposição das funções e objeto global no escopo da janela (window)
const globalScope = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {});

globalScope.API_BASE_URL = API_BASE_URL;
globalScope.LoginWithGoogle = LoginWithGoogle;
globalScope.SaveToCloud = SaveToCloud;
globalScope.LoadFromCloud = LoadFromCloud;
globalScope.getGhostdexDictionaryForCloud = getGhostdexDictionaryForCloud;

globalScope.DangerGhostCloud = {
    get API_BASE_URL() {
        return getCloudApiUrl();
    },
    set API_BASE_URL(val) {
        if (typeof window !== 'undefined') {
            window.CLOUD_API_URL = val;
        }
    },
    LoginWithGoogle,
    SaveToCloud,
    LoadFromCloud,
    getGhostdexDictionaryForCloud
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        LoginWithGoogle,
        SaveToCloud,
        LoadFromCloud,
        getGhostdexDictionaryForCloud,
        DangerGhostCloud: globalScope.DangerGhostCloud
    };
}
