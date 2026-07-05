const fs = require('fs');

const mainJsPath = 'js/main.js';
const desoApiPath = 'js/web3/deso_api.js';

let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Find the start of the DeSo block
const startMarker = "window.addEventListener('message', function(event) {\r\n\t\t\t\tif (event.origin !== \"https://identity.deso.org\")";
const startIndex = mainJs.indexOf("window.addEventListener('message', function(event) {");

if (startIndex === -1) {
    console.error("Start marker not found!");
    process.exit(1);
}

// Find the end of LoadRPGStateFromDeSo
const endMarker = "window.LoadRPGStateFromDeSo = LoadRPGStateFromDeSo;";
let endIndex = mainJs.indexOf(endMarker, startIndex);

if (endIndex === -1) {
    console.error("End marker not found!");
    process.exit(1);
}
endIndex += endMarker.length;

// Extract the block
const extractedBlock = mainJs.substring(startIndex, endIndex);

// Remove the block from main.js
mainJs = mainJs.substring(0, startIndex) + "\n\t\t\t// DESO API MOVED TO js/web3/deso_api.js\n" + mainJs.substring(endIndex);

// Write deso_api.js
const desoApiCode = `// --- Danger Ghost Web3 DeSo API ---
// This file handles all communication with node.deso.org and identity.deso.org

${extractedBlock}
`;

fs.writeFileSync(desoApiPath, desoApiCode, 'utf8');
fs.writeFileSync(mainJsPath, mainJs, 'utf8');

console.log("Successfully extracted DeSo API to " + desoApiPath);
