const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

// 1. Update background of mobileNameInputScreen
html = html.replace(
    /<div id="mobileNameInputScreen" style="([^"]+)">/,
    (match, style) => {
        let newStyle = style.replace('background: rgba(0,0,0,0.95)', "background: url('assets/menu_bg.png') center/cover no-repeat #000");
        return `<div id="mobileNameInputScreen" style="${newStyle}">`;
    }
);

// 2. Change ShowMobileNameInput logic to bypass if name is saved
const oldShowMobile = `        function ShowMobileNameInput() {
            document.getElementById('mobileNameInputScreen').style.display = 'flex';
            // Pre-fill name if already exists
            if (window.g_playerName && window.g_playerName !== "GHOST") {
                document.getElementById('mobileGhostNameInput').value = window.g_playerName;
            }
        }`;

const newShowMobile = `        function ShowMobileNameInput() {
            var savedName = localStorage.getItem("playerName") || localStorage.getItem("rpg_player_name");
            if (savedName && savedName !== "GHOST" && savedName.trim() !== "") {
                window.g_playerName = savedName;
                document.getElementById('mobileGhostNameInput').value = savedName;
                StartMobileGame(); // Bypass input screen and start game
            } else {
                document.getElementById('mobileNameInputScreen').style.display = 'flex';
                // Pre-fill name if already exists
                if (window.g_playerName && window.g_playerName !== "GHOST") {
                    document.getElementById('mobileGhostNameInput').value = window.g_playerName;
                }
            }
        }`;

html = html.replace(oldShowMobile, newShowMobile);

// 3. Make SaveMobileName also hide the screen or automatically start? 
// The user said "depois que o jogador salva o nome a pagina nao aparece mais". 
// I will just make it so SaveMobileName saves it, then calls StartMobileGame() to be seamless.
const oldSaveMobile = `        function SaveMobileName() {
            var name = document.getElementById('mobileGhostNameInput').value.trim();
            if (name !== "") {
                window.g_playerName = name.substring(0, 10).toUpperCase();
                localStorage.setItem("rpg_player_name", window.g_playerName);
                localStorage.setItem("playerName", window.g_playerName);
            }
        }`;

const newSaveMobile = `        function SaveMobileName() {
            var name = document.getElementById('mobileGhostNameInput').value.trim();
            if (name !== "") {
                window.g_playerName = name.substring(0, 10).toUpperCase();
                localStorage.setItem("rpg_player_name", window.g_playerName);
                localStorage.setItem("playerName", window.g_playerName);
                StartMobileGame(); // Automatically start the game after saving
            } else {
                alert("Please enter a name");
            }
        }`;

html = html.replace(oldSaveMobile, newSaveMobile);

// 4. Remove the GO button since SAVE now starts the game.
// Look for `<button onclick="StartMobileGame()"` inside the flex div.
// Wait, to avoid breaking, let's just leave GO or hide it. Or just let the script remove it.
const buttonsHtmlOld = `<button onclick="SaveMobileName()" style="background: #FF00FF; border: none; color: #000; padding: 10px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">SAVE</button>
            <button onclick="StartMobileGame()" style="background: #00FFFF; border: none; color: #000; padding: 10px 20px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">GO</button>`;

const buttonsHtmlNew = `<button onclick="SaveMobileName()" style="background: #FF00FF; border: none; color: #000; padding: 10px 40px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace; font-size: 18px;">SAVE & START</button>`;

html = html.replace(buttonsHtmlOld, buttonsHtmlNew);

fs.writeFileSync('www/index.html', html, 'utf8');
console.log("Modifications applied successfully.");
