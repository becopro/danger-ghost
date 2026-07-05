const admin = require('firebase-admin');
require('dotenv').config();

// Inicialização do Firebase Admin com a chave de serviço (Service Account)
// Por segurança, as chaves devem estar em variáveis de ambiente, ou apontar para um arquivo local não commitado
let firebaseApp = null;
try {
    const serviceAccountParams = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
        : null;

    if (serviceAccountParams) {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccountParams)
        });
        console.log("[Auth] Firebase Admin inicializado com sucesso.");
    } else {
        console.warn("[Auth] FIREBASE_SERVICE_ACCOUNT não encontrado. O login estará operando em MOCK MODE (Inseguro!).");
    }
} catch (error) {
    console.error("[Auth] Erro ao inicializar o Firebase Admin SDK:", error);
}

class Auth {
    /**
     * Valida um id_token enviado pelo cliente e extrai uid e email.
     * @param {string} token - O JWT token recebido do cliente
     * @returns {Promise<{uid: string, email: string} | null>}
     */
    static async verifyGoogleToken(token) {
        // Fallback for Mock Mode
        if (!firebaseApp && process.env.NODE_ENV !== 'production') {
            console.log("[Auth] MOCK VERIFY: Ignorando assinatura para o token:", token);
            // In Mock mode, we pretend the token is valid if it has some format
            if (token) {
                if (token.includes("mock_")) {
                    const parts = token.split("_");
                    return {
                        uid: "mock_uid_" + (parts[1] || "user"),
                        email: (parts[1] || "user") + "@mock.com"
                    };
                } else {
                    // Tenta decodificar o payload de um JWT real (header.payload.signature)
                    try {
                        const payloadBase64 = token.split('.')[1];
                        if (payloadBase64) {
                            const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
                            return {
                                uid: payload.user_id || payload.sub || "mock_uid",
                                email: payload.email || "mock@mock.com"
                            };
                        }
                    } catch (e) {
                        console.warn("[Auth] MOCK VERIFY: Falha ao decodificar token, tratando como user padrão.");
                    }
                    return { uid: "mock_uid_default", email: "default@mock.com" };
                }
            }
            return null;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            return {
                uid: decodedToken.uid,
                email: decodedToken.email
            };
        } catch (error) {
            console.error("[Auth] Erro ao validar o token do Firebase:", error.message);
            return null;
        }
    }
}

module.exports = Auth;
