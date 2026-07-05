const fs = require('fs');

const mainJsPath = 'js/main.js';
const rpgSystemPath = 'rpg_system.js';
const uiManagerPath = 'js/ui/ui_manager.js';

let mainJs = fs.readFileSync(mainJsPath, 'utf8');
let rpgSystem = fs.readFileSync(rpgSystemPath, 'utf8');

// 1. Extract ToggleNavbarTab from main.js
const toggleStart = mainJs.indexOf('function ToggleNavbarTab(tab) {');
const toggleEndMarker = 'window.ToggleNavbarTab = ToggleNavbarTab;';
const toggleEnd = mainJs.indexOf(toggleEndMarker, toggleStart) + toggleEndMarker.length;
const toggleBlock = mainJs.substring(toggleStart, toggleEnd);
mainJs = mainJs.substring(0, toggleStart) + "\n\t\t\t// UI MOVED TO js/ui/ui_manager.js\n" + mainJs.substring(toggleEnd);

// 2. Extract RenderRPGStatusDrawer from rpg_system.js
const renderStart = rpgSystem.indexOf('function RenderRPGStatusDrawer() {');
const renderEndMarker = 'window.RenderRPGStatusDrawer = RenderRPGStatusDrawer;';
const renderEnd = rpgSystem.indexOf(renderEndMarker, renderStart) + renderEndMarker.length;
const renderBlock = rpgSystem.substring(renderStart, renderEnd);
rpgSystem = rpgSystem.substring(0, renderStart) + "\n\t\t\t// UI MOVED TO js/ui/ui_manager.js\n" + rpgSystem.substring(renderEnd);

// 3. Write ui_manager.js
const uiCode = `// --- Danger Ghost UI Manager ---
// This file handles DOM updates, overlays, and Menus

${toggleBlock}

${renderBlock}
`;

fs.writeFileSync(uiManagerPath, uiCode, 'utf8');
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
fs.writeFileSync(rpgSystemPath, rpgSystem, 'utf8');

console.log("Successfully extracted UI blocks to " + uiManagerPath);
