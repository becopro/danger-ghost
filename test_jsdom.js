const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const indexPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log("====================================================");
console.log("🖥️ RUNTIME EXCEPTION AUDIT IN VIRTUAL BROWSER (JSDOM) 🖥️");
console.log("====================================================\n");

// Cria o JSDOM com suporte a execução de scripts e recursos locais
const dom = new JSDOM(html, {
    url: "file://" + indexPath,
    resources: "usable",
    runScripts: "dangerously",
    beforeParse(window) {
        // Mock do LocalStorage
        window.localStorage = {
            getItem: () => null,
            setItem: () => null,
            removeItem: () => null,
            clear: () => null
        };
        // Mock do Canvas context
        window.HTMLCanvasElement.prototype.getContext = function(type) {
            return {
                fillRect: () => {},
                clearRect: () => {},
                fillText: () => {},
                drawImage: () => {},
                createLinearGradient: () => ({
                    addColorStop: () => {}
                }),
                strokeRect: () => {},
                stroke: () => {},
                beginPath: () => {},
                moveTo: () => {},
                lineTo: () => {},
                measureText: () => ({ width: 100 })
            };
        };
        // Captura erros no escopo global do window
        window.addEventListener('error', function(event) {
            console.error(`❌ Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
        });
    }
});

// Aguarda 1 segundo para garantir inicialização de scripts assíncronos
setTimeout(() => {
    const document = dom.window.document;
    const window = dom.window;

    console.log("Verificando se variáveis globais estão definidas:");
    console.log(`- window.g_gameState: ${window.g_gameState}`);
    console.log(`- window.GhostRPG: ${window.GhostRPG ? 'DEFINED' : 'UNDEFINED'}`);
    console.log(`- window.LoadRPGStateFromDeSo: ${window.LoadRPGStateFromDeSo ? 'DEFINED' : 'UNDEFINED'}`);
    console.log(`- window.TriggerRPGSaveToDeSo: ${window.TriggerRPGSaveToDeSo ? 'DEFINED' : 'UNDEFINED'}`);
    
    // Testa se o parser de imagens não crasha
    if (window.RenderCharacterNFTBlob) {
        console.log("✅ RenderCharacterNFTBlob está definido.");
        try {
            window.RenderCharacterNFTBlob({
                level: 1, xp: 0, xpRequired: 100, vit: 1, agi: 1, int: 1, pow: 1, characterId: "dg_test123"
            }, (blob) => {
                console.log("✅ RenderCharacterNFTBlob executou com sucesso (blob gerado).");
            });
        } catch(e) {
            console.error("❌ Erro ao rodar RenderCharacterNFTBlob:", e.message);
        }
    } else {
        console.error("❌ RenderCharacterNFTBlob não está definido!");
    }

    console.log("\n====================================================");
    console.log("Audit de tempo de execução (JSDOM) concluído.");
    console.log("====================================================");
}, 3500);
