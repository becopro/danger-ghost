const fs = require('fs');
const path = require('path');

const mainPath = 'C:/Users/Klara/Desktop/dragaMP/danger ghost/js/main.js';
let code = fs.readFileSync(mainPath, 'utf8');

const desoFuncs = [
    'CreateDeSoNFT',
    'SubmitSignedTransaction',
    'CheckVIPStatus',
    'ExecuteDeSoPost',
    'ExecuteDeSoRPGSave',
    'TriggerCreateNewGhost',
    'ExecuteCharacterPostCreation',
    'ExecuteCharacterPostSubmit',
    'LoadRPGStateFromDeSo'
];

const uiFuncs = [
    'OpenInteractiveTutorial',
    'CloseInteractiveTutorial',
    'SwitchTutorialTab',
    'UpdateTutorialRunePreview',
    'TriggerTutorialRuneBlast',
    'RunTutorialSaveSimulation'
];

function extractFunctions(funcNames, codeStr) {
    let extractedCode = '';
    let newCodeStr = codeStr;
    
    for (const fn of funcNames) {
        // Regex to match "async function Name(" or "function Name("
        const regex = new RegExp(`(?:async\\s+)?function\\s+${fn}\\s*\\([^{]*\\)\\s*\\{`, 'g');
        const match = regex.exec(newCodeStr);
        if (!match) continue;
        
        let startIndex = match.index;
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let endIndex = -1;
        
        // Find the matching closing brace
        for (let i = startIndex + match[0].length - 1; i < newCodeStr.length; i++) {
            const char = newCodeStr[i];
            
            // Handle strings to not count braces inside them
            if ((char === '"' || char === "'" || char === "`") && newCodeStr[i-1] !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            if (!inString) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                
                if (braceCount === 0) {
                    endIndex = i;
                    break;
                }
            }
        }
        
        if (endIndex !== -1) {
            const funcBody = newCodeStr.substring(startIndex, endIndex + 1);
            extractedCode += funcBody + '\n\n';
            newCodeStr = newCodeStr.substring(0, startIndex) + `/* Extracted ${fn} */` + newCodeStr.substring(endIndex + 1);
        }
    }
    
    return { extractedCode, newCodeStr };
}

// 1. Extract DeSo
const desoResult = extractFunctions(desoFuncs, code);
code = desoResult.newCodeStr;
let web3Code = '// WEB3 INTEGRATION MODULE\n\n' + desoResult.extractedCode;
fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/web3-integration.js', web3Code);

// 2. Extract UI
const uiResult = extractFunctions(uiFuncs, code);
code = uiResult.newCodeStr;
let uiCode = '// UI MANAGER MODULE\n\n' + uiResult.extractedCode;
fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/ui-manager.js', uiCode);

// 3. Rename main.js to game.js
fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/game.js', code);
// We will NOT delete main.js yet, just in case we need it as backup.

console.log('Extraction complete.');
