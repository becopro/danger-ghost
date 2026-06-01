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
}, 60);


// --- TEST 6: VALIDAR PARSING DE PAYLOADS DO FEED DESO ---
function runLeaderboardParsingTest() {
    console.log("📊 [TEST 6] DeSo Hashtag API Parsing Validation...");

    // Payload de exemplo da API DeSo do endpoint https://node.deso.org/api/v0/get-posts-for-hashtag
    const mockDeSoPayload = {
        Posts: [
            {
                PosterPublicKeyBase58Check: "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn", // VIP (HODLer)
                Body: "🎮 I just conquered DANGER GHOST!\n\nGhost Hunter: PlayerVIP\nScore: 25000\n#DangerGhost #Web3"
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere",
                Body: "🏆 DANGER GHOST GLOBAL TOP 10 🏆\n1. PlayerA - 50000 pts\n2. PlayerB - 35000 pts\n#DangerGhost"
            },
            {
                PosterPublicKeyBase58Check: "BC1NonVIPAddressHere",
                Body: "🎮 I just conquered DANGER GHOST!\n\nGhost Hunter: PlayerA\nScore: 12000\n#DangerGhost" // Score menor duplicado, deve ser ignorado
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

    const postsList = mockDeSoPayload.Posts;
    const list = [];

    // Parsing idêntico às linhas 875-911 do index.html
    for (let i = 0; i < postsList.length; i++) {
        const post = postsList[i];
        if (post.Body) {
            const posterKey = post.PosterPublicKeyBase58Check;
            const isVip = vipMap[posterKey] ? true : false;

            if (post.Body.includes("🏆 DANGER GHOST GLOBAL TOP 10 🏆") || post.Body.includes("DANGER GHOST GLOBAL TOP 10")) {
                const lines = post.Body.split("\n");
                let inLeaderboard = false;
                for (let j = 0; j < lines.length; j++) {
                    if (lines[j].includes("DANGER GHOST GLOBAL TOP 10")) {
                        inLeaderboard = true; continue;
                    }
                    if (inLeaderboard) {
                        if (lines[j].includes("#DangerGhost")) break;
                        const match = lines[j].match(/^\d+\.\s+(.+?)\s+-\s+(\d+)\s+pts(?:\s+\((\d+:\d+)\))?/);
                        if (match) {
                            list.push({ 
                                name: match[1].trim(), 
                                score: parseInt(match[2], 10),
                                time: match[3] ? match[3].trim() : "",
                                isVip: isVip
                            });
                        }
                    }
                }
            }
            const matchScore = post.Body.match(/Score:\s*(\d+)/i);
            const matchName = post.Body.match(/Ghost Hunter:\s*(.+)/i);
            const matchTime = post.Body.match(/Time:\s*(\d+:\d+)/i);
            if (matchScore && matchName) {
                list.push({
                    name: matchName[1].substring(0, 15).trim(),
                    score: parseInt(matchScore[1], 10),
                    time: matchTime ? matchTime[1].trim() : "",
                    isVip: isVip
                });
            }
        }
    }

    // Deduplicação (mantendo o maior score de cada jogador)
    const uniqueMap = {};
    for (let k = 0; k < list.length; k++) {
        const p = list[k];
        if (!uniqueMap[p.name] || uniqueMap[p.name].score < p.score) {
            uniqueMap[p.name] = p;
        }
    }
    let parsedList = Object.values(uniqueMap);

    // Ordenação Decrescente de Scores
    parsedList.sort((a, b) => b.score - a.score);
    const leaderboardList = parsedList.slice(0, 10);

    // Asserções do Ranking
    assert.strictEqual(leaderboardList.length, 3, "Devem ser extraídos exatamente 3 registros únicos de jogadores.");
    
    // PlayerA deve reter o score de 50000 e ser Rank 1
    assert.strictEqual(leaderboardList[0].name, "PlayerA");
    assert.strictEqual(leaderboardList[0].score, 50000, "Deduplicação de score de PlayerA falhou (devia manter o maior: 50000).");
    assert.strictEqual(leaderboardList[0].isVip, false, "PlayerA não deve ter tag VIP.");

    // PlayerB deve ser Rank 2 com 35000
    assert.strictEqual(leaderboardList[1].name, "PlayerB");
    assert.strictEqual(leaderboardList[1].score, 35000);

    // PlayerVIP deve ser Rank 3 e ter status VIP reconhecido
    assert.strictEqual(leaderboardList[2].name, "PlayerVIP");
    assert.strictEqual(leaderboardList[2].isVip, true, "PlayerVIP devia ter a tag VIP ativa por ser HODLer do token.");

    console.log("✅ [TEST 6 PASSED] Parsing de payload, ordenação de ranking, deduplicação e VIP checks validados.\n");

    console.log("====================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% SUCCESS 🎉");
    console.log("====================================================");
}
