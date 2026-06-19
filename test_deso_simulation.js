const assert = require('assert');

// Simulação de funções globais presentes no ambiente do browser
global.window = {};
global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.SafeAtob = (str) => decodeURIComponent(escape(global.atob(str)));
global.SafeBtoa = (str) => global.btoa(unescape(encodeURIComponent(str)));
window.SafeAtob = global.SafeAtob;
window.SafeBtoa = global.SafeBtoa;

// Vamos extrair a lógica de ordenação e deduplicação do index.html para testar isoladamente

function runDeSoDeduplication(posts) {
    // Ordenação idêntica ao index.html atual
    posts.sort(function(a, b) {
        var timeA = BigInt(a.TimestampNanos || 0);
        var timeB = BigInt(b.TimestampNanos || 0);
        if (timeB !== timeA) {
            return timeB > timeA ? 1 : -1;
        }
        // Fallback de progressão
        var scoreA = 0, scoreB = 0;
        try { 
            if(a.PostExtraData && a.PostExtraData["DangerGhost_SaveState"]) { 
                var stA = JSON.parse(window.SafeAtob(a.PostExtraData["DangerGhost_SaveState"]));
                scoreA = (parseInt(stA.level, 10) || 1) * 1000000 + (parseInt(stA.xp, 10) || 0);
            } 
        } catch(e){}
        try { 
            if(b.PostExtraData && b.PostExtraData["DangerGhost_SaveState"]) { 
                var stB = JSON.parse(window.SafeAtob(b.PostExtraData["DangerGhost_SaveState"]));
                scoreB = (parseInt(stB.level, 10) || 1) * 1000000 + (parseInt(stB.xp, 10) || 0);
            } 
        } catch(e){}
        return scoreB - scoreA;
    });

    var validCharIds = {};
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        if (post && post.PostExtraData && post.PostExtraData["DangerGhost_CharacterID"] && (post.IsNFT || post.PosterPublicKeyBase58Check === "USER_PUBKEY")) {
            var charId = post.PostExtraData["DangerGhost_CharacterID"];
            validCharIds[charId] = true;
        }
    }

    var charactersMap = {};
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        if (post && post.PostExtraData && post.PostExtraData["DangerGhost_SaveState"]) {
            var charId = post.PostExtraData["DangerGhost_CharacterID"];
            if (charId && validCharIds[charId]) {
                if (!charactersMap[charId]) {
                    try {
                        var decrypted = window.SafeAtob(post.PostExtraData["DangerGhost_SaveState"]);
                        var stats = JSON.parse(decrypted);
                        stats.characterId = charId;
                        stats.mag = stats.mag || 1;
                        stats.imageUrl = post.ImageURLs && post.ImageURLs[0] ? post.ImageURLs[0] : "";
                        stats.postHashHex = post.PostHashHex;
                        stats.timestamp = post.TimestampNanos || 0;
                        charactersMap[charId] = stats;
                    } catch(err) {}
                }
            }
        }
    }
    return Object.values(charactersMap);
}

// CENÁRIO 1: O NFT original tem TimestampNanos. O Save (post) vem SEM TimestampNanos (0 ou omitido) devido a algum erro na API da DeSo ou índice não sincronizado cross-PC.
const nftLevel1 = {
    IsNFT: true,
    PosterPublicKeyBase58Check: "USER_PUBKEY",
    TimestampNanos: 1680000000000000000n, // Timestamp válido
    PostExtraData: {
        "DangerGhost_CharacterID": "dg_char_test",
        "DangerGhost_SaveState": global.SafeBtoa(JSON.stringify({ level: 1, xp: 0 }))
    }
};

const saveLevel42 = {
    IsNFT: false,
    PosterPublicKeyBase58Check: "USER_PUBKEY",
    TimestampNanos: 0n, // Simulação de omissão da API/Nó dessincronizado
    PostExtraData: {
        "DangerGhost_CharacterID": "dg_char_test",
        "DangerGhost_SaveState": global.SafeBtoa(JSON.stringify({ level: 42, xp: 1500 }))
    }
};

console.log("=== INICIANDO SIMULAÇÃO DE QUEBRA CROSS-PC ===");
const posts = [nftLevel1, saveLevel42];

const characters = runDeSoDeduplication(posts);
console.log("Personagem carregado:", characters[0]);

if (characters[0].level === 1) {
    console.log("❌ A QUEBRA FOI CONFIRMADA! O Level 1 sobrepôs o Level 42.");
    console.log("MOTIVO: O TimestampNanos do Level 42 falhou/foi 0, logo ele caiu pro final do array. A lógica de Deduplicação ignorou o fallback de Level/XP porque timeB !== timeA foi acionado cega e prematuramente!");
} else {
    console.log("✅ Funciona corretamente.");
}

// CORREÇÃO: Lógica com Fallback Primário em Progresso
function runCorrectedDeSoDeduplication(posts) {
    posts.sort(function(a, b) {
        var scoreA = 0, scoreB = 0;
        try { 
            if(a.PostExtraData && a.PostExtraData["DangerGhost_SaveState"]) { 
                var stA = JSON.parse(window.SafeAtob(a.PostExtraData["DangerGhost_SaveState"]));
                scoreA = (parseInt(stA.level, 10) || 1) * 1000000 + (parseInt(stA.xp, 10) || 0);
            } 
        } catch(e){}
        try { 
            if(b.PostExtraData && b.PostExtraData["DangerGhost_SaveState"]) { 
                var stB = JSON.parse(window.SafeAtob(b.PostExtraData["DangerGhost_SaveState"]));
                scoreB = (parseInt(stB.level, 10) || 1) * 1000000 + (parseInt(stB.xp, 10) || 0);
            } 
        } catch(e){}

        if (scoreB !== scoreA) {
            return scoreB - scoreA; // Prioriza SEMPRE o maior Level/XP
        }

        var timeA = BigInt(a.TimestampNanos || 0);
        var timeB = BigInt(b.TimestampNanos || 0);
        if (timeB !== timeA) {
            return timeB > timeA ? 1 : -1;
        }
        return 0;
    });

    var charactersMap = {};
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        if (post && post.PostExtraData && post.PostExtraData["DangerGhost_SaveState"]) {
            var charId = post.PostExtraData["DangerGhost_CharacterID"];
            if (charId) {
                if (!charactersMap[charId]) {
                    try {
                        var decrypted = window.SafeAtob(post.PostExtraData["DangerGhost_SaveState"]);
                        var stats = JSON.parse(decrypted);
                        stats.characterId = charId;
                        charactersMap[charId] = stats;
                    } catch(err) {}
                }
            }
        }
    }
    return Object.values(charactersMap);
}

const correctedCharacters = runCorrectedDeSoDeduplication([nftLevel1, saveLevel42]);
console.log("\nPersonagem carregado APÓS CORREÇÃO:", correctedCharacters[0]);
if (correctedCharacters[0].level === 42) {
    console.log("✅ Correção confirmada! O personagem de maior Level agora é sempre respeitado!");
}
