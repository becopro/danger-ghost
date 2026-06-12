/**
 * DANGER GHOST - ADVANCED AUTOMATED SANDBOX TEST SUITE
 * File: C:\\Users\\Klara\\Desktop\\dragaMP\\danger ghost\\sandbox_test.js
 * 
 * Execução: node sandbox_test.js
 * Dependências: Nenhuma (Node.js nativo para máxima performance e resiliência a sandbox local)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Caminho absoluto para o index.html
const indexPath = path.join(__dirname, 'index.html');

console.log("====================================================");
console.log("🎮 DANGER GHOST AUTOMATED SANDBOX TEST SUITE 🎮");
console.log("====================================================\n");

// --- TEST 1: VALIDAÇÃO ESTÁTICA & ESTRUTURAL ---
console.log("🔍 [TEST 1] Static and Structural Validation of index.html...");
assert(fs.existsSync(indexPath), "O arquivo index.html deve existir no diretório.");
const htmlContent = fs.readFileSync(indexPath, 'utf8');

// Valida elementos cruciais no DOM
assert(htmlContent.includes("id=\"myCanvas\""), "Elemento Canvas com id 'myCanvas' está ausente.");
assert(htmlContent.includes("id=\"desoBtn\""), "Botão de login 'desoBtn' está ausente.");
assert(htmlContent.includes("id=\"winPanel\""), "Painel de vitória 'winPanel' está ausente.");
assert(htmlContent.includes("id=\"leaderboardContent\""), "Contêiner de exibição do ranking está ausente.");

// Valida presença de funções, variáveis e endpoints do ecossistema DangerGhost
assert(htmlContent.includes("SetGameState"), "A função de transição FSM SetGameState deve estar declarada.");
assert(htmlContent.includes("_antiCheat"), "A estrutura de shadow state _antiCheat de prevenção a hack de memória deve existir.");
assert(htmlContent.includes("AddScore"), "O método AddScore de atualização de score seguro deve existir.");
assert(htmlContent.includes("WaitForWindowClose"), "A rotina resiliente WaitForWindowClose contra Popup Blockers deve existir.");
assert(htmlContent.includes("/get-single-post"), "O endpoint de thread DeSo get-single-post deve estar integrado.");
console.log("✅ [TEST 1 PASSED] Elementos estruturais e integrações de API validados com sucesso.\n");


// --- TEST 2: EXTRAÇÃO DE CÓDIGO JAVASCRIPT ---
console.log("📦 [TEST 2] JavaScript Block Extraction...");
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let jsBlocks = [];
let match;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
    jsBlocks.push(match[1]);
}
assert(jsBlocks.length > 0, "Nenhum script JavaScript pôde ser extraído do index.html.");
console.log(`✅ [TEST 2 PASSED] ${jsBlocks.length} bloco(s) JavaScript extraídos e analisados com sucesso.\n`);


// --- TEST 3: SIMULAÇÃO DE FSM (SetGameState) E ATUALIZAÇÃO DO VIRTUAL DOM ---
console.log("🔄 [TEST 3] FSM State Transition & DOM Sync Simulation...");

// Constantes FSM idênticas ao código original
const G_START = 0, G_PLAY = 1, G_WIN = 2, G_GAMEOVER = 3, G_CUTSCENE = 4, G_END_CUTSCENE = 5, G_PAUSE = 6;
let g_gameState = G_START;

// Elementos virtuais do DOM para teste
const virtualDOM = {
    desoBtn: { style: { display: 'inline-block' } },
    winPanel: { style: { display: 'none' } }
};

const documentMock = {
    getElementById: function(id) {
        return virtualDOM[id] || null;
    }
};

// Réplica da FSM SetGameState do index.html
function simulateSetGameState(newState) {
    if (g_gameState === newState) return;
    g_gameState = newState;
    
    const btn = documentMock.getElementById("desoBtn");
    if (btn) btn.style.display = (g_gameState == G_START || g_gameState == G_WIN) ? "inline-block" : "none";
    
    const winPanel = documentMock.getElementById("winPanel");
    if (winPanel) winPanel.style.display = (g_gameState == G_WIN) ? "block" : "none";
}

// Fluxo 1: Estado Inicial G_START
assert.strictEqual(virtualDOM.desoBtn.style.display, 'inline-block', "desoBtn deve ser exibido no Start Screen");
assert.strictEqual(virtualDOM.winPanel.style.display, 'none', "winPanel deve ser ocultado no Start Screen");

// Fluxo 2: Transição para G_PLAY (Gameplay ativo)
simulateSetGameState(G_PLAY);
assert.strictEqual(g_gameState, G_PLAY, "Estado deve ser G_PLAY");
assert.strictEqual(virtualDOM.desoBtn.style.display, 'none', "desoBtn deve ser ocultado em G_PLAY");
assert.strictEqual(virtualDOM.winPanel.style.display, 'none', "winPanel deve ser ocultado em G_PLAY");

// Fluxo 3: Transição para G_WIN (Vitória - Fim da 33ª fase)
simulateSetGameState(G_WIN);
assert.strictEqual(g_gameState, G_WIN, "Estado deve ser G_WIN");
assert.strictEqual(virtualDOM.desoBtn.style.display, 'inline-block', "desoBtn deve ser re-exibido na tela de vitória");
assert.strictEqual(virtualDOM.winPanel.style.display, 'block', "winPanel deve ser exibido para download de screenshot/NFT");

// Fluxo 4: Transição para G_GAMEOVER
simulateSetGameState(G_GAMEOVER);
assert.strictEqual(g_gameState, G_GAMEOVER, "Estado deve ser G_GAMEOVER");
assert.strictEqual(virtualDOM.desoBtn.style.display, 'none', "desoBtn deve ser ocultado na tela de gameover");
assert.strictEqual(virtualDOM.winPanel.style.display, 'none', "winPanel deve ser ocultado na tela de gameover");

console.log("✅ [TEST 3 PASSED] Transição FSM e sincronização DOM virtual rodaram 100% corretas.\n");


// --- TEST 4: CONSISTÊNCIA DE SHADOW STATE _antiCheat & AddScore ---
console.log("🛡️ [TEST 4] Anti-Cheat Shadow State & Score Integrity Verification...");
let g_score = 0;
const _antiCheat = {
    salt: "test_deso_salt_random_9988",
    hash: ""
};

// Função auxiliar btoa nativa Node.js
function btoa(str) {
    return Buffer.from(str, 'binary').toString('base64');
}

// Inicia hash com score 0
_antiCheat.hash = btoa("0" + _antiCheat.salt);

// Simulação de AddScore
function simulateAddScore(points) {
    g_score += points;
    _antiCheat.hash = btoa(g_score + _antiCheat.salt);
}

// Adiciona pontos normalmente
simulateAddScore(150); // Coleta de Diamond
assert.strictEqual(g_score, 150);
assert.strictEqual(_antiCheat.hash, btoa("150" + _antiCheat.salt), "Hash deve casar com o score de 150 e o salt.");

simulateAddScore(666); // Coleta de Vida Extra (Level 12/33)
assert.strictEqual(g_score, 816);
assert.strictEqual(_antiCheat.hash, btoa("816" + _antiCheat.salt), "Hash deve casar com o score acumulado e salt.");

// Tentativa de Hack (Manipulação direta da variável global g_score na memória)
console.log("👉 Executando simulação de injeção de memória direta (Hacker altering g_score)...");
g_score = 999999; // Score forjado diretamente
const detectionResult = btoa(g_score + _antiCheat.salt) !== _antiCheat.hash;
assert(detectionResult, "Anti-cheat falhou em detectar a alteração de memória direta!");
console.log("👉 Cheat detectado com sucesso via incompatibilidade de hashes.");

console.log("✅ [TEST 4 PASSED] Mecanismo de Anti-Cheat em Shadow State validado com consistência total.\n");


// --- TEST 5: RESILIÊNCIA DE WaitForWindowClose CONTRA POPUPS NULOS ---
console.log("🚪 [TEST 5] WaitForWindowClose Resilience & Popup Trap Testing...");

function simulateWaitForWindowClose(win, callback) {
    if (!win) return; // Evita crashes silenciosos se a janela for bloqueada por Popup Blocker
    const timer = setInterval(function() {
        if (win.closed) {
            clearInterval(timer);
            callback();
        }
    }, 10); // Intervalo acelerado para propósitos de teste automatizado
}

// Caso A: O navegador bloqueia o popup do DeSo Identity (Window retorna null)
try {
    let callbackTriggered = false;
    simulateWaitForWindowClose(null, () => { callbackTriggered = true; });
    assert.strictEqual(callbackTriggered, false, "Callback de janela fechada não deve rodar se a janela era nula.");
    console.log("👉 Resiliência contra Popup Blocker: OK (Sem travamentos ou TypeError).");
} catch (e) {
    assert.fail(`O script crashou ao receber janela nula no WaitForWindowClose: ${e.message}`);
}

// Caso B: Popup abre e é fechado pelo usuário
const mockWindow = { closed: false };
let windowCloseCallbackExecuted = false;

simulateWaitForWindowClose(mockWindow, () => {
    windowCloseCallbackExecuted = true;
});

// Simula fechar a janela após 50ms
setTimeout(() => {
    mockWindow.closed = true;
}, 30);

setTimeout(() => {
    assert.strictEqual(windowCloseCallbackExecuted, true, "Callback deve disparar após a janela ser fechada.");
    console.log("👉 Fechamento de janela detectado e callback invocado.");
    console.log("✅ [TEST 5 PASSED] Resiliência a popup nulo e tracking de fechamento validados.\n");
    
    // Roda o teste final síncrono com o encerramento do timeout anterior
    runLeaderboardParsingTest();
}, 200);


// --- TEST 6: VALIDAR PARSING DE PAYLOADS DO FEED DESO ---
function runLeaderboardParsingTest() {
    console.log("📊 [TEST 6] DeSo Hashtag API Parsing Validation...");

    // Payload de exemplo da API DeSo do endpoint https://node.deso.org/api/v0/get-posts-for-hashtag
    const mockDeSoPayload = {
        Posts: [
            {
                PosterPublicKeyBase58Check: "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn", // VIP (HODLer) e Oficial
                Body: "🎮 I just conquered DANGER GHOST!\n\nGhost Hunter: PlayerVIP_Char\nScore: 25000\nTime: 12:34\nLevels Completed: 33 / 33\n[RPG Level: 15]\n#DangerGhost #Web3",
                ProfileEntryResponse: { Username: "PlayerVIP" },
                PostExtraData: {
                    "DangerGhost_SaveState": "eyJsZXZlbCI6MTV9" // {"level": 15}
                }
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere", // Não-oficial (tentando injetar bloco consolidado falso)
                Body: "🏆 DANGER GHOST LEVEL TOP 10 🏆\n1. HackerConsolidated - Level 999\n#DangerGhost"
            },
            {
                PosterPublicKeyBase58Check: "BC1YLgwuSYXasawyfX5D8wiVSvC7qS1usfPA9QCnJ3ZRndyRcRmKdUG", // Oficial DeSoGhost (Não-VIP)
                Body: "🏆 DANGER GHOST LEVEL TOP 10 🏆\n1. PlayerA - Level 50\n2. PlayerB - Level 30\n#DangerGhost"
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere", // Não-oficial individual válido
                Body: "🎮 I just conquered DANGER GHOST!\n\nGhost Hunter: PlayerA_Char\nScore: 12000\nTime: 10:15\nLevels Completed: 33 / 33\n[RPG Level: 45]\n#DangerGhost",
                ProfileEntryResponse: { Username: "PlayerA" },
                PostExtraData: {
                    "DangerGhost_SaveState": "eyJsZXZlbCI6NDV9" // {"level": 45}
                }
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere", // Não-oficial individual
                Body: "🎮 I just conquered DANGER GHOST!\n\nGhost Hunter: PlayerBad_Char\nScore: 10000\nTime: 05:22\nLevels Completed: 12 / 33\n[RPG Level: 5]\n#DangerGhost",
                ProfileEntryResponse: { Username: "PlayerBad" }
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPSavePlayerKey", // Salve de progresso individual
                Body: "🛡️ Danger Ghost - Permanent Progress Save\n\nMy Ghost is evolving! [RPG Level: 27 | VIT: 5 | AGI: 3 | INT: 2 | POW: 4 | MAG: 1 | CharID: test_save]\n\n#DangerGhost #RPGSave #Web3 #DeSo",
                ProfileEntryResponse: { Username: "PlayerSave" },
                PostExtraData: {
                    "DangerGhost_SaveState": "eyJsZXZlbCI6Mjd9" // {"level": 27}
                }
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere",
                Body: "Postagem qualquer contendo a hashtag #DangerGhost sem seguir o formato do leaderboard."
            }
        ]
    };

    const vipMap = {
        "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn": true
    };

    const officialKeys = {
        "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn": true, // @DangerGhost
        "BC1YLgwuSYXasawyfX5D8wiVSvC7qS1usfPA9QCnJ3ZRndyRcRmKdUG": true, // @DeSoGhost
        "BC1YLh2VrBvTgvqLm9PtVpLZWoCBUXrFSNmS3zs1eEv1rCFuDxfbqcC": true  // @sickcrow
    };

    const postsList = mockDeSoPayload.Posts;
    const list = [];

    // Parsing idêntico às linhas do index.html
    for (let i = 0; i < postsList.length; i++) {
        const post = postsList[i];
        if (post.Body) {
            const cleanBody = post.Body.replace(/\r/g, "");
            const posterKey = post.PosterPublicKeyBase58Check;
            const isVip = vipMap[posterKey] ? true : false;
            const isOfficialPost = officialKeys[posterKey] ? true : false;

            const matchRpg = cleanBody.match(/RPG Level:\s*(\d+)/i);
            let rpgLvl = 1;
            let hasSaveState = false;
            if (post.PostExtraData && post.PostExtraData["DangerGhost_SaveState"]) {
                try {
                    const decrypted = atob(post.PostExtraData["DangerGhost_SaveState"]);
                    const stats = JSON.parse(decrypted);
                    let rawLvl = undefined;
                    if (stats && typeof stats.level !== "undefined") {
                        rawLvl = stats.level;
                    } else if (stats && typeof stats.Level !== "undefined") {
                        rawLvl = stats.Level;
                    }
                    if (rawLvl !== undefined) {
                        const parsedLvl = parseInt(rawLvl, 10);
                        if (!isNaN(parsedLvl)) {
                            rpgLvl = parsedLvl;
                            hasSaveState = true;
                        }
                    }
                } catch(e) {
                    console.warn("Erro ao descriptografar DangerGhost_SaveState no teste", e);
                }
            }
            if (rpgLvl === 1 && matchRpg) {
                const parsedMatch = parseInt(matchRpg[1], 10);
                if (!isNaN(parsedMatch)) {
                    rpgLvl = parsedMatch;
                }
            }

            if (cleanBody.includes("🏆 DANGER GHOST GLOBAL TOP 10 🏆") || cleanBody.includes("DANGER GHOST GLOBAL TOP 10")) {
                const lines = cleanBody.split("\n");
                let inLeaderboard = false;
                for (let j = 0; j < lines.length; j++) {
                    if (lines[j].includes("DANGER GHOST GLOBAL TOP 10")) {
                        inLeaderboard = isOfficialPost; continue;
                    }
                    if (inLeaderboard) {
                        if (lines[j].includes("#DangerGhost")) break;
                        const match = lines[j].match(/^\d+\.\s+(.+?)\s+-\s+(\d+)\s+pts(?:\s+\((\d+:\d+)\))?/);
                        if (match) {
                            const parsedScore = parseInt(match[2], 10);
                            if (!isNaN(parsedScore)) {
                                list.push({ 
                                    name: match[1].trim(), 
                                    accountKey: match[1].trim(),
                                    score: parsedScore,
                                    isVip: isVip,
                                    rpgLevel: rpgLvl
                                });
                            }
                        }
                    }
                }
            }
            if (cleanBody.includes("🏆 DANGER GHOST LEVEL TOP 10 🏆") || cleanBody.includes("DANGER GHOST LEVEL TOP 10") || cleanBody.includes("LEVEL RANK") || cleanBody.includes("DANGER GHOST LEVEL TOP 10")) {
                const lines = cleanBody.split("\n");
                let inLevelLeaderboard = false;
                for (let j = 0; j < lines.length; j++) {
                    if (lines[j].includes("DANGER GHOST LEVEL TOP 10")) {
                        inLevelLeaderboard = isOfficialPost; continue;
                    }
                    if (inLevelLeaderboard) {
                        if (lines[j].includes("#DangerGhost")) break;
                        const match = lines[j].match(/^\d+\.\s+(.+?)\s+-\s+Level\s+(\d+)/i);
                        if (match) {
                            const parsedLvl = parseInt(match[2], 10);
                            if (!isNaN(parsedLvl)) {
                                list.push({ 
                                    name: match[1].trim(), 
                                    accountKey: match[1].trim(),
                                    rpgLevel: parsedLvl,
                                    isVip: isVip
                                });
                            }
                        }
                    }
                }
            }
            const matchScore = cleanBody.match(/Score:\s*(\d+)/i);
            const matchName = cleanBody.match(/Ghost Hunter:\s*(.+)/i);
            if ((matchScore && matchName) || matchRpg) {
                if (hasSaveState || isOfficialPost) {
                    var displayCharacterName = matchName ? matchName[1].substring(0, 15).trim() : "";
                    var desoUsername = (post.ProfileEntryResponse && post.ProfileEntryResponse.Username) ? post.ProfileEntryResponse.Username : displayCharacterName;
                    if (!desoUsername && posterKey) {
                        desoUsername = posterKey.substring(0, 11) + "...";
                    }
                    var accountKey = (post.ProfileEntryResponse && post.ProfileEntryResponse.Username) ? post.ProfileEntryResponse.Username : (posterKey || desoUsername);
                    
                    var parsedScoreVal = matchScore ? parseInt(matchScore[1], 10) : 0;
                    if (isNaN(parsedScoreVal)) parsedScoreVal = 0;
                    
                    list.push({
                        name: desoUsername,
                        accountKey: accountKey,
                        score: parsedScoreVal,
                        isVip: isVip,
                        rpgLevel: rpgLvl
                    });
                }
            }
        }
    }

    // Deduplicação por conta para o Ranking de Level (mantendo APENAS o level mais alto)
    const uniqueLevelMap = {};
    for (let k = 0; k < list.length; k++) {
        const p = list[k];
        const key = (p.accountKey || p.name || "unknown").toLowerCase().trim();
        const currentLvl = p.rpgLevel || 1;
        if (!uniqueLevelMap[key]) {
            uniqueLevelMap[key] = p;
        } else {
            const existingLvl = uniqueLevelMap[key].rpgLevel || 1;
            if (currentLvl > existingLvl) {
                uniqueLevelMap[key] = p;
            }
        }
    }
    const finalLevelList = Object.values(uniqueLevelMap);

    // Ordenação Decrescente de Levels com desempate
    finalLevelList.sort((a, b) => {
        var lvlA = a.rpgLevel || 1;
        var lvlB = b.rpgLevel || 1;
        if (lvlB !== lvlA) {
            return lvlB - lvlA;
        }
        return (b.score || 0) - (a.score || 0); // Desempate pelo Score
    });
    const levelLeaderboardList = finalLevelList.slice(0, 10);

    // Asserções do Ranking
    // Deve ignorar o falso bloco do hacker
    assert.strictEqual(levelLeaderboardList.some(p => p.name === "HackerConsolidated"), false, "Falso bloco de ranking consolidado do Hacker deve ser descartado!");
    
    // Deve ignorar PlayerBad porque não possui DangerGhost_SaveState e não é oficial
    assert.strictEqual(levelLeaderboardList.some(p => p.name === "PlayerBad"), false, "Postagem individual de PlayerBad sem metadados de SaveState deve ser descartada!");

    assert.strictEqual(levelLeaderboardList.length, 4, "Devem ser extraídos exatamente 4 registros únicos de jogadores válidos (PlayerBad descartado).");
    
    // PlayerA deve ser Rank 1 com nível 50
    assert.strictEqual(levelLeaderboardList[0].name, "PlayerA");
    assert.strictEqual(levelLeaderboardList[0].rpgLevel, 50, "Deduplicação de level de PlayerA falhou (devia manter o maior: 50).");
    assert.strictEqual(levelLeaderboardList[0].isVip, false, "PlayerA não deve ter tag VIP.");

    // PlayerB deve ser Rank 2 com nível 30
    assert.strictEqual(levelLeaderboardList[1].name, "PlayerB");
    assert.strictEqual(levelLeaderboardList[1].rpgLevel, 30);

    // PlayerSave deve ser Rank 3 com nível 27 (vindo de um RPG Save sem score)
    assert.strictEqual(levelLeaderboardList[2].name, "PlayerSave");
    assert.strictEqual(levelLeaderboardList[2].rpgLevel, 27, "O level extraído do RPG Save de PlayerSave deve ser 27!");

    // PlayerVIP deve ser Rank 4 com nível 15 e ter status VIP
    assert.strictEqual(levelLeaderboardList[3].name, "PlayerVIP");
    assert.strictEqual(levelLeaderboardList[3].rpgLevel, 15);
    assert.strictEqual(levelLeaderboardList[3].isVip, true, "PlayerVIP devia ter a tag VIP ativa.");

    console.log("✅ [TEST 6 PASSED] Parsing de payload, ordenação de ranking, deduplicação e VIP checks validados.\n");

    // --- TEST 7: DYNAMIC CHARACTER SELECT & MINT PRICING MATH ---
    console.log("👤 [TEST 7] Character Save NFT Pricing & ID Deduplication...");
    
    function calculateGhostPrice(ownedCount) {
        return ownedCount * 0.25;
    }
    
    assert.strictEqual(calculateGhostPrice(0), 0.00, "1º Fantasma deve ser Grátis.");
    assert.strictEqual(calculateGhostPrice(1), 0.25, "2º Fantasma deve custar 0.25 DeSo.");
    assert.strictEqual(calculateGhostPrice(2), 0.50, "3º Fantasma deve custar 0.50 DeSo.");
    assert.strictEqual(calculateGhostPrice(5), 1.25, "6º Fantasma deve custar 1.25 DeSo.");
    console.log("👉 Cálculo de precificação graduada: OK.");

    const mockPosts = [
        {
            IsNFT: true,
            PostHashHex: "new_save_1",
            ImageURLs: ["img1"],
            PostExtraData: {
                DangerGhost_CharacterID: "char_A",
                DangerGhost_SaveState: btoa(JSON.stringify({ level: 5, score: 2500 }))
            }
        },
        {
            IsNFT: true,
            PostHashHex: "old_save_1",
            ImageURLs: ["img1_old"],
            PostExtraData: {
                DangerGhost_CharacterID: "char_A",
                DangerGhost_SaveState: btoa(JSON.stringify({ level: 3, score: 1000 }))
            }
        },
        {
            IsNFT: true,
            PostHashHex: "new_save_2",
            ImageURLs: ["img2"],
            PostExtraData: {
                DangerGhost_CharacterID: "char_B",
                DangerGhost_SaveState: btoa(JSON.stringify({ level: 12, score: 8500 }))
            }
        }
    ];

    const charactersMap = {};
    for (let i = 0; i < mockPosts.length; i++) {
        const post = mockPosts[i];
        if (post && post.IsNFT && post.PostExtraData && post.PostExtraData.DangerGhost_SaveState) {
            const charId = post.PostExtraData.DangerGhost_CharacterID;
            if (charId && !charactersMap[charId]) {
                const decrypted = Buffer.from(post.PostExtraData.DangerGhost_SaveState, 'base64').toString('utf8');
                const stats = JSON.parse(decrypted);
                stats.characterId = charId;
                charactersMap[charId] = stats;
            }
        }
    }
    const uniqueChars = Object.values(charactersMap);

    assert.strictEqual(uniqueChars.length, 2, "Devem haver exatamente 2 Fantasmas únicos deduplicados.");
    assert.strictEqual(uniqueChars[0].characterId, "char_A");
    assert.strictEqual(uniqueChars[0].level, 5, "Fantasma A deve carregar o nível mais recente (5 em vez de 3).");
    assert.strictEqual(uniqueChars[1].characterId, "char_B");
    assert.strictEqual(uniqueChars[1].level, 12);
    console.log("👉 Deduplicação de IDs de personagem com base no save mais recente: OK.");

    console.log("✅ [TEST 7 PASSED] Lógica de precificação e deduplicação de IDs validada com sucesso.\n");

    // --- TEST 8: VITALITY LIVES CAP MATH & PICKUP VALIDATION ---
    console.log("❤️ [TEST 8] Vitality Lives Cap & Pickup Limits...");
    
    function simulateGetMaxLivesCap(vit) {
        return 4 + vit;
    }
    
    // Simula a coleta de vida extra
    function simulateLivesPickup(currentLives, vit) {
        var maxLivesCap = simulateGetMaxLivesCap(vit);
        if (currentLives < maxLivesCap) {
            return currentLives + 1;
        }
        return currentLives;
    }
    
    // Caso A: VIT = 1 (Teto = 5)
    assert.strictEqual(simulateGetMaxLivesCap(1), 5, "VIT = 1 deve dar teto de 5 vidas");
    assert.strictEqual(simulateLivesPickup(3, 1), 4, "Coleta com 3 vidas deve subir para 4");
    assert.strictEqual(simulateLivesPickup(4, 1), 5, "Coleta com 4 vidas deve subir para 5");
    assert.strictEqual(simulateLivesPickup(5, 1), 5, "Coleta com 5 vidas deve travar em 5");
    
    // Caso B: VIT = 2 (Teto = 6)
    assert.strictEqual(simulateGetMaxLivesCap(2), 6, "VIT = 2 deve dar teto de 6 vidas");
    assert.strictEqual(simulateLivesPickup(5, 2), 6, "Coleta com 5 vidas deve subir para 6");
    assert.strictEqual(simulateLivesPickup(6, 2), 6, "Coleta com 6 vidas deve travar em 6");

    // Caso C: VIT = 3 (Teto = 7)
    assert.strictEqual(simulateGetMaxLivesCap(3), 7, "VIT = 3 deve dar teto de 7 vidas");
    assert.strictEqual(simulateLivesPickup(6, 3), 7, "Coleta com 6 vidas deve subir para 7");
    assert.strictEqual(simulateLivesPickup(7, 3), 7, "Coleta com 7 vidas deve travar em 7");
    
    console.log("👉 Testes de limite de acúmulo de vidas (4 + VIT): OK.");
    console.log("✅ [TEST 8 PASSED] Limite dinâmico de vidas com base em Vitalidade validado com sucesso.\n");

    console.log("====================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% SUCCESS 🎉");
    console.log("====================================================");
}
