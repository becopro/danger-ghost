/**
 * test_deso_sync.js
 * ============================================================
 * QA Senior — Script de Teste de Sincronização Blockchain DeSo
 * Versão: Pure Node.js (SEM dependência de JSDOM)
 * ============================================================
 */

'use strict';

const assert = require('assert');

const SafeBtoa = (str) => Buffer.from(unescape(encodeURIComponent(str)), 'binary').toString('base64');
const SafeAtob = (str) => decodeURIComponent(escape(Buffer.from(str, 'base64').toString('binary')));

function runParsingEngine(posts) {
    posts.sort(function(a, b) {
        var timeA = a.TimestampNanos || 0;
        var timeB = b.TimestampNanos || 0;
        if (timeB !== timeA) return timeB > timeA ? 1 : -1;
        return 0;
    });

    var uniqueCharacters = [];
    if (posts.length > 0) {
        var validCharIds = {};
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            if (post && post.PostExtraData && post.PostExtraData["DangerGhost_CharacterID"] &&
                (post.IsNFT || post.PosterPublicKeyBase58Check === USER_PUBKEY)) {
                validCharIds[post.PostExtraData["DangerGhost_CharacterID"]] = true;
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
                            var decrypted = SafeAtob(post.PostExtraData["DangerGhost_SaveState"]);
                            var stats = JSON.parse(decrypted);
                            stats.characterId = charId;
                            stats.mag = stats.mag || 1;
                            stats.imageUrl = post.ImageURLs && post.ImageURLs[0] ? post.ImageURLs[0] : "";
                            stats.postHashHex = post.PostHashHex;
                            stats.timestamp = post.TimestampNanos || 0;
                            charactersMap[charId] = stats;
                        } catch(err) {
                            console.error("Corrupted sheet for ghost ID " + charId, err);
                        }
                    } else {
                        if (!charactersMap[charId].imageUrl && post.ImageURLs && post.ImageURLs[0]) {
                            charactersMap[charId].imageUrl = post.ImageURLs[0];
                        }
                    }
                }
            }
        }
        uniqueCharacters = Object.values(charactersMap);
    }
    return uniqueCharacters;
}

const USER_PUBKEY    = "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn";
const CREATOR_PUBKEY = "BC1YLhXXXXSECONDARYMARKETCREATOR";

const nftLevel5 = {
    IsNFT: true,
    PosterPublicKeyBase58Check: USER_PUBKEY,
    TimestampNanos: 1610000000000000000,
    PostHashHex: "post_lvl5",
    ImageURLs: ["https://images.deso.org/ghost_lvl5.png"],
    PostExtraData: {
        "DangerGhost_CharacterID": "dg_char_5",
        "DangerGhost_SaveState": SafeBtoa(JSON.stringify({
            level: 5, vit: 2, agi: 3, int: 2, pow: 2, mag: 1,
            characterId: "dg_char_5", xp: 250, xpRequired: 500, score: 1200, time: 90
        }))
    }
};

const nftLevel52Secondary = {
    IsNFT: true,
    PosterPublicKeyBase58Check: CREATOR_PUBKEY,
    TimestampNanos: 1630000000000000000,
    PostHashHex: "post_lvl52",
    ImageURLs: ["https://images.deso.org/ghost_lvl52.png"],
    PostExtraData: {
        "DangerGhost_CharacterID": "dg_char_52",
        "DangerGhost_SaveState": SafeBtoa(JSON.stringify({
            level: 52, vit: 15, agi: 20, int: 10, pow: 25, mag: 8,
            characterId: "dg_char_52", xp: 1500, xpRequired: 5200, score: 75000, time: 980
        }))
    }
};

const saveCommentLevel6 = {
    IsNFT: false,
    PosterPublicKeyBase58Check: USER_PUBKEY,
    TimestampNanos: 1620000000000000000,
    PostHashHex: "save_lvl6_comment",
    PostExtraData: {
        "DangerGhost_CharacterID": "dg_char_5",
        "DangerGhost_SaveState": SafeBtoa(JSON.stringify({
            level: 6, vit: 3, agi: 3, int: 2, pow: 2, mag: 1,
            characterId: "dg_char_5", xp: 10, xpRequired: 600, score: 1500, time: 120
        }))
    }
};

console.log("====================================================");
console.log("🔬 RUNNING DESO BLOCKCHAIN SYNC TEST (Pure Node.js) 🔬");
console.log("====================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     → ${e.message}`);
        failed++;
    }
}

console.log("🧪 [Block 1] SafeAtob / SafeBtoa round-trip decode tests");

test("SafeBtoa produces a valid base64 string", () => {
    const encoded = SafeBtoa(JSON.stringify({ level: 5, score: 1200 }));
    assert.ok(typeof encoded === 'string' && encoded.length > 0);
    assert.ok(/^[A-Za-z0-9+/=]+$/.test(encoded));
});

test("SafeAtob correctly decodes a SafeBtoa-encoded string", () => {
    const original = JSON.stringify({ level: 6, score: 1500, time: 120 });
    assert.strictEqual(SafeAtob(SafeBtoa(original)), original);
});

test("SafeAtob/SafeBtoa round-trip preserves Unicode characters", () => {
    const original = JSON.stringify({ name: "Fantasma 🔥", note: "Niterói" });
    const parsed = JSON.parse(SafeAtob(SafeBtoa(original)));
    assert.strictEqual(parsed.name, "Fantasma 🔥");
    assert.strictEqual(parsed.note, "Niterói");
});

test("SafeAtob produces correct JSON for Level 52", () => {
    const stats = JSON.parse(SafeAtob(nftLevel52Secondary.PostExtraData["DangerGhost_SaveState"]));
    assert.strictEqual(stats.level, 52);
    assert.strictEqual(stats.score, 75000);
    assert.strictEqual(stats.time, 980);
});

console.log("\n🧪 [Block 2] Timestamp sort — newest-first ordering");

test("Posts are sorted newest-first", () => {
    const posts = [nftLevel5, nftLevel52Secondary, saveCommentLevel6];
    posts.sort((a, b) => { const tA = a.TimestampNanos||0, tB = b.TimestampNanos||0; return tB > tA ? 1 : tB < tA ? -1 : 0; });
    assert.strictEqual(posts[0].PostHashHex, "post_lvl52");
    assert.strictEqual(posts[1].PostHashHex, "save_lvl6_comment");
    assert.strictEqual(posts[2].PostHashHex, "post_lvl5");
});

test("Save comment (Level 6) has higher timestamp than NFT Level 5", () => {
    assert.ok(saveCommentLevel6.TimestampNanos > nftLevel5.TimestampNanos);
});

console.log("\n🧪 [Block 3] Character map construction — NFT + user-post validation");

test("NFTs and user-posts are accepted in validCharIds", () => {
    const posts = [nftLevel5, nftLevel52Secondary, saveCommentLevel6];
    const validCharIds = {};
    for (const post of posts) {
        if (post && post.PostExtraData && post.PostExtraData["DangerGhost_CharacterID"] &&
            (post.IsNFT || post.PosterPublicKeyBase58Check === USER_PUBKEY)) {
            validCharIds[post.PostExtraData["DangerGhost_CharacterID"]] = true;
        }
    }
    assert.ok(validCharIds["dg_char_5"],  "dg_char_5 must be valid");
    assert.ok(validCharIds["dg_char_52"], "dg_char_52 must be valid (secondary market)");
});

test("Secondary market NFT (different creator) IS accepted in validCharIds", () => {
    const validCharIds = {};
    if (nftLevel52Secondary.IsNFT && nftLevel52Secondary.PostExtraData?.["DangerGhost_CharacterID"]) {
        validCharIds[nftLevel52Secondary.PostExtraData["DangerGhost_CharacterID"]] = true;
    }
    assert.ok(validCharIds["dg_char_52"]);
});

console.log("\n🧪 [Block 4] Full parsing engine — complete simulation");

let finalChars;

test("Parsing engine produces exactly 2 characters", () => {
    finalChars = runParsingEngine([nftLevel5, nftLevel52Secondary, saveCommentLevel6]);
    assert.strictEqual(finalChars.length, 2);
});

test("dg_char_5 evolved to Level 6 (most recent save wins)", () => {
    const char5 = finalChars.find(c => c.characterId === "dg_char_5");
    assert.ok(char5);
    assert.strictEqual(char5.level, 6);
});

test("dg_char_52 is Level 52 (from secondary market NFT)", () => {
    const char52 = finalChars.find(c => c.characterId === "dg_char_52");
    assert.ok(char52);
    assert.strictEqual(char52.level, 52);
});

console.log("\n🧪 [Block 5] score and time preservation in SaveState");

test("dg_char_5 score=1500 and time=120 (from Level 6 save)", () => {
    const char5 = finalChars.find(c => c.characterId === "dg_char_5");
    assert.strictEqual(char5.score, 1500);
    assert.strictEqual(char5.time, 120);
});

test("dg_char_52 score=75000 and time=980 preserved", () => {
    const char52 = finalChars.find(c => c.characterId === "dg_char_52");
    assert.strictEqual(char52.score, 75000);
    assert.strictEqual(char52.time, 980);
});

test("dg_char_52 vit=15, agi=20, pow=25 preserved", () => {
    const char52 = finalChars.find(c => c.characterId === "dg_char_52");
    assert.strictEqual(char52.vit, 15);
    assert.strictEqual(char52.agi, 20);
    assert.strictEqual(char52.pow, 25);
});

console.log("\n🧪 [Block 6] Edge cases and robustness");

test("Empty posts array produces empty character list", () => {
    assert.strictEqual(runParsingEngine([]).length, 0);
});

test("Post without DangerGhost_CharacterID is ignored", () => {
    const result = runParsingEngine([{
        IsNFT: true, TimestampNanos: 1610000000000000000, PostHashHex: "no_id",
        PostExtraData: { "DangerGhost_SaveState": SafeBtoa(JSON.stringify({ level: 1 })) }
    }]);
    assert.strictEqual(result.length, 0);
});

test("Corrupted SaveState is handled gracefully (no crash)", () => {
    let threw = false;
    try {
        runParsingEngine([{
            IsNFT: true, TimestampNanos: 1610000000000000000, PostHashHex: "corrupt",
            PostExtraData: { "DangerGhost_CharacterID": "dg_corrupt", "DangerGhost_SaveState": "NOT_BASE64!!!" }
        }]);
    } catch(e) { threw = true; }
    assert.strictEqual(threw, false);
});

test("mag defaults to 1 if missing from SaveState", () => {
    const result = runParsingEngine([{
        IsNFT: true, TimestampNanos: 1610000000000000000, PostHashHex: "nomag",
        PostExtraData: {
            "DangerGhost_CharacterID": "dg_nomag",
            "DangerGhost_SaveState": SafeBtoa(JSON.stringify({ level: 3, vit: 1, score: 500, time: 60 }))
        }
    }]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].mag, 1);
});

test("imageUrl is set from NFT post", () => {
    const char52 = runParsingEngine([nftLevel5, nftLevel52Secondary, saveCommentLevel6]).find(c => c.characterId === "dg_char_52");
    assert.strictEqual(char52.imageUrl, "https://images.deso.org/ghost_lvl52.png");
});

console.log("\n====================================================");
if (failed === 0) {
    console.log(`🎉 ALL ${passed} TESTS PASSED! 100% SUCCESS! 🎉`);
    console.log("====================================================");
    process.exit(0);
} else {
    console.log(`❌ RESULT: ${passed} passed, ${failed} FAILED out of ${passed + failed} total.`);
    console.log("====================================================");
    process.exit(1);
}
