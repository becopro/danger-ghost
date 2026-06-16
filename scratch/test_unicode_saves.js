const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log("====================================================");
const dom = new JSDOM(html, {
    url: "file://" + indexPath,
    resources: "usable",
    runScripts: "dangerously"
});

setTimeout(() => {
    const window = dom.window;

    console.log("🔍 Checking existence of SafeBtoa and SafeAtob...");
    if (typeof window.SafeBtoa !== 'function' || typeof window.SafeAtob !== 'function') {
        console.error("❌ SafeBtoa or SafeAtob is not defined on the window object!");
        process.exit(1);
    }
    console.log("✅ SafeBtoa and SafeAtob are present.");

    // Unicode test payload
    const unicodePayload = JSON.stringify({
        level: 42,
        xp: 1500,
        characterId: "dg_fantasma_Niterói_2012_🚀",
        weapon: { name: "Ghostblade de Fogo 🔥", damage: 150 }
    });

    console.log("🧪 testing SafeBtoa and SafeAtob with Unicode characters & Emojis...");
    try {
        const encoded = window.SafeBtoa(unicodePayload);
        const decoded = window.SafeAtob(encoded);
        
        console.log(`Original:  ${unicodePayload}`);
        console.log(`Encoded:   ${encoded}`);
        console.log(`Decoded:   ${decoded}`);

        if (unicodePayload !== decoded) {
            console.error("❌ Mismatch between original and decoded string!");
            process.exit(1);
        }
        console.log("✅ SafeBtoa and SafeAtob correctly preserved UTF-8/Unicode data.");
    } catch (err) {
        console.error("❌ SafeBtoa/SafeAtob failed to process Unicode payload:", err);
        process.exit(1);
    }

    console.log("🧪 Verifying native btoa behavior on the same payload...");
    try {
        window.btoa(unicodePayload);
        console.error("❌ Expected window.btoa to throw on unicode characters, but it did not!");
        process.exit(1);
    } catch (err) {
        console.log("✅ Native btoa threw an exception as expected: " + err.message);
    }

    console.log("====================================================");
    console.log("🎉 ALL UNICODE SAVE/LOAD TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("====================================================");
    process.exit(0);
}, 2000);
